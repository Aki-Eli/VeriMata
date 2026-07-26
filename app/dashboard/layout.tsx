'use client'

import { ProtectedRoute } from '@/components/protected-route'
import { Navigation } from '@/components/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
