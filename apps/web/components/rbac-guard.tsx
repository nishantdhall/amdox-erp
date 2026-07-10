"use client"
import { useAuth } from "@/lib/auth-context"

const ROLE_PERMISSIONS: Record<string, string[]> = {
  TenantAdmin: ["dashboard", "finance", "hr", "supply-chain", "ai-forecasting", "analytics", "settings"],
  HR_MANAGER:  ["dashboard", "hr"],
  FINANCE_MANAGER: ["dashboard", "finance"],
  SUPPLY_MANAGER:  ["dashboard", "supply-chain"],
  EMPLOYEE:    ["dashboard"],
}

export function RBACGuard({ module, children }: { module: string; children: React.ReactNode }) {
  const { user } = useAuth()
  const role = user?.role || "EMPLOYEE"
  const allowed = ROLE_PERMISSIONS[role] || ["dashboard"]

  if (!allowed.includes(module)) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-500">You don't have permission to access this page.</p>
        <p className="text-sm text-gray-400">Required role: <span className="font-semibold text-red-500">{Object.entries(ROLE_PERMISSIONS).find(([,v]) => v.includes(module))?.[0]}</span></p>
        <p className="text-sm text-gray-400">Your role: <span className="font-semibold text-blue-500">{role}</span></p>
        <a href="/dashboard" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">← Back to Dashboard</a>
      </div>
    )
  }

  return <>{children}</>
}
