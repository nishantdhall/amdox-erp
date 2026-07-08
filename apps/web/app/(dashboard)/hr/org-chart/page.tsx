'use client'
import { usePathname } from 'next/navigation'
import { SubNav } from '@/components/sub-nav'

const hrNavItems = [
  { label: 'Employees', href: '/hr' },
  { label: 'Attendance', href: '/hr/attendance' },
  { label: 'Leave Mgmt', href: '/hr/leave' },
  { label: 'Run Payroll', href: '/hr/payroll' },
  { label: 'Org Chart', href: '/hr/org-chart' },
  { label: 'Compliance', href: '/hr/compliance' },
  { label: 'Payslips', href: '/hr/payslips' },
]

const orgData = [
  { name: 'CEO', title: 'Chief Executive Officer', children: [
    { name: 'Vikram Patel', title: 'CTO', children: [
      { name: 'Nishant Dhall', title: 'SDE Intern', children: [] },
    ]},
    { name: 'Priya Sharma', title: 'CFO', children: [
      { name: 'Meera Joshi', title: 'Jr. Accountant', children: [] },
    ]},
    { name: 'Anita Singh', title: 'HR Lead', children: [] },
    { name: 'Rahul Kumar', title: 'Supply Chain Manager', children: [
      { name: 'Arjun Reddy', title: 'Ops Manager', children: [] },
    ]},
    { name: 'Sneha Gupta', title: 'Marketing Head', children: [] },
  ]},
]

function OrgNode({ name, title, children, level = 0 }: { name: string; title: string; children: any[]; level?: number }) {
  const colors = ['#4f6ef7', '#22a06b', '#f59e0b', '#e5484d', '#a78bfa']
  const color = colors[level % colors.length]

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white rounded-xl border-2 px-4 py-3 text-center shadow-sm card-hover min-w-[140px]" style={{ borderColor: color }}>
        <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: color }}>
          {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="text-[12px] font-semibold text-[#1a1d2e]">{name}</div>
        <div className="text-[10px] text-[#8898aa]">{title}</div>
      </div>
      {children.length > 0 && (
        <>
          <div className="w-[2px] h-6 bg-[#e0e5ef]" />
          <div className="flex gap-6 items-start">
            {children.map((child: any, i: number) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-[2px] h-4 bg-[#e0e5ef]" />
                <OrgNode {...child} level={level + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function OrgChartPage() {
  const pathname = usePathname()

  return (
    <div className="flex gap-4 animate-fade-in">
      <SubNav items={hrNavItems} title="HR & Payroll" icon="👥" currentPath={pathname} />
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold text-[#1a1d2e] mb-5">Organization Chart</h2>
        <div className="bg-white rounded-xl border border-[#e0e5ef] p-8 shadow-sm overflow-x-auto">
          <div className="flex justify-center min-w-[800px]">
            <OrgNode {...orgData[0]} />
          </div>
        </div>
      </div>
    </div>
  )
}
