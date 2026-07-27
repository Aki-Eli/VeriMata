'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trophy, Zap, Target, Medal } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type LeaderboardEntry = Database['public']['Tables']['leaderboard_cache']['Row']

const SORT_OPTIONS = [
  { key: 'xp', label: 'Total XP' },
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'streak', label: 'Streak' },
] as const

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
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <div className="text-lg font-semibold text-muted-foreground">Loading leaderboard…</div>
        </div>
      </div>
    )
  }

  const topEntries = entries.slice(0, 10)
  const podium = topEntries.slice(0, 3)
  const rest = topEntries.slice(3)

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/15 via-transparent to-accent/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-secondary" />
            <h1 className="font-display text-4xl font-bold text-foreground">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">Top AI detectives compete here</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 py-12">
        {/* Your Rank Card */}
        {userRank && (
          <div className="mb-12 hud-card glow-primary rounded-2xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Your Rank</p>
                <p className="font-hud text-4xl font-bold text-primary">#{userRank.rank}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total XP</p>
                <p className="font-hud text-4xl font-bold text-secondary flex items-center gap-2">
                  <Zap className="w-6 h-6" />
                  {userRank.total_xp}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Accuracy</p>
                <p className="font-hud text-4xl font-bold text-accent">{userRank.accuracy_percentage}%</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Streak</p>
                <p className="font-hud text-4xl font-bold text-foreground">{userRank.current_streak}</p>
              </div>
            </div>
          </div>
        )}

        {/* Podium */}
        {podium.length > 0 && (
          <div className="mb-12 grid grid-cols-3 gap-3 md:gap-6 items-end max-w-3xl mx-auto">
            {[podium[1], podium[0], podium[2]].map((entry, i) => {
              if (!entry) return <div key={i} />
              const place = i === 1 ? 1 : i === 0 ? 2 : 3
              const heights = { 1: 'h-40 md:h-48', 2: 'h-32 md:h-36', 3: 'h-24 md:h-28' } as const
              const medalColor = { 1: 'text-accent', 2: 'text-muted-foreground', 3: 'text-[#c9803e]' } as const
              return (
                <div key={entry.user_id} className="pop-in flex flex-col items-center" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] mb-2 ${place === 1 ? 'glow-accent' : ''}`}>
                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center font-bold text-lg text-foreground">
                      {entry.username[0]?.toUpperCase()}
                    </div>
                  </div>
                  <Medal className={`w-5 h-5 mb-1 ${medalColor[place]}`} />
                  <p className="font-semibold text-sm text-foreground text-center truncate max-w-[100px]">{entry.username}</p>
                  <p className="font-hud text-xs text-accent mb-2">{entry.total_xp} XP</p>
                  <div className={`w-full ${heights[place]} hud-card rounded-t-2xl flex items-start justify-center pt-3`}>
                    <span className="font-display font-bold text-2xl text-muted-foreground">#{place}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Sort Buttons */}
        <div className="flex gap-2 mb-6">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`press-scale px-4 py-2 rounded-full font-medium text-sm transition-all ${
                sortBy === opt.key
                  ? 'bg-primary text-primary-foreground glow-primary'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="hud-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
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
                {rest.map((entry, idx) => (
                  <tr
                    key={entry.user_id}
                    className={`rise-in border-b border-border last:border-0 transition ${
                      entry.user_id === profile?.id
                        ? 'bg-primary/10 hover:bg-primary/15'
                        : 'hover:bg-muted/40'
                    }`}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <td className="px-6 py-4">
                      <span className="font-hud text-muted-foreground font-semibold">{entry.rank}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm">
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
                      <span className="font-hud font-semibold text-foreground flex items-center justify-end gap-2">
                        <Zap className="w-4 h-4 text-accent" />
                        {entry.total_xp}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-hud font-semibold text-foreground">{entry.accuracy_percentage}%</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-hud text-muted-foreground">{entry.quizzes_completed}</span>
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
