import { Link } from 'react-router-dom';

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    paras: [
      'Prova stores the minimum needed to run manual QA: your GitHub profile (id, username, email, avatar), your projects, test cases, runs, and any screenshots you upload.',
      'Screenshots are stored on Cloudinary. Authentication uses a GitHub OAuth token held in an httpOnly cookie. We do not sell your data.',
      'Delete a project to remove its data, or contact us to delete your account.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    paras: [
      'Prova is provided “as is”, without warranty. The free tier allows one project per user; limits may change.',
      'You are responsible for the repositories you connect and the content you create. Don’t abuse the GitHub integration or upload unlawful content.',
      'We may suspend accounts that violate these terms or GitHub’s terms.',
    ],
  },
};

export default function Legal({ page = 'privacy' }) {
  const { title, paras } = CONTENT[page] || CONTENT.privacy;
  return (
    <div className="app-bg min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link to="/" className="text-sm text-muted hover:text-app">← Home</Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-app">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
          {paras.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <p className="mt-10 text-xs text-muted">Last updated {new Date().getFullYear()}. Placeholder copy — replace before launch.</p>
      </div>
    </div>
  );
}
