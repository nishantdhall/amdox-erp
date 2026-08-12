'use client'

import { useActionState } from 'react'
import { ActionForm, ResultBanner, SubmitButton } from '@/components/ui/action'
import { resetDemoAction, updatePrefsAction, type ActionResult } from '@/app/(app)/actions'
import { Card, CardBody, CardHeader } from '@/components/ui/primitives'
import type { NotificationPrefs } from '@/lib/types'

const CHANNELS = [
  { key: 'inApp', label: 'In-app', description: 'Shown in the notification inbox and the topbar badge.' },
  { key: 'email', label: 'Email', description: 'Queued for the mail worker with three retry attempts.' },
  { key: 'webhook', label: 'Webhook', description: 'HMAC-signed POST to your registered endpoint.' },
] as const

export function NotificationPreferences({ prefs }: { prefs: NotificationPrefs }) {
  return (
    <Card>
      <CardHeader title="Notification preferences" subtitle="Applied on every event fan-out" />
      <CardBody>
        <ActionForm action={updatePrefsAction}>
          <div className="space-y-2.5">
            {CHANNELS.map((channel) => (
              <label
                key={channel.key}
                htmlFor={`pref-${channel.key}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink-line px-3 py-2.5 transition-colors hover:bg-surface-sunken"
              >
                <input
                  id={`pref-${channel.key}`}
                  name={channel.key}
                  type="checkbox"
                  defaultChecked={prefs[channel.key]}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-ink">{channel.label}</span>
                  <span className="block text-[11px] leading-relaxed text-ink-muted">{channel.description}</span>
                </span>
              </label>
            ))}
          </div>

          <SubmitButton pendingLabel="Saving…">Save preferences</SubmitButton>
        </ActionForm>
      </CardBody>
    </Card>
  )
}

export function ResetDemoPanel({ canReset }: { canReset: boolean }) {
  const [result, formAction] = useActionState<ActionResult | null, FormData>(resetDemoAction, null)

  return (
    <Card>
      <CardHeader title="Demo data" subtitle="Restore the seeded dataset" />
      <CardBody className="space-y-3">
        <p className="text-[11px] leading-relaxed text-ink-muted">
          Resetting rebuilds every table from the deterministic seed — employees, ledger, inventory, projects, notifications and
          the audit chain. Useful immediately before recording a walkthrough so the numbers start from a known state.
        </p>

        <ResultBanner result={result} />

        {canReset ? (
          <form
            action={formAction}
            onSubmit={(event) => {
              if (!window.confirm('Reset all demo data? Every change made in this session will be discarded.')) {
                event.preventDefault()
              }
            }}
          >
            <SubmitButton variant="danger" size="md" className="w-full" pendingLabel="Restoring…">
              Reset demo data
            </SubmitButton>
          </form>
        ) : (
          <p className="rounded-lg bg-surface-sunken px-3 py-2 text-[11px] text-ink-muted">
            Resetting the dataset requires the SuperAdmin role.
          </p>
        )}
      </CardBody>
    </Card>
  )
}
