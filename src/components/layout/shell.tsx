'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { NAVIGATION, breadcrumbFor } from '@/lib/nav'
import { ROLE_PERMISSIONS, type Permission } from '@/lib/auth/rbac'
import { cn, initials } from '@/lib/utils'
import { Logo } from './logo'
import type { Role } from '@/lib/types'

export interface ShellUser {
  name: string
  email: string
  role: Role
  tenantName: string
  tenantPlan: string
}

export function AppShell({
  user,
  unreadCount,
  children,
  signOut,
}: {
  user: ShellUser
  unreadCount: number
  children: ReactNode
  signOut: ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the drawer whenever navigation happens.
  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [pathname])

  const granted = new Set<Permission>(ROLE_PERMISSIONS[user.role])
  const trail = breadcrumbFor(pathname)

  const sections = NAVIGATION.map((section) => ({
    ...section,
    items: section.items.filter((item) => granted.has(item.permission)),
  })).filter((section) => section.items.length > 0)

  const sidebar = (
    <>
      <div className="flex h-14 items-center border-b border-white/10 px-4">
        <Logo variant="dark" />
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/35">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                        active ? 'bg-brand-500 text-white shadow-sm' : 'text-white/65 hover:bg-white/[0.07] hover:text-white',
                      )}
                    >
                      <span aria-hidden className="w-4 shrink-0 text-center text-[13px] opacity-90">
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                      {item.href === '/notifications' && unreadCount > 0 ? (
                        <span className="tnum ml-auto shrink-0 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="rounded-lg bg-white/[0.06] p-3">
          <p className="truncate text-[11px] font-semibold text-white">{user.tenantName}</p>
          <p className="mt-0.5 text-[10px] capitalize text-white/45">{user.tenantPlan} plan · AMX-ERP-2026-04</p>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] flex-col bg-ink lg:flex">{sidebar}</aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close navigation" className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] flex-col bg-ink shadow-pop">{sidebar}</aside>
        </div>
      ) : null}

      <div className="lg:pl-[var(--sidebar-width)]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-ink-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-ink-line text-ink lg:hidden"
          >
            <span aria-hidden>☰</span>
          </button>

          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 text-xs text-ink-muted">
              {trail.map((crumb, i) => (
                <li key={crumb} className="flex items-center gap-1.5">
                  {i > 0 ? <span aria-hidden>/</span> : null}
                  <span className={cn('truncate', i === trail.length - 1 && 'font-semibold text-ink')}>{crumb}</span>
                </li>
              ))}
            </ol>
          </nav>

          <Link
            href="/notifications"
            className="relative grid h-8 w-8 place-items-center rounded-lg border border-ink-line text-ink transition-colors hover:bg-surface-sunken"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <span aria-hidden>◉</span>
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-lg border border-ink-line py-1 pl-1 pr-2 transition-colors hover:bg-surface-sunken"
            >
              <span aria-hidden className="grid h-6 w-6 place-items-center rounded-md bg-brand-500 text-[10px] font-bold text-white">
                {initials(user.name)}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-[130px] truncate text-[11px] font-semibold text-ink">{user.name}</span>
                <span className="block text-[10px] text-ink-muted">{user.role}</span>
              </span>
              <span aria-hidden className="text-[9px] text-ink-muted">
                ▼
              </span>
            </button>

            {menuOpen ? (
              <div role="menu" className="absolute right-0 top-full z-30 mt-1.5 w-60 rounded-xl border border-ink-line bg-white p-1.5 shadow-pop">
                <div className="border-b border-ink-line px-2.5 pb-2 pt-1.5">
                  <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-[11px] text-ink-muted">{user.email}</p>
                  <p className="mt-1 truncate text-[10px] text-ink-muted">
                    {user.tenantName} · {user.role}
                  </p>
                </div>
                <Link href="/settings" role="menuitem" className="mt-1 block rounded-lg px-2.5 py-1.5 text-xs text-ink hover:bg-surface-sunken">
                  Settings & preferences
                </Link>
                <Link href="/api-docs" role="menuitem" className="block rounded-lg px-2.5 py-1.5 text-xs text-ink hover:bg-surface-sunken">
                  API reference
                </Link>
                <div className="mt-1 border-t border-ink-line pt-1">{signOut}</div>
              </div>
            ) : null}
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1400px] animate-fade-up px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="mx-auto w-full max-w-[1400px] px-4 pb-8 sm:px-6 lg:px-8">
          <p className="border-t border-ink-line pt-4 text-[11px] text-ink-muted">
            AMDOX Technologies — AI-Powered Cloud ERP Suite · AMX-ERP-2026-04 · v1.0.0
          </p>
        </footer>
      </div>
    </div>
  )
}
