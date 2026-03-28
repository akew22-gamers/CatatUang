'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  MessageSquare, 
  History, 
  Settings,
  LogOut,
  Menu,
  Wallet,
  User,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Users,
  Banknote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

interface WalletItem {
  id: number
  name: string
  saldo: number
}

const menuItems = [
  { href: '/dashboard', label: 'Chat AI', icon: MessageSquare, adminOnly: false },
  { href: '/dashboard/transactions', label: 'Riwayat Transaksi', icon: History, adminOnly: false },
  { href: '/dashboard/cashflow', label: 'Arus Kas', icon: Banknote, adminOnly: false },
  { href: '/dashboard/reports', label: 'Laporan', icon: BarChart3, adminOnly: false },
  { href: '/dashboard/users', label: 'Akses User', icon: Users, adminOnly: true },
  { href: '/dashboard/settings', label: 'Pengaturan', icon: Settings, adminOnly: true },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [wallets, setWallets] = useState<WalletItem[]>([])
  const [walletsLoading, setWalletsLoading] = useState(true)
  const [walletsCollapsed, setWalletsCollapsed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    loadWallets()
  }, [])

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      const role = profile?.role
      if (role === 'admin' || role === 'user') {
        setUserRole(role)
      } else {
        setUserRole('user')
      }
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadWallets() {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('group_id', 1)
        .order('name')
      
      if (error) {
        console.error('Error loading wallets:', error)
      } else {
        setWallets(data || [])
      }
    } catch (error) {
      console.error('Wallet load error:', error)
    } finally {
      setWalletsLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-soft">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Memuat...</p>
        </div>
      </div>
    )
  }

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 sm:p-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-shadow duration-200">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">CatatUang</h1>
            <p className="text-xs text-gray-500">AI Assistant</p>
          </div>
        </Link>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {menuItems
            .filter((item) => !item.adminOnly || userRole === 'admin')
            .map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => mobile && setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              )
            })}
        </nav>

        <div className="mt-6 sm:mt-8">
          <button
            onClick={() => setWalletsCollapsed(!walletsCollapsed)}
            className="w-full px-3 mb-3 flex items-center justify-between group"
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Saldo Dompet
            </h3>
            {walletsCollapsed ? (
              <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            ) : (
              <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            )}
          </button>
          {!walletsCollapsed && (
            <div className="space-y-1">
              {walletsLoading ? (
                <div className="px-3 space-y-2">
                  <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              ) : (
                wallets.map((wallet) => (
                  <div 
                    key={wallet.id} 
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs text-gray-600 truncate">{wallet.name}</span>
                    <span className="text-xs font-medium text-gray-900">
                      Rp {wallet.saldo?.toLocaleString('id-ID') || '0'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 sm:p-4 border-t border-gray-50 bg-gray-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </p>
              {userRole === 'admin' && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700 rounded">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-center text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all duration-200 rounded-lg h-9 sm:h-10 text-sm"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Keluar
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gradient-soft">
      <aside className="hidden md:block w-[260px] sticky top-0 h-screen border-r border-gray-100">
        <SidebarContent />
      </aside>

      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 h-14 safe-area-top">
        <div className="flex items-center justify-between h-full px-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] border-r border-gray-100">
              <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
              <SidebarContent mobile />
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              CatatUang
            </span>
          </Link>

          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
