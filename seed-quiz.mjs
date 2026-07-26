import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseKey = (serviceKey && serviceKey !== 'your-service-role-key' && serviceKey !== 'your_service_role_key') ? serviceKey : anonKey

if (!rawUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const supabase = createClient(supabaseUrl, supabaseKey)

const quizQuestions = [
  {
    human: 'The sun set slowly over the horizon, painting the sky in shades of orange and purple. I stood there, watching the day fade away, thinking about all that had happened. The cool breeze brushed my face as I reflected on the week\'s events.',
    ai: 'The sunset presented a beautiful gradient of chromatic transitions across the atmospheric expanse. The observer maintained a contemplative stance while processing cognitive phenomena. Meteorological conditions facilitated thermal regulation through ambient air circulation patterns.',
    correctAnswer: 'human',
    humanExplanation:
      'The human version includes personal details, emotions, and a natural narrative flow that comes from lived experience.',
    aiExplanation:
      'The AI version uses overly formal language, abstract phrases like "chromatic transitions" and "atmospheric expanse," and lacks the emotional connection of the human version.',
    visualFlaws: ['Overly formal vocabulary', 'Lacks personal perspective'],
    linguisticPatterns: ['Human: uses simple, emotionally resonant language'],
  },
  {
    human: 'I made a terrible mistake at work today. I presented my ideas to the team, but they were confused because I didn\'t explain them clearly. My manager gave me that look—you know the one—where they\'re trying to be supportive but you can tell they\'re disappointed. I felt my face get hot.',
    ai: 'A professional made an error in their workplace presentation. The individual\'s communication methodology was ineffective, resulting in confusion among team members. The supervisor displayed non-verbal cues suggesting disapproval, and the individual experienced physiological responses consistent with embarrassment.',
    correctAnswer: 'human',
    humanExplanation: 'This captures real human emotions and specific details like "that look" which only someone who has experienced it would describe.',
    aiExplanation: 'Notice the robotic language: "communication methodology," "non-verbal cues," and clinical descriptions of emotions as "physiological responses."',
    visualFlaws: [],
    linguisticPatterns: ['Human: specific, emotional details', 'AI: abstract, clinical language'],
  },
  {
    human: 'The recipe calls for two tablespoons of olive oil, three minced garlic cloves, salt, and pepper. Heat a large skillet over medium-high heat. Add the oil and garlic, stirring constantly for about two minutes until fragrant. Then add your vegetables and cook for five minutes.',
    ai: 'Culinary preparation requires the integration of lipid-based ingredients with aromatics. Temperature modulation should be set to intermediate-high parameters. Ingredients should be combined through continuous agitation for approximately 120 seconds until olfactory indicators suggest completion of the initial cooking phase.',
    correctAnswer: 'human',
    humanExplanation: 'Clear, practical instructions written for someone actually following a recipe with natural language and specific measurements.',
    aiExplanation:
      'Overly complex vocabulary like "lipid-based ingredients," "olfactory indicators," and vague descriptions like "intermediate-high parameters" instead of "medium-high heat."',
    visualFlaws: [],
    linguisticPatterns: ['Human: clear instructions, natural language'],
  },
  {
    human: 'During my last vacation, I got completely lost trying to find a local restaurant my friend recommended. My GPS wasn\'t working, and I ended up walking for three hours through neighborhoods I\'d never seen before. But you know what? I discovered this amazing little café with the best pastries, and I met an elderly baker who told me stories about the city for an hour.',
    ai: 'Travel experiences often include instances of geographic disorientation. Navigation systems may experience technical malfunctions. Pedestrian locomotion through unfamiliar urban environments can result in serendipitous encounters with local commercial establishments and their proprietors, creating memorable experiential outcomes.',
    correctAnswer: 'human',
    humanExplanation:
      'Rich with specific details, emotions, and the kind of vivid storytelling that comes from actually experiencing something and wanting to share it.',
    aiExplanation:
      'Bland, impersonal description using corporate language like "serendipitous encounters" and "experiential outcomes" instead of showing what actually happened.',
    visualFlaws: ['Generic business language'],
    linguisticPatterns: ['Human: vivid storytelling', 'AI: generic description'],
  },
  {
    human: 'I love my dog so much, but sometimes I want to throw my phone across the room when he eats his food. He\'s so loud and messy. He just shoves his entire face into the bowl like he\'s never eaten before in his life. Today, he somehow got kibble all over my kitchen tiles, and I found pieces of it under the refrigerator.',
    ai: 'Canine companionship provides emotional satisfaction. However, certain behavioral patterns during alimentary consumption can generate frustration. The animal exhibits enthusiastic engagement with food through rapid jaw movements and vigorous head positioning relative to the feeding vessel.',
    correctAnswer: 'human',
    humanExplanation:
      'Authentic voice with humor, specific observations, and emotional honesty about loving someone while being annoyed by their habits.',
    aiExplanation:
      'Clinical, sterile description that avoids genuine emotion and uses phrases like "alimentary consumption" and "rapid jaw movements" instead of describing what actually happens.',
    visualFlaws: [],
    linguisticPatterns: ['Human: authentic, humorous voice', 'AI: clinical detachment'],
  },
]

async function seedQuiz() {
  try {
    console.log('Starting quiz seed...')

    const today = new Date().toISOString().split('T')[0]

    // Check if today's quiz already exists
    const { data: existingQuiz } = await supabase
      .from('daily_quizzes')
      .select('id')
      .eq('quiz_date', today)
      .single()

    let quizId
    if (existingQuiz) {
      console.log('Quiz already exists for today, skipping creation')
      quizId = existingQuiz.id

      // Delete existing questions for this quiz
      await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId)
    } else {
      // Create today's quiz
      const { data: newQuiz, error: quizError } = await supabase
        .from('daily_quizzes')
        .insert({ quiz_date: today })
        .select()
        .single()

      if (quizError) throw quizError
      quizId = newQuiz.id
      console.log(`Created quiz for ${today}`)
    }

    // Insert questions
    const questions = quizQuestions.map((q, index) => ({
      quiz_id: quizId,
      question_order: index + 1,
      human_content: q.human,
      ai_content: q.ai,
      correct_answer: q.correctAnswer,
      explanation_human: q.humanExplanation,
      explanation_ai: q.aiExplanation,
      visual_flaws: q.visualFlaws,
      linguistic_patterns: q.linguisticPatterns,
    }))

    const { error: insertError } = await supabase
      .from('quiz_questions')
      .insert(questions)

    if (insertError) throw insertError

    console.log(`✓ Inserted ${questions.length} quiz questions`)
    console.log(`✓ Quiz seed completed successfully!`)
  } catch (err) {
    console.error('Failed to seed quiz:', err)
    process.exit(1)
  }
}

seedQuiz()
