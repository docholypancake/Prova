import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getProject, listSuites, listCases, listRuns, createRun,
  listBugs, syncBugToGitHub, deleteBug,
} from '../api';
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

function flattenSuites(tree, depth = 0, out = []) {
  tree.forEach((s) => {
    out.push({ _id: s._id, name: `${'  '.repeat(depth)}${depth > 0 ? '└ ' : ''}${s.name}` });
    if (s.children?.length) flattenSuites(s.children, depth + 1, out);
  });
  return out;
}

export default function Runs() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const pr = location.state?.pr || null;
  const [showWizard, setShowWizard] = useState(!!pr);

  const { data: project } = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id) });
  const { data: runs = [], isLoading } = useQuery({ queryKey: ['runs', id], queryFn: () => listRuns(id) });

  return (
    <AppShell breadcrumb={project?.name}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-app">Test Runs</h1>
        <button onClick={() => setShowWizard(true)} className="btn btn-primary btn-sm">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          New Run
        </button>
      </div>

      {/* Runs list */}
      {isLoading ? (
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : runs.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 border-dashed p-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" style={{ color: 'var(--accent)' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-app">No runs yet</p>
            <p className="mt-0.5 text-sm text-muted">Start your first test run</p>
          </div>
          <button onClick={() => setShowWizard(true)} className="btn btn-primary btn-sm">Start run</button>
        </div>
      ) : (
        <div className="card mt-6 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const total  = r.cases.length;
                const passed = r.cases.filter((c) => c.result === 'passed').length;
                const done   = r.cases.filter((c) => c.result !== 'pending').length;
                const rate   = total ? Math.round((passed / total) * 100) : 0;
                return (
                  <tr key={r._id} className="cursor-pointer" onClick={() => navigate(`/runs/${r._id}/execute`)}>
                    <td>
                      <p className="font-semibold text-app">{r.name}</p>
                      <p className="text-xs text-muted">{passed}/{total} passed · {done}/{total} executed</p>
                    </td>
                    <td style={{ width: 120 }}>
                      <div className="progress-track" style={{ width: 80 }}>
                        <div className="progress-fill" style={{ width: `${rate}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-muted">{rate}%</p>
                    </td>
                    <td>
                      <span className={STATUS_BADGE[r.status] || 'badge badge-muted'}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-sm text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/runs/${r._id}/execute`); }}
                      >
                        {r.status === 'in_progress' ? 'Execute' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <BugList projectId={id} />
      {showWizard && <RunWizard projectId={id} pr={pr} onClose={() => setShowWizard(false)} />}
    </AppShell>
  );
}

function BugList({ projectId }) {
  const queryClient = useQueryClient();
  const { data: bugs = [] } = useQuery({ queryKey: ['bugs', projectId], queryFn: () => listBugs(projectId) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['bugs', projectId] });
  const sync = useMutation({
    mutationFn: syncBugToGitHub,
    onSuccess: (bug) => { refresh(); toast.success(`Synced to GitHub Issue #${bug.github?.issueNumber}`); },
    onError: (err) => toast.error(err.response?.data?.error || 'Sync failed'),
  });
  const del = useMutation({
    mutationFn: deleteBug,
    onSuccess: () => { refresh(); toast.success('Bug deleted'); },
  });

  if (bugs.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold tracking-tight text-app">Bugs</h2>
      <div className="card mt-3 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr><th>Severity</th><th>Title</th><th>Case</th><th>GitHub</th><th /></tr>
          </thead>
          <tbody>
            {bugs.map((b) => (
              <tr key={b._id}>
                <td><span className={SEV_BADGE[b.severity] || 'badge badge-muted'}>{b.severity}</span></td>
                <td className="font-semibold text-app">{b.title}</td>
                <td className="text-sm text-muted">{b.testCaseId?.title || '—'}</td>
                <td>
                  {b.github?.issueUrl ? (
                    <a href={b.github.issueUrl} target="_blank" rel="noreferrer" className="link-accent text-sm">
                      #{b.github.issueNumber}
                    </a>
                  ) : (
                    <button onClick={() => sync.mutate(b._id)} disabled={sync.isPending} className="text-sm text-muted transition-colors hover:text-app">
                      Sync to GitHub
                    </button>
                  )}
                </td>
                <td>
                  <button onClick={() => confirm('Delete bug?') && del.mutate(b._id)} className="btn-danger text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RunWizard({ projectId, pr, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState(pr ? `PR #${pr.number}: ${pr.title}` : '');
  const [suiteId, setSuiteId] = useState('');
  const [selected, setSelected] = useState({});
  const [error, setError] = useState('');

  const { data: suiteTree = [] } = useQuery({ queryKey: ['suites', projectId], queryFn: () => listSuites(projectId) });
  const suites = flattenSuites(suiteTree);
  const { data: cases = [] } = useQuery({ queryKey: ['cases', suiteId], queryFn: () => listCases(suiteId), enabled: !!suiteId });

  const start = useMutation({
    mutationFn: (data) => createRun(projectId, data),
    onSuccess: (run) => { queryClient.invalidateQueries({ queryKey: ['runs', projectId] }); navigate(`/runs/${run._id}/execute`); },
    onError: (err) => setError(err.response?.data?.error || 'Failed to create run'),
  });

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const submit = (e) => {
    e.preventDefault(); setError('');
    if (!name.trim()) return setError('Name is required');
    if (selectedIds.length === 0) return setError('Select at least one case');
    const payload = { name, selectedCaseIds: selectedIds };
    if (pr) payload.githubPR = { number: pr.number, title: pr.title, sha: pr.sha };
    start.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="card flex w-full max-w-lg flex-col rounded-none shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h3 className="text-base font-bold text-app">New Test Run</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted transition-colors hover:bg-[var(--surface-2)] hover:text-app">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form id="run-form" onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <label className="label">Run name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Regression — PR #42" className="input" />
          </div>
          <div>
            <label className="label">Suite</label>
            <select value={suiteId} onChange={(e) => { setSuiteId(e.target.value); setSelected({}); }} className="input">
              <option value="">Select a suite…</option>
              {suites.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          {suiteId && (
            <div>
              <div className="flex items-center justify-between">
                <label className="label mb-0">Cases <span className="font-normal opacity-70">({selectedIds.length} selected)</span></label>
                {cases.length > 0 && (
                  <button type="button" className="text-xs font-semibold" style={{ color: 'var(--accent)' }}
                    onClick={() => { const all = {}; cases.forEach((c) => (all[c._id] = true)); setSelected(all); }}>
                    Select all
                  </button>
                )}
              </div>
              {cases.length === 0 ? (
                <p className="mt-1 text-sm text-muted">No cases in this suite.</p>
              ) : (
                <ul className="mt-2 space-y-0.5">
                  {cases.map((c) => (
                    <li key={c._id}>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[var(--surface-2)]">
                        <input type="checkbox" checked={!!selected[c._id]} onChange={(e) => setSelected({ ...selected, [c._id]: e.target.checked })} className="accent-[var(--accent)] h-3.5 w-3.5" />
                        <span className="chip">{c.priority}</span>
                        <span className="text-app">{c.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && <p className="text-sm" style={{ color: 'var(--accent)' }}>{error}</p>}
        </form>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
          <button type="submit" form="run-form" disabled={start.isPending} className="btn btn-primary btn-sm">
            {start.isPending ? 'Starting…' : 'Start run'}
          </button>
        </div>
      </div>
    </div>
  );
}
