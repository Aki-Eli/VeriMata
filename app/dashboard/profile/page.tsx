'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Zap, Flame, Trophy, Target, Award, Calendar, LogOut } from 'lucide-react'
import type { Database } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  const joinDate = profile.created_at ? new Date(profile.created_at) : null
  const earnedBadgeIds = new Set(badges.map((b) => b.badge_id))

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
              {profile.display_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{profile.display_name}</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Level</p>
              <p className="text-2xl font-bold text-primary">
                {Math.floor((profile.total_xp || 0) / 500) + 1}
              </p>
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
              <p className="text-2xl font-bold text-secondary">{badges.length}</p>
            </div>
            <div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 py-12">
        {/* Stats Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Total XP</h3>
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <p className="text-3xl font-bold text-accent mb-1">{stats.totalXp}</p>
              <p className="text-xs text-muted-foreground">Experience points</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Quizzes</h3>
                <Target className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary mb-1">{stats.totalQuizzes}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Accuracy</h3>
                <Trophy className="w-5 h-5 text-secondary" />
              </div>
              <p className="text-3xl font-bold text-secondary mb-1">{stats.totalAccuracy}%</p>
              <p className="text-xs text-muted-foreground">Overall</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Streak</h3>
                <Flame className="w-5 h-5 text-secondary" />
              </div>
              <p className="text-3xl font-bold text-secondary mb-1">{profile.current_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Days</p>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Achievements</h2>
          {badgeDetails.length === 0 ? (
            <p className="text-muted-foreground">Loading badges...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {badgeDetails.map((badge) => {
                const earned = earnedBadgeIds.has(badge.id)
                return (
                  <div
                    key={badge.id}
                    className={`relative group rounded-lg p-4 text-center transition ${
                      earned
                        ? 'bg-secondary/10 border border-secondary/50'
                        : 'bg-muted/50 border border-border opacity-50'
                    }`}
                  >
                    <div className={`text-4xl mb-2 flex justify-center ${earned ? '' : 'grayscale'}`}>
                      <Award className={`w-8 h-8 ${earned ? 'text-secondary' : 'text-muted-foreground'}`} />
                    </div>
                    <h3 className={`font-semibold text-sm mb-1 ${earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {badge.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    {earned && <div className="absolute top-2 right-2 w-3 h-3 bg-secondary rounded-full"></div>}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Account Info */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Account</h2>
          <div className="bg-card border border-border rounded-lg p-6">
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
