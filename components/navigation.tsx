'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Zap, Trophy, LogOut, Home, BookOpen, Shield } from 'lucide-react'

export function Navigation() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
            ⚙️
          </div>
          <div className="text-xl font-bold text-primary">Spot the Bot</div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link
            href="/dashboard/leaderboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </Link>
          <Link
            href="/dashboard/analyzer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
          >
            <Shield className="w-4 h-4" />
            Analyzer
          </Link>
          <Link
            href="/dashboard/guide"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
          >
            <BookOpen className="w-4 h-4" />
            Guide
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-secondary/20 px-3 py-1 rounded-full text-sm">
            <Zap className="w-4 h-4 text-accent" />
            <span className="font-semibold text-foreground">{profile?.total_xp || 0}</span>
          </div>
          <Link href="/dashboard/profile" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
              {profile?.display_name?.[0]?.toUpperCase() || 'U'}
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="hidden sm:flex gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-border px-4 py-3 flex gap-2 overflow-x-auto">
        <Link
          href="/dashboard"
          className="px-3 py-2 bg-secondary/20 rounded-lg text-sm font-medium text-foreground whitespace-nowrap"
        >
          Home
        </Link>
        <Link
          href="/dashboard/leaderboard"
          className="px-3 py-2 bg-secondary/20 rounded-lg text-sm font-medium text-foreground whitespace-nowrap"
        >
          Leaderboard
        </Link>
        <Link
          href="/dashboard/analyzer"
          className="px-3 py-2 bg-secondary/20 rounded-lg text-sm font-medium text-foreground whitespace-nowrap"
        >
          Analyzer
        </Link>
        <Link
          href="/dashboard/profile"
          className="px-3 py-2 bg-secondary/20 rounded-lg text-sm font-medium text-foreground whitespace-nowrap"
        >
          Profile
        </Link>
      </div>
    </nav>
  )
}
