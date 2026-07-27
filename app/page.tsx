'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function Page() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/auth/signin')
      }
    }
  }, [user, loading, router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        </div>
        <div className="font-display text-3xl font-bold text-gradient mb-2">Spot the Bot</div>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </main>
  )
}
