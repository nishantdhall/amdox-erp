'use client'
import Link from 'next/link'

interface NavItem {
  label: string
  href: string
  icon?: string
}

interface SubNavProps {
  items: NavItem[]
  title: string
  icon?: string
  currentPath?: string
}

export function SubNav({ items, title, icon, currentPath='' }: SubNavProps) {
  return (
    <div className="w-[180px] flex-shrink-0 bg-[#1a1d2e] rounded-xl overflow-hidden self-start animate-slide-left">
      <div className="px-4 py-3 border-b border-white/10">
        <div className="text-[11px] font-bold text-white/50 uppercase tracking-[1.5px]">
          {icon} {title}
        </div>
      </div>
      <div className="py-2">
        {items.map((item) => {
          const isActive = currentPath === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 text-[12px] transition-all duration-150 border-l-[3px] ${
                isActive
                  ? 'bg-[#4f6ef7]/20 text-[#879fff] border-[#4f6ef7] font-medium'
                  : 'text-white/50 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
