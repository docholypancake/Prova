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
        <h1 className="text-2xl font-bold tracking-tight text-app">{project?.name || 'Loading…'}</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/projects/${id}/dashboard`)} className="btn btn-ghost">Dashboard</button>
          <button onClick={() => navigate(`/projects/${id}/runs`)} className="btn btn-ghost">Test Runs</button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Suites + GitHub */}
        <aside className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Suites</span>
              <button onClick={() => handleAddSuite(null)} className="text-sm font-semibold text-clay-500 hover:underline">+ Add</button>
            </div>
            <ul className="mt-3 space-y-1">
              {suites.length === 0 && <li className="text-sm text-muted">No suites yet</li>}
              {suites.map((s) => (
                <SuiteNode
                  key={s._id} suite={s} depth={0}
                  selectedId={selectedSuite?._id}
                  onSelect={setSelectedSuite}
                  onAddChild={handleAddSuite}
                  onDelete={(sid, sname) => { if (confirm(`Delete suite "${sname}" and its cases?`)) removeSuite.mutate(sid); }}
                />
              ))}
            </ul>
          </div>
          <GitHubPanel projectId={id} project={project} />
        </aside>

        {/* Cases */}
        <div>
          {selectedSuite ? (
            <CasePanel suite={selectedSuite} />
          ) : (
            <div className="card flex h-64 items-center justify-center text-muted">
              Select a suite to view its test cases.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function GitHubPanel({ projectId, project }) {
  const queryClient = useQueryClient();
  const connected = project?.github?.owner && project?.github?.repo;
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [msg, setMsg] = useState('');
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['project', projectId] });

  const connect = useMutation({
    mutationFn: () => connectGitHub(projectId, { owner: owner.trim(), repo: repo.trim() }),
    onSuccess: (data) => { setMsg(data.warning || 'Connected'); refresh(); data.warning ? toast(data.warning) : toast.success('Repo connected'); },
    onError: (err) => { const m = err.response?.data?.error || 'Failed'; setMsg(m); toast.error(m); },
  });
  const disconnect = useMutation({ mutationFn: () => disconnectGitHub(projectId), onSuccess: () => { setMsg(''); refresh(); toast.success('Repo disconnected'); } });

  return (
    <div className="card p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">GitHub</span>
      {connected ? (
        <div className="mt-2">
          <p className="font-mono text-sm text-app">{project.github.owner}/{project.github.repo}</p>
          <p className="text-xs text-muted">{project.webhookId ? 'Webhook active' : 'No webhook'}</p>
          <button onClick={() => disconnect.mutate()} className="btn-danger mt-2 text-xs">Disconnect</button>
        </div>
      ) : (
        <form className="mt-2 space-y-2" onSubmit={(e) => { e.preventDefault(); setMsg(''); connect.mutate(); }}>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="owner" className="input" />
          <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="repo" className="input" />
          <button type="submit" disabled={connect.isPending || !owner || !repo} className="btn btn-primary w-full">
            {connect.isPending ? 'Connecting…' : 'Connect repo'}
          </button>
        </form>
      )}
      {msg && <p className="mt-2 text-xs text-muted">{msg}</p>}
    </div>
  );
}

function SuiteNode({ suite, depth, selectedId, onSelect, onAddChild, onDelete }) {
  const active = selectedId === suite._id;
  return (
    <li>
      <div
        className={`group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors ${active ? 'bg-clay-500 text-white' : 'text-app hover:bg-[var(--surface-2)]'}`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button className="flex-1 truncate text-left" onClick={() => onSelect(suite)}>{suite.name}</button>
        <span className="ml-2 hidden gap-2 group-hover:flex">
          <button title="Add sub-suite" onClick={() => onAddChild(suite._id)} className={active ? 'text-white/80' : 'text-muted'}>+</button>
          <button title="Delete" onClick={() => onDelete(suite._id, suite.name)} className={active ? 'text-white/80' : 'text-clay-500'}>×</button>
        </span>
      </div>
      {suite.children?.length > 0 && (
        <ul className="space-y-1">
          {suite.children.map((c) => (
            <SuiteNode key={c._id} suite={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} onAddChild={onAddChild} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </li>
  );
}

function CasePanel({ suite }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const { data: cases = [], isLoading } = useQuery({ queryKey: ['cases', suite._id], queryFn: () => listCases(suite._id) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cases', suite._id] });

  const add = useMutation({ mutationFn: (data) => createCase(suite._id, data), onSuccess: () => { invalidate(); setEditing(null); } });
  const edit = useMutation({ mutationFn: ({ id, data }) => updateCase(id, data), onSuccess: () => { invalidate(); setEditing(null); } });
  const remove = useMutation({ mutationFn: deleteCase, onSuccess: invalidate });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-app">{suite.name}</h2>
        <button onClick={() => setEditing('new')} className="btn btn-primary">+ Test Case</button>
      </div>

      {isLoading ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : cases.length === 0 ? (
        <div className="card mt-6 border-dashed p-10 text-center text-muted">No test cases yet — add your first one.</div>
      ) : (
        <ul className="mt-6 space-y-3">
          {cases.map((c) => (
            <li key={c._id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip">{c.priority}</span>
                    {c.testCaseId && <span className="chip font-mono text-clay-500">{c.testCaseId}</span>}
                    {c.type && <span className="chip text-olive-600 dark:text-olive-300">{c.type}</span>}
                    <span className="font-semibold text-app">{c.title}</span>
                  </div>
                  {c.feature && <p className="mt-1 text-xs text-muted">Feature: {c.feature}</p>}
                </div>
                <div className="ml-3 flex shrink-0 gap-3 text-sm">
                  <button onClick={() => setEditing(c)} className="link-muted">Edit</button>
                  <button onClick={() => confirm(`Delete "${c.title}"?`) && remove.mutate(c._id)} className="btn-danger">Delete</button>
                </div>
              </div>
              {c.preconditions && <Field label="Preconditions">{c.preconditions}</Field>}
              {c.testData && <Field label="Test data">{c.testData}</Field>}
              {c.steps?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-muted">Steps</p>
                  <ol className="mt-1 list-decimal pl-5 text-sm text-app">{c.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                </div>
              )}
              {c.expectedResult && <Field label="Expected result">{c.expectedResult}</Field>}
              {c.postconditions && <Field label="Postconditions">{c.postconditions}</Field>}
              {c.rationale && <Field label="Why this matters">{c.rationale}</Field>}
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
  return <p className="mt-2 text-sm text-muted"><span className="font-semibold text-app">{label}:</span> {children}</p>;
}

function CaseFormModal({ initial, onClose, onSubmit, pending }) {
  const [form, setForm] = useState({
    title: initial?.title || '', testCaseId: initial?.testCaseId || '', feature: initial?.feature || '',
    type: initial?.type || '', priority: initial?.priority || 'P2', preconditions: initial?.preconditions || '',
    testData: initial?.testData || '', expectedResult: initial?.expectedResult || '',
    postconditions: initial?.postconditions || '', rationale: initial?.rationale || '',
    tags: (initial?.tags || []).join(', '),
  });
  const [steps, setSteps] = useState(initial?.steps?.length ? initial.steps : ['']);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      steps: steps.map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="card flex w-full max-w-2xl flex-col rounded-none shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-app px-6 py-4">
          <h3 className="text-lg font-bold text-app">{initial ? 'Edit test case' : 'New test case'}</h3>
          <button onClick={onClose} className="link-muted text-xl leading-none">✕</button>
        </div>

        <form id="case-form" onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div><label className="label">Title *</label><input value={form.title} onChange={set('title')} required className="input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Test Case ID</label><input value={form.testCaseId} onChange={set('testCaseId')} placeholder="AUTH-LOGIN-01" className="input" /></div>
            <div><label className="label">Priority</label><select value={form.priority} onChange={set('priority')} className="input">{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></div>
            <div><label className="label">Feature</label><input value={form.feature} onChange={set('feature')} className="input" /></div>
            <div><label className="label">Type</label><input value={form.type} onChange={set('type')} placeholder="Functional, UI…" className="input" /></div>
          </div>
          <div><label className="label">Preconditions</label><textarea value={form.preconditions} onChange={set('preconditions')} rows={2} className="input" /></div>
          <div><label className="label">Test data</label><textarea value={form.testData} onChange={set('testData')} rows={2} className="input" /></div>
          <div>
            <label className="label">Steps</label>
            {steps.map((step, i) => (
              <div key={i} className="mt-1 flex gap-2">
                <span className="mt-2 w-5 shrink-0 text-right text-sm text-muted">{i + 1}.</span>
                <input value={step} onChange={(e) => { const n = [...steps]; n[i] = e.target.value; setSteps(n); }} className="input" />
                <button type="button" onClick={() => setSteps(steps.length > 1 ? steps.filter((_, j) => j !== i) : [''])} className="btn btn-ghost px-3">−</button>
              </div>
            ))}
            <button type="button" onClick={() => setSteps([...steps, ''])} className="mt-2 text-sm text-clay-500 hover:underline">+ Add step</button>
          </div>
          <div><label className="label">Expected result</label><textarea value={form.expectedResult} onChange={set('expectedResult')} rows={2} className="input" /></div>
          <div><label className="label">Postconditions</label><textarea value={form.postconditions} onChange={set('postconditions')} rows={2} className="input" /></div>
          <div><label className="label">Why this case matters</label><textarea value={form.rationale} onChange={set('rationale')} rows={2} className="input" /></div>
          <div><label className="label">Tags (comma-separated)</label><input value={form.tags} onChange={set('tags')} placeholder="smoke, regression" className="input" /></div>
        </form>

        <div className="flex justify-end gap-2 border-t border-app px-6 py-4">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="submit" form="case-form" disabled={pending} className="btn btn-primary">{pending ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
