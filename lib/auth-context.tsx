'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import type { Database } from './supabase'

export interface GeneratedQuestion {
  id: string
  type: 'text' | 'image'
  topic: string
  option_a_content: string
  option_b_content: string
  option_a_type: 'human' | 'ai'
  option_b_type: 'human' | 'ai'
  correct_answer: 'a' | 'b'
  explanation: string
}

interface QuizCache {
  questions: GeneratedQuestion[]
  generatedAt: number
}

interface AuthContextType {
  user: User | null
  profile: Database['public']['Tables']['users']['Row'] | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  // Quiz prefetch
  cachedQuiz: QuizCache | null
  quizLoading: boolean
  quizError: string | null
  refreshQuiz: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Database['public']['Tables']['users']['Row'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [cachedQuiz, setCachedQuiz] = useState<QuizCache | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  const fetchQuiz = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return
    fetchingRef.current = true
    setQuizLoading(true)
    setQuizError(null)

    try {
      const res = await fetch('/api/generate-quiz')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate quiz')
      }
      const data = await res.json()
      setCachedQuiz({ questions: data.questions, generatedAt: Date.now() })
    } catch (err: any) {
      setQuizError(err.message || 'Failed to generate quiz')
    } finally {
      setQuizLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Prefetch quiz when user logs in
  useEffect(() => {
    if (user && !cachedQuiz && !quizLoading) {
      fetchQuiz()
    }
    if (!user) {
      // Clear cache on logout
      setCachedQuiz(null)
      setQuizError(null)
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const refreshQuiz = useCallback(async () => {
    setCachedQuiz(null)
    await fetchQuiz()
  }, [fetchQuiz])

  useEffect(() => {
    const initAuth = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      setUser(sessionData?.session?.user || null)

      if (sessionData?.session?.user) {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', sessionData.session.user.id)
          .single()

        setProfile(profileData)
      }

      setLoading(false)
    }

    initAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)

        if (session?.user) {
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setProfile(profileData)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, username: string) => {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }, // passed to raw_user_meta_data, trigger uses this
      },
    })
    if (signUpError) throw signUpError
    // Profile row is created automatically by the DB trigger on auth.users insert
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshProfile = async () => {
    if (user) {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
    }
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signIn, signUp, signOut, refreshProfile,
      cachedQuiz, quizLoading, quizError, refreshQuiz,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
