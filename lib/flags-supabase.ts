import { createClient } from '@supabase/supabase-js'

// Same Supabase project as the main app — flag_reports is the only table needed.
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const flagsSupabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const flagsSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const flagsSupabase = createClient(flagsSupabaseUrl, flagsSupabaseAnonKey)

// One row per user flag submission — post_url is the "post", reports group by it.
export interface FlagReport {
  id: string
  created_at: string
  post_url: string
  user_id: string | null
  user_email: string | null
  reason: string
  category: string | null
}
