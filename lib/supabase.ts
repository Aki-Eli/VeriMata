import { createClient } from '@supabase/supabase-js'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string | null
          avatar_url: string | null
          total_xp: number
          current_streak: number
          longest_streak: number
          last_played_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          total_xp?: number
          current_streak?: number
          longest_streak?: number
          last_played_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          total_xp?: number
          current_streak?: number
          longest_streak?: number
          last_played_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_quizzes: {
        Row: {
          id: string
          quiz_date: string
          created_at: string
        }
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          question_order: number
          human_content: string
          ai_content: string
          correct_answer: 'human' | 'ai'
          explanation_human: string | null
          explanation_ai: string | null
          visual_flaws: string[]
          linguistic_patterns: string[]
          created_at: string
        }
      }
      user_quiz_responses: {
        Row: {
          id: string
          user_id: string
          quiz_date: string
          question_id: string
          user_answer: 'human' | 'ai'
          is_correct: boolean
          xp_earned: number
          answered_at: string
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string | null
          icon_url: string | null
          xp_threshold: number
          created_at: string
        }
      }
      user_badges: {
        Row: {
          user_id: string
          badge_id: string
          earned_at: string
        }
      }
      leaderboard_cache: {
        Row: {
          user_id: string
          username: string
          total_xp: number
          accuracy_percentage: number
          current_streak: number
          quizzes_completed: number
          rank: number | null
          updated_at: string
        }
      }
    }
  }
}
