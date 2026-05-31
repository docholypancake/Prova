import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Project from './pages/Project';
import Runs from './pages/Runs';
import RunExecute from './pages/RunExecute';
import Share from './pages/Share';
import ProjectDashboard from './pages/ProjectDashboard';
import { Privacy, Terms } from './pages/Legal';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/share/:token" element={<Share />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <PrivateRoute>
                <Project />
              </PrivateRoute>
            }
          />
          <Route
            path="/projects/:id/runs"
            element={
              <PrivateRoute>
                <Runs />
              </PrivateRoute>
            }
          />
          <Route
            path="/projects/:id/dashboard"
            element={
              <PrivateRoute>
                <ProjectDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/runs/:id/execute"
            element={
              <PrivateRoute>
                <RunExecute />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Landing for guests, dashboard for authed users.
function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />;
}
