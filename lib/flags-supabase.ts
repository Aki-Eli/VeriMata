import { createClient } from '@supabase/supabase-js'

// The "Spot the Bot" browser extension writes to its own Supabase project
// (separate from this site's project — see lib/supabase.ts). This client is
// read-only from the site's perspective: we only ever `select` from `flags`.
// The anon key is safe to expose here — it's the public key, and the
// extension's RLS policies (supabase/migrations/0001_create_flags.sql in the
// extension repo) are what actually govern access.
const rawUrl =
  process.env.NEXT_PUBLIC_STB_SUPABASE_URL || 'https://placeholder.supabase.co'
const flagsSupabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const flagsSupabaseAnonKey = process.env.NEXT_PUBLIC_STB_SUPABASE_ANON_KEY || 'placeholder'

export const flagsSupabase = createClient(flagsSupabaseUrl, flagsSupabaseAnonKey)

// One row per unique URL/content — the registry entry.
export interface FlaggedPost {
  id: string
  created_at: string
  post_url: string
  snippet: string | null
  ai_probability: number
  bias_flags: string[]
  reasoning: string | null
  flag_count: number
}

// One row per user flag report, attached to a FlaggedPost.
export interface FlagReport {
  id: string
  created_at: string
  flag_id: string
  user_id: string | null
  user_email: string | null
  reason: string
  category: string | null
}
