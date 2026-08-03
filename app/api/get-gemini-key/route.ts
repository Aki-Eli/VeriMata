import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Returns the Gemini API key to authenticated extension users.
// The key lives only in Vercel env vars — never in the extension bundle.
export async function GET(req: Request) {
  // Require a valid Supabase bearer token so random people can't just fetch the key
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the token against Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ key: process.env.GEMINI_API_KEY || '' })
}
