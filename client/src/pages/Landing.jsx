import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { githubLoginUrl } from '../api';
import useReveal from '../hooks/useReveal';
import ThemeToggle from '../components/ThemeToggle';

const FEATURES = [
  {
    title: 'PR Status Checks',
    body: 'Manual QA results post straight to the PR as a commit status — "prova/manual-qa: 8/10 passed". Green or red, right where reviewers look.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="M9 12.5l2.5 2.5L16 9" />
      </svg>
    ),
    accent: 'var(--accent-2)',
  },
  {
    title: 'Bug → GitHub Issues',
    body: 'Found a bug mid-run? One click turns it into a labeled GitHub Issue with steps, expected vs actual, and the screenshot attached.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21q-3.1 0-5.3-2.2Q4.5 16.6 4.5 13.5v-1a3 3 0 013-3h9a3 3 0 013 3v1Q19.5 18.6 17.3 20.8 15.1 21 12 21z" />
        <path d="M7.5 9.5v-1a4.5 4.5 0 019 0v1M3 14h3M18 14h3M7.5 6l-2-2M16.5 6l2-2" />
      </svg>
    ),
    accent: 'var(--accent)',
  },
  {
    title: 'Shareable Reports',
    body: 'Every run gets a public, no-login report URL and an SVG badge for your README. Send it to a client, drop it in a PR comment.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13" />
      </svg>
    ),
    accent: '#d97706',
  },
];

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const featRef    = useReveal();
  const pricingRef = useReveal();

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="app-bg min-h-screen">
      {/* Nav */}
      <nav className="topbar">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="logo-mark">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="3.2">
                <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[15px] font-bold tracking-tight text-app">Prova</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href={githubLoginUrl()} className="btn btn-primary btn-sm">Sign in</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden px-6 pb-24 pt-32">
        {/* Background glows */}
        <div className="pointer-events-none absolute left-1/2 top-[-100px] h-[700px] w-[700px]"
          style={{ transform: `translate(-50%, ${scrollY * 0.2}px)`, background: 'radial-gradient(circle, rgba(166,61,64,0.1), transparent 68%)' }} />
        <div className="pointer-events-none absolute right-[-200px] top-20 h-[600px] w-[600px]"
          style={{ transform: `translateY(${scrollY * -0.12}px)`, background: 'radial-gradient(circle, rgba(130,140,81,0.09), transparent 68%)' }} />

        <div className="relative mx-auto max-w-2xl text-center">
          {/* Badge */}
          <div className="card mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-muted">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent-2)' }} />
            Free forever for solo devs
          </div>

          <h1 className="animate-fade-up text-5xl font-extrabold leading-[1.08] tracking-tight text-app sm:text-6xl">
            GitHub-native<br />
            <span className="text-gradient">manual QA</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg animate-fade-up text-lg text-muted" style={{ animationDelay: '0.1s' }}>
            Run test cases against a PR, mark pass/fail, and post the result as a commit status check — no TestRail pricing surprises.
          </p>

          <div className="mt-8 flex animate-fade-up justify-center gap-3" style={{ animationDelay: '0.2s' }}>
            <a href={githubLoginUrl()} className="btn btn-primary px-6 py-2.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
              </svg>
              Sign in with GitHub
            </a>
            <a href="#features" className="btn btn-ghost px-6 py-2.5">See how it works</a>
          </div>

          {/* Mock status check */}
          <div className="card mx-auto mt-12 max-w-sm animate-fade-up p-4 text-left shadow-xl" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'color-mix(in srgb, var(--accent-2) 16%, transparent)' }}>
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" style={{ color: 'var(--accent-2)' }} strokeWidth="3" strokeLinecap="round">
                  <path d="M5 12.5l4.5 4.5L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-app">prova/manual-qa</p>
                <p className="text-xs text-muted">Manual QA: 8/10 passed</p>
              </div>
              <span className="badge badge-green shrink-0">passing</span>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" ref={featRef} className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 text-center reveal">
          <h2 className="text-3xl font-bold tracking-tight text-app">Everything you need for manual QA</h2>
          <p className="mt-2 text-muted">Tightly integrated with GitHub — zero context switching.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="reveal card p-6" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: `color-mix(in srgb, ${f.accent} 13%, transparent)`, color: f.accent }}>
                <div className="h-5 w-5">{f.icon}</div>
              </div>
              <h3 className="mt-4 text-base font-semibold text-app">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section ref={pricingRef} className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-10 text-center">
          <h2 className="reveal text-3xl font-bold tracking-tight text-app">Simple pricing</h2>
          <p className="reveal mt-2 text-muted">Start free. Upgrade when you outgrow one project.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Free */}
          <div className="reveal card p-8">
            <p className="section-title">Free</p>
            <p className="mt-3 text-4xl font-extrabold text-app">$0</p>
            <ul className="mt-6 space-y-2.5">
              {['1 project', 'Unlimited test cases & runs', 'PR status checks', 'Bug → GitHub Issues', 'Public shareable reports'].map((item) => (
                <PricingLi key={item}>{item}</PricingLi>
              ))}
            </ul>
            <a href={githubLoginUrl()} className="btn btn-ghost mt-8 w-full">Get started free</a>
          </div>

          {/* Pro */}
          <div className="reveal card relative overflow-hidden p-8 shadow-lg" style={{ borderColor: 'var(--accent)', borderWidth: 2, transitionDelay: '80ms' }}>
            <span className="badge badge-red absolute right-4 top-4">Coming soon</span>
            <p className="section-title">Pro</p>
            <p className="mt-3 text-4xl font-extrabold text-app">
              $12<span className="text-base font-medium text-muted">/mo</span>
            </p>
            <ul className="mt-6 space-y-2.5">
              {['Everything in Free', 'Unlimited projects', 'Custom report branding', 'Analytics & flaky-test detection'].map((item) => (
                <PricingLi key={item}>{item}</PricingLi>
              ))}
            </ul>
            <button disabled className="btn btn-primary mt-8 w-full opacity-60">Notify me</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="logo-mark" style={{ width: '1.5rem', height: '1.5rem' }}>
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="3.5">
                <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>© {new Date().getFullYear()} Prova</span>
          </div>
          <div className="flex gap-5">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-app">GitHub</a>
            <Link to="/privacy" className="hover:text-app">Privacy</Link>
            <Link to="/terms" className="hover:text-app">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PricingLi({ children }) {
  return (
    <li className="flex items-center gap-2 text-sm text-app">
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none" strokeWidth="2.5" stroke="var(--accent-2)" strokeLinecap="round">
        <path d="M5 12.5l4.5 4.5L19 7" />
      </svg>
      {children}
    </li>
  );
}
