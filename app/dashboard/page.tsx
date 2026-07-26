'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Zap, Flame, Trophy, Target, Award, Shield } from 'lucide-react'
import type { Database } from '@/lib/supabase'

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
    }

    checkTodayProgress()
    fetchBadges()
  }, [user])

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {profile?.display_name}!
          </h1>
          <p className="text-muted-foreground text-lg">Ready to sharpen your AI detection skills?</p>
        </div>
      </section>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {/* Stats Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Total XP</h3>
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <p className="text-3xl font-bold text-primary mb-1">{profile?.total_xp || 0}</p>
            <p className="text-sm text-muted-foreground">Points earned</p>
          </div>

          {/* Streak Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Current Streak</h3>
              <Flame className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-3xl font-bold text-secondary mb-1">{profile?.current_streak || 0}</p>
            <p className="text-sm text-muted-foreground">Days in a row</p>
          </div>

          {/* Best Streak Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Best Streak</h3>
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <p className="text-3xl font-bold text-accent mb-1">{profile?.longest_streak || 0}</p>
            <p className="text-sm text-muted-foreground">Personal record</p>
          </div>

          {/* Today's Score */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Today&apos;s Score</h3>
              <Target className="w-5 h-5 text-primary" />
            </div>
            {playedToday && todayScore ? (
              <>
                <p className="text-3xl font-bold text-primary mb-1">
                  {todayScore.correct}/{todayScore.total}
                </p>
                <p className="text-sm text-muted-foreground">+{todayScore.xp} XP</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-muted mb-1">-</p>
                <p className="text-sm text-muted-foreground">Play today</p>
              </>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-primary to-secondary/50 rounded-lg p-8 mb-12 text-white">
          <h2 className="text-2xl font-bold mb-2">
            {playedToday ? 'Great work today!' : "Today's Challenge Awaits"}
          </h2>
          <p className="mb-6 text-white/90">
            {playedToday
              ? `You scored ${todayScore?.correct}/${todayScore?.total} and earned ${todayScore?.xp} XP. Play again to keep improving!`
              : "Complete today's 5-question quiz to boost your XP and keep your streak alive."}
          </p>
          <Button
            className="bg-white text-primary hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed"
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

        {/* Badges Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="bg-card border border-border rounded-lg p-4 text-center hover:shadow-lg transition"
              >
                <div className="text-3xl mb-2 flex justify-center">
                  <Award className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1">{badge.name}</h3>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            className="group text-left disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={quizLoading}
            onClick={() => router.push('/dashboard/arena')}
          >
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition h-full">
              {quizLoading ? (
                <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin block mb-2" />
              ) : (
                <Zap className="w-8 h-8 text-primary mb-2" />
              )}
              <h3 className="font-semibold text-foreground mb-1">Play Arena</h3>
              <p className="text-sm text-muted-foreground">
                {quizLoading ? 'Generating quiz...' : 'Daily quiz'}
              </p>
            </div>
          </button>
          <Link href="/dashboard/analyzer" className="group">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition h-full">
              <Shield className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Analyzer</h3>
              <p className="text-sm text-muted-foreground">Check any content</p>
            </div>
          </Link>
          <Link href="/dashboard/leaderboard" className="group">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-secondary transition">
              <Trophy className="w-8 h-8 text-secondary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Leaderboard</h3>
              <p className="text-sm text-muted-foreground">Top detectives</p>
            </div>
          </Link>
          <Link href="/dashboard/guide" className="group">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-accent transition">
              <Trophy className="w-8 h-8 text-accent mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Guide</h3>
              <p className="text-sm text-muted-foreground">Learn tips</p>
            </div>
          </Link>
        </section>
      </div>
    </div>
  )
}
