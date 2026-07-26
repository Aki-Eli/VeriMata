import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })
const MODEL = 'gemini-3.5-flash-lite'

// Use service role key so we can write to the pool tables
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const TEXT_POOL_TARGET = 10
const IMAGE_POOL_TARGET = 10

const TOPICS = [
  'a cozy coffee shop morning', 'hiking in the mountains', 'a street market in Asia',
  'a dog playing in the park', 'a sunset at the beach', 'a rainy city street',
  'a home-cooked meal', 'a child blowing out birthday candles', 'an old library',
  'a garden in spring', 'a busy train station', 'a snowy mountain village',
  'a tropical beach resort', 'a farmers market', 'a birthday party',
  'a morning run in the city', 'a cat sitting on a windowsill', 'a bookshop',
  'a rooftop view at night', 'a picnic in the park',
]

// ── Helpers ────────────────────────────────────────────────────────────────

async function validateImageUrl(url: string): Promise<boolean> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  }
  try {
    // HEAD first
    const head = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000), headers })
    const ct = head.headers.get('content-type') || ''
    if (head.ok && ct.startsWith('image/')) return true
  } catch { /* fall through to GET */ }

  try {
    // GET fallback
    const get = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000), headers })
    const ct = get.headers.get('content-type') || ''
    await get.body?.cancel()
    return get.ok && ct.startsWith('image/')
  } catch {
    return false
  }
}

async function searchRealImage(query: string): Promise<string | null> {
  const apiKey = process.env.SERP_API_KEY
  if (!apiKey) return null

  try {
    const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=10&safe=active`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const images = (data.images_results as { original: string }[] | undefined) || []

    for (const img of images.filter(i => i.original?.startsWith('http'))) {
      if (await validateImageUrl(img.original)) {
        return img.original
      }
    }
    return null
  } catch {
    return null
  }
}

async function generateAiImage(prompt: string): Promise<string | null> {
  for (let attempt = 1; attempt <= 4; attempt++) {
    if (attempt > 1) {
      const delay = attempt * 15000 // 15s, 30s, 45s between retries
      console.log(`Pollinations waiting ${delay/1000}s before attempt ${attempt}...`)
      await new Promise(r => setTimeout(r, delay))
    }
    try {
      const encoded = encodeURIComponent(prompt)
      const seed = Math.floor(Math.random() * 999999)
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${seed}&model=flux`
      console.log(`Pollinations attempt ${attempt}: fetching...`)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000)

      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      console.log(`Pollinations attempt ${attempt} status: ${res.status}, content-type: ${res.headers.get('content-type')}`)
      if (res.status === 429) {
        console.warn(`Pollinations 429 — rate limited, backing off...`)
        continue
      }
      if (!res.ok) { console.warn(`Pollinations not ok: ${res.status}`); continue }
      const ct = res.headers.get('content-type') || ''
      if (!ct.startsWith('image/')) { console.warn(`Pollinations non-image: ${ct}`); continue }
      const buffer = await res.arrayBuffer()
      console.log(`Pollinations buffer size: ${buffer.byteLength} bytes`)
      if (buffer.byteLength < 1000) { console.warn(`Pollinations image too small: ${buffer.byteLength}`); continue }
      return `data:${ct};base64,${Buffer.from(buffer).toString('base64')}`
    } catch (e: any) {
      console.warn(`Pollinations attempt ${attempt} error: ${e?.message || e}`)
    }
  }
  return null
}

// ── Text pool refill ───────────────────────────────────────────────────────

