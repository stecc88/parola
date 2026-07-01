'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart2, PenLine, Zap, BookOpen, Sparkles, User,
  LayoutDashboard, GraduationCap, Users, Menu, X, type LucideIcon
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
  '/student/progress':     BarChart2,
  '/student/write':        PenLine,
  '/student/exercises':    Zap,
  '/student/guides':       BookOpen,
  '/student/personalized': Sparkles,
  '/teacher/dashboard':    LayoutDashboard,
  '/teacher/classes':      GraduationCap,
  '/teacher/students':     Users,
  '/account':              User,
}

export function AppNav({ items }: AppNavProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <nav className="sticky top-0 z-30 border-b border-border/60 bg-[var(--surface-translucent)] backdrop-blur-xl">
      {/* gradient top accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-brand-600 via-violet-400 to-coral-400 opacity-80" />

      {/* Main bar */}
      <div className="flex items-center gap-2 px-3 py-2 sm:gap-4 sm:px-5">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-lg px-1 py-0.5 transition-opacity hover:opacity-80"
        >
          <ParolaMascot mood="neutro" className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="hidden font-bold text-ink-primary sm:inline">
            <span className="gradient-text-brand">Parola</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hide-scrollbar hidden flex-1 items-center gap-0.5 overflow-x-auto sm:flex sm:gap-1">
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
                    'group relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-glow-brand'
                      : 'text-ink-secondary hover:bg-surface-tertiary hover:text-ink-primary'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'text-white/90' : ''
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Desktop right controls */}
        <div className="hidden shrink-0 items-center gap-1 sm:flex sm:gap-2">
          <NotificationBell />
          <TeacherNotificationBell />
          <AdminNotificationBell />
          <ThemeToggle />
          <LogoutButton />
        </div>

        {/* Mobile: bells + hamburger */}
        <div className="flex flex-1 items-center justify-end gap-1 sm:hidden">
          <NotificationBell />
          <TeacherNotificationBell />
          <AdminNotificationBell />
          <button
            type="button"
            aria-label={mobileOpen ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-tertiary"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-border/60 sm:hidden">
          <ul className="space-y-0.5 px-3 py-2">
            {items.map((item) => {
              const isActive = pathname === item.href
              const Icon = ROUTE_ICONS[item.href] ?? User
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-gradient-to-br from-brand-600 to-violet-600 text-white'
                        : 'text-ink-secondary hover:bg-surface-tertiary hover:text-ink-primary'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      )}
    </nav>
  )
}
