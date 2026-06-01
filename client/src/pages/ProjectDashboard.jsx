import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getProject, getProjectStats } from '../api';
import AppShell from '../components/AppShell';

const STATUS_STYLE = {
  in_progress: 'bg-clay-100 text-clay-700 dark:bg-clay-500/15 dark:text-clay-300',
  passed: 'bg-olive-100 text-olive-700 dark:bg-olive-500/15 dark:text-olive-200',
  failed: 'bg-clay-100 text-clay-700 dark:bg-clay-500/20 dark:text-clay-300',
  aborted: 'chip',
};

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project } = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id) });
  const { data, isLoading, isError } = useQuery({ queryKey: ['stats', id], queryFn: () => getProjectStats(id) });

  const stats = data?.stats;
  const recentRuns = data?.recentRuns || [];
  const trend = data?.trend || [];
  const openBugs = data?.openBugsList || [];

  return (
    <AppShell breadcrumb={project?.name}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-app">Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/projects/${id}/runs`)} className="btn btn-primary">New Test Run</button>
          <button onClick={() => navigate(`/projects/${id}`)} className="btn btn-ghost">New Test Case</button>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : isError || !stats ? (
        <div className="card mt-6 p-8 text-center text-muted">
          Couldn’t load dashboard stats. Try reloading.
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Test cases" value={stats.totalCases} />
            <StatCard label="Total runs" value={stats.totalRuns} />
            <StatCard label="Avg pass rate" value={`${stats.avgPassRate}%`} />
            <StatCard label="Open bugs" value={stats.openBugs} />
          </div>

          <section className="card mt-8 p-5">
            <h2 className="text-sm font-semibold text-muted">Pass rate — last 30 days</h2>
            {trend.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No completed runs in the last 30 days.</p>
            ) : (
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ left: -20, right: 10, top: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)' }} />
                    <Line type="monotone" dataKey="passRate" stroke="#828c51" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="text-sm font-semibold text-muted">Recent runs</h2>
              {recentRuns.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No runs yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {recentRuns.map((r) => (
                    <li key={r._id} className="card card-hover flex cursor-pointer items-center justify-between p-3" onClick={() => navigate(`/runs/${r._id}/execute`)}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-app">{r.name}</p>
                        <p className="text-xs text-muted">{r.passed}/{r.total} · {new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="ml-3 flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className="h-full bg-olive-500" style={{ width: `${r.passRate}%` }} /></div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>{r.status.replace('_', ' ')}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold text-muted">Open bugs</h2>
              {openBugs.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No open bugs 🎉</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {openBugs.map((b) => (
                    <li key={b._id} className="card p-3 text-sm">
                      <p className="font-semibold text-app">{b.title}</p>
                      <p className="text-xs text-muted">{b.severity}{b.testCaseId?.title ? ` · ${b.testCaseId.title}` : ''}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card card-hover p-4">
      <p className="text-2xl font-bold text-app">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
