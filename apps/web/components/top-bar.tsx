'use client'
import { usePathname } from 'next/navigation'

interface TopBarProps {
  onMenuToggle: () => void
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const pathname = usePathname()

  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return 'Dashboard'
    const last = segments[segments.length - 1]
    return last
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  const getBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean)
    return segments
      .map((s) =>
        s
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      )
      .join(' / ')
  }

  return (
    <div className="bg-white border-b border-[#e0e5ef] px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-[#8898aa] hover:text-[#1a1d2e] p-1.5 rounded-lg hover:bg-[#f4f6fb] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <div>
          <h1 className="text-[15px] font-bold text-[#1a1d2e]">{getPageTitle()}</h1>
          <p className="text-[11px] text-[#8898aa]">{getBreadcrumb()}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center bg-[#f4f6fb] rounded-full px-3.5 py-2 border border-[#e0e5ef] w-[220px]">
          <span className="text-[#8898aa] text-sm mr-2">🔍</span>
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-[12px] text-[#1a1d2e] placeholder-[#8898aa] outline-none w-full"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-[#f4f6fb] transition-colors">
          <span className="text-lg">🔔</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#e5484d] rounded-full" />
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#4f6ef7] flex items-center justify-center text-white text-[12px] font-bold cursor-pointer hover:ring-2 hover:ring-[#4f6ef7]/30 transition-all">
          N
        </div>
      </div>
    </div>
  )
}
