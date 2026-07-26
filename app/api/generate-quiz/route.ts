import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { refillIfNeeded } from '../refill-quiz-pool/route'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const TEXT_NEEDED = 3
const IMAGE_NEEDED = 2
const REFILL_THRESHOLD = 7 // trigger background refill when pool drops to 7 or below

function shuffleSides(questions: any[]) {
  return questions.map((q) => {
    if (Math.random() > 0.5) {
      return {
        ...q,
        option_a_content: q.option_b_content,
        option_b_content: q.option_a_content,
        option_a_type: q.option_b_type,
        option_b_type: q.option_a_type,
        correct_answer: q.correct_answer === 'a' ? 'b' : 'a',
      }
    }
    return q
  })
}

export async function GET() {
  try {
    // Fetch oldest TEXT_NEEDED text questions and IMAGE_NEEDED image questions
    const [textRes, imageRes] = await Promise.all([
      supabaseAdmin
        .from('quiz_pool_text')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(TEXT_NEEDED),
      supabaseAdmin
        .from('quiz_pool_image')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(IMAGE_NEEDED),
    ])

    const textRows = textRes.data || []
    const imageRows = imageRes.data || []

    console.log(`Pool draw — text: ${textRows.length}, image: ${imageRows.length}`)

    // Need at least 3 text questions to serve a quiz
    if (textRows.length < TEXT_NEEDED) {
      // Pool empty — fall back to live generation
      console.warn('Text pool too low, triggering live generation fallback')
      refillIfNeeded().catch(e => console.warn('Background refill error:', e))
      return NextResponse.json(
        { error: 'Quiz pool is being refilled, please try again in a moment.' },
        { status: 503 }
      )
    }

    // Delete used questions from pool
    const textIds = textRows.map((r) => r.id)
    const imageIds = imageRows.map((r) => r.id)

    await Promise.all([
      supabaseAdmin.from('quiz_pool_text').delete().in('id', textIds),
      imageIds.length > 0
        ? supabaseAdmin.from('quiz_pool_image').delete().in('id', imageIds)
        : Promise.resolve(),
    ])

    // Check remaining pool size and trigger background refill if low
    const [{ count: textRemaining }, { count: imageRemaining }] = await Promise.all([
      supabaseAdmin.from('quiz_pool_text').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('quiz_pool_image').select('*', { count: 'exact', head: true }),
    ])

    if ((textRemaining || 0) <= REFILL_THRESHOLD || (imageRemaining || 0) <= REFILL_THRESHOLD) {
      console.log(`Pool low (text:${textRemaining}, image:${imageRemaining}) — triggering background refill`)
      // Run in background without awaiting
      refillIfNeeded().catch(e => console.warn('Background refill error:', e))
    }

    // Build question objects
    const textQuestions = textRows.map((row, i) => ({
      id: `pool-text-${row.id}`,
      type: 'text' as const,
      topic: row.topic,
      option_a_content: row.human_content,
      option_b_content: row.ai_content,
      option_a_type: 'human' as const,
      option_b_type: 'ai' as const,
      correct_answer: 'b' as const,
      explanation: row.explanation,
    }))

    const imageQuestions = imageRows.map((row, i) => ({
      id: `pool-image-${row.id}`,
      type: 'image' as const,
      topic: row.topic,
      option_a_content: row.real_image_url,
      option_b_content: row.ai_image_data,
      option_a_type: 'human' as const,
      option_b_type: 'ai' as const,
      correct_answer: 'b' as const,
      explanation: row.explanation,
    }))

    // Interleave: text, text, image, text, image
    const ordered = [
      textQuestions[0],
      textQuestions[1],
      ...(imageQuestions[0] ? [imageQuestions[0]] : []),
      textQuestions[2],
      ...(imageQuestions[1] ? [imageQuestions[1]] : []),
    ].filter(Boolean)

    const finalQuestions = shuffleSides(ordered)

    return NextResponse.json({ questions: finalQuestions })
  } catch (err: any) {
    console.error('generate-quiz error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate quiz' }, { status: 500 })
  }
}
