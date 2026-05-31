import { Link } from 'react-router-dom';
import { githubLoginUrl } from '../api';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  return (
    <div className="app-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>
      <div className="pointer-events-none absolute -top-24 -left-24 animate-float">
        <div className="h-72 w-72 rounded-full bg-clay-500/15 blur-3xl" />
      </div>
      <div className="pointer-events-none absolute -bottom-24 -right-24 animate-float" style={{ animationDelay: '2s' }}>
        <div className="h-72 w-72 rounded-full bg-olive-500/15 blur-3xl" />
      </div>

      <div className="card w-full max-w-sm animate-fade-up p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-clay-500 to-olive-500 text-white shadow-lg">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="3"><path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-app">Prova</h1>
        <p className="mt-2 text-sm text-muted">GitHub-native manual QA. Sign in to start testing.</p>

        <a href={githubLoginUrl()} className="btn btn-primary mt-6 w-full py-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" /></svg>
          Sign in with GitHub
        </a>
        <Link to="/" className="mt-4 inline-block text-xs text-muted hover:text-app">← Back to home</Link>
      </div>
    </div>
  );
}
