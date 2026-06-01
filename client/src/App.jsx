import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Project = lazy(() => import('./pages/Project'));
const Runs = lazy(() => import('./pages/Runs'));
const RunExecute = lazy(() => import('./pages/RunExecute'));
const ProjectDashboard = lazy(() => import('./pages/ProjectDashboard'));
const Share = lazy(() => import('./pages/Share'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Legal = lazy(() => import('./pages/Legal'));

function Loading() {
  return <div className="app-bg flex min-h-screen items-center justify-center text-muted">Loading…</div>;
}

const Private = (el) => <PrivateRoute>{el}</PrivateRoute>;

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
              },
            }}
          />
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/share/:token" element={<Share />} />
              <Route path="/privacy" element={<Legal page="privacy" />} />
              <Route path="/terms" element={<Legal page="terms" />} />
              <Route path="/dashboard" element={Private(<Dashboard />)} />
              <Route path="/projects/:id" element={Private(<Project />)} />
              <Route path="/projects/:id/runs" element={Private(<Runs />)} />
              <Route path="/projects/:id/dashboard" element={Private(<ProjectDashboard />)} />
              <Route path="/runs/:id/execute" element={Private(<RunExecute />)} />
              <Route path="/" element={<Home />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />;
}
