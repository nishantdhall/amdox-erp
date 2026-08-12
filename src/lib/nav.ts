import type { Permission } from './auth/rbac'

export interface NavItem {
  href: string
  label: string
  icon: string
  permission: Permission
  /** Optional secondary links rendered when the section is active. */
  children?: { href: string; label: string; permission: Permission }[]
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/**
 * Sidebar structure. Items are filtered by the signed-in user's permissions,
 * so a Viewer never sees a link they would be bounced from.
 */
export const NAVIGATION: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '◈', permission: 'dashboard.view' },
      { href: '/analytics', label: 'Analytics', icon: '◳', permission: 'analytics.view' },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        href: '/finance/ledger',
        label: 'General Ledger',
        icon: '≡',
        permission: 'finance.view',
        children: [
          { href: '/finance/ledger', label: 'Journals & trial balance', permission: 'finance.view' },
          { href: '/finance/payables', label: 'Accounts payable', permission: 'finance.view' },
          { href: '/finance/receivables', label: 'Accounts receivable', permission: 'finance.view' },
        ],
      },
      { href: '/finance/payables', label: 'Payables', icon: '↧', permission: 'finance.view' },
      { href: '/finance/receivables', label: 'Receivables', icon: '↥', permission: 'finance.view' },
    ],
  },
  {
    title: 'People',
    items: [
      { href: '/hr/employees', label: 'Employees', icon: '⚇', permission: 'employee.view' },
      { href: '/hr/attendance', label: 'Attendance', icon: '◷', permission: 'attendance.self' },
      { href: '/hr/leave', label: 'Leave', icon: '⌇', permission: 'leave.apply' },
      { href: '/hr/payroll', label: 'Payroll', icon: '₹', permission: 'payroll.view' },
    ],
  },
  {
    title: 'Supply Chain',
    items: [
      { href: '/supply-chain/inventory', label: 'Inventory', icon: '▤', permission: 'inventory.view' },
      { href: '/supply-chain/purchase-orders', label: 'Purchase Orders', icon: '⇄', permission: 'po.view' },
      { href: '/supply-chain/vendors', label: 'Vendors', icon: '⌂', permission: 'po.view' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { href: '/forecasting', label: 'AI Forecasting', icon: '◠', permission: 'forecast.view' },
      { href: '/projects', label: 'Projects', icon: '▦', permission: 'project.view' },
    ],
  },
  {
    title: 'Platform',
    items: [
      { href: '/notifications', label: 'Notifications', icon: '◉', permission: 'dashboard.view' },
      { href: '/audit', label: 'Audit Trail', icon: '⛨', permission: 'audit.view' },
      { href: '/api-docs', label: 'API Reference', icon: '⌘', permission: 'dashboard.view' },
      { href: '/settings', label: 'Settings', icon: '⚙', permission: 'dashboard.view' },
    ],
  },
]

/** Human-readable trail for the topbar, longest matching prefix first. */
export function breadcrumbFor(pathname: string): string[] {
  for (const section of NAVIGATION) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return [section.title, item.label]
      }
    }
  }
  return ['Overview']
}
