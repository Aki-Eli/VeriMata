'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { checkAndAwardBadges } from '@/lib/badges'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Zap, CheckCircle, XCircle, ImageIcon, FileText } from 'lucide-react'
import type { GeneratedQuestion } from '@/lib/auth-context'

export default function ArenaPage() {
  const { user, profile, refreshProfile, cachedQuiz, quizLoading, quizError, refreshQuiz } = useAuth()
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<'a' | 'b' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false)
  const [results, setResults] = useState<{ correct: number; total: number; accuracy: number; xp: number } | null>(null)
  // Use a ref for scores to avoid stale closure issues on last question
  const scoresRef = useRef<boolean[]>([])

  // Load from cache as soon as it's ready
  useEffect(() => {
    if (cachedQuiz && !results) {
      setQuestions(cachedQuiz.questions)
      setCurrentIndex(0)
      scoresRef.current = []
      setReady(true)
    }
    // If quiz failed to generate, still unblock the loading screen
    if (quizError) {
      setReady(false)
    }
  }, [cachedQuiz, quizError]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentQuestion = questions[currentIndex]

  const handleConfirm = async () => {
    if (!currentQuestion || !selectedAnswer) return
    setSubmitting(true)

    const isCorrect = selectedAnswer === currentQuestion.correct_answer
    const xpEarned = isCorrect ? 10 : 0
    setLastAnswerCorrect(isCorrect)
    scoresRef.current = [...scoresRef.current, isCorrect]

    // Save to Supabase
    if (user?.id) {
      try {
        const { error } = await supabase.from('user_quiz_responses').insert({
          user_id: user.id,
          quiz_date: new Date().toISOString().split('T')[0],
          question_id: currentQuestion.id,
          user_answer: selectedAnswer === 'a' ? currentQuestion.option_a_type : currentQuestion.option_b_type,
          is_correct: isCorrect,
          xp_earned: xpEarned,
        })
        if (error) console.error('Failed to save response:', error)
      } catch (e) {
        console.error('Failed to save response:', e)
      }
    }

    setShowExplanation(true)
    setSubmitting(false)
  }

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      // Quiz complete — read directly from ref to avoid stale state
      const allScores = scoresRef.current
      const correct = allScores.filter(Boolean).length
      const total = questions.length
      const xp = allScores.filter(Boolean).length * 10

      // Set results first so the UI shows results, not loading
      setResults({ correct, total, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0, xp })

      // Update profile & leaderboard
      if (user && profile) {
        try {
          // Streak: check if user played yesterday
          const todayStr = new Date().toISOString().split('T')[0]
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]

          const lastPlayed = profile.last_played_date
            ? new Date(profile.last_played_date).toISOString().split('T')[0]
            : null

          let newStreak: number
          if (lastPlayed === todayStr) {
            // Already played today (Play Again) — keep streak
            newStreak = profile.current_streak
          } else if (lastPlayed === yesterdayStr) {
            // Played yesterday — extend streak
            newStreak = (profile.current_streak || 0) + 1
          } else {
            // Gap — reset streak
            newStreak = 1
          }
          const longestStreak = Math.max(newStreak, profile.longest_streak || 0)

          const { error: updateError } = await supabase
            .from('users')
            .update({
              total_xp: (profile.total_xp || 0) + xp,
              current_streak: newStreak,
              longest_streak: longestStreak,
              last_played_date: new Date().toISOString(),
            })
            .eq('id', user.id)

          if (updateError) {
            console.error('Failed to update user profile:', updateError)
          } else {
            await refreshProfile()
            await checkAndAwardBadges(user.id)
          }
        } catch (profileErr) {
          console.error('Could not update profile stats:', profileErr)
        }
      }

      // Start generating next quiz in background AFTER results are shown
      refreshQuiz()
    }
  }

  // ── Results (checked BEFORE loading so refreshQuiz doesn't clobber the screen) ──
  if (results) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">Quiz Complete!</h1>

            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 my-8">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Accuracy</p>
                  <p className="text-4xl font-bold text-primary">{results.accuracy}%</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    {results.correct}/{results.total} correct
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-2">XP Earned</p>
                  <p className="text-4xl font-bold text-accent flex items-center justify-center gap-2">
                    <Zap className="w-8 h-8" />
                    {results.xp}
                  </p>
                </div>
              </div>

              {results.accuracy === 100 && (
                <div className="mb-6 p-4 bg-secondary/20 border border-secondary rounded-lg text-secondary">
                  <p className="font-semibold">Perfect score! You&apos;re a bot detective! 🎉</p>
                </div>
              )}
              {results.accuracy >= 80 && results.accuracy < 100 && (
                <div className="mb-6 p-4 bg-secondary/20 border border-secondary rounded-lg text-secondary">
                  <p className="font-semibold">Outstanding! You&apos;re crushing it!</p>
                </div>
              )}
              {results.accuracy >= 60 && results.accuracy < 80 && (
                <div className="mb-6 p-4 bg-accent/20 border border-accent rounded-lg text-accent">
                  <p className="font-semibold">Good job! Keep practicing to improve!</p>
                </div>
              )}
              {results.accuracy < 60 && (
                <div className="mb-6 p-4 bg-muted border border-border rounded-lg text-muted-foreground">
                  <p className="font-semibold">Keep going — spotting AI takes practice!</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button className="bg-muted text-foreground w-full">Back to Dashboard</Button>
              </Link>
              <Button
                className="flex-1 bg-primary text-primary-foreground"
                onClick={() => {
                  setResults(null)
                  setReady(false)
                  scoresRef.current = []
                  setSelectedAnswer(null)
                  setShowExplanation(false)
                  setCurrentIndex(0)
                }}
                disabled={quizLoading}
              >
                {quizLoading ? 'Generating...' : 'Play Again'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!ready || quizLoading || quizError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          {quizError ? (
            <>
              <div className="text-2xl font-bold text-destructive mb-2">Generation Failed</div>
              <p className="text-muted-foreground mb-4">{quizError}</p>
              <Button onClick={() => refreshQuiz()} className="bg-primary text-primary-foreground">
                Try Again
              </Button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-xl font-bold text-primary mb-2">Generating your quiz...</div>
              <p className="text-muted-foreground text-sm">Powered by Gemini AI &amp; Pollinations</p>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── No questions ─────────────────────────────────────────────────────────
  if (!questions.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">No Questions Generated</div>
          <Link href="/dashboard">
            <Button className="bg-primary text-primary-foreground">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── Quiz UI ──────────────────────────────────────────────────────────────
  if (!currentQuestion) return null

  const isImageQuestion = currentQuestion.type === 'image'

  return (
    <div className="flex-1 flex flex-col">
      {/* Progress Bar */}
      <div className="border-b border-border bg-card p-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                Question {currentIndex + 1} of {questions.length}
              </p>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isImageQuestion ? 'bg-accent/20 text-accent' : 'bg-secondary/20 text-secondary'
              }`}>
                {isImageQuestion ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                {isImageQuestion ? 'Image' : 'Text'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {Math.round(((currentIndex + 1) / questions.length) * 100)}%
            </p>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-start justify-center p-4 py-8">
        <div className="max-w-5xl w-full">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-1">Topic: {currentQuestion.topic}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Which {isImageQuestion ? 'image' : 'text'} is AI-generated?
            </h2>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['a', 'b'] as const).map((option) => {
              const content = option === 'a' ? currentQuestion.option_a_content : currentQuestion.option_b_content
              const isSelected = selectedAnswer === option
              const isCorrectOption = option === currentQuestion.correct_answer
              const borderClass = showExplanation
                ? isCorrectOption
                  ? 'border-green-500 bg-green-500/5'
                  : isSelected && !isCorrectOption
                    ? 'border-red-500 bg-red-500/5'
                    : 'border-border opacity-60'
                : isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'

              return (
                <div
                  key={option}
                  className={`cursor-pointer transition-all ${showExplanation || submitting ? 'pointer-events-none' : ''}`}
                  onClick={() => setSelectedAnswer(option)}
                >
                  <div className={`bg-card border-2 rounded-lg p-5 transition-all h-full flex flex-col ${borderClass}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-semibold">
                        OPTION {option.toUpperCase()}
                      </span>
                      {showExplanation && isCorrectOption && <CheckCircle className="w-6 h-6 text-green-500" />}
                      {showExplanation && isSelected && !isCorrectOption && <XCircle className="w-6 h-6 text-red-500" />}
                      {!showExplanation && isSelected && <CheckCircle className="w-6 h-6 text-primary" />}
                    </div>

                    {isImageQuestion ? (
                      <div className="flex-1 rounded-lg overflow-hidden bg-muted min-h-[220px]">
                        {content ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={content.startsWith('data:') ? content : `/api/proxy-image?url=${encodeURIComponent(content)}`}
                            alt={`Option ${option.toUpperCase()}`}
                            className="w-full h-full object-cover rounded-lg"
                            style={{ minHeight: 220 }}
                            onError={(e) => {
                              const el = e.target as HTMLImageElement
                              el.style.display = 'none'
                              if (el.parentElement) el.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:220px;color:#888;font-size:14px">Image unavailable</div>'
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center min-h-[220px] text-muted-foreground">
                            <ImageIcon className="w-12 h-12 opacity-30" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1">
                        <p className="text-foreground text-base leading-relaxed">{content}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Explanation panel */}
          {showExplanation && (
            <div className={`mt-6 p-5 rounded-lg border ${
              lastAnswerCorrect ? 'bg-green-500/10 border-green-500/40' : 'bg-red-500/10 border-red-500/40'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {lastAnswerCorrect
                  ? <CheckCircle className="w-5 h-5 text-green-500" />
                  : <XCircle className="w-5 h-5 text-red-500" />}
                <span className={`font-bold text-lg ${lastAnswerCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {lastAnswerCorrect ? 'Correct! +10 XP' : 'Not quite!'}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Why it&apos;s AI:</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6">
            {!showExplanation ? (
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-lg font-semibold disabled:opacity-40"
                disabled={!selectedAnswer || submitting}
                onClick={handleConfirm}
              >
                {submitting ? 'Checking...' : 'Confirm Answer'}
              </Button>
            ) : (
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-lg font-semibold"
                onClick={handleNext}
              >
                {currentIndex < questions.length - 1 ? 'Next Question →' : 'See Results'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
