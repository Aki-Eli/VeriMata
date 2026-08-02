'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Zap, Trophy, LogOut, Home, BookOpen, Puzzle, ShieldAlert, Flame, Shield } from 'lucide-react'

const LEVEL_XP = 500

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/analyzer', label: 'Analyzer', icon: Shield },
  { href: '/dashboard/guide', label: 'Guide', icon: BookOpen },
  { href: '/dashboard/extension', label: 'Extension', icon: Puzzle },
  { href: '/dashboard/flags', label: 'Flags', icon: ShieldAlert },
]

export function Navigation() {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  const totalXp = profile?.total_xp || 0
  const level = Math.floor(totalXp / LEVEL_XP) + 1
  const xpIntoLevel = totalXp % LEVEL_XP
  const xpPct = Math.round((xpIntoLevel / LEVEL_XP) * 100)

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden border-2 border-primary/30 transition-transform group-hover:scale-105 group-hover:-rotate-3">
            <img src="/logo.jpg" alt="VeriMata" className="w-full h-full object-contain" />
          </div>
          <div className="text-lg font-display font-bold tracking-tight leading-none">
            <span className="text-gradient">Veri</span>
            <span className="text-foreground">Mata</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1 bg-card/60 border border-border rounded-full px-1.5 py-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_50%,transparent)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/profile"
            className="hidden sm:flex items-center gap-2.5 bg-card/60 border border-border rounded-full pl-1 pr-3 py-1 hover-lift group"
          >
            <div className="relative w-7 h-7 shrink-0">
              <svg viewBox="0 0 36 36" className="w-7 h-7 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--muted)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 15.5}`}
                  strokeDashoffset={`${2 * Math.PI * 15.5 * (1 - xpPct / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-hud font-bold text-accent">
                {level}
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="flex items-center gap-1 text-xs font-hud font-semibold text-foreground">
                <Zap className="w-3 h-3 text-accent" />
                {totalXp.toLocaleString()} XP
              </span>
              {(profile?.current_streak ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Flame className="w-3 h-3 text-secondary flicker-flame" />
                  {profile?.current_streak} day streak
                </span>
              )}
            </div>
          </Link>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] hover-lift">
            <Link
              href="/dashboard/profile"
              className="w-full h-full rounded-full bg-card flex items-center justify-center text-foreground font-semibold text-sm"
            >
              {profile?.display_name?.[0]?.toUpperCase() || 'U'}
            </Link>
          </div>

          <Button variant="ghost" size="icon-sm" onClick={handleSignOut} className="hidden sm:flex" aria-label="Sign out">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-border px-4 py-2.5 flex gap-2 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
