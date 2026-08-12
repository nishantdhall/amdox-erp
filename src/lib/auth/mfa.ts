import { sha256Hex } from '../hash'

/**
 * Demo second factor.
 *
 * A production build swaps this for TOTP (RFC 6238) against an authenticator
 * app or an SMS gateway. The surrounding flow — issue an unverified session,
 * gate every route on `mfaVerified`, audit both success and failure — is the
 * part that matters and is already real.
 */
export function mfaCodeFor(userId: string): string {
  const digest = sha256Hex(`mfa:${userId}`)
  const numeric = parseInt(digest.slice(0, 12), 16) % 1_000_000
  return String(numeric).padStart(6, '0')
}
