import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogoMark, LogoutIcon, PlusIcon, SettingsIcon } from './Icons'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/calendar', label: 'Calendar' },
]

export function AppShell() {
  const { user, signOut } = useAuth()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const initial = user?.email?.charAt(0).toUpperCase() ?? '?'
  const onDashboard = pathname === '/dashboard'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <LogoMark />
              <span className="hidden text-lg font-bold tracking-tight sm:inline">Subtrack</span>
            </Link>
            <nav className="flex gap-1">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                      isActive ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {onDashboard && (
              <Link to="/add" className="btn-primary hidden sm:inline-flex">
                <PlusIcon size={18} /> Add subscription
              </Link>
            )}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
                className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-slate-700 to-slate-900 text-sm font-semibold text-white ring-2 ring-white transition hover:ring-indigo-200"
              >
                {initial}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block border-b border-slate-100 px-4 py-3 hover:bg-slate-50"
                    >
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="truncate text-sm font-medium">{user?.email}</p>
                      <p className="mt-0.5 text-xs font-semibold text-indigo-600">View profile →</p>
                    </Link>
                    <Link
                      to="/"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LogoMark size={16} /> About Subtrack
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <SettingsIcon size={16} /> Settings
                    </Link>
                    <button
                      onClick={signOut}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LogoutIcon size={16} /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-8">
        <Outlet />
      </main>

      {onDashboard && (
        <Link
          to="/add"
          aria-label="Add subscription"
          className="fixed bottom-6 right-6 z-20 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-600 to-fuchsia-600 text-white shadow-xl shadow-indigo-600/30 transition active:scale-95 sm:hidden"
        >
          <PlusIcon size={26} />
        </Link>
      )}
    </div>
  )
}
