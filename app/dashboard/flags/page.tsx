'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { flagsSupabase, type FlagReport } from '@/lib/flags-supabase'
import {
  ShieldAlert, RefreshCw, ExternalLink, Puzzle,
  Users, ChevronDown, ChevronUp, Flag, Loader2,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

// A "post" is just all reports grouped under one URL
type FlaggedUrl = {
  post_url: string
  reports: FlagReport[]
  first_seen: string   // created_at of the earliest report
}

const FLAG_CATEGORIES = [
  { value: 'ai_generated',   label: 'AI-generated content' },
  { value: 'misinformation', label: 'Misinformation / false claims' },
  { value: 'propaganda',     label: 'Propaganda or manipulation' },
  { value: 'spam',           label: 'Spam or scam' },
  { value: 'deepfake',       label: 'Deepfake or manipulated media' },
  { value: 'other',          label: 'Other' },
]

// ── Flag submission form ───────────────────────────────────────────────────

function FlagSubmitPanel({
  postUrl,
  onDone,
}: {
  postUrl: string
  onDone: () => void
}) {
  const [category, setCategory] = useState('')
  const [reason, setReason]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [urlExpanded, setUrlExpanded] = useState(false)

  const truncatedUrl = postUrl.length > 60 ? postUrl.slice(0, 60) + '…' : postUrl

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || reason.trim().length < 5) return
    setSubmitting(true)
    setError('')

    const { error: err } = await flagsSupabase
      .from('flag_reports')
      .insert({ post_url: postUrl, reason: reason.trim(), category })

    setSubmitting(false)
    if (err) {
      setError(err.message)
    } else {
      onDone()
    }
  }, [category, reason, postUrl, onDone])

  return (
    <div className="hud-card rounded-2xl p-5 border-2 border-destructive/30 bg-destructive/5">
      <div className="flex items-start gap-2 mb-4">
        <Flag className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-bold text-foreground text-sm mb-1">Flag this content</p>
          <p className="text-xs text-muted-foreground break-all">
            {urlExpanded ? postUrl : truncatedUrl}
            {postUrl.length > 60 && (
              <button
                onClick={() => setUrlExpanded(!urlExpanded)}
                className="ml-1 text-primary hover:underline font-medium"
              >
                {urlExpanded ? 'show less' : 'show more'}
              </button>
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Category */}
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

        {error && <p className="text-xs text-destructive font-medium">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDone}
            className="flex-1 py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground text-center transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!category || reason.trim().length < 5 || submitting}
            className="flex-1 py-2 rounded-xl bg-destructive text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-destructive/90 transition-all press-scale"
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              : <><Flag className="w-4 h-4" /> Submit report</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Flagged URL card (post + comments) ────────────────────────────────────

function FlaggedUrlCard({ item, highlight }: { item: FlaggedUrl; highlight: boolean }) {
  const [expanded, setExpanded] = useState(highlight)
  const [urlExpanded, setUrlExpanded] = useState(false)
  const count = item.reports.length
  const justFlagged = Date.now() - new Date(item.first_seen).getTime() < 60_000
  const truncatedUrl = item.post_url.length > 60 ? item.post_url.slice(0, 60) + '…' : item.post_url

  return (
    <div
      className={`pop-in hover-lift relative hud-card rounded-2xl p-4 ${
        highlight   ? 'border-destructive ring-2 ring-destructive/20' : ''
      } ${justFlagged && !highlight ? 'border-chart-4 ring-2 ring-chart-4/20' : ''}`}
    >
      {highlight && (
        <span className="absolute -top-2.5 left-4 bg-destructive text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
          Your flag
        </span>
      )}
      {justFlagged && !highlight && (
        <span className="absolute -top-2.5 left-4 bg-chart-4 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
          Just flagged
        </span>
      )}

      {/* Top row */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-xs text-muted-foreground font-hud">
          First flagged {formatRelativeTime(item.first_seen)}
        </span>
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
          count >= 3
            ? 'bg-destructive/15 text-destructive'
            : 'bg-muted/40 text-muted-foreground'
        }`}>
          <Users className="w-3 h-3" />
          {count} {count === 1 ? 'report' : 'reports'}
        </span>
      </div>

      {/* URL */}
      <div className="mb-3">
        <a
          href={item.post_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-start gap-1 text-sm text-primary hover:underline break-all leading-snug"
        >
          {urlExpanded ? item.post_url : truncatedUrl}
          <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
        </a>
        {item.post_url.length > 60 && (
          <button
            onClick={() => setUrlExpanded(!urlExpanded)}
            className="ml-1 text-xs text-muted-foreground hover:text-foreground underline"
          >
            {urlExpanded ? 'show less' : 'show more'}
          </button>
        )}
      </div>

      {/* Toggle reports */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Hide' : 'Show'} {count} {count === 1 ? 'report' : 'reports'}
      </button>

      {/* Reports (comments) */}
      {expanded && (
        <div className="mt-3 flex flex-col gap-2 pl-3 border-l-2 border-border">
          {item.reports.map((report) => (
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
                  <span className="text-muted-foreground">
                    {formatRelativeTime(report.created_at)}
                  </span>
                </div>
              </div>
              <p className="text-foreground/80 leading-snug">{report.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main content (needs useSearchParams → Suspense) ────────────────────────

function FlagsContent() {
  const searchParams  = useSearchParams()
  const incomingUrl   = searchParams.get('flag') ?? ''
  const fromExtension = searchParams.get('from') === 'extension'

  const [items, setItems]       = useState<FlaggedUrl[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showPanel, setShowPanel] = useState(!!incomingUrl && fromExtension)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    const { data, error } = await flagsSupabase
      .from('flag_reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) { setLoadError(error.message); setLoading(false); return }

    // Group by post_url
    const map = new Map<string, FlagReport[]>()
    for (const row of (data ?? []) as FlagReport[]) {
      const list = map.get(row.post_url) ?? []
      list.push(row)
      map.set(row.post_url, list)
    }

    // Sort groups by most-recent first_seen (oldest report in group = first_seen)
    const grouped: FlaggedUrl[] = Array.from(map.entries()).map(([url, reports]) => ({
      post_url: url,
      reports:  reports.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      first_seen: reports[reports.length - 1]?.created_at ?? reports[0].created_at,
    })).sort((a, b) => new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime())

    setItems(grouped)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmitted = useCallback(() => {
    setShowPanel(false)
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

      {/* Submission form — only when coming from extension with a URL */}
      {showPanel && incomingUrl && (
        <FlagSubmitPanel postUrl={incomingUrl} onDone={() => { setShowPanel(false); load() }} />
      )}

      {/* List */}
      {loading && (
        <p className="text-muted-foreground text-sm text-center py-12">Loading flagged posts…</p>
      )}

      {loadError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm">
          <p>Couldn&apos;t load flagged posts: {loadError}</p>
        </div>
      )}

      {!loading && !loadError && items.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Puzzle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No posts have been flagged yet. Flag one from the extension and it&apos;ll show up here.
          </p>
        </div>
      )}

      {!loading && items.map((item) => (
        <FlaggedUrlCard
          key={item.post_url}
          item={item}
          highlight={fromExtension && item.post_url === incomingUrl}
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

function formatRelativeTime(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1)  return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)   return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
