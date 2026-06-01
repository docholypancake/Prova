import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { getSharedReport, badgeUrl, shareUrl } from '../api';
import ThemeToggle from '../components/ThemeToggle';

const RESULT_COLOR = {
  passed:  '#828c51',
  failed:  '#a63d40',
  skipped: '#9ca3af',
  blocked: '#d97706',
  pending: '#d6cdbf',
};

const SEV_BADGE = {
  low:      'badge badge-muted',
  medium:   'badge badge-green',
  high:     'badge badge-amber',
  critical: 'badge badge-red',
};

const RESULT_BADGE = {
  passed:  'badge badge-green',
  failed:  'badge badge-red',
  skipped: 'badge badge-muted',
  blocked: 'badge badge-amber',
  pending: 'badge badge-muted',
};

export default function Share() {
  const { token } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['share', token],
    queryFn: () => getSharedReport(token),
    retry: false,
  });

  if (isLoading) return <Centered>Loading report…</Centered>;
  if (isError || !data) return <Centered>Report not found.</Centered>;

  const { run, project, summary, bugs } = data;

  const pie = [
    { name: 'Passed',  value: summary.passed,  key: 'passed'  },
    { name: 'Failed',  value: summary.failed,  key: 'failed'  },
    { name: 'Skipped', value: summary.skipped, key: 'skipped' },
    { name: 'Blocked', value: summary.blocked, key: 'blocked' },
    { name: 'Pending', value: summary.pending, key: 'pending' },
  ].filter((s) => s.value > 0);

  const passRate = summary.total ? Math.round((summary.passed / summary.total) * 100) : 0;

  return (
    <div className="app-bg min-h-screen">
      {/* Top bar */}
      <div className="topbar">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="logo-mark" style={{ width: '1.75rem', height: '1.75rem' }}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="3.2">
                <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-sm font-bold tracking-tight text-app">Prova</span>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Run header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{project.name}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-app">{run.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {run.completedAt
                ? `Completed ${new Date(run.completedAt).toLocaleString()}`
                : 'In progress'}
              {run.githubPR?.number ? ` · PR #${run.githubPR.number}` : ''}
            </p>
          </div>
          <img src={badgeUrl(token)} alt="status badge" className="mt-1" />
        </div>

        {/* Summary card */}
        <div className="card mt-6 p-5">
          <div className="flex flex-wrap items-center gap-8">
            {/* Pie */}
            <div className="h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" innerRadius={38} outerRadius={58} paddingAngle={2}>
                    {pie.map((s) => <Cell key={s.key} fill={RESULT_COLOR[s.key]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stats grid */}
            <div className="flex flex-1 flex-wrap gap-x-8 gap-y-3">
              <StatItem label="Total"   value={summary.total} />
              <StatItem label="Passed"  value={summary.passed}  color="var(--accent-2)" />
              <StatItem label="Failed"  value={summary.failed}  color="var(--accent)" />
              <StatItem label="Skipped" value={summary.skipped} />
              <StatItem label="Blocked" value={summary.blocked} color="#d97706" />
              <StatItem label="Pending" value={summary.pending} />
            </div>

            {/* Pass rate */}
            <div className="text-center">
              <p className="text-3xl font-bold text-app">{passRate}%</p>
              <p className="mt-0.5 text-xs text-muted">Pass rate</p>
              <div className="progress-track mx-auto mt-2" style={{ width: 64 }}>
                <div className="progress-fill" style={{ width: `${passRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2 print:hidden">
          <button
            onClick={() => { navigator.clipboard.writeText(shareUrl(token)); toast.success('Link copied'); }}
            className="btn btn-ghost btn-sm"
          >
            Copy link
          </button>
          <button onClick={() => window.print()} className="btn btn-ghost btn-sm">Print / PDF</button>
        </div>

        {/* Cases table */}
        <div className="card mt-6 overflow-hidden">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="section-title">Test Cases</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Result</th>
                <th>Case</th>
                <th>Note</th>
                <th>Screenshot</th>
              </tr>
            </thead>
            <tbody>
              {run.cases.map((c, i) => (
                <tr key={i}>
                  <td>
                    <span className={RESULT_BADGE[c.result] || 'badge badge-muted'}>{c.result}</span>
                  </td>
                  <td className="text-app">
                    {c.testCaseId && (
                      <span className="mr-1.5 font-mono text-xs" style={{ color: 'var(--accent)' }}>{c.testCaseId}</span>
                    )}
                    {c.title}
                  </td>
                  <td className="text-sm text-muted">{c.note || '—'}</td>
                  <td>
                    {c.screenshotUrl ? (
                      <a href={c.screenshotUrl} target="_blank" rel="noreferrer" className="link-accent text-sm">view</a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bugs */}
        {bugs.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-app">Bugs <span className="text-sm font-normal text-muted">({bugs.length})</span></h2>
            <div className="card mt-3 overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr><th>Severity</th><th>Title</th><th>GitHub</th></tr>
                </thead>
                <tbody>
                  {bugs.map((b) => (
                    <tr key={b._id}>
                      <td><span className={SEV_BADGE[b.severity] || 'badge badge-muted'}>{b.severity}</span></td>
                      <td className="text-sm text-app">{b.title}</td>
                      <td>
                        {b.github?.issueUrl ? (
                          <a href={b.github.issueUrl} target="_blank" rel="noreferrer" className="link-accent text-sm">
                            #{b.github.issueNumber}
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* README badge */}
        <div className="card mt-6 p-4 print:hidden">
          <p className="section-title mb-2">README badge</p>
          <code className="block overflow-x-auto rounded-lg p-3 text-xs text-app" style={{ background: 'var(--surface-2)' }}>
            [![Prova]({badgeUrl(token)})]({shareUrl(token)})
          </code>
        </div>

        <p className="mt-8 text-center text-xs text-muted">Powered by Prova</p>
      </div>
    </div>
  );
}

function StatItem({ label, value, color = 'var(--text)' }) {
  return (
    <div>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function Centered({ children }) {
  return <div className="app-bg flex h-screen items-center justify-center text-sm text-muted">{children}</div>;
}
