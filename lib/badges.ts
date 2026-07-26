import { supabase } from './supabase'
import type { Database } from './supabase'

export type Badge = Database['public']['Tables']['badges']['Row']

// Badge unlock conditions
export const BADGE_CONDITIONS = {
  FIRST_DETECTION: { xpThreshold: 0, name: 'First Detection' },
  ACCURACY_EXPERT: { xpThreshold: 100, name: 'Accuracy Expert' },
  WEEK_WARRIOR: { streakThreshold: 7, name: 'Week Warrior' },
  XP_MASTER: { xpThreshold: 1000, name: 'XP Master' },
  DETECTIVE: { xpThreshold: 5000, name: 'Detective' },
  MASTER_DETECTIVE: { xpThreshold: 10000, name: 'Master Detective' },
}

/**
 * Check and award badges to a user based on their stats
 */
export async function checkAndAwardBadges(userId: string) {
  try {
    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) throw userError
    if (!user) return

    // Get all available badges
    const { data: allBadges, error: badgesError } = await supabase
      .from('badges')
      .select('*')

    if (badgesError) throw badgesError
    if (!allBadges) return

    // Get user's earned badges
    const { data: earnedBadges, error: earnedError } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)

    if (earnedError) throw earnedError

    const earnedBadgeIds = new Set(earnedBadges?.map((b) => b.badge_id) || [])

    // Check each badge condition
    const badgesToAward: string[] = []

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue

      let shouldAward = false

      // Check XP-based badges
      if (badge.name === 'First Detection' && user.total_xp >= 0) {
        shouldAward = true
      } else if (badge.name === 'Accuracy Expert') {
        // Check if user achieved 90% accuracy on any quiz
        const { data: responses } = await supabase
          .from('user_quiz_responses')
          .select('quiz_date, is_correct')
          .eq('user_id', userId)

        if (responses) {
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

          shouldAward = Object.values(dailyStats).some((d) => (d.correct / d.total) * 100 >= 90)
        }
      } else if (badge.name === 'Week Warrior' && user.current_streak >= 7) {
        shouldAward = true
      } else if (badge.name === 'XP Master' && user.total_xp >= 1000) {
        shouldAward = true
      } else if (badge.name === 'Detective' && user.total_xp >= 5000) {
        shouldAward = true
      } else if (badge.name === 'Master Detective' && user.total_xp >= 10000) {
        shouldAward = true
      }

      if (shouldAward) {
        badgesToAward.push(badge.id)
      }
    }

    // Award new badges
    if (badgesToAward.length > 0) {
      const badgeInserts = badgesToAward.map((badgeId) => ({
        user_id: userId,
        badge_id: badgeId,
      }))

      const { error: insertError } = await supabase
        .from('user_badges')
        .insert(badgeInserts)

      if (insertError) throw insertError
    }

    return badgesToAward.length
  } catch (err) {
    console.error('Failed to check and award badges:', err)
    return 0
  }
}

/**
 * Get all available badges
 */
export async function getAllBadges() {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('xp_threshold', { ascending: true })

  if (error) throw error
  return data as Badge[]
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(userId: string) {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*, badges:badge_id(*)')
    .eq('user_id', userId)

  if (error) throw error
  return data
}
