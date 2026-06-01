import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getRun, updateRunCase, completeRun, uploadScreenshot, createBug, syncBugToGitHub } from '../api';
import ThemeToggle from '../components/ThemeToggle';

const RESULTS = [
  { key: 'passed',  label: 'Pass',  short: 'P', bg: 'var(--accent-2)', ring: '#828c51' },
  { key: 'failed',  label: 'Fail',  short: 'F', bg: 'var(--accent)',   ring: '#a63d40' },
  { key: 'skipped', label: 'Skip',  short: 'S', bg: '#9ca3af',         ring: '#9ca3af' },
  { key: 'blocked', label: 'Block', short: 'B', bg: '#d97706',         ring: '#d97706' },
];

const RESULT_ICON = {
  pending: { symbol: '○', color: 'var(--muted)' },
  passed:  { symbol: '✓', color: 'var(--accent-2)' },
  failed:  { symbol: '✗', color: 'var(--accent)' },
  skipped: { symbol: '–', color: 'var(--muted)' },
  blocked: { symbol: '⊘', color: '#d97706' },
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
  const finish    = useMutation({
    mutationFn: () => completeRun(id),
    onSuccess: (res) => { invalidate(); toast.success(`Run finished — ${res.summary.passed}/${res.summary.total} passed`); },
  });
  const reportBug = useMutation({
    mutationFn: ({ projectId, data }) => createBug(projectId, data),
    onSuccess: (bug) => { setBugByCase((m) => ({ ...m, [bug.testCaseId]: bug })); toast.success('Bug logged'); },
  });
  const syncBug = useMutation({
    mutationFn: (bugId) => syncBugToGitHub(bugId),
    onSuccess: (bug) => { setBugByCase((m) => ({ ...m, [bug.testCaseId]: bug })); toast.success(`Synced → Issue #${bug.github?.issueNumber}`); },
    onError: (err) => toast.error(err.response?.data?.error || 'Sync failed'),
  });

  const cases   = run?.cases || [];
  const current = cases[active];
  const locked  = run?.status !== 'in_progress';

  const advance = useCallback(() => {
    const next = cases.findIndex((c, i) => i > active && c.result === 'pending');
    if (next !== -1) setActive(next);
  }, [cases, active]);

  const mark = useCallback((result) => {
    if (!current || locked) return;
    const caseId = current.testCaseId?._id || current.testCaseId;
    setResult.mutate({ caseId, data: { result } }, { onSuccess: () => setTimeout(advance, 120) });
  }, [current, locked, setResult, advance]);

  // Keyboard shortcuts
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

  // Paste screenshot
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
        } catch (err) { toast.error(err.response?.data?.error || 'Upload failed'); }
        finally { setUploading(false); }
      };
      reader.readAsDataURL(item.getAsFile());
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [current, id, locked]);

  if (isLoading) return <FullCenter>Loading…</FullCenter>;
  if (!run)      return <FullCenter>Run not found.</FullCenter>;

  const total  = cases.length;
  const done   = cases.filter((c) => c.result !== 'pending').length;
  const passed = cases.filter((c) => c.result === 'passed').length;
  const pct    = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="app-bg flex h-screen flex-col overflow-hidden">
      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/dashboard" aria-label="Home"
              className="logo-mark shrink-0"
              style={{ width: '1.875rem', height: '1.875rem' }}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="3.2">
                <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <button onClick={() => navigate(`/projects/${run.projectId}/runs`)}
              className="hidden text-sm text-muted transition-colors hover:text-app sm:block">
              ← Runs
            </button>
            <span className="text-[var(--border)]">/</span>
            <h1 className="truncate text-sm font-semibold text-app">{run.name}</h1>
          </div>

          {/* Centre: progress */}
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-xs font-semibold text-muted">{done}/{total}</span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--accent-2)' }} />
            </div>
            <span className="text-xs font-semibold text-muted">{pct}%</span>
          </div>

          {/* Right */}
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {!locked ? (
              <button onClick={() => confirm('Finish this run?') && finish.mutate()} className="btn btn-primary btn-sm">
                Finish run
              </button>
            ) : (
              <>
                <button
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/share/${run.shareToken}`); toast.success('Share link copied'); }}
                  className="btn btn-ghost btn-sm"
                >
                  Copy share link
                </button>
                <span className="text-sm font-bold text-app">{passed}/{total} passed</span>
              </>
            )}
          </div>
        </div>

        {/* Progress bar (full-width, thin) */}
        <div className="h-0.5 w-full" style={{ background: 'var(--surface-2)' }}>
          <div className="h-full transition-all" style={{ width: `${pct}%`, background: 'var(--accent-2)' }} />
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Case sidebar */}
        <aside style={{ width: 260, borderRight: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, overflowY: 'auto' }}>
          <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="section-title">Cases</p>
          </div>
          <ul>
            {cases.map((c, i) => {
              const tc   = c.testCaseId || {};
              const icon = RESULT_ICON[c.result] || RESULT_ICON.pending;
              const isActive = i === active;
              return (
                <li key={i}>
                  <button
                    onClick={() => setActive(i)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors"
                    style={{
                      background: isActive ? 'var(--surface-2)' : undefined,
                      borderBottom: '1px solid color-mix(in srgb, var(--border) 50%, transparent)',
                    }}
                  >
                    <span className="shrink-0 text-base leading-none" style={{ color: icon.color, width: '1rem', textAlign: 'center' }}>
                      {icon.symbol}
                    </span>
                    <span className={`truncate ${isActive ? 'font-semibold text-app' : 'text-muted'}`}>
                      {tc.title || 'Case'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Main execution area */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
          {current ? (
            <ActiveCase
              entry={current}
              locked={locked}
              uploading={uploading}
              onMark={mark}
              onNote={(note) => {
                const caseId = current.testCaseId?._id || current.testCaseId;
                setResult.mutate({ caseId, data: { note } });
              }}
              bug={bugByCase[current.testCaseId?._id || current.testCaseId]}
              onReportBug={(data) => {
                const tc = current.testCaseId || {};
                reportBug.mutate({
                  projectId: run.projectId,
                  data: { runId: run._id, testCaseId: tc._id, title: data.title, description: data.description, severity: data.severity, screenshotUrl: current.screenshotUrl || null },
                });
              }}
              onSyncBug={(bugId) => syncBug.mutate(bugId)}
              syncing={syncBug.isPending}
            />
          ) : (
            <FullCenter>No cases in this run.</FullCenter>
          )}
        </main>
      </div>
    </div>
  );
}

/* ── Active case view ──────────────────────────────────────── */
function ActiveCase({ entry, locked, uploading, onMark, onNote, bug, onReportBug, onSyncBug, syncing }) {
  const tc = entry.testCaseId || {};
  const [note, setNote]       = useState(entry.note || '');
  const [bugForm, setBugForm] = useState(null);
  useEffect(() => { setNote(entry.note || ''); setBugForm(null); }, [entry.testCaseId, entry.note]);
  const showNote = entry.result === 'failed' || entry.result === 'blocked';

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      {/* Case header */}
      <div className="flex flex-wrap items-start gap-2">
        {tc.priority && <span className="chip">{tc.priority}</span>}
        {tc.testCaseId && <span className="chip font-mono text-xs" style={{ color: 'var(--accent)' }}>{tc.testCaseId}</span>}
        {tc.type && <span className="chip text-xs">{tc.type}</span>}
      </div>
      <h2 className="mt-2 text-xl font-bold text-app">{tc.title}</h2>

      {/* Case details */}
      {tc.preconditions && <DetailBlock label="Preconditions">{tc.preconditions}</DetailBlock>}
      {tc.testData       && <DetailBlock label="Test data">{tc.testData}</DetailBlock>}
      {tc.steps?.length > 0 && (
        <div className="mt-4">
          <p className="section-title mb-2">Steps</p>
          <ol className="space-y-1.5 pl-0">
            {tc.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-app">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}
      {tc.expectedResult && <DetailBlock label="Expected result">{tc.expectedResult}</DetailBlock>}

      {/* Result buttons */}
      <div className="mt-6 grid grid-cols-4 gap-2">
        {RESULTS.map((r) => {
          const isSelected = entry.result === r.key;
          return (
            <button
              key={r.key}
              disabled={locked}
              onClick={() => onMark(r.key)}
              className="rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40"
              style={{
                background: r.bg,
                outline: isSelected ? `3px solid ${r.ring}` : 'none',
                outlineOffset: 2,
                boxShadow: isSelected ? `0 4px 16px -4px ${r.ring}80` : undefined,
              }}
            >
              {r.label}
              <span className="ml-1 text-xs opacity-70">({r.short})</span>
            </button>
          );
        })}
      </div>
      {!locked && (
        <p className="mt-2 text-center text-xs text-muted">
          Keyboard: <kbd className="rounded bg-[var(--surface-2)] px-1 py-0.5 font-mono text-[10px]">P</kbd> pass ·{' '}
          <kbd className="rounded bg-[var(--surface-2)] px-1 py-0.5 font-mono text-[10px]">F</kbd> fail ·{' '}
          <kbd className="rounded bg-[var(--surface-2)] px-1 py-0.5 font-mono text-[10px]">S</kbd> skip ·{' '}
          <kbd className="rounded bg-[var(--surface-2)] px-1 py-0.5 font-mono text-[10px]">B</kbd> block ·{' '}
          paste screenshot
        </p>
      )}

      {/* Note */}
      {showNote && (
        <div className="mt-5">
          <label className="label">Note</label>
          <textarea
            value={note}
            disabled={locked}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => onNote(note)}
            rows={3}
            placeholder="What went wrong?"
            className="input"
          />
        </div>
      )}

      {/* Screenshot */}
      <div className="card mt-5 p-4">
        <p className="section-title mb-2">Screenshot {uploading && <span className="text-muted font-normal normal-case"> — uploading…</span>}</p>
        {entry.screenshotUrl ? (
          <a href={entry.screenshotUrl} target="_blank" rel="noreferrer">
            <img src={entry.screenshotUrl} alt="screenshot" className="max-h-56 rounded-lg border border-[var(--border)]" />
          </a>
        ) : (
          <p className="text-sm text-muted">{locked ? 'No screenshot' : 'Paste (⌘V / Ctrl+V) an image to attach'}</p>
        )}
      </div>

      {/* Bug reporting */}
      {showNote && (
        <div className="card mt-4 p-4" style={{ borderColor: 'color-mix(in srgb, var(--accent) 25%, var(--border))' }}>
          {bug ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-app">🐛 {bug.title}</p>
              <p className="text-xs text-muted">Severity: {bug.severity}</p>
              {bug.github?.issueUrl ? (
                <a href={bug.github.issueUrl} target="_blank" rel="noreferrer"
                  className="badge badge-green mt-2 inline-flex">
                  ✓ GitHub Issue #{bug.github.issueNumber}
                </a>
              ) : (
                <button onClick={() => onSyncBug(bug._id)} disabled={syncing} className="btn btn-ghost btn-sm mt-2">
                  {syncing ? 'Syncing…' : 'Sync to GitHub Issue'}
                </button>
              )}
            </div>
          ) : bugForm ? (
            <form onSubmit={(e) => { e.preventDefault(); onReportBug(bugForm); }} className="space-y-2.5">
              <input value={bugForm.title} onChange={(e) => setBugForm({ ...bugForm, title: e.target.value })} required placeholder="Bug title" className="input" />
              <textarea value={bugForm.description} onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })} rows={2} placeholder="What actually happened?" className="input" />
              <div className="flex items-center gap-2">
                <select value={bugForm.severity} onChange={(e) => setBugForm({ ...bugForm, severity: e.target.value })} className="input w-auto">
                  {['low', 'medium', 'high', 'critical'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <button type="submit" className="btn btn-primary btn-sm">Create bug</button>
                <button type="button" onClick={() => setBugForm(null)} className="link-muted text-sm">Cancel</button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setBugForm({ title: tc.title || '', description: note || '', severity: 'medium' })}
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Report bug from this case
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DetailBlock({ label, children }) {
  return (
    <div className="mt-4">
      <p className="section-title mb-1">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-app">{children}</p>
    </div>
  );
}

function FullCenter({ children }) {
  return <div className="app-bg flex h-screen items-center justify-center text-sm text-muted">{children}</div>;
}
