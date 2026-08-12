import type { Metadata } from 'next'
import { requireSession, switchableTenants } from '@/lib/auth/session'
import { can, ROLE_PERMISSIONS } from '@/lib/auth/rbac'
import { getTenant, getUser, listUsers } from '@/lib/db/repo'
import { bootedAt } from '@/lib/db/store'
import { Badge, Card, CardBody, CardHeader, KeyValue, PageHeader, Table } from '@/components/ui/primitives'
import { NotificationPreferences, ResetDemoPanel } from './settings-ui'
import { formatDateTime, formatNumber } from '@/lib/utils'

export const metadata: Metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await requireSession()
  const tenant = getTenant(session.tenantId)
  const user = getUser(session.tenantId, session.id)
  const users = listUsers(session.tenantId)
  const tenants = switchableTenants(session)

  const permissions = ROLE_PERMISSIONS[session.role]
  const canManageTenant = can(session, 'tenant.manage')
  const canReset = can(session, 'system.reset')

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your profile, tenant configuration, role permissions and platform diagnostics."
        meta={
          <>
            <Badge tone="brand">{session.role}</Badge>
            <Badge tone="muted">{tenant.name}</Badge>
            <Badge tone={session.mfaVerified ? 'ok' : 'warn'}>{session.mfaVerified ? 'MFA verified' : 'MFA pending'}</Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Your profile" subtitle="Identity attached to the current session" />
          <CardBody>
            <KeyValue
              items={[
                { label: 'Name', value: user.name },
                { label: 'Email', value: user.email },
                { label: 'Role', value: session.role },
                { label: 'Tenant', value: tenant.name },
                { label: 'MFA enabled', value: user.mfaEnabled ? 'Yes' : 'No' },
                { label: 'Last sign-in', value: formatDateTime(user.lastLoginAt) },
                { label: 'Session expires', value: formatDateTime(new Date(session.exp * 1000).toISOString()) },
                { label: 'Linked employee', value: user.employeeId ? 'Yes' : 'Not linked' },
              ]}
            />
          </CardBody>
        </Card>

        <NotificationPreferences prefs={user.notificationPrefs} />

        <Card>
          <CardHeader title="Tenant configuration" subtitle={canManageTenant ? 'Editable by tenant administrators' : 'Read-only for your role'} />
          <CardBody>
            <KeyValue
              items={[
                { label: 'Tenant name', value: tenant.name },
                { label: 'Tenant id', value: <span className="font-mono text-[11px]">{tenant.id}</span> },
                { label: 'Plan', value: tenant.plan },
                { label: 'Country', value: tenant.country },
                { label: 'Base currency', value: tenant.baseCurrency },
                { label: 'MFA enforced', value: tenant.mfaRequired ? 'Yes' : 'No' },
                { label: 'Users', value: formatNumber(users.length) },
                { label: 'Accessible tenants', value: formatNumber(tenants.length) },
              ]}
            />
            {tenants.length > 1 ? (
              <div className="mt-4 border-t border-ink-line pt-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Tenants you can reach</p>
                <ul className="space-y-1.5">
                  {tenants.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-2 rounded-lg border border-ink-line px-2.5 py-1.5">
                      <span className="text-xs font-medium text-ink">{entry.name}</span>
                      <Badge tone={entry.id === tenant.id ? 'brand' : 'muted'}>{entry.id === tenant.id ? 'current' : entry.baseCurrency}</Badge>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                  Only a SuperAdmin sees more than one tenant here. Every repository read is filtered by the tenant on the
                  session, so data cannot cross the boundary.
                </p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Your permissions" subtitle={`${formatNumber(permissions.length)} granted by the ${session.role} role`} />
          <CardBody>
            <div className="flex flex-wrap gap-1.5">
              {permissions.map((permission) => (
                <code key={permission} className="rounded-md bg-surface-sunken px-1.5 py-1 font-mono text-[10px] text-ink">
                  {permission}
                </code>
              ))}
            </div>
            <p className="mt-3 border-t border-ink-line pt-2.5 text-[11px] leading-relaxed text-ink-muted">
              Permissions are checked in three places: Edge middleware gates the route, the server action re-checks before it
              mutates, and the API route re-checks again. A hidden button is never the security boundary.
            </p>
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Tenant users" subtitle="Accounts that can sign in to this tenant" />
          <Table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>MFA</th>
                <th>Last sign-in</th>
                <th>Channels</th>
              </tr>
            </thead>
            <tbody>
              {users.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <p className="text-xs font-semibold text-ink">{entry.name}</p>
                    <p className="text-[11px] text-ink-muted">{entry.email}</p>
                  </td>
                  <td>
                    <Badge tone={entry.role === 'SuperAdmin' ? 'brand' : entry.role === 'Viewer' ? 'muted' : 'neutral'}>{entry.role}</Badge>
                  </td>
                  <td className="text-xs text-ink-muted">{entry.mfaEnabled ? 'Enabled' : 'Disabled'}</td>
                  <td className="text-[11px] text-ink-muted">{formatDateTime(entry.lastLoginAt)}</td>
                  <td className="text-[11px] text-ink-muted">
                    {[entry.notificationPrefs.inApp && 'in-app', entry.notificationPrefs.email && 'email', entry.notificationPrefs.webhook && 'webhook']
                      .filter(Boolean)
                      .join(', ') || 'none'}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Platform diagnostics" />
          <CardBody>
            <KeyValue
              items={[
                { label: 'Version', value: '1.0.0' },
                { label: 'Project code', value: 'AMX-ERP-2026-04' },
                { label: 'API version', value: 'v1' },
                { label: 'Data layer booted', value: formatDateTime(bootedAt()) },
                { label: 'Session cookie', value: 'HMAC-SHA-256 signed' },
                { label: 'Rate limit', value: '240 requests / 60s per IP' },
              ]}
            />
            <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-line pt-3">
              <a
                href="/api/v1/health"
                className="rounded-lg border border-ink-line px-2.5 py-1.5 text-[11px] font-semibold text-ink hover:bg-surface-sunken"
              >
                Health endpoint
              </a>
              <a
                href="/api/v1/openapi.json"
                className="rounded-lg border border-ink-line px-2.5 py-1.5 text-[11px] font-semibold text-ink hover:bg-surface-sunken"
              >
                OpenAPI 3.1 spec
              </a>
              <a
                href="/api/v1/audit/verify"
                className="rounded-lg border border-ink-line px-2.5 py-1.5 text-[11px] font-semibold text-ink hover:bg-surface-sunken"
              >
                Verify audit chain
              </a>
            </div>
          </CardBody>
        </Card>

        <ResetDemoPanel canReset={canReset} />
      </div>
    </>
  )
}
