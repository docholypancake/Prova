import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getProject, listSuites, listCases, listRuns, createRun,
  listBugs, syncBugToGitHub, deleteBug,
} from '../api';
import AppShell from '../components/AppShell';

const STATUS_STYLE = {
  in_progress: 'bg-clay-100 text-clay-700 dark:bg-clay-500/15 dark:text-clay-300',
  passed: 'bg-olive-100 text-olive-700 dark:bg-olive-500/15 dark:text-olive-200',
  failed: 'bg-clay-100 text-clay-700 dark:bg-clay-500/20 dark:text-clay-300',
  aborted: 'chip',
};

function flattenSuites(tree, depth = 0, out = []) {
  tree.forEach((s) => {
    out.push({ _id: s._id, name: `${'— '.repeat(depth)}${s.name}` });
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-app">Test Runs</h1>
        <button onClick={() => setShowWizard(true)} className="btn btn-primary">+ New Test Run</button>
      </div>

      {isLoading ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : runs.length === 0 ? (
        <div className="card mt-6 border-dashed p-10 text-center text-muted">No runs yet — start your first test run.</div>
      ) : (
        <ul className="mt-6 space-y-3">
          {runs.map((r) => {
            const total = r.cases.length;
            const passed = r.cases.filter((c) => c.result === 'passed').length;
            const done = r.cases.filter((c) => c.result !== 'pending').length;
            return (
              <li key={r._id} className="card card-hover flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-app">{r.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>{r.status.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{passed}/{total} passed · {done}/{total} executed · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={() => navigate(`/runs/${r._id}/execute`)} className="btn btn-ghost">
                  {r.status === 'in_progress' ? 'Execute' : 'View'}
                </button>
              </li>
            );
          })}
        </ul>
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
  const sync = useMutation({ mutationFn: syncBugToGitHub, onSuccess: (bug) => { refresh(); toast.success(`Synced to GitHub Issue #${bug.github?.issueNumber}`); }, onError: (err) => toast.error(err.response?.data?.error || 'Sync failed') });
  const del = useMutation({ mutationFn: deleteBug, onSuccess: () => { refresh(); toast.success('Bug deleted'); } });
  if (bugs.length === 0) return null;

  const SEV = {
    low: 'chip',
    medium: 'bg-olive-100 text-olive-700 dark:bg-olive-500/15 dark:text-olive-200',
    high: 'bg-clay-100 text-clay-600 dark:bg-clay-500/15 dark:text-clay-300',
    critical: 'bg-clay-500 text-white',
  };

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-app">Bugs</h2>
      <ul className="mt-3 space-y-2">
        {bugs.map((b) => (
          <li key={b._id} className="card flex items-center justify-between p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SEV[b.severity]}`}>{b.severity}</span>
                <span className="truncate font-semibold text-app">{b.title}</span>
              </div>
              {b.testCaseId?.title && <p className="text-xs text-muted">Case: {b.testCaseId.title}</p>}
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-3 text-sm">
              {b.github?.issueUrl ? (
                <a href={b.github.issueUrl} target="_blank" rel="noreferrer" className="font-semibold text-olive-600 hover:underline dark:text-olive-300">Issue #{b.github.issueNumber}</a>
              ) : (
                <button onClick={() => sync.mutate(b._id)} disabled={sync.isPending} className="link-muted">Sync to GitHub</button>
              )}
              <button onClick={() => confirm('Delete bug?') && del.mutate(b._id)} className="btn-danger">Delete</button>
            </div>
          </li>
        ))}
      </ul>
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
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="card flex w-full max-w-lg flex-col rounded-none shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-app px-6 py-4">
          <h3 className="text-lg font-bold text-app">New Test Run</h3>
          <button onClick={onClose} className="link-muted text-xl leading-none">✕</button>
        </div>
        <form id="run-form" onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div><label className="label">Run name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Regression — PR #42" className="input" /></div>
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
                <label className="label mb-0">Cases ({selectedIds.length} selected)</label>
                {cases.length > 0 && (
                  <button type="button" className="text-xs text-clay-500 hover:underline" onClick={() => { const all = {}; cases.forEach((c) => (all[c._id] = true)); setSelected(all); }}>Select all</button>
                )}
              </div>
              {cases.length === 0 ? (
                <p className="mt-1 text-sm text-muted">No cases in this suite.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {cases.map((c) => (
                    <li key={c._id}>
                      <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--surface-2)]">
                        <input type="checkbox" checked={!!selected[c._id]} onChange={(e) => setSelected({ ...selected, [c._id]: e.target.checked })} className="accent-clay-500" />
                        <span className="chip">{c.priority}</span>
                        <span className="text-app">{c.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {error && <p className="text-sm text-clay-500">{error}</p>}
        </form>
        <div className="flex justify-end gap-2 border-t border-app px-6 py-4">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="submit" form="run-form" disabled={start.isPending} className="btn btn-primary">{start.isPending ? 'Starting…' : 'Start run'}</button>
        </div>
      </div>
    </div>
  );
}
