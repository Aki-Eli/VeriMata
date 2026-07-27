'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Shield, Upload, Link2, FileText, X, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface FactualClaim {
  claim: string
  verdict: 'likely true' | 'likely false' | 'unverifiable' | 'misleading'
  evidence: string
  confidence: 'high' | 'medium' | 'low'
}

interface DeepReport {
  originAssessment?: string
  rhetoricalTechniques?: string
  factualClaims?: FactualClaim[] | string
  domainAnalysis?: string
  pathAnalysis?: string
  trustSignals?: string
  anatomicalAnalysis?: string
  lightingAndShadows?: string
  lightingAnalysis?: string
  textureAndDetail?: string
  textureAnalysis?: string
  overallVerdict?: string
  factualityScore?: number
}

interface AnalysisResult {
  aiProbability: number
  summary: string
  flags: string[]
  reasoning: string
  deepReport: DeepReport | null
  contentType?: string
  subject?: string
  factualityScore?: number | null
  factualClaims?: FactualClaim[]
  confidence?: string
  crossChecks?: any[]
  biasFlags?: string[]
}

type AnalysisMode = 'text' | 'link' | 'image'
type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: AnalysisResult; mode: AnalysisMode }
  | { status: 'error'; message: string }

function AnalyzerContent() {
  const { user } = useAuth()
  const params = useSearchParams()
  const fromExtension = params.get('from') === 'extension'

  const [mode, setMode] = useState<AnalysisMode>('text')
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [state, setState] = useState<AnalysisState>({ status: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // When arriving from extension, load the saved result from DB
  useEffect(() => {
    if (!fromExtension || !user) return
    setState({ status: 'loading' })
    fetch(`/api/analyze-content?userId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setState({ status: 'error', message: data.error }); return }
        // Map new DB schema fields
        const deep = data.deep_analysis ?? {}
        setState({
          status: 'done',
          result: {
            aiProbability: data.ai_probability,
            summary: data.verdict ?? '',
            flags: data.summary_flags ?? [],
            reasoning: data.summary_reason ?? '',
            factualityScore: data.factuality_score ?? null,
            factualClaims: data.factual_claims ?? [],
            confidence: data.confidence,
            crossChecks: data.cross_checks ?? [],
            deepReport: {
              originAssessment: deep.originAssessment,
              rhetoricalTechniques: deep.rhetoricalTechniques,
              domainAnalysis: deep.domainAnalysis,
              pathAnalysis: deep.pathAnalysis,
              trustSignals: deep.trustSignals,
              anatomicalAnalysis: deep.anatomicalAnalysis,
              lightingAnalysis: deep.lightingAnalysis,
              textureAnalysis: deep.textureAnalysis,
              overallVerdict: deep.overallVerdict,
            },
            contentType: data.content_type,
            subject: data.subject,
            biasFlags: data.summary_flags ?? [],
          },
          mode: (data.content_type ?? 'text') as AnalysisMode,
        })
      })
      .catch(e => setState({ status: 'error', message: e.message }))
  }, [fromExtension, user])

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setState({ status: 'error', message: 'Please select an image file (JPG, PNG, GIF, WebP).' })
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setState({ status: 'idle' })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleAnalyze = async () => {
    setState({ status: 'loading' })
    try {
      let body: any
      if (mode === 'image' && imageFile) {
        const base64 = await fileToBase64(imageFile)
        body = { imageBase64: base64, imageMimeType: imageFile.type, userId: user?.id }
      } else if (mode === 'link' || mode === 'text') {
        body = { text: text.trim(), userId: user?.id }
      } else {
        setState({ status: 'error', message: 'Please provide content to analyze.' })
        return
      }

      const res = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Analysis failed (${res.status})`)
      }
      const result = await res.json()
      setState({ status: 'done', result, mode })
    } catch (err: any) {
      setState({ status: 'error', message: err.message || 'Something went wrong.' })
    }
  }

  const reset = () => {
    setState({ status: 'idle' })
    setText('')
    setImageFile(null)
    setImagePreview(null)
  }

  const canAnalyze =
    state.status !== 'loading' &&
    ((mode === 'text' && text.trim().length > 10) ||
      (mode === 'link' && text.trim().length > 5) ||
      (mode === 'image' && imageFile !== null))

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Content Analyzer</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Deep, fact-based analysis of text, links, and images using Gemini AI.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto w-full px-4 py-10 space-y-6">

        {/* Extension banner */}
        {fromExtension && (
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>Full report from your <strong>Spot the Bot extension</strong> analysis is shown below.</span>
          </div>
        )}

        {/* Only show input controls when not coming from extension */}
        {!fromExtension && (
          <>
            {/* Mode selector */}
            <div className="flex gap-2 bg-muted rounded-lg p-1 w-fit">
              {(['text', 'link', 'image'] as AnalysisMode[]).map((m) => {
                const icons = { text: FileText, link: Link2, image: Upload }
                const Icon = icons[m]
                return (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setState({ status: 'idle' }) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                      mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                )
              })}
            </div>

            {(mode === 'text' || mode === 'link') && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  {mode === 'text' ? 'Paste the text you want to analyze' : 'Paste the link you want to check'}
                </label>
                <textarea
                  value={text}
                  onChange={(e) => { setText(e.target.value); setState({ status: 'idle' }) }}
                  placeholder={mode === 'text' ? 'Paste social media posts, news articles, or any text here…' : 'https://example.com/article'}
                  rows={mode === 'text' ? 6 : 2}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                />
              </div>
            )}

            {mode === 'image' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Upload an image to analyze</label>
                <div
                  className={`relative border-2 border-dashed rounded-lg transition cursor-pointer ${
                    imagePreview ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/20'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
                  {imagePreview ? (
                    <div className="p-4">
                      <div className="relative inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg object-contain mx-auto block" />
                        <button
                          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80 transition"
                          onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setState({ status: 'idle' }) }}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-center text-sm text-muted-foreground mt-2">{imageFile?.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                      <Upload className="w-10 h-10 opacity-40" />
                      <p className="font-medium">Drop an image here, or click to browse</p>
                      <p className="text-xs">JPG, PNG, GIF, WebP — up to 20 MB</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button onClick={handleAnalyze} disabled={!canAnalyze}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-base font-semibold disabled:opacity-40">
              {state.status === 'loading' ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Analyzing with Gemini…
                </span>
              ) : (
                <span className="flex items-center gap-2"><Shield className="w-4 h-4" />Analyze Content</span>
              )}
            </Button>
          </>
        )}

        {/* Loading when coming from extension */}
        {fromExtension && state.status === 'loading' && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {state.status === 'error' && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Analysis failed</p>
              <p className="text-sm text-destructive/80 mt-1">{state.message}</p>
            </div>
            <button onClick={reset} className="ml-auto text-destructive hover:text-destructive/80"><X className="w-4 h-4" /></button>
          </div>
        )}

        {state.status === 'done' && (
          <ResultCard result={state.result} mode={state.mode} onClose={reset} fromExtension={fromExtension} />
        )}

        {state.status === 'idle' && !fromExtension && (
          <div className="bg-muted/40 border border-border rounded-lg p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">What does this analyze?</p>
            <ul className="space-y-1">
              <li><span className="font-medium text-foreground">Text</span> — AI detection, rhetorical techniques, factual claim assessment.</li>
              <li><span className="font-medium text-foreground">Link</span> — Domain safety, phishing patterns, structural red flags.</li>
              <li><span className="font-medium text-foreground">Image</span> — Gemini Vision checks for AI generation artifacts.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function ResultCard({ result, mode, onClose, fromExtension }: {
  result: AnalysisResult
  mode: AnalysisMode
  onClose: () => void
  fromExtension?: boolean
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const score = result.aiProbability
  const isHigh = score >= 70
  const isMedium = score >= 40 && score < 70
  const label = mode === 'link' ? 'Risk Score' : 'AI-Generated Likelihood'
  const scoreColor = isHigh ? 'text-destructive' : isMedium ? 'text-accent' : 'text-secondary'
  const trackColor = isHigh ? 'bg-destructive' : isMedium ? 'bg-accent' : 'bg-secondary'

  const flags = result.flags?.length ? result.flags : (result.biasFlags ?? [])

  // Deep report sections based on content type (excludes factualClaims — shown separately)
  const deepSections: { key: keyof DeepReport; label: string }[] = mode === 'link'
    ? [
        { key: 'domainAnalysis', label: 'Domain Analysis' },
        { key: 'pathAnalysis', label: 'Path & Parameter Analysis' },
        { key: 'trustSignals', label: 'Trust Signals' },
        { key: 'overallVerdict', label: 'Overall Verdict' },
      ]
    : mode === 'image'
    ? [
        { key: 'anatomicalAnalysis', label: 'Anatomical Analysis' },
        { key: 'lightingAnalysis', label: 'Lighting & Shadows' },
        { key: 'textureAnalysis', label: 'Texture & Detail' },
        { key: 'overallVerdict', label: 'Overall Verdict' },
      ]
    : [
        { key: 'originAssessment', label: 'Origin Assessment (AI vs Human)' },
        { key: 'rhetoricalTechniques', label: 'Rhetorical Techniques' },
        { key: 'overallVerdict', label: 'Overall Verdict' },
      ]

  // Factuality color helpers
  const fscore = result.factualityScore ?? null
  const fColor = fscore == null ? '' : fscore >= 60 ? 'text-secondary' : fscore >= 35 ? 'text-accent' : 'text-destructive'
  const fTrack = fscore == null ? '' : fscore >= 60 ? 'bg-secondary' : fscore >= 35 ? 'bg-accent' : 'bg-destructive'
  const fBorder = fscore == null ? '' : fscore >= 60 ? 'border-secondary/30 bg-secondary/5' : fscore >= 35 ? 'border-accent/30 bg-accent/5' : 'border-destructive/30 bg-destructive/5'

  const verdictColors: Record<string, string> = {
    'likely true': 'bg-secondary/10 text-secondary border-secondary/30',
    'likely false': 'bg-destructive/10 text-destructive border-destructive/30',
    'unverifiable': 'bg-muted text-muted-foreground border-border',
    'misleading': 'bg-accent/10 text-accent border-accent/30',
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-foreground text-background">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="font-semibold text-sm">
            {mode === 'link' ? 'Link Safety Report' : mode === 'image' ? 'Image Authenticity Report' : 'Content Analysis Report'}
          </span>
        </div>
        {!fromExtension && (
          <button onClick={onClose} className="hover:opacity-70 transition" aria-label="Close"><X className="w-4 h-4" /></button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Subject */}
        {result.subject && (
          <div className="text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2 truncate">
            <span className="font-semibold uppercase tracking-wide mr-2">Analyzed:</span>{result.subject}
          </div>
        )}

        {/* Score bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">{label}</span>
            <span className={`text-2xl font-bold ${scoreColor}`}>{score}%</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${trackColor}`} style={{ width: `${score}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">Human / Safe</span>
            <span className="text-xs text-muted-foreground">AI / Risky</span>
          </div>
        </div>

        {/* Verdict */}
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
          isHigh ? 'bg-destructive/10 border border-destructive/30' :
          isMedium ? 'bg-accent/10 border border-accent/30' :
          'bg-secondary/10 border border-secondary/30'
        }`}>
          {isHigh
            ? <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            : <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isMedium ? 'text-accent' : 'text-secondary'}`} />}
          <p className={`text-sm font-medium ${isHigh ? 'text-destructive' : isMedium ? 'text-accent' : 'text-secondary'}`}>
            {result.summary}
          </p>
        </div>

        {/* Flags */}
        {flags.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Detected Signals</p>
            <div className="flex flex-wrap gap-2">
              {flags.map((flag) => (
                <span key={flag} className="px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full text-xs font-medium">{flag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Summary reasoning */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Summary</p>
          <p className="text-sm text-foreground leading-relaxed">{result.reasoning}</p>
        </div>

        {/* Factuality score */}
        {fscore != null && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Factuality Score</p>
              <span className={`text-2xl font-bold ${fColor}`}>{fscore}%</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all ${fTrack}`} style={{ width: `${fscore}%` }} />
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${fBorder}`}>
              {fscore >= 60
                ? <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                : <AlertTriangle className="w-4 h-4 flex-shrink-0 text-accent" />}
              <span className={fColor}>
                {fscore >= 60
                  ? 'Claims appear mostly supported by evidence'
                  : fscore >= 35
                  ? 'Some claims are uncertain or unverifiable'
                  : 'Claims appear unsupported or fabricated'}
              </span>
            </div>
          </div>
        )}

        {/* Factual claims — per-claim evidence */}
        {result.factualClaims && result.factualClaims.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Factual Claims Evidence</p>
            <div className="space-y-3">
              {result.factualClaims.map((claim, i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden">
                  <div className={`flex items-center justify-between px-4 py-2 border-b border-border ${verdictColors[claim.verdict] ?? 'bg-muted/20'}`}>
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {claim.verdict === 'likely true' ? '✓ Likely True'
                        : claim.verdict === 'likely false' ? '✗ Likely False'
                        : claim.verdict === 'misleading' ? '⚠ Misleading'
                        : '? Unverifiable'}
                    </span>
                    <span className="text-xs text-muted-foreground">Confidence: {claim.confidence}</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-sm font-medium text-foreground italic">"{claim.claim}"</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{claim.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deep report — expandable sections */}
        {result.deepReport && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Deep Report</p>
            <div className="space-y-2">
              {deepSections.map(({ key, label }) => {
                const content = result.deepReport?.[key]
                if (!content) return null
                const isOpen = expanded === key
                return (
                  <div key={key} className="border border-border rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition text-left"
                      onClick={() => setExpanded(isOpen ? null : key)}
                    >
                      {label}
                      {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border bg-muted/20">
                        {content}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!fromExtension && (
          <button onClick={onClose} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition py-1">
            Analyze something else →
          </button>
        )}
      </div>
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => { resolve((reader.result as string).split(',')[1]) }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AnalyzerPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AnalyzerContent />
    </Suspense>
  )
}
