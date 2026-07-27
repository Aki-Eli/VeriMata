'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Zap, Flame, Trophy, Target, Award, BookOpen, Puzzle, ShieldAlert, ArrowRight, Shield } from 'lucide-react'
import type { Database } from '@/lib/supabase'

const LEVEL_XP = 500

export default function DashboardPage() {
  const { profile, user, cachedQuiz, quizLoading } = useAuth()
  const router = useRouter()
  const [playedToday, setPlayedToday] = useState(false)
  const [todayScore, setTodayScore] = useState<{
    correct: number
    total: number
    xp: number
  } | null>(null)
  const [badges, setBadges] = useState<Database['public']['Tables']['badges']['Row'][]>([])
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return

    const checkTodayProgress = async () => {
      const today = new Date().toISOString().split('T')[0]

      const { data: responses } = await supabase
        .from('user_quiz_responses')
        .select('is_correct, xp_earned')
        .eq('user_id', user.id)
        .eq('quiz_date', today)

      if (responses && responses.length > 0) {
        const correct = responses.filter((r) => r.is_correct).length
        setPlayedToday(true)
        setTodayScore({
          correct,
          total: responses.length,
          xp: responses.reduce((sum, r) => sum + r.xp_earned, 0),
        })
      }
    }

    const fetchBadges = async () => {
      const { data } = await supabase.from('badges').select('*').limit(6)
      if (data) setBadges(data)

      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id)
      if (userBadges) setEarnedBadgeIds(new Set(userBadges.map((b) => b.badge_id)))
    }

    checkTodayProgress()
    fetchBadges()
  }, [user])

  const totalXp = profile?.total_xp || 0
  const level = Math.floor(totalXp / LEVEL_XP) + 1
  const xpIntoLevel = totalXp % LEVEL_XP
  const xpPct = Math.min(100, Math.round((xpIntoLevel / LEVEL_XP) * 100))
  const streak = profile?.current_streak || 0

  const stats = [
    {
      label: 'Total XP', value: totalXp.toLocaleString(), sub: `Level ${level} · ${LEVEL_XP - xpIntoLevel} to next`,
      icon: Zap, iconWrap: 'bg-accent/10', iconColor: 'text-accent', valueColor: 'text-accent', animateIcon: false,
    },
    {
      label: 'Current Streak', value: streak, sub: streak > 0 ? 'Days in a row' : 'Start one today',
      icon: Flame, iconWrap: 'bg-secondary/10', iconColor: 'text-secondary', valueColor: 'text-secondary', animateIcon: streak > 0,
    },
    {
      label: 'Best Streak', value: profile?.longest_streak || 0, sub: 'Personal record',
      icon: Trophy, iconWrap: 'bg-primary/10', iconColor: 'text-primary', valueColor: 'text-primary', animateIcon: false,
    },
    {
      label: "Today's Score",
      value: playedToday && todayScore ? `${todayScore.correct}/${todayScore.total}` : '—',
      sub: playedToday && todayScore ? `+${todayScore.xp} XP earned` : 'Play to fill this in',
      icon: Target, iconWrap: 'bg-primary/10', iconColor: 'text-primary', valueColor: 'text-primary', animateIcon: false,
    },
  ]

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-14">
          <p className="rise-in text-xs font-hud font-semibold tracking-[0.2em] text-secondary uppercase mb-3">
            Case File · Level {level}
          </p>
          <h1 className="rise-in font-display text-4xl md:text-5xl font-bold text-foreground mb-3" style={{ animationDelay: '60ms' }}>
            Welcome back, <span className="text-gradient">{profile?.display_name}</span>
          </h1>
          <p className="rise-in text-muted-foreground text-lg" style={{ animationDelay: '120ms' }}>
            Ready to sharpen your AI detection skills?
          </p>

          {/* Level progress bar */}
          <div className="rise-in mt-6 max-w-md" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center justify-between text-xs font-hud text-muted-foreground mb-1.5">
              <span>Level {level}</span>
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

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="pop-in hud-card hover-lift rounded-2xl p-6"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">{stat.label}</h3>
                  <div className={`p-1.5 rounded-lg ${stat.iconWrap}`}>
                    <Icon className={`w-4 h-4 ${stat.iconColor} ${stat.animateIcon ? 'flicker-flame' : ''}`} />
                  </div>
                </div>
                <p className={`font-hud text-3xl font-bold mb-1 ${stat.valueColor}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Call to Action */}
        <div className="scan-sweep relative rounded-3xl p-8 md:p-10 mb-12 text-white bg-gradient-to-br from-primary via-primary to-secondary/70 glow-primary">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                {playedToday ? 'Great work today!' : "Today's Challenge Awaits"}
              </h2>
              <p className="text-white/90 max-w-lg">
                {playedToday
                  ? `You scored ${todayScore?.correct}/${todayScore?.total} and earned ${todayScore?.xp} XP. Play again to keep improving!`
                  : "Complete today's 5-question quiz to boost your XP and keep your streak alive."}
              </p>
            </div>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 px-6 py-6 text-base"
              disabled={quizLoading}
              onClick={() => router.push('/dashboard/arena')}
            >
              {quizLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Generating Quiz...
                </span>
              ) : playedToday ? (
                'Play Again'
              ) : (
                'Start Quiz Now'
              )}
            </Button>
          </div>
        </div>

        {/* Badges Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-foreground">Achievements</h2>
            <Link href="/dashboard/profile" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {badges.map((badge, i) => {
              const earned = earnedBadgeIds.size === 0 ? true : earnedBadgeIds.has(badge.id)
              return (
                <div
                  key={badge.id}
                  className={`pop-in relative rounded-2xl p-4 text-center hover-lift transition ${
                    earned ? 'hud-card glow-accent' : 'bg-muted/30 border border-border opacity-60'
                  }`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="text-3xl mb-2 flex justify-center">
                    <Award className={`w-8 h-8 ${earned ? 'text-accent' : 'text-muted-foreground'}`} />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{badge.name}</h3>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Explore</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button
              className="group text-left disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={quizLoading}
              onClick={() => router.push('/dashboard/arena')}
            >
              <div className="hud-card hover-lift press-scale rounded-2xl p-6 h-full">
                {quizLoading ? (
                  <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin block mb-3" />
                ) : (
                  <Zap className="w-7 h-7 text-primary mb-3 group-hover:scale-110 transition-transform" />
                )}
                <h3 className="font-semibold text-foreground mb-1">Play Arena</h3>
                <p className="text-xs text-muted-foreground">
                  {quizLoading ? 'Generating quiz...' : 'Daily quiz'}
                </p>
              </div>
            </button>
            <Link href="/dashboard/leaderboard" className="group">
              <div className="hud-card hover-lift press-scale rounded-2xl p-6 h-full">
                <Trophy className="w-7 h-7 text-secondary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Leaderboard</h3>
                <p className="text-xs text-muted-foreground">Top detectives</p>
              </div>
            </Link>
            <Link href="/dashboard/analyzer" className="group">
              <div className="hud-card hover-lift press-scale rounded-2xl p-6 h-full">
                <Shield className="w-7 h-7 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Analyzer</h3>
                <p className="text-xs text-muted-foreground">Deep AI check</p>
              </div>
            </Link>
            <Link href="/dashboard/guide" className="group">
              <div className="hud-card hover-lift press-scale rounded-2xl p-6 h-full">
                <BookOpen className="w-7 h-7 text-accent mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Guide</h3>
                <p className="text-xs text-muted-foreground">Learn tips</p>
              </div>
            </Link>
            <Link href="/dashboard/extension" className="group">
              <div className="hud-card hover-lift press-scale rounded-2xl p-6 h-full">
                <Puzzle className="w-7 h-7 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Extension</h3>
                <p className="text-xs text-muted-foreground">Spot it live</p>
              </div>
            </Link>
            <Link href="/dashboard/flags" className="group">
              <div className="hud-card hover-lift press-scale rounded-2xl p-6 h-full">
                <ShieldAlert className="w-7 h-7 text-destructive mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-1">Flags</h3>
                <p className="text-xs text-muted-foreground">Community feed</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
