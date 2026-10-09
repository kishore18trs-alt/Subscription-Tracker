import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CATALOG } from '../lib/catalog'
import { ServiceBadge } from '../components/ServiceBadge'
import { BellIcon, CheckIcon, LogoMark, PiggyIcon } from '../components/Icons'

type Mode = 'login' | 'signup'

const FEATURES = [
  { icon: <CheckIcon size={16} />, text: 'Every subscription and its real price in one place' },
  { icon: <BellIcon size={16} />, text: 'A reminder before each renewal, so nothing surprises you' },
  { icon: <PiggyIcon size={16} />, text: 'See what you spend each month and what you save by cancelling' },
]

const SHOWCASE = ['netflix', 'spotify', 'claude-pro', 'youtube-premium', 'amazon-prime', 'jiohotstar', 'chatgpt-plus', 'icloud', 'notion']
  .map((key) => CATALOG.find((c) => c.key === key)!)

export function AuthPage({ mode }: { mode: Mode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  if (user) return <Navigate to={redirectTo} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          },
        })
        if (error) throw error
        if (!data.session) {
          setInfo('Check your email to confirm your account, then log in.')
          return
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <LogoMark size={36} />
          <span className="text-xl font-bold">Subtrack</span>
        </div>

        <div className="relative">
          <div className="mb-10 grid w-fit grid-cols-3 gap-3">
            {SHOWCASE.map((c, i) => (
              <span
                key={c.key}
                className="rounded-2xl bg-white/10 p-2 ring-1 ring-white/20 backdrop-blur"
                style={{ transform: `translateY(${(i % 3) * 10}px)` }}
              >
                <ServiceBadge name={c.name} catalogKey={c.key} size={52} />
              </span>
            ))}
          </div>
          <h2 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">
            Know exactly what you pay for, every month.
          </h2>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-3 text-indigo-50">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-indigo-200">Free while in beta</p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <LogoMark size={36} />
            <span className="text-xl font-bold">Subtrack</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-2 text-slate-500">
            {isLogin ? 'Log in to see your subscriptions.' : 'Start tracking in under a minute.'}
          </p>

          {!isSupabaseConfigured && (
            <p className="mt-6 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-800 ring-1 ring-amber-200">
              Supabase isn't configured yet. Add your keys to <code>.env</code> and restart the dev server.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="label">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </label>
            <label className="block">
              <span className="label">Password</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={isLogin ? '••••••••' : 'At least 6 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </label>

            {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</p>}
            {info && <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{info}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link to={isLogin ? '/signup' : '/login'} className="font-semibold text-indigo-600 hover:text-indigo-700">
              {isLogin ? 'Sign up' : 'Log in'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
