'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart2, PenLine, Zap, BookOpen, Sparkles, User,
  LayoutDashboard, GraduationCap, Users, type LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ParolaMascot } from './ParolaMascot'
import { LogoutButton } from './LogoutButton'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from './NotificationBell'
import { TeacherNotificationBell } from './TeacherNotificationBell'
import { AdminNotificationBell } from './AdminNotificationBell'

interface NavItem { href: string; label: string }
interface AppNavProps { items: NavItem[] }

const ROUTE_ICONS: Record<string, LucideIcon> = {
  '/student/progress':    BarChart2,
  '/student/write':       PenLine,
  '/student/exercises':   Zap,
  '/student/guides':      BookOpen,
  '/student/personalized': Sparkles,
  '/teacher/dashboard':   LayoutDashboard,
  '/teacher/classes':     GraduationCap,
  '/teacher/students':    Users,
  '/account':             User,
}

export function AppNav({ items }: AppNavProps) {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-30 border-b border-border/60 bg-[var(--surface-translucent)] px-3 py-2 backdrop-blur-xl sm:px-5">
      {/* gradient top accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-brand-600 via-violet-400 to-coral-400 opacity-80" />

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg px-1 py-0.5 transition-opacity hover:opacity-80">
          <ParolaMascot mood="neutro" className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="hidden font-bold text-ink-primary sm:inline">
            <span className="gradient-text-brand">Parola</span>
          </span>
        </Link>

        {/* Nav links */}
        <ul className="hide-scrollbar flex flex-1 items-center gap-0.5 overflow-x-auto sm:gap-1">
          {items.map((item) => {
            const isActive = pathname === item.href
            const Icon = ROUTE_ICONS[item.href] ?? User
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  title={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200 sm:px-3 sm:text-sm',
                    isActive
                      ? 'bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-glow-brand'
                      : 'text-ink-secondary hover:bg-surface-tertiary hover:text-ink-primary'
                  )}
                >
                  <Icon
                    className={cn(
                      'shrink-0 transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'h-3.5 w-3.5 text-white/90' : 'h-3.5 w-3.5'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Right controls */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <NotificationBell />
          <TeacherNotificationBell />
          <AdminNotificationBell />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}
