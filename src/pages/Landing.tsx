import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ServiceBadge } from '../components/ServiceBadge'
import { LogoMark } from '../components/Icons'
import { CATALOG } from '../lib/catalog'
import { PLANS } from '../lib/prices'

const PLAN_COUNT = Object.values(PLANS).reduce((n, p) => n + p.length, 0)
const byKey = (keys: string[]) => keys.map((k) => CATALOG.find((c) => c.key === k)!)

const INNER_RING = byKey(['netflix', 'spotify', 'claude-pro', 'youtube-premium', 'jiohotstar', 'icloud'])
const OUTER_RING = byKey([
  'amazon-prime', 'chatgpt-plus', 'notion', 'apple-music', 'google-one', 'xbox-game-pass',
  'canva', 'duolingo', 'adobe-cc', 'playstation-plus',
])

// ─────────────────────────── building blocks ───────────────────────────

/** Fades children up when they scroll into view. */
function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShown(true), io.disconnect()), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal ${shown ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/** Tilts its content in 3D toward the pointer. */
function Tilt({ children, max = 10, className = '' }: { children: ReactNode; max?: number; className?: string }) {
  const [rot, setRot] = useState({ x: 0, y: 0 })
  function onMove(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    setRot({ x: -((e.clientY - r.top) / r.height - 0.5) * max * 2, y: ((e.clientX - r.left) / r.width - 0.5) * max * 2 })
  }
  return (
    <div className={`perspective-[1200px] ${className}`} onPointerMove={onMove} onPointerLeave={() => setRot({ x: 0, y: 0 })}>
      <div
        className="transition-transform duration-300 ease-out transform-3d"
        style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
      >
        {children}
      </div>
    </div>
  )
}

function OrbitRing({ items, radius, speed, reverse }: { items: typeof CATALOG; radius: number; speed: string; reverse?: boolean }) {
  return (
    <>
      {/* Track */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full border border-white/10"
        style={{ width: radius * 2, height: radius * 2, transform: 'translate(-50%, -50%)', boxShadow: 'inset 0 0 60px rgb(129 140 248 / 0.08)' }}
      />
      <div className={`orbit-ring absolute left-1/2 top-1/2 ${reverse ? 'reverse' : ''}`} style={{ '--speed': speed } as CSSProperties}>
        {items.map((c, i) => {
          const a = (i * 360) / items.length
          return (
            <div key={c.key} className="absolute" style={{ '--a': `${a}deg`, transform: `rotateZ(${a}deg) translateX(${radius}px)` } as CSSProperties}>
              {/* Fixed size: the ring is zero-width, so content would otherwise shrink to nothing. */}
              <div className="orbit-face -ml-7 -mt-7 size-14">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10 shadow-[0_10px_40px_-8px_rgb(0_0_0/0.8)] ring-1 ring-white/20 backdrop-blur">
                  <ServiceBadge name={c.name} catalogKey={c.key} size={44} />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

/** Logos orbiting a glowing "monthly spend" sphere, drawn with CSS 3D transforms. */
function OrbitScene({ tilt }: { tilt: { x: number; y: number } }) {
  return (
    <div className="relative h-95 sm:h-130 lg:h-150">
      <div className="absolute left-1/2 top-1/2 size-150 -translate-x-1/2 -translate-y-1/2 scale-[0.6] perspective-[1400px] sm:scale-[0.85] lg:scale-100">
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out transform-3d"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          <div className="absolute inset-0 transform-3d" style={{ transform: 'rotateX(68deg)' }}>
            <OrbitRing items={INNER_RING} radius={170} speed="34s" />
            <OrbitRing items={OUTER_RING} radius={285} speed="60s" reverse />

            {/* Sphere, stood upright so it faces the viewer */}
            <div className="absolute left-1/2 top-1/2" style={{ transform: 'translate(-50%, -50%) rotateX(-68deg)' }}>
              <div className="animate-glow absolute -inset-16 rounded-full bg-fuchsia-500/30 blur-3xl" />
              <div
                className="relative flex size-44 flex-col items-center justify-center rounded-full text-center text-white"
                style={{
                  background:
                    'radial-gradient(circle at 32% 28%, #f5d0fe 0%, #c084fc 18%, #7c3aed 45%, #312e81 75%, #0b0a1f 100%)',
                  boxShadow: '0 30px 80px -10px rgb(124 58 237 / 0.7), inset -20px -30px 60px rgb(0 0 0 / 0.45), inset 10px 10px 40px rgb(255 255 255 / 0.15)',
                }}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-100/80">Every month</span>
                <span className="font-display text-3xl font-extrabold">₹3,160</span>
                <span className="text-xs text-fuchsia-100/80">16 subscriptions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** A tilted, layered mock of the dashboard. Each layer sits at a different depth. */
function DashboardPreview() {
  const rows = byKey(['netflix', 'claude-pro', 'spotify', 'youtube-premium'])
  const prices = ['₹649', '$20', '₹139', '₹149']
  const due = ['In 2 days', 'Nov 8', 'Nov 12', 'Nov 20']
  return (
    <Tilt max={8} className="mx-auto w-full max-w-xl">
      <div className="relative rounded-[28px] bg-white/6 p-5 ring-1 ring-white/15 backdrop-blur-xl transform-3d">
        <div
          className="rounded-2xl bg-linear-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-5 text-white shadow-2xl shadow-violet-900/50"
          style={{ transform: 'translateZ(50px)' }}
        >
          <p className="text-xs text-white/70">You spend each month</p>
          <p className="font-display text-4xl font-extrabold">≈ ₹3,160</p>
          <div className="mt-3 h-2 rounded-full bg-white/20">
            <div className="h-full w-[79%] rounded-full bg-emerald-300" />
          </div>
          <p className="mt-1.5 text-xs text-white/80">₹840 left of your ₹4,000 budget</p>
        </div>
        <div className="mt-4 space-y-2" style={{ transform: 'translateZ(25px)' }}>
          {rows.map((c, i) => (
            <div key={c.key} className="flex items-center gap-3 rounded-xl bg-white/7 px-3 py-2.5 ring-1 ring-white/10">
              <ServiceBadge name={c.name} catalogKey={c.key} size={30} />
              <span className="flex-1 text-sm font-semibold text-white">{c.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${i === 0 ? 'bg-amber-400/20 text-amber-200' : 'bg-white/10 text-white/60'}`}>
                {due[i]}
              </span>
              <span className="w-14 text-right text-sm font-semibold text-white tabular-nums">{prices[i]}</span>
            </div>
          ))}
        </div>
        {/* Floating tip card, furthest forward */}
        <div
          className="absolute -right-6 -top-8 w-56 rounded-2xl bg-white p-4 text-slate-900 shadow-2xl sm:-right-12"
          style={{ transform: 'translateZ(90px) rotate(4deg)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Ways to save</p>
          <p className="mt-1 text-sm font-semibold">Switch Claude to yearly</p>
          <p className="text-xs text-slate-500">Save $40 a year</p>
        </div>
        <div
          className="absolute -bottom-6 -left-6 flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-rose-900/50 sm:-left-10"
          style={{ transform: 'translateZ(70px) rotate(-3deg)' }}
        >
          <span className="size-2 animate-pulse rounded-full bg-white" /> Trial ends tomorrow
        </div>
      </div>
    </Tilt>
  )
}

/** Three isometric layers that spread apart on hover. */
function LayerStack() {
  const layers = [
    { title: 'Savings', note: 'Tips from real prices', tone: 'from-emerald-400 to-teal-500' },
    { title: 'Trials', note: 'Alarms before the charge', tone: 'from-rose-400 to-orange-400' },
    { title: 'Spend', note: 'One total, one currency', tone: 'from-indigo-500 to-fuchsia-500' },
  ]
  const [open, setOpen] = useState(false)
  return (
    <div
      className="relative mx-auto h-80 w-full max-w-sm perspective-[1600px]"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="absolute inset-0 transform-3d" style={{ transform: 'rotateX(58deg) rotateZ(-38deg)' }}>
        {layers.map((l, i) => (
          <div
            key={l.title}
            className={`absolute inset-x-6 top-10 flex h-48 flex-col justify-end rounded-3xl bg-linear-to-br p-6 text-white shadow-[0_40px_60px_-20px_rgb(0_0_0/0.7)] ring-1 ring-white/30 transition-transform duration-700 ease-out ${l.tone}`}
            style={{ transform: `translateZ(${i * (open ? 90 : 46)}px)` }}
          >
            <span className={`font-display text-2xl font-extrabold transition-transform duration-700 ${open ? 'translate-x-2' : ''}`}>
              {l.title}
            </span>
            <span className="text-sm text-white/80">{l.note}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────── page ───────────────────────────

const FEATURES = [
  { icon: '◎', title: 'One true total', body: 'INR, USD and more, converted at daily ECB rates into a single monthly figure.' },
  { icon: '⏰', title: 'Free-trial alarms', body: 'Trials sit at the top in red with a countdown, so they never quietly become charges.' },
  { icon: '₹', title: 'Real plan prices', body: `${CATALOG.length} services and ${PLAN_COUNT} plans with checked INR and USD prices. Pick a plan, the price fills in.` },
  { icon: '✂', title: 'Cancel helper', body: 'Step-by-step cancel guides per service, plus iPhone, Android and UPI AutoPay mandates.' },
  { icon: '▦', title: 'Renewal calendar', body: 'A month view of every charge, with day totals and trial endings marked.' },
  { icon: '↺', title: 'Nothing is lost', body: 'Undo for 10 seconds, a 30-day Recently deleted bin, and full account deletion anytime.' },
]

const STEPS = [
  { n: '01', title: 'Add in two taps', body: 'Pick Netflix, choose your plan. Price, cycle and logo are filled in for you.' },
  { n: '02', title: 'Get warned early', body: 'See what renews this week, which trials end soon, and where your budget stands.' },
  { n: '03', title: 'Cancel and save', body: 'Follow the cancel guide, mark it cancelled, and watch Money saved grow.' },
]

const PAINS = [
  { title: 'Trials that turn into charges', body: 'You meant to cancel after 7 days. Day 8 sends the bill.' },
  { title: 'Price hikes nobody mentions', body: 'The plan you signed up for costs more now, and the app never told you.' },
  { title: 'Five apps doing one job', body: 'Two music apps, three streaming services, and only one gets opened.' },
]

export function Landing() {
  const { user } = useAuth()
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const primaryCta = user ? { to: '/dashboard', label: 'Open your dashboard' } : { to: '/signup', label: 'Start tracking free' }

  function onHeroMove(e: PointerEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    setTilt({ x: -((e.clientY - r.top) / r.height - 0.5) * 10, y: ((e.clientX - r.left) / r.width - 0.5) * 16 })
  }

  return (
    <div className="grain relative min-h-screen overflow-x-hidden bg-[#07061a] text-white">
      {/* Ambient light */}
      <div className="pointer-events-none absolute -left-40 -top-40 size-160 rounded-full bg-indigo-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-40 size-144 rounded-full bg-fuchsia-600/20 blur-[120px]" />

      {/* Nav */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark size={34} />
          <span className="font-display text-xl font-bold">Subtrack</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#privacy" className="hover:text-white">Privacy</a>
        </nav>
        <div className="flex items-center gap-2">
          {!user && (
            <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-white/80 hover:text-white">
              Log in
            </Link>
          )}
          <Link to={primaryCta.to} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-indigo-100">
            {user ? 'Dashboard' : 'Get started'}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section
        onPointerMove={onHeroMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        className="relative z-10 mx-auto grid max-w-6xl items-center gap-4 px-4 pb-10 pt-6 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-12"
      >
        <div className="relative z-10">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/7 px-3 py-1.5 text-xs font-semibold text-indigo-200 ring-1 ring-white/15">
              <span className="size-1.5 rounded-full bg-emerald-400" /> Made for India · INR, USD and more
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Every subscription.
              <span className="block bg-linear-to-r from-indigo-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
                One clear orbit.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
              Subtrack puts Netflix, Spotify, Claude and everything else in one place, shows what you really spend each
              month, and warns you before a free trial becomes a charge.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={primaryCta.to}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-linear-to-r from-indigo-500 to-fuchsia-500 px-6 py-3.5 font-semibold shadow-[0_10px_40px_-6px_rgb(168_85_247/0.7)] transition hover:shadow-[0_14px_50px_-4px_rgb(168_85_247/0.9)]"
              >
                {primaryCta.label}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a href="#how" className="rounded-2xl px-5 py-3.5 font-semibold text-white/80 ring-1 ring-white/20 transition hover:bg-white/5 hover:text-white">
                See how it works
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55">
              <li>✓ No bank login needed</li>
              <li>✓ Free while in beta</li>
              <li>✓ Delete everything anytime</li>
            </ul>
          </Reveal>
        </div>
        <OrbitScene tilt={tilt} />
      </section>

      {/* Logo marquee */}
      <section className="relative z-10 border-y border-white/10 bg-white/2 py-6">
        <div className="overflow-hidden mask-[linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
          <div className="animate-marquee flex w-max gap-10">
            {[...CATALOG, ...CATALOG].map((c, i) => (
              <span key={`${c.key}-${i}`} className="flex items-center gap-2.5 text-sm font-semibold text-white/60">
                <ServiceBadge name={c.name} catalogKey={c.key} size={26} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal>
          <h2 className="max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Small charges. <span className="text-white/40">Quietly adding up.</span>
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PAINS.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <Tilt max={6}>
                <div className="h-full rounded-3xl bg-linear-to-b from-white/8 to-white/2 p-7 ring-1 ring-white/10">
                  <span className="font-display text-5xl font-extrabold text-white/15">0{i + 1}</span>
                  <h3 className="mt-4 text-xl font-bold">{p.title}</h3>
                  <p className="mt-2 text-white/60">{p.body}</p>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl scroll-mt-10 px-4 py-16 sm:px-6">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <LayerStack />
            <p className="mt-2 text-center text-xs text-white/40">Hover or tap to look inside</p>
          </Reveal>
          <div>
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-300">What you get</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Everything about your subscriptions, in layers.
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 70}>
                  <div className="flex gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/7 text-lg ring-1 ring-white/15">
                      {f.icon}
                    </span>
                    <div>
                      <h3 className="font-bold">{f.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/60">{f.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">At a glance</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Open it. Know where your money goes.
              </h2>
              <p className="mt-5 text-lg text-white/65">
                Your monthly total, your budget, what renews this week and the easiest ways to save. All on one screen,
                before you've had your chai.
              </p>
            </Reveal>
          </div>
          <Reveal delay={120} className="py-10">
            <div className="animate-float">
              <DashboardPreview />
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl scroll-mt-10 px-4 py-20 sm:px-6">
        <Reveal>
          <h2 className="text-center font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Three steps. That's it.</h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="relative h-full perspective-[900px]">
                <div
                  className="relative h-full rounded-3xl bg-[#0f0d2a] p-7 ring-1 ring-white/10 transition-transform duration-500 hover:transform-[rotateX(8deg)_translateY(-6px)]"
                  style={{ boxShadow: '0 30px 60px -30px rgb(99 102 241 / 0.6)' }}
                >
                  <span
                    className="inline-block bg-linear-to-br from-indigo-300 to-fuchsia-400 bg-clip-text font-display text-6xl font-extrabold text-transparent"
                    style={{ textShadow: '0 1px 0 rgb(255 255 255 / 0.05), 0 6px 0 rgb(79 70 229 / 0.25)' }}
                  >
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-white/60">{s.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="relative z-10 mx-auto max-w-6xl scroll-mt-10 px-4 py-20 sm:px-6">
        <Reveal>
          <div className="grid gap-8 rounded-4xl bg-white/4 p-8 ring-1 ring-white/10 sm:p-12 md:grid-cols-[auto_1fr] md:items-center">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-emerald-400/15 text-4xl ring-1 ring-emerald-300/30">🔒</div>
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight">Your data, on your terms.</h2>
              <p className="mt-3 max-w-2xl text-white/65">
                Subtrack never asks for your bank or card login. You add what you pay for, and only you can see it.
                Delete a subscription and it's gone after 30 days; delete your account and everything goes with it,
                immediately.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <Reveal>
          <Tilt max={4}>
            <div className="relative overflow-hidden rounded-[36px] bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-8 py-16 text-center sm:px-16">
              <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-white/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -right-10 size-80 rounded-full bg-amber-300/25 blur-3xl" />
              <div className="relative" style={{ transform: 'translateZ(40px)' }}>
                <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">Stop paying for things you forgot.</h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">It takes a minute to add your first subscription.</p>
                <Link
                  to={primaryCta.to}
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-semibold text-slate-900 shadow-2xl transition hover:scale-[1.03]"
                >
                  {primaryCta.label} →
                </Link>
              </div>
            </div>
          </Tilt>
        </Reveal>
      </section>

      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-white/45 sm:flex-row sm:px-6">
          <span className="flex items-center gap-2">
            <LogoMark size={22} /> Subtrack · Free while in beta
          </span>
          <span>Prices checked October 2026. Logos belong to their owners.</span>
        </div>
      </footer>
    </div>
  )
}
