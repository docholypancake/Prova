import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProject, listSuites, createSuite, deleteSuite,
  listCases, createCase, updateCase, deleteCase,
  connectGitHub, disconnectGitHub,
} from '../api';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';

const PRIORITIES = ['P0', 'P1', 'P2', 'P3'];

export default function Project() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSuite, setSelectedSuite] = useState(null);

  const { data: project } = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id) });
  const { data: suites = [] } = useQuery({ queryKey: ['suites', id], queryFn: () => listSuites(id) });

  const addSuite = useMutation({
    mutationFn: (data) => createSuite(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suites', id] }),
  });
  const removeSuite = useMutation({
    mutationFn: deleteSuite,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suites', id] }); setSelectedSuite(null); },
  });

  const handleAddSuite = (parentId = null) => {
    const name = prompt('Suite name:');
    if (name) addSuite.mutate({ name, parentId });
  };

  return (
    <AppShell breadcrumb={project?.name}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-app">Test Cases</h1>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
        {/* Left panel: suites + github */}
        <aside className="space-y-3">
          {/* Suites card */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-3.5 py-2.5">
              <p className="section-title">Suites</p>
              <button
                onClick={() => handleAddSuite(null)}
                className="flex items-center gap-1 text-xs font-semibold transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Add
              </button>
            </div>
            <div className="p-2">
              {suites.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted">No suites yet</p>
              ) : (
                <ul className="space-y-0.5">
                  {suites.map((s) => (
                    <SuiteNode
                      key={s._id} suite={s} depth={0}
                      selectedId={selectedSuite?._id}
                      onSelect={setSelectedSuite}
                      onAddChild={handleAddSuite}
                      onDelete={(sid, sname) => { if (confirm(`Delete "${sname}" and its cases?`)) removeSuite.mutate(sid); }}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* GitHub card */}
          <GitHubPanel projectId={id} project={project} />
        </aside>

        {/* Right panel: cases */}
        <div>
          {selectedSuite ? (
            <CasePanel suite={selectedSuite} />
          ) : (
            <div className="card flex h-60 flex-col items-center justify-center gap-2 text-muted">
              <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current opacity-30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
              </svg>
              <p className="text-sm">Select a suite to view test cases</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* ── GitHub panel ──────────────────────────────────────────── */
function GitHubPanel({ projectId, project }) {
  const queryClient = useQueryClient();
  const connected = project?.github?.owner && project?.github?.repo;
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [msg, setMsg] = useState('');
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['project', projectId] });

  const connect = useMutation({
    mutationFn: () => connectGitHub(projectId, { owner: owner.trim(), repo: repo.trim() }),
    onSuccess: (data) => { setMsg(data.warning || ''); refresh(); data.warning ? toast(data.warning) : toast.success('Repo connected'); },
    onError: (err) => { const m = err.response?.data?.error || 'Failed'; setMsg(m); toast.error(m); },
  });
  const disconnect = useMutation({
    mutationFn: () => disconnectGitHub(projectId),
    onSuccess: () => { setMsg(''); refresh(); toast.success('Repo disconnected'); },
  });

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3.5 py-2.5">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current text-muted" ><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" /></svg>
        <p className="section-title">GitHub</p>
      </div>
      <div className="p-3.5">
        {connected ? (
          <div className="space-y-2">
            <p className="font-mono text-sm font-semibold text-app">{project.github.owner}/{project.github.repo}</p>
            <p className="text-xs text-muted">{project.webhookId ? '● Webhook active' : '○ No webhook'}</p>
            <button onClick={() => disconnect.mutate()} className="btn-danger text-xs">Disconnect</button>
          </div>
        ) : (
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); setMsg(''); connect.mutate(); }}>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="owner" className="input" />
            <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="repo" className="input" />
            <button type="submit" disabled={connect.isPending || !owner || !repo} className="btn btn-primary btn-sm w-full">
              {connect.isPending ? 'Connecting…' : 'Connect repo'}
            </button>
          </form>
        )}
        {msg && <p className="mt-2 text-xs text-muted">{msg}</p>}
      </div>
    </div>
  );
}

/* ── Suite tree node ───────────────────────────────────────── */
function SuiteNode({ suite, depth, selectedId, onSelect, onAddChild, onDelete }) {
  const active = selectedId === suite._id;
  return (
    <li>
      <div
        className={`group flex items-center justify-between gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors cursor-pointer ${
          active
            ? 'font-semibold'
            : 'text-muted hover:bg-[var(--surface-2)] hover:text-app'
        }`}
        style={{
          paddingLeft: 8 + depth * 12,
          background: active ? 'color-mix(in srgb, var(--accent) 11%, transparent)' : undefined,
          color: active ? 'var(--accent)' : undefined,
        }}
      >
        <button className="flex-1 truncate text-left" onClick={() => onSelect(suite)}>
          {suite.name}
        </button>
        <span className="hidden shrink-0 items-center gap-1 group-hover:flex">
          <button
            title="Add sub-suite"
            onClick={() => onAddChild(suite._id)}
            className="rounded p-0.5 text-xs transition-colors hover:text-app"
            style={{ color: active ? 'var(--accent)' : undefined }}
          >
            +
          </button>
          <button
            title="Delete"
            onClick={() => onDelete(suite._id, suite.name)}
            className="rounded p-0.5 text-xs transition-colors hover:text-clay-500"
          >
            ×
          </button>
        </span>
      </div>
      {suite.children?.length > 0 && (
        <ul className="space-y-0.5">
          {suite.children.map((c) => (
            <SuiteNode key={c._id} suite={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} onAddChild={onAddChild} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ── Case panel ────────────────────────────────────────────── */
function CasePanel({ suite }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const { data: cases = [], isLoading } = useQuery({ queryKey: ['cases', suite._id], queryFn: () => listCases(suite._id) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cases', suite._id] });

  const add    = useMutation({ mutationFn: (data) => createCase(suite._id, data),           onSuccess: () => { invalidate(); setEditing(null); } });
  const edit   = useMutation({ mutationFn: ({ id, data }) => updateCase(id, data),           onSuccess: () => { invalidate(); setEditing(null); } });
  const remove = useMutation({ mutationFn: deleteCase,                                        onSuccess: invalidate });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-app">{suite.name}</h2>
        <button onClick={() => setEditing('new')} className="btn btn-primary btn-sm">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Test Case
        </button>
      </div>

      {isLoading ? (
        <p className="mt-5 text-sm text-muted">Loading…</p>
      ) : cases.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center gap-2 border-dashed p-10 text-center">
          <p className="text-sm font-medium text-muted">No test cases in this suite</p>
          <button onClick={() => setEditing('new')} className="btn btn-primary btn-sm">Add first case</button>
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {cases.map((c) => (
            <li key={c._id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="chip">{c.priority}</span>
                    {c.testCaseId && <span className="chip font-mono text-xs" style={{ color: 'var(--accent)' }}>{c.testCaseId}</span>}
                    {c.type && <span className="chip text-xs" style={{ color: 'var(--accent-2)' }}>{c.type}</span>}
                    <span className="text-sm font-semibold text-app">{c.title}</span>
                  </div>
                  {c.feature && <p className="mt-1 text-xs text-muted">Feature: {c.feature}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-sm">
                  <button onClick={() => setEditing(c)} className="link-muted text-xs font-medium">Edit</button>
                  <button onClick={() => confirm(`Delete "${c.title}"?`) && remove.mutate(c._id)} className="btn-danger text-xs">Delete</button>
                </div>
              </div>

              {c.preconditions  && <Field label="Preconditions">{c.preconditions}</Field>}
              {c.testData       && <Field label="Test data">{c.testData}</Field>}
              {c.steps?.length > 0 && (
                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-muted">Steps</p>
                  <ol className="mt-1 list-decimal pl-5 text-sm text-app space-y-0.5">
                    {c.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              )}
              {c.expectedResult && <Field label="Expected result">{c.expectedResult}</Field>}
              {c.postconditions && <Field label="Postconditions">{c.postconditions}</Field>}
              {c.rationale      && <Field label="Why this matters">{c.rationale}</Field>}
              {c.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.tags.map((t) => <span key={t} className="chip">{t}</span>)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <CaseFormModal
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => (editing === 'new' ? add.mutate(data) : edit.mutate({ id: editing._id, data }))}
          pending={add.isPending || edit.isPending}
        />
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <p className="mt-2 text-sm text-muted">
      <span className="font-semibold text-app">{label}:</span>{' '}{children}
    </p>
  );
}

/* ── Case form modal ───────────────────────────────────────── */
function CaseFormModal({ initial, onClose, onSubmit, pending }) {
  const [form, setForm] = useState({
    title:           initial?.title          || '',
    testCaseId:      initial?.testCaseId     || '',
    feature:         initial?.feature        || '',
    type:            initial?.type           || '',
    priority:        initial?.priority       || 'P2',
    preconditions:   initial?.preconditions  || '',
    testData:        initial?.testData       || '',
    expectedResult:  initial?.expectedResult || '',
    postconditions:  initial?.postconditions || '',
    rationale:       initial?.rationale      || '',
    tags: (initial?.tags || []).join(', '),
  });
  const [steps, setSteps] = useState(initial?.steps?.length ? initial.steps : ['']);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      steps: steps.map((s) => s.trim()).filter(Boolean),
      tags:  form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="card flex w-full max-w-2xl flex-col rounded-none shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h3 className="text-base font-bold text-app">{initial ? 'Edit test case' : 'New test case'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted transition-colors hover:bg-[var(--surface-2)] hover:text-app">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form id="case-form" onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div><label className="label">Title *</label><input value={form.title} onChange={set('title')} required className="input" /></div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Test Case ID</label><input value={form.testCaseId} onChange={set('testCaseId')} placeholder="AUTH-LOGIN-01" className="input" /></div>
            <div>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={set('priority')} className="input">
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="label">Feature</label><input value={form.feature} onChange={set('feature')} className="input" /></div>
            <div><label className="label">Type</label><input value={form.type} onChange={set('type')} placeholder="Functional, UI…" className="input" /></div>
          </div>

          <div><label className="label">Preconditions</label><textarea value={form.preconditions} onChange={set('preconditions')} rows={2} className="input" /></div>
          <div><label className="label">Test data</label><textarea value={form.testData} onChange={set('testData')} rows={2} className="input" /></div>

          <div>
            <label className="label">Steps</label>
            {steps.map((step, i) => (
              <div key={i} className="mt-1.5 flex gap-2">
                <span className="mt-2 w-5 shrink-0 text-right text-sm text-muted">{i + 1}.</span>
                <input value={step} onChange={(e) => { const n = [...steps]; n[i] = e.target.value; setSteps(n); }} className="input" />
                <button type="button" onClick={() => setSteps(steps.length > 1 ? steps.filter((_, j) => j !== i) : [''])} className="btn btn-ghost btn-sm px-2">−</button>
              </div>
            ))}
            <button type="button" onClick={() => setSteps([...steps, ''])} className="mt-2 text-xs font-semibold" style={{ color: 'var(--accent)' }}>+ Add step</button>
          </div>

          <div><label className="label">Expected result</label><textarea value={form.expectedResult} onChange={set('expectedResult')} rows={2} className="input" /></div>
          <div><label className="label">Postconditions</label><textarea value={form.postconditions} onChange={set('postconditions')} rows={2} className="input" /></div>
          <div><label className="label">Why this case matters</label><textarea value={form.rationale} onChange={set('rationale')} rows={2} className="input" /></div>
          <div><label className="label">Tags (comma-separated)</label><input value={form.tags} onChange={set('tags')} placeholder="smoke, regression" className="input" /></div>
        </form>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
          <button type="submit" form="case-form" disabled={pending} className="btn btn-primary btn-sm">
            {pending ? 'Saving…' : 'Save case'}
          </button>
        </div>
      </div>
    </div>
  );
}
