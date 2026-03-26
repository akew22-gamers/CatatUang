'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold">CatatUang</h1>
        </div>
        <nav className="space-y-1 px-3">
          <Link
            href="/dashboard"
            className="block px-3 py-2 rounded-md hover:bg-accent"
          >
            📊 Dashboard
          </Link>
          <Link
            href="/dashboard/transactions"
            className="block px-3 py-2 rounded-md hover:bg-accent"
          >
            💰 Transaksi
          </Link>
          <Link
            href="/dashboard/settings"
            className="block px-3 py-2 rounded-md hover:bg-accent"
          >
            ⚙️ Settings
          </Link>
        </nav>
        <div className="absolute bottom-0 w-64 p-3 border-t">
          <div className="text-sm text-muted-foreground mb-2">
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-accent rounded-md"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <header className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">
            {user?.email?.split('@')[0] || 'User'}
          </h2>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
