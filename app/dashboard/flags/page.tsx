'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { flagsSupabase, type FlaggedPost } from '@/lib/flags-supabase'
import { ShieldAlert, RefreshCw, ExternalLink, Puzzle } from 'lucide-react'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; posts: FlaggedPost[] }

export default function FlagsPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })

    const { data, error } = await flagsSupabase
      .from('flags')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      setState({ status: 'error', message: error.message })
      return
    }

    setState({ status: 'loaded', posts: (data ?? []) as FlaggedPost[] })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/15 via-transparent to-accent/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-8 h-8 text-destructive" />
            <h1 className="font-display text-4xl font-bold text-foreground">Community Flags</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Posts flagged as suspicious by people using the{' '}
            <Link href="/dashboard/extension" className="text-primary underline underline-offset-4">
              Spot the Bot browser extension
            </Link>
            , newest first.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto w-full px-4 py-12 flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <button
            onClick={load}
            className="press-scale flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 border border-border rounded-full px-4 py-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {state.status === 'loading' && (
          <p className="text-muted-foreground text-sm text-center py-12">Loading flagged posts…</p>
        )}

        {state.status === 'error' && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm">
            <p className="m-0">Couldn&apos;t load flagged posts: {state.message}</p>
            <p className="text-muted-foreground text-xs mt-2">
              This feed reads from the extension&apos;s own Supabase project. Double-check
              <code className="mx-1">NEXT_PUBLIC_STB_SUPABASE_URL</code> and
              <code className="mx-1">NEXT_PUBLIC_STB_SUPABASE_ANON_KEY</code> are set.
            </p>
          </div>
        )}

        {state.status === 'loaded' && state.posts.length === 0 && (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <Puzzle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No posts have been flagged yet. Flag one from the extension and it&apos;ll show up here.
            </p>
          </div>
        )}

        {state.status === 'loaded' &&
          state.posts.map((post, i) => <FlaggedPostCard key={post.id} post={post} isNewest={i === 0} />)}
      </div>
    </div>
  )
}

function FlaggedPostCard({ post, isNewest }: { post: FlaggedPost; isNewest: boolean }) {
  const isRisky = post.ai_probability >= 60
  const justFlagged = isNewest && Date.now() - new Date(post.created_at).getTime() < 60_000

  return (
    <div
      className={`pop-in hover-lift relative hud-card rounded-2xl p-4 ${
        justFlagged ? 'border-chart-4 ring-2 ring-chart-4/20' : ''
      }`}
    >
      {justFlagged && (
        <span className="absolute -top-2.5 left-4 bg-chart-4 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
          Just flagged
        </span>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-hud">{formatRelativeTime(post.created_at)}</span>
        <span className={`text-sm font-bold font-hud ${isRisky ? 'text-destructive' : 'text-chart-4'}`}>
          {post.ai_probability}% AI
        </span>
      </div>

      {post.bias_flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {post.bias_flags.map((flag) => (
            <span
              key={flag}
              className="bg-accent/15 text-accent text-[11px] font-medium px-2 py-0.5 rounded-full"
            >
              {flag}
            </span>
          ))}
        </div>
      )}

      {post.reasoning && <p className="text-sm text-foreground/80 leading-snug mb-2">{post.reasoning}</p>}

      {post.snippet && (
        <p className="text-xs text-muted-foreground italic bg-muted/40 rounded-md p-2 mb-2 leading-snug">
          {truncate(post.snippet, 220)}
        </p>
      )}

      <a
        href={post.post_url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        View original post <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  )
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
