import { requireSession } from '@/lib/auth/session'
import { getTenant, listNotifications } from '@/lib/db/repo'
import { AppShell } from '@/components/layout/shell'
import { ToastHost } from '@/components/ui/action'
import { signOutAction } from '@/app/login/actions'

export const dynamic = 'force-dynamic'

function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        role="menuitem"
        className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-danger hover:bg-danger-soft"
      >
        Sign out
      </button>
    </form>
  )
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  const tenant = getTenant(session.tenantId)
  const unread = listNotifications(session.tenantId, { unreadOnly: true }).length

  return (
    <AppShell
      user={{
        name: session.name,
        email: session.email,
        role: session.role,
        tenantName: tenant.name,
        tenantPlan: tenant.plan,
      }}
      unreadCount={unread}
      signOut={<SignOutButton />}
    >
      {children}
      <ToastHost />
    </AppShell>
  )
}
