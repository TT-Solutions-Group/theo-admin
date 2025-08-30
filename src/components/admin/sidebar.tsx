"use client"

import { Button } from '@/components/ui/button'
import {
    Activity,
    Bookmark,
    Languages,
    LayoutDashboard,
    List,
    LogOut,
    Megaphone,
    Menu,
    Repeat,
    Tags,
    Users,
    Wallet,
    X
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  // { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/transactions', label: 'Transactions', icon: List },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/category-translations', label: 'Category Translations', icon: Languages },
  { href: '/admin/user-categories', label: 'User Categories', icon: Bookmark },
  // { href: '/admin/user-cards', label: 'Cards', icon: CreditCard },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: Repeat },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/budgets', label: 'Limits', icon: Wallet },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  
  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      setLoggingOut(false)
    }
  }
  
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-[rgb(var(--border))]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[rgb(var(--whoop-green))] flex items-center justify-center">
            <Activity className="w-6 h-6 text-black" />
          </div>
          <span className="text-xl font-bold">
            {process.env.NEXT_PUBLIC_APP_NAME || 'Teodor Admin'}
          </span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
                           (item.href !== '/admin' && pathname.startsWith(item.href))
            const Icon = item.icon
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all duration-200 ${
                    isActive
                      ? 'bg-[rgb(var(--whoop-green))] text-black font-medium'
                      : 'text-[rgb(var(--secondary-foreground))] hover:bg-[rgb(var(--card))] hover:text-[rgb(var(--foreground))]'
                  }`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      
      {/* Logout Button */}
      <div className="p-4 border-t border-[rgb(var(--border))]">
        <Button
          variant="secondary"
          size="md"
          className="w-full"
          onClick={handleLogout}
          loading={loggingOut}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </>
  )
  
  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[rgb(var(--card-elevated))] lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-[rgb(var(--background-secondary))] border-r border-[rgb(var(--border))] fixed left-0 top-0">
        <SidebarContent />
      </aside>
      
      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-[rgb(var(--background-secondary))] border-r border-[rgb(var(--border))] transform transition-transform duration-300 lg:hidden ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </aside>
    </>
  )
}