/**
 * AdminGate — password-protection wrapper for all /admin routes.
 * Shows a login screen until the correct password is verified server-side.
 * Auth state is stored in sessionStorage (clears when the browser tab closes).
 */
import React from 'react'
import { apiAuth } from '../lib/api'

export const ADMIN_SESSION_KEY = 'catchy.admin.auth'

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = React.useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'
  )
  const [pw, setPw]       = React.useState('')
  const [error, setError] = React.useState('')
  const [busy, setBusy]   = React.useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!pw.trim()) return
    setBusy(true)
    setError('')
    try {
      const result = await apiAuth.login(pw)
      if (result.ok) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
        setAuthed(true)
      } else {
        setError(result.error ?? 'Incorrect password. Try again.')
        setPw('')
      }
    } catch {
      setError('Could not reach the server. Check your connection.')
    } finally {
      setBusy(false)
    }
  }

  if (authed) return <>{children}</>

  return (
    <div className="min-h-dvh bg-[#070810] flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-5 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center">
          <div className="mb-3 text-5xl">🔐</div>
          <h1 className="text-xl font-semibold text-white">Admin Access</h1>
          <p className="mt-1 text-sm text-white/50">
            Enter the admin password to continue
          </p>
        </div>

        {/* Password input */}
        <input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError('') }}
          placeholder="Admin password"
          autoFocus
          autoComplete="current-password"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-[var(--brand)]/60 focus:bg-black/40"
        />

        {/* Error message */}
        {error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            ⚠️ {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={busy || !pw.trim()}
          className="w-full rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--brand-2)] disabled:opacity-50 transition-colors"
        >
          {busy ? 'Verifying…' : 'Enter Admin Panel'}
        </button>

        {/* Back link */}
        <p className="text-center text-xs text-white/30">
          <a href="/" className="hover:text-white/60 transition-colors">
            ← Back to store
          </a>
        </p>
      </form>
    </div>
  )
}
