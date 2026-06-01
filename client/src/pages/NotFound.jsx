import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="app-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-extrabold text-gradient">404</p>
      <h1 className="mt-4 text-xl font-bold text-app">Page not found</h1>
      <p className="mt-2 text-sm text-muted">That page doesn’t exist or moved.</p>
      <Link to="/" className="btn btn-primary mt-6">Back to home</Link>
    </div>
  );
}
