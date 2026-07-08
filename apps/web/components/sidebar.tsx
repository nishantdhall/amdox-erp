'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '💰', label: 'Finance', href: '/finance' },
  { icon: '👥', label: 'HR & Payroll', href: '/hr' },
  { icon: '📦', label: 'Supply Chain', href: '/supply-chain' },
  { icon: '🤖', label: 'AI Forecasting', href: '/ai-forecasting' },
  { icon: '📈', label: 'Analytics', href: '/analytics' },
  { icon: '⚙️', label: 'Settings', href: '/settings' },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div
      className={`h-full bg-[#1a1d2e] flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        {!isCollapsed && (
          <div className="animate-fade-in">
            <div className="text-[15px] font-extrabold text-white tracking-wide">
              AMDOX <span className="gradient-text">ERP</span>
            </div>
            <div className="text-[10px] text-white/35 mt-0.5">AI-Powered ERP Suite</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="text-white/40 hover:text-white text-sm transition-colors p-1 rounded hover:bg-white/10"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '»' : '«'}
        </button>
      </div>

      {/* Section Label */}
      {!isCollapsed && (
        <div className="px-5 pt-5 pb-2">
          <div className="text-[9px] text-white/25 uppercase tracking-[2px] font-semibold">Modules</div>
        </div>
      )}

      {/* Nav Items */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2 pt-4' : 'px-3'} space-y-0.5`}>
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 py-2.5 rounded-lg transition-all duration-150 ${
                isCollapsed ? 'justify-center px-2' : 'px-3'
              } ${
                active
                  ? 'bg-[#4f6ef7]/20 text-[#879fff]'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-[16px] flex-shrink-0">{item.icon}</span>
              {!isCollapsed && (
                <span className="text-[13px] font-medium truncate">{item.label}</span>
              )}
              {active && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4f6ef7]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-white/8 px-4 py-3">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-full bg-[#4f6ef7] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            N
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-[12px] text-white font-semibold truncate">Nishant D.</div>
              <div className="text-[10px] text-white/35">TenantAdmin</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-white/8">
          <div className="text-[10px] text-white/20 leading-relaxed">
            Amdox Technologies<br />Internship 2026
          </div>
        </div>
      )}
    </div>
  )
}