async function refillTextPool(needed: number): Promise<number> {
  if (needed <= 0) return 0
  const shuffled = [...TOPICS].sort(() => Math.random() - 0.5)
  let inserted = 0

  while (inserted < needed) {
    const batch = Math.min(3, needed - inserted)
    const batchTopics = shuffled.splice(0, batch)

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: `Generate ${batch} quiz questions for a "Spot the AI" game.
Each shows two texts — one human-written, one AI-generated — player identifies the AI one.

Return ONLY a valid JSON array, no markdown:
[
  {
    "topic": "brief topic",
    "human_content": "naturally written human text, 2-4 sentences, personal and specific",
    "ai_content": "AI-generated version, formal and generic sounding",
    "explanation": "2-3 sentences explaining specific AI tells in the ai_content"
  }
]

Topics: ${batchTopics.join(', ')}`,
      })

      const raw = (response.text ?? '').trim()
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) continue
      const questions = JSON.parse(match[0])

      // Validate and cap to exactly what we still need
      const remaining = needed - inserted
      const validQuestions = questions
        .filter((q: any) =>
          q.topic?.trim() &&
          q.human_content?.trim().length > 20 &&
          q.ai_content?.trim().length > 20 &&
          q.explanation?.trim().length > 20
        )
        .slice(0, remaining) // never insert more than needed

      if (validQuestions.length === 0) continue

      // Re-check count right before inserting to prevent overshoot from concurrent runs
      const { count: currentCount } = await supabaseAdmin
        .from('quiz_pool_text')
        .select('*', { count: 'exact', head: true })

      if ((currentCount || 0) >= TEXT_POOL_TARGET) {
        console.log(`Text pool: already at ${currentCount}/${TEXT_POOL_TARGET}, stopping`)
        break
      }

      // Recalculate remaining after live count check
      const stillNeeded = TEXT_POOL_TARGET - (currentCount || 0)
      const toInsert = validQuestions.slice(0, stillNeeded)

      const { error } = await supabaseAdmin.from('quiz_pool_text').insert(
        toInsert.map((q: any) => ({
          topic: q.topic.trim(),
          human_content: q.human_content.trim(),
          ai_content: q.ai_content.trim(),
          explanation: q.explanation.trim(),
        }))
      )

      if (error) {
        console.error('Text pool insert error:', error)
      } else {
        inserted += toInsert.length
        console.log(`Text pool: inserted ${toInsert.length}, total ${inserted}/${needed}`)
      }
    } catch (e) {
      console.error('Text generation error:', e)
    }
  }

  return inserted
}

// ── Image pool refill ──────────────────────────────────────────────────────

async function refillImagePool(needed: number): Promise<number> {
  if (needed <= 0) return 0
  const shuffled = [...TOPICS].sort(() => Math.random() - 0.5)
  let inserted = 0

  for (let i = 0; i < needed; i++) {
    const topic = shuffled[i % shuffled.length]

    // Wait 15s between each image to avoid Pollinations rate limits
    if (i > 0) {
      console.log(`Image pool: waiting 15s before next image (${i}/${needed})...`)
      await new Promise(r => setTimeout(r, 15000))
    }

    console.log(`Image pool: generating image ${i + 1}/${needed} — topic: "${topic}"`)

    // Sequential: real image first, then AI image
    const realImageUrl = await searchRealImage(`${topic} photograph`)
    if (!realImageUrl) {
      console.warn(`Image pool: skipping "${topic}" — no valid real image found`)
      continue
    }

    const aiImageData = await generateAiImage(
      `Photorealistic photo of ${topic}. Natural lighting, candid style, high quality.`
    )
    if (!aiImageData) {
      console.warn(`Image pool: skipping "${topic}" — AI image generation failed`)
      continue
    }

    // Re-check count right before inserting to prevent overshoot from concurrent runs
    const { count: currentCount } = await supabaseAdmin
      .from('quiz_pool_image')
      .select('*', { count: 'exact', head: true })

    if ((currentCount || 0) >= IMAGE_POOL_TARGET) {
      console.log(`Image pool: already at ${currentCount}/${IMAGE_POOL_TARGET}, stopping`)
      break
    }

    let explanation = `AI-generated images of "${topic}" often show unnatural textures, overly perfect lighting, fine detail distortions, and dreamlike backgrounds.`
    try {
      const expResponse = await ai.models.generateContent({
        model: MODEL,
        contents: `An AI image was generated of "${topic}". Write 2-3 sentences about specific visual tells: texture issues, lighting anomalies, fine detail errors. Be concise.`,
      })
      const exp = (expResponse.text ?? '').trim()
      if (exp.length > 20) explanation = exp
    } catch { /* use default */ }

    const { error } = await supabaseAdmin.from('quiz_pool_image').insert({
      topic,
      real_image_url: realImageUrl,
      ai_image_data: aiImageData,
      explanation,
    })

    if (error) {
      console.error('Image pool insert error:', error)
    } else {
      inserted++
      console.log(`Image pool: ✓ inserted ${inserted}/${needed} — "${topic}"`)
    }
  }

  return inserted
}

