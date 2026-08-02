import Link from 'next/link'
import { Download, Puzzle, MousePointerClick, ShieldAlert, ArrowRight } from 'lucide-react'

export default function ExtensionPage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-2">
            <Puzzle className="w-8 h-8 text-primary" />
            <h1 className="font-display text-4xl font-bold text-foreground">VeriMata Extension</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl">
            You&apos;ve trained your eye on the daily quiz — now take it with you. The VeriMata
            browser extension analyzes real content anywhere on the web, right where you&apos;re browsing.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto w-full px-4 py-12 flex flex-col gap-10">
        {/* Download CTA */}
        <div className="hud-card rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">Chrome extension (preview build)</h2>
            <p className="text-muted-foreground text-sm">
              v0.1.0 · Manifest V3 · Not yet on the Chrome Web Store — install it manually in a couple
              of clicks.
            </p>
          </div>
          <a
            href="/downloads/VeriMata.zip"
            download
            className="press-scale shrink-0 inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl glow-primary hover:brightness-110 transition-all"
          >
            <Download className="w-4 h-4" />
            Download .zip
          </a>
        </div>

        {/* What it does */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">What it does</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="hud-card hover-lift rounded-2xl p-4">
              <MousePointerClick className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm text-foreground font-medium mb-1">Right-click to analyze</p>
              <p className="text-xs text-muted-foreground">
                Highlight any text on a webpage and choose &quot;Analyze with VeriMata.&quot;
              </p>
            </div>
            <div className="hud-card hover-lift rounded-2xl p-4">
              <ShieldAlert className="w-6 h-6 text-accent mb-2" />
              <p className="text-sm text-foreground font-medium mb-1">Digital Nutrition Label</p>
              <p className="text-xs text-muted-foreground">
                Get an AI-probability score, bias flags, and a plain-language explanation in an overlay
                card.
              </p>
            </div>
            <div className="hud-card hover-lift rounded-2xl p-4">
              <Puzzle className="w-6 h-6 text-secondary mb-2" />
              <p className="text-sm text-foreground font-medium mb-1">Flag it for the community</p>
              <p className="text-xs text-muted-foreground">
                One click saves a suspicious post to the shared feed everyone can see.
              </p>
            </div>
          </div>
        </div>

        {/* Install instructions */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Install it</h2>
          <ol className="flex flex-col gap-3 text-sm text-foreground">
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary font-semibold text-xs flex items-center justify-center">
                1
              </span>
              <span>
                Download the .zip above and unzip it somewhere you&apos;ll remember (e.g. your
                Downloads folder).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary font-semibold text-xs flex items-center justify-center">
                2
              </span>
              <span>
                In Chrome, go to <code className="bg-muted px-1.5 py-0.5 rounded">chrome://extensions</code>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary font-semibold text-xs flex items-center justify-center">
                3
              </span>
              <span>
                Turn on <strong>Developer mode</strong> (top-right toggle).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary font-semibold text-xs flex items-center justify-center">
                4
              </span>
              <span>
                Click <strong>Load unpacked</strong> and select the unzipped folder.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary font-semibold text-xs flex items-center justify-center">
                5
              </span>
              <span>Go to facebook.com, highlight some post text, and right-click to try it.</span>
            </li>
          </ol>
        </div>

        {/* Link to flags dashboard */}
        <Link
          href="/dashboard/flags"
          className="group flex items-center justify-between hud-card rounded-2xl p-5 hover:border-primary/40 transition"
        >
          <div>
            <p className="text-foreground font-semibold">See what the community has flagged</p>
            <p className="text-sm text-muted-foreground">
              Browse every post flagged as suspicious across everyone using the extension.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition" />
        </Link>
      </div>
    </div>
  )
}
