import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getSharedReport, badgeUrl, shareUrl } from '../api';
import ThemeToggle from '../components/ThemeToggle';

const RESULT_COLOR = { passed: '#828c51', failed: '#a63d40', skipped: '#9ca3af', blocked: '#d97706', pending: '#d6cdbf' };
const SEV = {
  low: 'chip',
  medium: 'bg-olive-100 text-olive-700 dark:bg-olive-500/15 dark:text-olive-200',
  high: 'bg-clay-100 text-clay-600 dark:bg-clay-500/15 dark:text-clay-300',
  critical: 'bg-clay-500 text-white',
};

export default function Share() {
  const { token } = useParams();
  const { data, isLoading, isError } = useQuery({ queryKey: ['share', token], queryFn: () => getSharedReport(token), retry: false });

  if (isLoading) return <Centered>Loading report…</Centered>;
  if (isError || !data) return <Centered>Report not found.</Centered>;

  const { run, project, summary, bugs } = data;
  const pie = [
    { name: 'Passed', value: summary.passed, key: 'passed' },
    { name: 'Failed', value: summary.failed, key: 'failed' },
    { name: 'Skipped', value: summary.skipped, key: 'skipped' },
    { name: 'Blocked', value: summary.blocked, key: 'blocked' },
    { name: 'Pending', value: summary.pending, key: 'pending' },
  ].filter((s) => s.value > 0);

  return (
    <div className="app-bg min-h-screen">
      <div className="absolute right-4 top-4 print:hidden"><ThemeToggle /></div>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted">{project.name}</p>
            <h1 className="text-2xl font-bold text-app">{run.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {run.completedAt ? `Completed ${new Date(run.completedAt).toLocaleString()}` : 'In progress'}
              {run.githubPR?.number ? ` · PR #${run.githubPR.number}` : ''}
            </p>
          </div>
          <img src={badgeUrl(token)} alt="status badge" className="mt-1" />
        </div>

        <div className="card mt-6 flex flex-wrap items-center gap-6 p-5">
          <div className="h-36 w-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius={40} outerRadius={64} paddingAngle={2}>
                  {pie.map((s) => <Cell key={s.key} fill={RESULT_COLOR[s.key]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <Stat label="Total" value={summary.total} />
            <Stat label="Passed" value={summary.passed} color="text-olive-600 dark:text-olive-300" />
            <Stat label="Failed" value={summary.failed} color="text-clay-500" />
            <Stat label="Skipped" value={summary.skipped} />
            <Stat label="Blocked" value={summary.blocked} color="text-amber-600" />
            <Stat label="Pending" value={summary.pending} />
          </div>
        </div>

        <div className="mt-4 flex gap-2 print:hidden">
          <button onClick={() => { navigator.clipboard.writeText(shareUrl(token)); alert('Link copied'); }} className="btn btn-ghost">Copy shareable link</button>
          <button onClick={() => window.print()} className="btn btn-ghost">Download PDF</button>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-app text-left text-muted">
              <th className="py-2">Result</th><th className="py-2">Case</th><th className="py-2">Note</th><th className="py-2">Shot</th>
            </tr>
          </thead>
          <tbody>
            {run.cases.map((c, i) => (
              <tr key={i} className="border-b border-app align-top">
                <td className="py-2"><span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ background: RESULT_COLOR[c.result] }}>{c.result}</span></td>
                <td className="py-2 text-app">{c.testCaseId && <span className="mr-1 font-mono text-xs text-clay-500">{c.testCaseId}</span>}{c.title}</td>
                <td className="py-2 text-muted">{c.note || '—'}</td>
                <td className="py-2">{c.screenshotUrl ? <a href={c.screenshotUrl} target="_blank" rel="noreferrer" className="text-clay-500 hover:underline">view</a> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {bugs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-app">Bugs ({bugs.length})</h2>
            <ul className="mt-2 space-y-2">
              {bugs.map((b) => (
                <li key={b._id} className="card flex items-center gap-2 p-3 text-sm">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SEV[b.severity]}`}>{b.severity}</span>
                  <span className="text-app">{b.title}</span>
                  {b.github?.issueUrl && <a href={b.github.issueUrl} target="_blank" rel="noreferrer" className="ml-auto text-olive-600 hover:underline dark:text-olive-300">Issue #{b.github.issueNumber}</a>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card mt-8 p-4 print:hidden">
          <p className="text-sm font-semibold text-muted">README badge</p>
          <code className="mt-1 block overflow-x-auto rounded-lg bg-[var(--surface-2)] p-2 text-xs text-app">[![Prova]({badgeUrl(token)})]({shareUrl(token)})</code>
        </div>

        <p className="mt-8 text-center text-xs text-muted">Powered by Prova</p>
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'text-app' }) {
  return <div className="flex items-center gap-2"><span className={`text-lg font-bold ${color}`}>{value}</span><span className="text-muted">{label}</span></div>;
}
function Centered({ children }) {
  return <div className="app-bg flex h-screen items-center justify-center text-muted">{children}</div>;
}
