import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getRun, updateRunCase, completeRun, uploadScreenshot, createBug, syncBugToGitHub } from '../api';
import ThemeToggle from '../components/ThemeToggle';

const RESULTS = [
  { key: 'passed', label: 'Pass', short: 'P', cls: 'bg-olive-500 hover:bg-olive-600' },
  { key: 'failed', label: 'Fail', short: 'F', cls: 'bg-clay-500 hover:bg-clay-600' },
  { key: 'skipped', label: 'Skip', short: 'S', cls: 'bg-stone-400 hover:bg-stone-500' },
  { key: 'blocked', label: 'Block', short: 'B', cls: 'bg-amber-600 hover:bg-amber-700' },
];
const ICON = {
  pending: { c: '○', cls: 'text-muted' },
  passed: { c: '✓', cls: 'text-olive-500' },
  failed: { c: '✗', cls: 'text-clay-500' },
  skipped: { c: '–', cls: 'text-muted' },
  blocked: { c: '⊘', cls: 'text-amber-600' },
};

export default function RunExecute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [active, setActive] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [bugByCase, setBugByCase] = useState({});

  const { data: run, isLoading } = useQuery({ queryKey: ['run', id], queryFn: () => getRun(id) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['run', id] });

  const setResult = useMutation({ mutationFn: ({ caseId, data }) => updateRunCase(id, caseId, data), onSuccess: () => invalidate() });
  const finish = useMutation({ mutationFn: () => completeRun(id), onSuccess: (res) => { invalidate(); toast.success(`Run finished — ${res.summary.passed}/${res.summary.total} passed`); } });
  const reportBug = useMutation({ mutationFn: ({ projectId, data }) => createBug(projectId, data), onSuccess: (bug) => { setBugByCase((m) => ({ ...m, [bug.testCaseId]: bug })); toast.success('Bug logged'); } });
  const syncBug = useMutation({ mutationFn: (bugId) => syncBugToGitHub(bugId), onSuccess: (bug) => { setBugByCase((m) => ({ ...m, [bug.testCaseId]: bug })); toast.success(`Synced to GitHub Issue #${bug.github?.issueNumber}`); }, onError: (err) => toast.error(err.response?.data?.error || 'Sync failed') });

  const cases = run?.cases || [];
  const current = cases[active];
  const locked = run?.status !== 'in_progress';

  const advance = useCallback(() => {
    const next = cases.findIndex((c, i) => i > active && c.result === 'pending');
    if (next !== -1) setActive(next);
  }, [cases, active]);

  const mark = useCallback((result) => {
    if (!current || locked) return;
    const caseId = current.testCaseId?._id || current.testCaseId;
    setResult.mutate({ caseId, data: { result } }, { onSuccess: () => setTimeout(advance, 100) });
  }, [current, locked, setResult, advance]);

  useEffect(() => {
    if (locked) return;
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const map = { p: 'passed', f: 'failed', s: 'skipped', b: 'blocked' };
      const r = map[e.key.toLowerCase()];
      if (r) { e.preventDefault(); mark(r); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mark, locked]);

  useEffect(() => {
    if (locked) return;
    const onPaste = async (e) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
      if (!item || !current) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          setUploading(true);
          const url = await uploadScreenshot(reader.result);
          const caseId = current.testCaseId?._id || current.testCaseId;
          await updateRunCase(id, caseId, { screenshotUrl: url });
          invalidate();
        } catch (err) { toast.error(err.response?.data?.error || 'Screenshot upload failed'); }
        finally { setUploading(false); }
      };
      reader.readAsDataURL(item.getAsFile());
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [current, id, locked]);

  if (isLoading) return <div className="app-bg flex h-screen items-center justify-center text-muted">Loading…</div>;
  if (!run) return <div className="app-bg flex h-screen items-center justify-center text-muted">Run not found.</div>;

  const total = cases.length;
  const done = cases.filter((c) => c.result !== 'pending').length;
  const passed = cases.filter((c) => c.result === 'passed').length;

  return (
    <div className="app-bg flex h-screen flex-col">
      <header className="topbar">
        <div className="flex items-center justify-between gap-3 px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/dashboard" aria-label="Home" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-clay-500 to-olive-500 text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="3.2"><path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <button onClick={() => navigate(`/projects/${run.projectId}/runs`)} className="link-muted text-sm">← Runs</button>
            <h1 className="truncate font-semibold text-app">{run.name}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {!locked ? (
              <button onClick={() => confirm('Finish this run?') && finish.mutate()} className="btn btn-primary">Finish Run</button>
            ) : (
              <>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/share/${run.shareToken}`); toast.success('Shareable report link copied'); }} className="btn btn-ghost">Copy share link</button>
                <span className="text-sm font-semibold text-app">{passed}/{total} passed</span>
              </>
            )}
          </div>
        </div>
        <div className="h-1.5 w-full bg-[var(--surface-2)]">
          <div className="h-full bg-olive-500 transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-app surface">
          <ul>
            {cases.map((c, i) => {
              const tc = c.testCaseId || {};
              const icon = ICON[c.result] || ICON.pending;
              return (
                <li key={i}>
                  <button onClick={() => setActive(i)} className={`flex w-full items-center gap-2 border-b border-app px-4 py-3 text-left text-sm transition-colors ${i === active ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]'}`}>
                    <span className={`text-base ${icon.cls}`}>{icon.c}</span>
                    <span className="truncate text-app">{tc.title || 'Case'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="flex-1 overflow-y-auto p-8">
          {current ? (
            <ActiveCase
              entry={current} locked={locked} uploading={uploading} onMark={mark}
              onNote={(note) => { const caseId = current.testCaseId?._id || current.testCaseId; setResult.mutate({ caseId, data: { note } }); }}
              bug={bugByCase[current.testCaseId?._id || current.testCaseId]}
              onReportBug={(data) => {
                const tc = current.testCaseId || {};
                reportBug.mutate({ projectId: run.projectId, data: { runId: run._id, testCaseId: tc._id, title: data.title, description: data.description, severity: data.severity, screenshotUrl: current.screenshotUrl || null } });
              }}
              onSyncBug={(bugId) => syncBug.mutate(bugId)}
              syncing={syncBug.isPending}
            />
          ) : <p className="text-muted">No cases in this run.</p>}
        </main>
      </div>
    </div>
  );
}

function ActiveCase({ entry, locked, uploading, onMark, onNote, bug, onReportBug, onSyncBug, syncing }) {
  const tc = entry.testCaseId || {};
  const [note, setNote] = useState(entry.note || '');
  const [bugForm, setBugForm] = useState(null);
  useEffect(() => { setNote(entry.note || ''); setBugForm(null); }, [entry.testCaseId, entry.note]);
  const showNote = entry.result === 'failed' || entry.result === 'blocked';

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">{tc.priority}</span>
        {tc.testCaseId && <span className="chip font-mono text-clay-500">{tc.testCaseId}</span>}
        <h2 className="text-xl font-bold text-app">{tc.title}</h2>
      </div>

      {tc.preconditions && <Block label="Preconditions">{tc.preconditions}</Block>}
      {tc.testData && <Block label="Test data">{tc.testData}</Block>}
      {tc.steps?.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-muted">Steps</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-app">{tc.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </div>
      )}
      {tc.expectedResult && <Block label="Expected result">{tc.expectedResult}</Block>}

      <div className="mt-6 flex gap-2">
        {RESULTS.map((r) => (
          <button key={r.key} disabled={locked} onClick={() => onMark(r.key)}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40 ${r.cls} ${entry.result === r.key ? 'ring-2 ring-offset-2 ring-offset-[var(--bg)] ring-[var(--text)]' : ''}`}>
            {r.label} <span className="opacity-70">({r.short})</span>
          </button>
        ))}
      </div>
      {!locked && <p className="mt-2 text-center text-xs text-muted">Keyboard: P pass · F fail · S skip · B block · paste (⌘V) a screenshot</p>}

      {showNote && (
        <div className="mt-4">
          <label className="label">Note</label>
          <textarea value={note} disabled={locked} onChange={(e) => setNote(e.target.value)} onBlur={() => onNote(note)} rows={3} placeholder="What went wrong?" className="input" />
        </div>
      )}

      <div className="mt-4">
        <p className="text-sm font-semibold text-muted">Screenshot {uploading && <span className="text-muted">— uploading…</span>}</p>
        {entry.screenshotUrl ? (
          <a href={entry.screenshotUrl} target="_blank" rel="noreferrer"><img src={entry.screenshotUrl} alt="screenshot" className="mt-1 max-h-64 rounded-xl border border-app" /></a>
        ) : <p className="mt-1 text-sm text-muted">{locked ? 'None' : 'Copy an image and paste (⌘V) here to attach.'}</p>}
      </div>

      {showNote && (
        <div className="mt-6 card border-clay-200 p-4 dark:border-clay-500/30">
          {bug ? (
            <div>
              <p className="text-sm font-semibold text-app">Bug: {bug.title}</p>
              <p className="text-xs text-muted">Severity: {bug.severity}</p>
              {bug.github?.issueUrl ? (
                <a href={bug.github.issueUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block rounded-full bg-olive-100 px-2 py-1 text-xs font-semibold text-olive-700 dark:bg-olive-500/15 dark:text-olive-200">✓ GitHub Issue #{bug.github.issueNumber}</a>
              ) : (
                <button onClick={() => onSyncBug(bug._id)} disabled={syncing} className="btn btn-ghost mt-2">{syncing ? 'Syncing…' : 'Sync to GitHub Issue'}</button>
              )}
            </div>
          ) : bugForm ? (
            <form onSubmit={(e) => { e.preventDefault(); onReportBug(bugForm); }} className="space-y-2">
              <input value={bugForm.title} onChange={(e) => setBugForm({ ...bugForm, title: e.target.value })} required placeholder="Bug title" className="input" />
              <textarea value={bugForm.description} onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })} rows={2} placeholder="What actually happened?" className="input" />
              <div className="flex items-center gap-2">
                <select value={bugForm.severity} onChange={(e) => setBugForm({ ...bugForm, severity: e.target.value })} className="input w-auto">
                  {['low', 'medium', 'high', 'critical'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <button type="submit" className="btn btn-primary">Create bug</button>
                <button type="button" onClick={() => setBugForm(null)} className="link-muted text-sm">Cancel</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setBugForm({ title: tc.title || '', description: entry.note || '', severity: 'medium' })} className="text-sm font-semibold text-clay-500 hover:underline">+ Report bug from this case</button>
          )}
        </div>
      )}
    </div>
  );
}

function Block({ label, children }) {
  return <div className="mt-4"><p className="text-sm font-semibold text-muted">{label}</p><p className="mt-1 whitespace-pre-wrap text-app">{children}</p></div>;
}
