'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Zap, Flame, Trophy, Target, Award, LogOut } from 'lucide-react'
import type { Database } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const LEVEL_XP = 500

export default function ProfilePage() {
  const { profile, user, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalAccuracy: 0,
    totalXp: 0,
    bestDay: 0,
  })
  const [badges, setBadges] = useState<Database['public']['Tables']['user_badges']['Row'][]>([])
  const [badgeDetails, setBadgeDetails] = useState<Database['public']['Tables']['badges']['Row'][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !profile) return

    const loadStats = async () => {
      try {
        // Get all quiz responses
        const { data: responses, error } = await supabase
          .from('user_quiz_responses')
          .select('is_correct, xp_earned, quiz_date')
          .eq('user_id', user.id)

        if (error) throw error

        if (responses) {
          const totalCorrect = responses.filter((r) => r.is_correct).length
          const totalAccuracy = responses.length > 0 ? Math.round((totalCorrect / responses.length) * 100) : 0

          // Group by day to find best day
          const dailyStats = responses.reduce(
            (acc, r) => {
              if (!acc[r.quiz_date]) {
                acc[r.quiz_date] = { correct: 0, total: 0 }
              }
              acc[r.quiz_date].total += 1
              if (r.is_correct) acc[r.quiz_date].correct += 1
              return acc
            },
            {} as Record<string, { correct: number; total: number }>
          )

          const bestDay = Math.max(
            ...Object.values(dailyStats).map((d) => d.correct),
            0
          )

          setStats({
            totalQuizzes: Object.keys(dailyStats).length,
            totalAccuracy,
            totalXp: profile.total_xp || 0,
            bestDay,
          })
        }

        // Get user badges
        const { data: userBadges } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', user.id)

        if (userBadges) setBadges(userBadges)

        // Get all badges for context
        const { data: allBadges } = await supabase.from('badges').select('*').limit(10)

        if (allBadges) setBadgeDetails(allBadges)
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [user, profile])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  const joinDate = profile.created_at ? new Date(profile.created_at) : null
  const earnedBadgeIds = new Set(badges.map((b) => b.badge_id))
  const totalXp = profile.total_xp || 0
  const level = Math.floor(totalXp / LEVEL_XP) + 1
  const xpIntoLevel = totalXp % LEVEL_XP
  const xpPct = Math.min(100, Math.round((xpIntoLevel / LEVEL_XP) * 100))
  const ringCircumference = 2 * Math.PI * 34

  const statCards = [
    { label: 'Total XP', value: stats.totalXp, icon: Zap, color: 'text-accent', bg: 'bg-accent/10', sub: 'Experience points' },
    { label: 'Quizzes', value: stats.totalQuizzes, icon: Target, color: 'text-primary', bg: 'bg-primary/10', sub: 'Completed' },
    { label: 'Accuracy', value: `${stats.totalAccuracy}%`, icon: Trophy, color: 'text-secondary', bg: 'bg-secondary/10', sub: 'Overall' },
    { label: 'Streak', value: profile.current_streak || 0, icon: Flame, color: 'text-secondary', bg: 'bg-secondary/10', sub: 'Days' },
  ]

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-wrap items-center gap-6 mb-6">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--muted)" strokeWidth="5" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="var(--accent)" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringCircumference * (1 - xpPct / 100)}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-[5px] rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl">
                {profile.display_name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-1">{profile.display_name}</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
            <div className="ml-auto">
              <Button onClick={handleSignOut} variant="outline" className="gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Level</p>
              <p className="font-hud text-2xl font-bold text-primary">{level}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-1">Member Since</p>
              <p className="text-lg font-semibold text-foreground">
                {joinDate
                  ? joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                  : 'Recently'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-1">Badges</p>
              <p className="font-hud text-2xl font-bold text-secondary">{badges.length}</p>
            </div>
          </div>

          <div className="mt-6 max-w-md">
            <div className="flex items-center justify-between text-xs font-hud text-muted-foreground mb-1.5">
              <span>Progress to Level {level + 1}</span>
              <span>{xpIntoLevel} / {LEVEL_XP} XP</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 py-12">
        {/* Stats Grid */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="pop-in hud-card hover-lift rounded-2xl p-6" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground text-sm">{s.label}</h3>
                    <div className={`p-1.5 rounded-lg ${s.bg}`}>
                      <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                  </div>
                  <p className={`font-hud text-3xl font-bold mb-1 ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Achievements */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Achievements</h2>
          {badgeDetails.length === 0 ? (
            <p className="text-muted-foreground">Loading badges...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {badgeDetails.map((badge, i) => {
                const earned = earnedBadgeIds.has(badge.id)
                return (
                  <div
                    key={badge.id}
                    className={`pop-in relative rounded-2xl p-4 text-center hover-lift transition ${
                      earned ? 'hud-card glow-accent' : 'bg-muted/30 border border-border opacity-50'
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className={`text-4xl mb-2 flex justify-center ${earned ? '' : 'grayscale'}`}>
                      <Award className={`w-8 h-8 ${earned ? 'text-accent' : 'text-muted-foreground'}`} />
                    </div>
                    <h3 className={`font-semibold text-sm mb-1 ${earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {badge.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    {earned && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-card" />}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Account Info */}
        <section>
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Account</h2>
          <div className="hud-card rounded-2xl p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="font-semibold text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="font-semibold text-foreground">Username</p>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Joined</p>
                  <p className="text-sm text-muted-foreground">
                    {joinDate ? joinDate.toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
