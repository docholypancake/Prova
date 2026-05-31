import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { githubLoginUrl } from '../api';
import useReveal from '../hooks/useReveal';
import ThemeToggle from '../components/ThemeToggle';

const FEATURES = [
  { title: 'PR Status Checks', body: 'Manual QA results post straight to the PR as a commit status — “prova/manual-qa: 8/10 passed”. Green or red, right where reviewers look.', icon: 'M9 12.5l2.5 2.5L16 9' },
  { title: 'Bug → GitHub Issues', body: 'Found a bug mid-run? One click turns it into a labeled GitHub Issue with steps, expected vs actual, and the screenshot attached.', icon: 'M12 8v5m0 3h.01M10.3 3.9l-7.5 13A2 2 0 004.5 20h15a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z' },
  { title: 'Shareable Reports', body: 'Every run gets a public, no-login report URL and an SVG badge for your README. Send it to a client, drop it in a PR comment.', icon: 'M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13' },
];

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const reveal = useReveal();
  const pricingRef = useReveal();

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="app-bg min-h-screen">
      <nav className="topbar">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-clay-500 to-olive-500 text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="3.2"><path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className="font-bold tracking-tight text-app">Prova</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href={githubLoginUrl()} className="btn btn-primary">Sign in</a>
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden px-6 pb-24 pt-40">
        {/* Parallax on the wrapper; blur on a non-transformed child (prevents filter-clipping to a box). */}
        <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2" style={{ transform: `translate(-50%, ${scrollY * 0.25}px)` }}>
          <div className="h-[480px] w-[480px] rounded-full bg-clay-500/20 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute right-10 top-60" style={{ transform: `translateY(${scrollY * -0.15}px)` }}>
          <div className="h-40 w-40 rounded-full bg-olive-500/25 blur-2xl" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="card mb-5 inline-flex animate-fade-in items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-olive-500" /> Free forever for solo devs
          </div>
          <h1 className="animate-fade-up text-5xl font-extrabold leading-[1.05] tracking-tight text-app sm:text-6xl">
            GitHub-native <span className="text-gradient">manual QA</span>.<br /> PR status checks for human testers.
          </h1>
          <p className="mx-auto mt-6 max-w-xl animate-fade-up text-lg text-muted" style={{ animationDelay: '0.1s' }}>
            Run test cases against a PR, mark pass/fail, and post the result as a status check — no TestRail pricing surprises.
          </p>
          <div className="mt-8 flex animate-fade-up items-center justify-center" style={{ animationDelay: '0.2s' }}>
            <a href={githubLoginUrl()} className="btn btn-primary px-6 py-3">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" /></svg>
              Sign in with GitHub — it’s free
            </a>
          </div>

          <div className="card mx-auto mt-14 max-w-md animate-fade-up p-4 text-left shadow-xl" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-olive-100 text-olive-700 dark:bg-olive-500/20 dark:text-olive-200">✓</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-app">prova/manual-qa</p>
                <p className="text-xs text-muted">Manual QA: 8/10 passed</p>
              </div>
              <span className="chip">Details</span>
            </div>
          </div>
        </div>
      </header>

      <section ref={reveal} className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="reveal card card-hover p-6" style={{ transitionDelay: `${i * 80}ms` }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-clay-100 text-clay-600 dark:bg-clay-500/15 dark:text-clay-300">
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2"><path d={f.icon} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <h3 className="mt-4 text-lg font-semibold text-app">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section ref={pricingRef} className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="reveal text-center text-3xl font-bold tracking-tight text-app">Simple pricing</h2>
        <p className="reveal mt-2 text-center text-muted">Start free. Upgrade when you outgrow one project.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="reveal card p-8">
            <p className="text-sm font-semibold text-muted">Free</p>
            <p className="mt-2 text-4xl font-extrabold text-app">$0</p>
            <ul className="mt-6 space-y-2 text-sm text-app">
              <Li>1 project</Li><Li>Unlimited test cases & runs</Li><Li>PR status checks</Li><Li>Bug → GitHub Issues</Li><Li>Public shareable reports</Li>
            </ul>
            <a href={githubLoginUrl()} className="btn btn-ghost mt-8 w-full">Get started</a>
          </div>
          <div className="reveal card relative overflow-hidden p-8 shadow-xl" style={{ transitionDelay: '80ms', borderColor: 'var(--accent)', borderWidth: 2 }}>
            <span className="chip absolute right-4 top-4 bg-clay-100 text-clay-600 dark:bg-clay-500/15 dark:text-clay-300">Coming soon</span>
            <p className="text-sm font-semibold text-muted">Pro</p>
            <p className="mt-2 text-4xl font-extrabold text-app">$12<span className="text-base font-medium text-muted">/mo</span></p>
            <ul className="mt-6 space-y-2 text-sm text-app">
              <Li>Everything in Free</Li><Li>Unlimited projects</Li><Li>Custom report branding</Li><Li>Analytics & flaky-test detection</Li>
            </ul>
            <button disabled className="btn btn-primary mt-8 w-full opacity-60">Notify me</button>
          </div>
        </div>
      </section>

      <footer className="border-t border-app">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} Prova</span>
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

function Li({ children }) {
  return (
    <li className="flex items-center gap-2">
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-olive-500" strokeWidth="3"><path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {children}
    </li>
  );
}
