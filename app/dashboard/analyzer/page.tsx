'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Shield, Upload, Link2, FileText, X, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface AnalysisResult {
  aiProbability: number
  biasFlags: string[]
  reasoning: string
  factCheckRefs?: { label: string; url: string }[]
}

type AnalysisMode = 'text' | 'link' | 'image'
type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: AnalysisResult; mode: AnalysisMode }
  | { status: 'error'; message: string }

export default function AnalyzerPage() {
  const [mode, setMode] = useState<AnalysisMode>('text')
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [state, setState] = useState<AnalysisState>({ status: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        // Convert to base64
        const base64 = await fileToBase64(imageFile)
        body = { imageBase64: base64, imageMimeType: imageFile.type }
      } else if (mode === 'link' || mode === 'text') {
        body = { text: text.trim() }
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

  const canAnalyze =
    state.status !== 'loading' &&
    ((mode === 'text' && text.trim().length > 10) ||
      (mode === 'link' && text.trim().length > 5) ||
      (mode === 'image' && imageFile !== null))

  const reset = () => {
    setState({ status: 'idle' })
    setText('')
    setImageFile(null)
    setImagePreview(null)
  }

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
            Paste text, a link, or upload an image — Gemini AI will check it for AI-generated content,
            misinformation signals, and bias.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto w-full px-4 py-10 space-y-6">
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
                  mode === m
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            )
          })}
        </div>

        {/* Input area */}
        {(mode === 'text' || mode === 'link') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              {mode === 'text' ? 'Paste the text you want to analyze' : 'Paste the link you want to check'}
            </label>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setState({ status: 'idle' }) }}
              placeholder={
                mode === 'text'
                  ? 'Paste social media posts, news articles, or any text here…'
                  : 'https://example.com/article-or-post'
              }
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
              />

              {imagePreview ? (
                <div className="p-4">
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 rounded-lg object-contain mx-auto block"
                    />
                    <button
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80 transition"
                      onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setState({ status: 'idle' }) }}
                    >
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

        {/* Analyze button */}
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-base font-semibold disabled:opacity-40"
        >
          {state.status === 'loading' ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Analyzing with Gemini…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Analyze Content
            </span>
          )}
        </Button>

        {/* Error state */}
        {state.status === 'error' && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Analysis failed</p>
              <p className="text-sm text-destructive/80 mt-1">{state.message}</p>
            </div>
            <button onClick={reset} className="ml-auto text-destructive hover:text-destructive/80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Result card */}
        {state.status === 'done' && (
          <ResultCard result={state.result} mode={state.mode} onClose={reset} />
        )}

        {/* Info box */}
        {state.status === 'idle' && (
          <div className="bg-muted/40 border border-border rounded-lg p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">What does this analyze?</p>
            <ul className="space-y-1">
              <li><span className="font-medium text-foreground">Text</span> — Checks for AI-generated writing patterns and bias flags.</li>
              <li><span className="font-medium text-foreground">Link</span> — Inspects the URL structure for phishing, lookalike domains, and scam patterns.</li>
              <li><span className="font-medium text-foreground">Image</span> — Uses Gemini Vision to detect AI-generated or manipulated images.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function ResultCard({
  result,
  mode,
  onClose,
}: {
  result: AnalysisResult
  mode: AnalysisMode
  onClose: () => void
}) {
  const score = result.aiProbability
  const isHigh = score >= 70
  const isMedium = score >= 40 && score < 70
  const label = mode === 'link' ? 'Risk Score' : 'AI-Generated Likelihood'

  const scoreColor = isHigh
    ? 'text-destructive'
    : isMedium
    ? 'text-accent'
    : 'text-secondary'

  const trackColor = isHigh ? 'bg-destructive' : isMedium ? 'bg-accent' : 'bg-secondary'

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-foreground text-background">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="font-semibold text-sm">
            {mode === 'link' ? 'Link Safety Report' : 'Digital Nutrition Label'}
          </span>
        </div>
        <button onClick={onClose} className="hover:opacity-70 transition" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">{label}</span>
            <span className={`text-2xl font-bold ${scoreColor}`}>{score}%</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${trackColor}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">Human / Safe</span>
            <span className="text-xs text-muted-foreground">AI / Risky</span>
          </div>
        </div>

        {/* Verdict badge */}
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
          isHigh
            ? 'bg-destructive/10 border border-destructive/30'
            : isMedium
            ? 'bg-accent/10 border border-accent/30'
            : 'bg-secondary/10 border border-secondary/30'
        }`}>
          {isHigh ? (
            <AlertTriangle className={`w-5 h-5 text-destructive flex-shrink-0`} />
          ) : (
            <CheckCircle2 className={`w-5 h-5 ${isMedium ? 'text-accent' : 'text-secondary'} flex-shrink-0`} />
          )}
          <p className={`text-sm font-medium ${isHigh ? 'text-destructive' : isMedium ? 'text-accent' : 'text-secondary'}`}>
            {isHigh
              ? mode === 'link'
                ? 'This link looks risky — be careful before clicking.'
                : 'Likely AI-generated — treat with caution.'
              : isMedium
              ? 'Uncertain — this content may or may not be AI-generated.'
              : mode === 'link'
              ? 'This link appears safe.'
              : 'Likely human-written.'}
          </p>
        </div>

        {/* Bias flags */}
        {result.biasFlags.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {mode === 'link' ? 'Risk Signals' : 'Detected Patterns'}
            </p>
            <div className="flex flex-wrap gap-2">
              {result.biasFlags.map((flag) => (
                <span
                  key={flag}
                  className="px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full text-xs font-medium"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Reasoning</p>
          <p className="text-sm text-foreground leading-relaxed">{result.reasoning}</p>
        </div>

        {/* Fact check refs */}
        {result.factCheckRefs && result.factCheckRefs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">References</p>
            <ul className="space-y-1">
              {result.factCheckRefs.map((ref) => (
                <li key={ref.url}>
                  <a href={ref.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                    {ref.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Re-analyze button */}
        <button
          onClick={onClose}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition py-1"
        >
          Analyze something else →
        </button>
      </div>
    </div>
  )
}

// Convert File to base64 string (without the data: prefix)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the "data:image/jpeg;base64," prefix
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
