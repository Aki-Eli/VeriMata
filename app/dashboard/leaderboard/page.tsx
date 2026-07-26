'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trophy, Zap, Target } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type LeaderboardEntry = Database['public']['Tables']['leaderboard_cache']['Row']

export default function LeaderboardPage() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'xp' | 'accuracy' | 'streak'>('xp')
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        // Fetch all users with their stats
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .order('total_xp', { ascending: false })

        if (error) throw error

        if (users) {
          // Calculate stats for each user
          const enrichedEntries = await Promise.all(
            users.map(async (user) => {
              const { data: responses } = await supabase
                .from('user_quiz_responses')
                .select('is_correct')
                .eq('user_id', user.id)

              const correct = responses?.filter((r) => r.is_correct).length || 0
              const total = responses?.length || 0
              const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

              return {
                user_id: user.id,
                username: user.username,
                total_xp: user.total_xp || 0,
                accuracy_percentage: accuracy,
                current_streak: user.current_streak || 0,
                quizzes_completed: total,
                rank: 0,
                updated_at: new Date().toISOString(),
              } as LeaderboardEntry
            })
          )

          // Sort and assign ranks
          const sorted =
            sortBy === 'xp'
              ? enrichedEntries.sort((a, b) => b.total_xp - a.total_xp)
              : sortBy === 'accuracy'
                ? enrichedEntries.sort((a, b) => b.accuracy_percentage - a.accuracy_percentage)
                : enrichedEntries.sort((a, b) => b.current_streak - a.current_streak)

          const ranked = sorted.map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }))

          setEntries(ranked)

          // Find user's rank
          if (profile) {
            const userEntry = ranked.find((e) => e.user_id === profile.id)
            setUserRank(userEntry || null)
          }
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err)
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [sortBy, profile])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">Loading Leaderboard...</div>
        </div>
      </div>
    )
  }

  const topEntries = entries.slice(0, 10)

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-r from-secondary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-secondary" />
            <h1 className="text-4xl font-bold text-foreground">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">Top AI detectives compete here</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 py-12">
        {/* Your Rank Card */}
        {userRank && (
          <div className="mb-12 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Your Rank</p>
                <p className="text-4xl font-bold text-primary">{userRank.rank}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total XP</p>
                <p className="text-4xl font-bold text-secondary flex items-center gap-2">
                  <Zap className="w-6 h-6" />
                  {userRank.total_xp}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Accuracy</p>
                <p className="text-4xl font-bold text-accent">{userRank.accuracy_percentage}%</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Streak</p>
                <p className="text-4xl font-bold text-foreground">{userRank.current_streak}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sort Buttons */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setSortBy('xp')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              sortBy === 'xp'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Total XP
          </button>
          <button
            onClick={() => setSortBy('accuracy')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              sortBy === 'accuracy'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Accuracy
          </button>
          <button
            onClick={() => setSortBy('streak')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              sortBy === 'streak'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Streak
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">#</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                    <div className="flex items-center justify-end gap-2">
                      <Zap className="w-4 h-4" />
                      XP
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                    <div className="flex items-center justify-end gap-2">
                      <Target className="w-4 h-4" />
                      Accuracy
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Quizzes</th>
                </tr>
              </thead>
              <tbody>
                {topEntries.map((entry, idx) => (
                  <tr
                    key={entry.user_id}
                    className={`border-b border-border transition ${
                      entry.user_id === profile?.id
                        ? 'bg-primary/5 hover:bg-primary/10'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      {idx === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                      {idx === 1 && <Trophy className="w-5 h-5 text-gray-400" />}
                      {idx === 2 && <Trophy className="w-5 h-5 text-orange-600" />}
                      {idx > 2 && <span className="text-muted-foreground font-semibold">{idx + 1}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                          {entry.username[0]?.toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{entry.username}</span>
                          {entry.user_id === profile?.id && (
                            <span className="text-xs text-primary font-semibold">YOU</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-foreground flex items-center justify-end gap-2">
                        <Zap className="w-4 h-4 text-accent" />
                        {entry.total_xp}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-foreground">{entry.accuracy_percentage}%</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-muted-foreground">{entry.quizzes_completed}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No players yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  )
}
