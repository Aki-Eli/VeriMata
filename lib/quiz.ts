import { supabase } from './supabase'
import type { Database } from './supabase'

export const DEFAULT_QUIZ_QUESTIONS: Database['public']['Tables']['quiz_questions']['Row'][] = [
  {
    id: 'default-q-1',
    quiz_id: 'default-quiz',
    question_order: 1,
    human_content:
      "The sun set slowly over the horizon, painting the sky in shades of orange and purple. I stood there, watching the day fade away, thinking about all that had happened. The cool breeze brushed my face as I reflected on the week's events.",
    ai_content:
      'The sunset presented a beautiful gradient of chromatic transitions across the atmospheric expanse. The observer maintained a contemplative stance while processing cognitive phenomena. Meteorological conditions facilitated thermal regulation through ambient air circulation patterns.',
    correct_answer: 'human',
    explanation_human:
      'The human version includes personal details, emotions, and a natural narrative flow that comes from lived experience.',
    explanation_ai:
      'The AI version uses overly formal language, abstract phrases like "chromatic transitions" and "atmospheric expanse," and lacks the emotional connection of the human version.',
    visual_flaws: ['Overly formal vocabulary', 'Lacks personal perspective'],
    linguistic_patterns: ['Human: uses simple, emotionally resonant language'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-q-2',
    quiz_id: 'default-quiz',
    question_order: 2,
    human_content:
      "I made a terrible mistake at work today. I presented my ideas to the team, but they were confused because I didn't explain them clearly. My manager gave me that look—you know the one—where they're trying to be supportive but you can tell they're disappointed. I felt my face get hot.",
    ai_content:
      "A professional made an error in their workplace presentation. The individual's communication methodology was ineffective, resulting in confusion among team members. The supervisor displayed non-verbal cues suggesting disapproval, and the individual experienced physiological responses consistent with embarrassment.",
    correct_answer: 'human',
    explanation_human:
      'This captures real human emotions and specific details like "that look" which only someone who has experienced it would describe.',
    explanation_ai:
      'Notice the robotic language: "communication methodology," "non-verbal cues," and clinical descriptions of emotions as "physiological responses."',
    visual_flaws: [],
    linguistic_patterns: ['Human: specific, emotional details', 'AI: abstract, clinical language'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-q-3',
    quiz_id: 'default-quiz',
    question_order: 3,
    human_content:
      'The recipe calls for two tablespoons of olive oil, three minced garlic cloves, salt, and pepper. Heat a large skillet over medium-high heat. Add the oil and garlic, stirring constantly for about two minutes until fragrant. Then add your vegetables and cook for five minutes.',
    ai_content:
      'Culinary preparation requires the integration of lipid-based ingredients with aromatics. Temperature modulation should be set to intermediate-high parameters. Ingredients should be combined through continuous agitation for approximately 120 seconds until olfactory indicators suggest completion of the initial cooking phase.',
    correct_answer: 'human',
    explanation_human:
      'Clear, practical instructions written for someone actually following a recipe with natural language and specific measurements.',
    explanation_ai:
      'Overly complex vocabulary like "lipid-based ingredients," "olfactory indicators," and vague descriptions like "intermediate-high parameters" instead of "medium-high heat."',
    visual_flaws: [],
    linguistic_patterns: ['Human: clear instructions, natural language'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-q-4',
    quiz_id: 'default-quiz',
    question_order: 4,
    human_content:
      "During my last vacation, I got completely lost trying to find a local restaurant my friend recommended. My GPS wasn't working, and I ended up walking for three hours through neighborhoods I'd never seen before. But you know what? I discovered this amazing little café with the best pastries, and I met an elderly baker who told me stories about the city for an hour.",
    ai_content:
      'Travel experiences often include instances of geographic disorientation. Navigation systems may experience technical malfunctions. Pedestrian locomotion through unfamiliar urban environments can result in serendipitous encounters with local commercial establishments and their proprietors, creating memorable experiential outcomes.',
    correct_answer: 'human',
    explanation_human:
      'Rich with specific details, emotions, and the kind of vivid storytelling that comes from actually experiencing something and wanting to share it.',
    explanation_ai:
      'Bland, impersonal description using corporate language like "serendipitous encounters" and "experiential outcomes" instead of showing what actually happened.',
    visual_flaws: ['Generic business language'],
    linguistic_patterns: ['Human: vivid storytelling', 'AI: generic description'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-q-5',
    quiz_id: 'default-quiz',
    question_order: 5,
    human_content:
      "I love my dog so much, but sometimes I want to throw my phone across the room when he eats his food. He's so loud and messy. He just shoves his entire face into the bowl like he's never eaten before in his life. Today, he somehow got kibble all over my kitchen tiles, and I found pieces of it under the refrigerator.",
    ai_content:
      'Canine companionship provides emotional satisfaction. However, certain behavioral patterns during alimentary consumption can generate frustration. The animal exhibits enthusiastic engagement with food through rapid jaw movements and vigorous head positioning relative to the feeding vessel.',
    correct_answer: 'human',
    explanation_human:
      'Authentic voice with humor, specific observations, and emotional honesty about loving someone while being annoyed by their habits.',
    explanation_ai:
      'Clinical, sterile description that avoids genuine emotion and uses phrases like "alimentary consumption" and "rapid jaw movements" instead of describing what actually happens.',
    visual_flaws: [],
    linguistic_patterns: ['Human: authentic, humorous voice', 'AI: clinical detachment'],
    created_at: new Date().toISOString(),
  },
]

export async function getTodayQuiz() {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data: quizData, error: quizError } = await supabase
      .from('daily_quizzes')
      .select('id')
      .eq('quiz_date', today)
      .single()

    if (quizError && quizError.code !== 'PGRST116') return null

    if (!quizData) {
      // Create today's quiz if it doesn't exist
      const { data: newQuiz, error: createError } = await supabase
        .from('daily_quizzes')
        .insert({ quiz_date: today })
        .select()
        .single()

      if (createError) return null
      return newQuiz
    }

    return quizData
  } catch (err) {
    console.warn('Error fetching/creating daily quiz:', err)
    return null
  }
}

export async function getTodayQuestions(): Promise<
  Database['public']['Tables']['quiz_questions']['Row'][]
> {
  try {
    const quiz = await getTodayQuiz()

    if (quiz?.id) {
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('question_order', { ascending: true })

      if (!questionsError && questions && questions.length > 0) {
        return questions as Database['public']['Tables']['quiz_questions']['Row'][]
      }

      // Try auto-seeding questions into database for today's quiz
      try {
        const seedData = DEFAULT_QUIZ_QUESTIONS.map((q, index) => ({
          quiz_id: quiz.id,
          question_order: index + 1,
          human_content: q.human_content,
          ai_content: q.ai_content,
          correct_answer: q.correct_answer,
          explanation_human: q.explanation_human,
          explanation_ai: q.explanation_ai,
          visual_flaws: q.visual_flaws,
          linguistic_patterns: q.linguistic_patterns,
        }))

        const { data: inserted, error: insertError } = await supabase
          .from('quiz_questions')
          .insert(seedData)
          .select()

        if (!insertError && inserted && inserted.length > 0) {
          return inserted as Database['public']['Tables']['quiz_questions']['Row'][]
        }
      } catch (seedErr) {
        console.warn('Could not auto-seed quiz questions to Supabase:', seedErr)
      }
    }

    // Try fetching existing questions from any quiz in Supabase
    try {
      const { data: anyQuestions } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('question_order', { ascending: true })
        .limit(5)

      if (anyQuestions && anyQuestions.length > 0) {
        return anyQuestions as Database['public']['Tables']['quiz_questions']['Row'][]
      }
    } catch {
      // Ignore fallback error
    }

    // Fallback to built-in default questions
    return DEFAULT_QUIZ_QUESTIONS
  } catch (err) {
    console.warn('Using default quiz questions due to error:', err)
    return DEFAULT_QUIZ_QUESTIONS
  }
}

export async function submitQuizAnswer(
  userId: string,
  questionId: string,
  userAnswer: 'human' | 'ai'
) {
  const today = new Date().toISOString().split('T')[0]
  let correctAnswer: 'human' | 'ai' | null = null

  // 1. Try to get correct answer from Supabase
  try {
    const { data: question } = await supabase
      .from('quiz_questions')
      .select('correct_answer')
      .eq('id', questionId)
      .single()

    if (question?.correct_answer) {
      correctAnswer = question.correct_answer as 'human' | 'ai'
    }
  } catch {
    // Ignore error
  }

  // 2. Fallback check from default questions if question was not in database
  if (!correctAnswer) {
    const defaultQ = DEFAULT_QUIZ_QUESTIONS.find((q) => q.id === questionId)
    if (defaultQ) {
      correctAnswer = defaultQ.correct_answer
    } else {
      // Default to human if not specified
      correctAnswer = 'human'
    }
  }

  const isCorrect = correctAnswer === userAnswer
  const xpEarned = isCorrect ? 10 : 0

  // 3. Try inserting response into database
  try {
    const { data: response } = await supabase
      .from('user_quiz_responses')
      .upsert(
        {
          user_id: userId,
          quiz_date: today,
          question_id: questionId,
          user_answer: userAnswer,
          is_correct: isCorrect,
          xp_earned: xpEarned,
        },
        { onConflict: 'user_id,quiz_date,question_id' }
      )
      .select()
      .single()

    return {
      response: response || null,
      correct: isCorrect,
      xpEarned,
    }
  } catch (err) {
    console.warn('Could not save quiz response to Supabase:', err)
    return {
      response: null,
      correct: isCorrect,
      xpEarned,
    }
  }
}

export async function getUserQuizProgress(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data: responses } = await supabase
      .from('user_quiz_responses')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_date', today)

    return (responses || []) as Database['public']['Tables']['user_quiz_responses']['Row'][]
  } catch (err) {
    console.warn('Error fetching quiz progress:', err)
    return []
  }
}

export async function getQuizResult(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data: responses } = await supabase
      .from('user_quiz_responses')
      .select('*, quiz_questions:question_id(*)')
      .eq('user_id', userId)
      .eq('quiz_date', today)

    if (responses && responses.length > 0) {
      const correct = responses.filter((r) => r.is_correct).length
      const total = responses.length
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
      const totalXp = responses.reduce((sum, r) => sum + r.xp_earned, 0)

      return {
        correct,
        total,
        accuracy,
        totalXp,
        responses,
      }
    }
  } catch (err) {
    console.warn('Error fetching quiz result:', err)
  }

  return {
    correct: 0,
    total: 0,
    accuracy: 0,
    totalXp: 0,
    responses: [],
  }
}

