'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { checkUsernameAvailable } from '@/lib/auth'


// this is SignUpPage
export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const handleUsernameChange = async (value: string) => {
    setUsername(value)
    if (value.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setChecking(true)
    try {
      const available = await checkUsernameAvailable(value)
      setUsernameAvailable(available)
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (usernameAvailable === false) {
      setError('Username is not available')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, username)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10" />
      <div className="pop-in relative w-full max-w-md">
        <div className="hud-card glow-primary rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <img src="/logo.jpg" alt="VeriMata" className="w-16 h-16 mx-auto mb-4 rounded-2xl object-contain" />
            <h1 className="font-display text-3xl font-bold text-gradient mb-2">Join VeriMata</h1>
            <p className="text-muted-foreground">Start your AI detection journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition ${usernameAvailable === true ? 'border-secondary' : usernameAvailable === false ? 'border-destructive' : 'border-border'
                  }`}
                placeholder="your_username"
                minLength={3}
                required
              />
              {checking && <p className="text-xs text-muted-foreground mt-1">Checking availability...</p>}
              {usernameAvailable === true && <p className="text-xs text-secondary mt-1">Username available!</p>}
              {usernameAvailable === false && <p className="text-xs text-destructive mt-1">Username taken</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            {error && <div className="p-3 bg-destructive/10 border border-destructive/40 text-destructive rounded-xl text-sm">{error}</div>}

            <Button
              type="submit"
              disabled={loading || usernameAvailable === false}
              className="w-full py-5 text-base"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