// ── Main handler ───────────────────────────────────────────────────────────

export async function refillIfNeeded() {
  const [{ count: textCount }, { count: imageCount }] = await Promise.all([
    supabaseAdmin.from('quiz_pool_text').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('quiz_pool_image').select('*', { count: 'exact', head: true }),
  ])
  const textNeeded = Math.max(0, TEXT_POOL_TARGET - (textCount || 0))
  const imageNeeded = Math.max(0, IMAGE_POOL_TARGET - (imageCount || 0))
  console.log(`refillIfNeeded — text: ${textCount}/${TEXT_POOL_TARGET} (need ${textNeeded}), image: ${imageCount}/${IMAGE_POOL_TARGET} (need ${imageNeeded})`)
  if (textNeeded === 0 && imageNeeded === 0) return
  await refillTextPool(textNeeded)
  await refillImagePool(imageNeeded)
}

export async function POST(req: Request) {
  try {
    // Check current pool counts
    const [{ count: textCount }, { count: imageCount }] = await Promise.all([
      supabaseAdmin.from('quiz_pool_text').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('quiz_pool_image').select('*', { count: 'exact', head: true }),
    ])

    const textNeeded = Math.max(0, TEXT_POOL_TARGET - (textCount || 0))
    const imageNeeded = Math.max(0, IMAGE_POOL_TARGET - (imageCount || 0))

    console.log(`Pool status — text: ${textCount}/${TEXT_POOL_TARGET}, image: ${imageCount}/${IMAGE_POOL_TARGET}`)
    console.log(`Refilling — text: ${textNeeded}, image: ${imageNeeded}`)

    if (textNeeded === 0 && imageNeeded === 0) {
      return NextResponse.json({ message: 'Pool already full', textCount, imageCount })
    }

    // Refill text first (fast), then images sequentially (slow — rate limited)
    const textInserted = await refillTextPool(textNeeded)
    const imageInserted = await refillImagePool(imageNeeded)

    return NextResponse.json({
      message: 'Pool refilled',
      textInserted,
      imageInserted,
    })
  } catch (err: any) {
    console.error('Refill error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET — just returns current pool status, and triggers refill if needed
export async function GET() {
  const [{ count: textCount }, { count: imageCount }] = await Promise.all([
    supabaseAdmin.from('quiz_pool_text').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('quiz_pool_image').select('*', { count: 'exact', head: true }),
  ])

  // Kick off a full refill via POST handler logic inline
  const textNeeded = Math.max(0, TEXT_POOL_TARGET - (textCount || 0))
  const imageNeeded = Math.max(0, IMAGE_POOL_TARGET - (imageCount || 0))

  if (textNeeded > 0 || imageNeeded > 0) {
    const [textInserted, imageInserted] = await Promise.all([
      refillTextPool(textNeeded),
      refillImagePool(imageNeeded),
    ])
    return NextResponse.json({ message: 'Pool refilled', textInserted, imageInserted })
  }

  return NextResponse.json({ message: 'Pool already full', textCount, imageCount })
}
