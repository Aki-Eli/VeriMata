'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { flagsSupabase, type FlaggedPost, type FlagReport } from '@/lib/flags-supabase'
import {
  ShieldAlert, RefreshCw, ExternalLink, Puzzle,
  Users, ChevronDown, ChevronUp, Flag, Loader2, CheckCircle,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────

type PostWithReports = FlaggedPost & { reports: FlagReport[] }

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; posts: PostWithReports[] }

const FLAG_CATEGORIES = [
  { value: 'ai_generated',   label: 'AI-generated content' },
  { value: 'misinformation', label: 'Misinformation / false claims' },
  { value: 'propaganda',     label: 'Propaganda or manipulation' },
  { value: 'spam',           label: 'Spam or scam' },
  { value: 'deepfake',       label: 'Deepfake or manipulated media' },
  { value: 'other',          label: 'Other' },
]

// ── Flag submission form (shown when ?flag=<url> is present) ──────────────

function FlagSubmitPanel({
  postUrl,
  onSubmitted,
}: {
  postUrl: string
  onSubmitted: () => void
}) {
  const [category, setCategory] = useState('')
  const [reason, setReason]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || reason.trim().length < 5) return
    setSubmitting(true)
    setError('')

    try {
      // 1. Check if this URL already has a flags row
      const { data: existing } = await flagsSupabase
        .from('flags')
        .select('id')
        .eq('post_url', postUrl)
        .limit(1)

      let flagId: string

      if (existing && existing.length > 0) {
        // URL already in DB — reuse it
        flagId = existing[0].id
      } else {
        // New URL — insert it
        const { data: inserted, error: insertErr } = await flagsSupabase
          .from('flags')
          .insert({ post_url: postUrl, ai_probability: 50, bias_flags: [], flag_count: 0 })
          .select('id')
          .single()
        if (insertErr) throw insertErr
        flagId = inserted.id
      }

      // 2. Add the report
      const { error: reportErr } = await flagsSupabase
        .from('flag_reports')
        .insert({ flag_id: flagId, reason: reason.trim(), category })
      if (reportErr) throw reportErr

      setDone(true)
      onSubmitted()
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }, [category, reason, postUrl, onSubmitted])

  if (done) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-green-200 bg-green-50 text-green-800 text-sm font-medium">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        Report submitted — thank you for helping the community.
      </div>
    )
  }

  return (
    <div className="hud-card rounded-2xl p-5 border-2 border-destructive/30 bg-destructive/5">
      <div className="flex items-center gap-2 mb-4">
        <Flag className="w-5 h-5 text-destructive flex-shrink-0" />
        <div>
          <p className="font-bold text-foreground text-sm">Flag this content</p>
          <p className="text-xs text-muted-foreground break-all">{postUrl}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Category grid */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Why are you flagging this? <span className="text-destructive">*</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FLAG_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`press-scale text-left px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  category === cat.value
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : 'border-border bg-card text-foreground hover:border-destructive/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Details <span className="text-destructive">*</span>
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe what made you flag this content…"
            rows={3}
            required
            minLength={5}
            maxLength={500}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-destructive/30"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{reason.length}/500</p>
        </div>

        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/dashboard/flags"
            className="flex-1 py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground text-center transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!category || reason.trim().length < 5 || submitting}
            className="flex-1 py-2 rounded-xl bg-destructive text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-destructive/90 transition-all press-scale"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
            ) : (
              <><Flag className="w-4 h-4" /> Submit report</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Individual flagged post card ───────────────────────────────────────────

function FlaggedPostCard({ post, isNewest, highlight }: { post: PostWithReports; isNewest: boolean; highlight: boolean }) {
  const isRisky = post.ai_probability >= 60
  const justFlagged = isNewest && Date.now() - new Date(post.created_at).getTime() < 60_000
  const [expanded, setExpanded] = useState(highlight) // auto-expand when coming from extension
  const reportCount = post.reports.length

  return (
    <div
      id={`flag-${post.id}`}
      className={`pop-in hover-lift relative hud-card rounded-2xl p-4 ${
        highlight ? 'border-destructive ring-2 ring-destructive/20' : ''
      } ${justFlagged ? 'border-chart-4 ring-2 ring-chart-4/20' : ''}`}
    >
      {justFlagged && !highlight && (
        <span className="absolute -top-2.5 left-4 bg-chart-4 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
          Just flagged
        </span>
      )}
      {highlight && (
        <span className="absolute -top-2.5 left-4 bg-destructive text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
          From extension
        </span>
      )}

      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-hud">{formatRelativeTime(post.created_at)}</span>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
            reportCount > 0
              ? 'bg-destructive/15 text-destructive'
              : 'bg-muted/40 text-muted-foreground'
          }`}>
            <Users className="w-3 h-3" />
            {reportCount} {reportCount === 1 ? 'report' : 'reports'}
          </span>
          <span className={`text-sm font-bold font-hud ${isRisky ? 'text-destructive' : 'text-chart-4'}`}>
            {post.ai_probability}% AI
          </span>
        </div>
      </div>

      {/* Bias chips */}
      {post.bias_flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {post.bias_flags.map((flag) => (
            <span key={flag} className="bg-accent/15 text-accent text-[11px] font-medium px-2 py-0.5 rounded-full">
              {flag}
            </span>
          ))}
        </div>
      )}

      {post.reasoning && (
        <p className="text-sm text-foreground/80 leading-snug mb-2">{post.reasoning}</p>
      )}

      {post.snippet && (
        <p className="text-xs text-muted-foreground italic bg-muted/40 rounded-md p-2 mb-2 leading-snug">
          {truncate(post.snippet, 220)}
        </p>
      )}

      {/* URL */}
      <a
        href={post.post_url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-3 break-all"
      >
        {truncate(post.post_url, 60)} <ExternalLink className="w-3 h-3 flex-shrink-0" />
      </a>

      {/* Reports (comments) */}
      {reportCount > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide' : 'Show'} {reportCount} {reportCount === 1 ? 'report' : 'reports'}
          </button>

          {expanded && (
            <div className="flex flex-col gap-2 pl-2 border-l-2 border-border">
              {post.reports.map((report) => (
                <div key={report.id} className="rounded-lg bg-muted/20 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                    <span className="font-semibold text-foreground/70">
                      {report.user_email ?? 'Anonymous'}
                    </span>
                    <div className="flex items-center gap-2">
                      {report.category && (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize">
                          {report.category.replace(/_/g, ' ')}
                        </span>
                      )}
                      <span className="text-muted-foreground">{formatRelativeTime(report.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-foreground/80 leading-snug">{report.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page content (needs useSearchParams so wrapped in Suspense) ───────

function FlagsContent() {
  const searchParams  = useSearchParams()
  const incomingUrl   = searchParams.get('flag') ?? ''   // set by extension
  const fromExtension = searchParams.get('from') === 'extension'

  const [listState, setListState] = useState<LoadState>({ status: 'loading' })
  const [submitted, setSubmitted] = useState(false)

  const load = useCallback(async () => {
    setListState({ status: 'loading' })

    const [flagsResult, reportsResult] = await Promise.all([
      flagsSupabase
        .from('flags')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      flagsSupabase
        .from('flag_reports')
        .select('*')
        .order('created_at', { ascending: true }),
    ])

    if (flagsResult.error) {
      setListState({ status: 'error', message: flagsResult.error.message })
      return
    }

    const reports = (reportsResult.data ?? []) as FlagReport[]
    const posts   = ((flagsResult.data ?? []) as FlaggedPost[]).map(post => ({
      ...post,
      reports: reports.filter(r => r.flag_id === post.id),
    }))

    setListState({ status: 'loaded', posts })
  }, [])

  useEffect(() => { load() }, [load])

  // After submit, reload so the new report appears
  const handleSubmitted = useCallback(() => {
    setSubmitted(true)
    load()
  }, [load])

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-12 flex flex-col gap-6">
      {/* Refresh */}
      <div className="flex items-center justify-end">
        <button
          onClick={load}
          className="press-scale flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 border border-border rounded-full px-4 py-2 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Flag submission form — only shown when coming from extension with a URL */}
      {incomingUrl && !submitted && (
        <FlagSubmitPanel postUrl={incomingUrl} onSubmitted={handleSubmitted} />
      )}
      {incomingUrl && submitted && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-green-200 bg-green-50 text-green-800 text-sm font-medium">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          Report submitted — thank you for helping the community.
        </div>
      )}

      {/* List states */}
      {listState.status === 'loading' && (
        <p className="text-muted-foreground text-sm text-center py-12">Loading flagged posts…</p>
      )}

      {listState.status === 'error' && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm">
          <p>Couldn&apos;t load flagged posts: {listState.message}</p>
          <p className="text-muted-foreground text-xs mt-2">
            Check <code className="mx-1">NEXT_PUBLIC_STB_SUPABASE_URL</code> and{' '}
            <code className="mx-1">NEXT_PUBLIC_STB_SUPABASE_ANON_KEY</code> are set.
          </p>
        </div>
      )}

      {listState.status === 'loaded' && listState.posts.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Puzzle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No posts have been flagged yet. Flag one from the extension and it&apos;ll show up here.
          </p>
        </div>
      )}

      {listState.status === 'loaded' &&
        listState.posts.map((post, i) => (
          <FlaggedPostCard
            key={post.id}
            post={post}
            isNewest={i === 0}
            highlight={fromExtension && post.post_url === incomingUrl}
          />
        ))}
    </div>
  )
}

// ── Page shell ─────────────────────────────────────────────────────────────

export default function FlagsPage() {
  return (
    <div className="flex-1 flex flex-col">
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
              VeriMata browser extension
            </Link>
            , newest first.
          </p>
        </div>
      </section>

      <Suspense fallback={
        <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading…</span>
        </div>
      }>
        <FlagsContent />
      </Suspense>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function formatRelativeTime(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1)  return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)   return `${hours}h ago`
  const days  = Math.floor(hours / 24)
  return `${days}d ago`
}
