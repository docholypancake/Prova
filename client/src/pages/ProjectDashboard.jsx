import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getProject, getProjectStats } from '../api';
import AppShell from '../components/AppShell';

const STATUS_BADGE = {
  in_progress: 'badge badge-amber',
  passed:      'badge badge-green',
  failed:      'badge badge-red',
  aborted:     'badge badge-muted',
};

const SEV_BADGE = {
  low:      'badge badge-muted',
  medium:   'badge badge-green',
  high:     'badge badge-amber',
  critical: 'badge badge-red',
};

function StatCard({ label, value, icon, color = 'var(--accent)' }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <div className="stat-icon" style={{ background: `color-mix(in srgb, ${color} 13%, transparent)`, color }}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-app">{value ?? '—'}</p>
    </div>
  );
}

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project } = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id) });
  const { data, isLoading, isError } = useQuery({ queryKey: ['stats', id], queryFn: () => getProjectStats(id) });

  const stats      = data?.stats;
  const recentRuns = data?.recentRuns || [];
  const trend      = data?.trend      || [];
  const openBugs   = data?.openBugsList || [];

  return (
    <AppShell breadcrumb={project?.name}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-app">Overview</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/projects/${id}/runs`)} className="btn btn-primary btn-sm">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
            New Test Run
          </button>
          <button onClick={() => navigate(`/projects/${id}`)} className="btn btn-ghost btn-sm">Test Cases</button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-4 w-16 rounded bg-[var(--surface-2)]" />
              <div className="mt-3 h-7 w-10 rounded bg-[var(--surface-2)]" />
            </div>
          ))}
        </div>
      ) : isError || !stats ? (
        <div className="card mt-6 p-10 text-center text-muted">Couldn't load stats — try reloading.</div>
      ) : (
        <>
          {/* KPI row */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Test cases"  value={stats.totalCases} color="var(--accent-2)"
              icon={<svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" /></svg>}
            />
            <StatCard label="Total runs"  value={stats.totalRuns}  color="var(--accent)"
              icon={<svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" /></svg>}
            />
            <StatCard label="Avg pass rate" value={`${stats.avgPassRate}%`} color="#d97706"
              icon={<svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 16l4-7 4 3.5 4-5.5" /></svg>}
            />
            <StatCard label="Open bugs"   value={stats.openBugs}  color="var(--accent)"
              icon={<svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 9a3 3 0 016 0v1a3 3 0 003 3v1a6 6 0 01-12 0v-1a3 3 0 003-3V9z" /><path d="M3 13h3M18 13h3M7.5 7l-2-2M16.5 7l2-2" /></svg>}
            />
          </div>

          {/* Chart */}
          <section className="card mt-5 p-5">
            <p className="section-title">Pass rate — last 30 days</p>
            {trend.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No completed runs yet.</p>
            ) : (
              <div className="mt-4 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ left: -20, right: 8, top: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <Tooltip
                      formatter={(v) => [`${v}%`, 'Pass rate']}
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
                    />
                    <Line type="monotone" dataKey="passRate" stroke="var(--accent-2)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--accent-2)' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Recent runs + Open bugs */}
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {/* Recent runs */}
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <p className="section-title">Recent Runs</p>
                <button onClick={() => navigate(`/projects/${id}/runs`)} className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>View all →</button>
              </div>
              {recentRuns.length === 0 ? (
                <p className="p-5 text-sm text-muted">No runs yet.</p>
              ) : (
                <ul>
                  {recentRuns.map((r) => (
                    <li key={r._id}
                      className="flex cursor-pointer items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0 transition-colors hover:bg-[var(--surface-2)]"
                      onClick={() => navigate(`/runs/${r._id}/execute`)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-app">{r.name}</p>
                        <p className="text-xs text-muted">{r.passed}/{r.total} passed · {new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="w-16">
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${r.passRate}%` }} />
                          </div>
                        </div>
                        <span className={STATUS_BADGE[r.status] || 'badge badge-muted'}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Open bugs */}
            <section className="card overflow-hidden">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <p className="section-title">Open Bugs</p>
              </div>
              {openBugs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-muted/40 fill-none stroke-current" strokeWidth="1.5" strokeLinecap="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
                  <p className="text-sm font-medium text-muted">No open bugs</p>
                </div>
              ) : (
                <ul>
                  {openBugs.map((b) => (
                    <li key={b._id} className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0">
                      <span className={SEV_BADGE[b.severity] || 'badge badge-muted'} style={{ marginTop: '2px' }}>
                        {b.severity}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-app">{b.title}</p>
                        {b.testCaseId?.title && <p className="text-xs text-muted">{b.testCaseId.title}</p>}
                      </div>
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
