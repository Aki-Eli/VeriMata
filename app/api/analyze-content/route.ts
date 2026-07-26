import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const TEXT_SYSTEM_PROMPT = `You are a content analysis engine for a misinformation-literacy tool.
Given a snippet of social media text, return ONLY a valid JSON object (no markdown, no prose) with this exact shape:

{
  "aiProbability": <integer 0-100, your best estimate that this text was AI-generated>,
  "biasFlags": [<short strings naming manipulation techniques present, e.g. "Urgency framing", "Fear appeal", "False dichotomy">],
  "reasoning": "<2-3 sentences in plain language explaining WHY, citing specific phrases or patterns in the text>"
}

Be honest about uncertainty. If the text is too short or ambiguous to judge confidently, say so in "reasoning" and keep aiProbability closer to 50.`

const LINK_SYSTEM_PROMPT = `You are a link-safety analysis engine for a misinformation and scam-detection tool.
You will receive a URL. Judge it purely from its structure — domain name, subdomain tricks, shorteners, path patterns.
Return ONLY a valid JSON object (no markdown, no prose) with this exact shape:

{
  "riskScore": <integer 0-100: how likely this link is a scam, phishing attempt, or otherwise unsafe/deceptive>,
  "riskFlags": [<short strings naming specific red flags, e.g. "Lookalike domain", "URL shortener", "Suspicious TLD">],
  "riskReasoning": "<1-2 sentences explaining the score>"
}

Guidance:
- Genuine facebook.com, twitter.com, instagram.com links with normal paths are LOW risk.
- Watch for lookalike domains (e.g. "faceb00k.com", "facebook-security.com").
- URL shorteners raise risk moderately since the real destination is hidden.
- If the URL looks like a normal, well-formed social media permalink, say so and keep the score low.`

const IMAGE_SYSTEM_PROMPT = `You are an image-authenticity analysis engine for a misinformation-literacy tool.
Look closely at the provided image and judge whether it is AI-generated/synthetic versus a genuine photograph.
Return ONLY a valid JSON object (no markdown, no prose) with this exact shape:

{
  "aiProbability": <integer 0-100: how likely this image is AI-generated or synthetically manipulated>,
  "biasFlags": [<short strings naming specific visual tells, e.g. "Distorted hands", "Inconsistent lighting", "Unnaturally smooth skin">],
  "reasoning": "<2-3 sentences explaining what visual evidence informed the score>"
}

Be honest about uncertainty — many real photos have imperfections, and many AI images look realistic now.`

export async function POST(req: Request) {
  try {
    const { text, imageUrl, imageBase64, imageMimeType } = await req.json()

    if (imageUrl || imageBase64) {
      return NextResponse.json(await analyzeImage(imageUrl, imageBase64, imageMimeType))
    }

    if (text && typeof text === 'string') {
      const trimmed = text.trim()
      const isLink = /^https?:\/\/\S+$/i.test(trimmed)
      if (isLink) {
        return NextResponse.json(await analyzeLink(trimmed))
      }
      return NextResponse.json(await analyzeText(trimmed))
    }

    return NextResponse.json({ error: 'Missing "text" or "imageUrl" field' }, { status: 400 })
  } catch (err: any) {
    console.error('analyze-content error:', err)
    return NextResponse.json({ error: err.message || 'Analysis failed' }, { status: 500 })
  }
}

async function analyzeText(text: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' })
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${TEXT_SYSTEM_PROMPT}\n\nText to analyze:\n"""\n${text}\n"""` }] }],
    generationConfig: { responseMimeType: 'application/json' },
  })
  const raw = result.response.text().trim()
  const parsed = safeParseJson(raw)
  return {
    aiProbability: parsed.aiProbability ?? 50,
    biasFlags: parsed.biasFlags ?? [],
    reasoning: parsed.reasoning ?? 'Analysis complete.',
    factCheckRefs: [],
  }
}

async function analyzeLink(url: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' })
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${LINK_SYSTEM_PROMPT}\n\nAnalyze this link:\n${url}` }] }],
    generationConfig: { responseMimeType: 'application/json' },
  })
  const raw = result.response.text().trim()
  const parsed = safeParseJson(raw)
  const riskScore = parsed.riskScore ?? 50
  return {
    aiProbability: riskScore,
    biasFlags: parsed.riskFlags ?? [],
    reasoning: parsed.riskReasoning ?? 'Link analysis complete.',
    factCheckRefs: [],
  }
}

async function analyzeImage(imageUrl?: string, imageBase64?: string, imageMimeType?: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' })

  let imagePart: any

  if (imageBase64 && imageMimeType) {
    // Base64 image uploaded directly
    imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: imageMimeType,
      },
    }
  } else if (imageUrl) {
    // Fetch the image and convert to base64 for Gemini
    try {
      const res = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
      const buffer = await res.arrayBuffer()
      const ct = res.headers.get('content-type') || 'image/jpeg'
      imagePart = {
        inlineData: {
          data: Buffer.from(buffer).toString('base64'),
          mimeType: ct.split(';')[0].trim(),
        },
      }
    } catch {
      // Fall back to URL-only text analysis
      return analyzeText(`Image URL for analysis: ${imageUrl}`)
    }
  } else {
    return { aiProbability: 50, biasFlags: [], reasoning: 'No image provided.', factCheckRefs: [] }
  }

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${IMAGE_SYSTEM_PROMPT}\n\nAnalyze this image:` },
          imagePart,
        ],
      },
    ],
    generationConfig: { responseMimeType: 'application/json' },
  })

  const raw = result.response.text().trim()
  const parsed = safeParseJson(raw)
  return {
    aiProbability: parsed.aiProbability ?? 50,
    biasFlags: parsed.biasFlags ?? [],
    reasoning: parsed.reasoning ?? 'Image analysis complete.',
    factCheckRefs: [],
  }
}

function safeParseJson(raw: string): any {
  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch { /* fall through */ }
    }
    return {}
  }
}
