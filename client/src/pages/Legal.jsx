import { Link } from 'react-router-dom';

// Minimal public legal pages. Replace copy with your real policy before launch.
function Page({ title, children }) {
  return (
    <div className="app-bg min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link to="/" className="text-sm text-muted hover:text-app">← Home</Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-app">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">{children}</div>
        <p className="mt-10 text-xs text-muted">Last updated {new Date().getFullYear()}. This is placeholder copy — replace before launch.</p>
      </div>
    </div>
  );
}

export function Privacy() {
  return (
    <Page title="Privacy Policy">
      <p>Prova stores the minimum needed to run manual QA: your GitHub profile (id, username, email, avatar), your projects, test cases, runs, and any screenshots you upload.</p>
      <p>Screenshots are stored on Cloudinary. Authentication uses a GitHub OAuth token held in an httpOnly cookie. We do not sell your data.</p>
      <p>Delete a project to remove its data, or contact us to delete your account.</p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of Service">
      <p>Prova is provided “as is”, without warranty. The free tier allows one project per user; limits may change.</p>
      <p>You are responsible for the repositories you connect and the content you create. Don’t abuse the GitHub integration or upload unlawful content.</p>
      <p>We may suspend accounts that violate these terms or GitHub’s terms.</p>
    </Page>
  );
}
