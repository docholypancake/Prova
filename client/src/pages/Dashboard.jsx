import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listProjects, createProject, deleteProject } from '../api';
import AppShell from '../components/AppShell';
import { CardSkeleton } from '../components/Skeleton';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
  });

  const del = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
  });

  return (
    <AppShell>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-app">Projects</h1>
          <p className="mt-0.5 text-sm text-muted">Your QA workspaces</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          New Project
        </button>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <CardSkeleton /><CardSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState onNew={() => setShowModal(true)} />
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p._id} project={p} onDelete={() => {
              if (confirm(`Delete "${p.name}"? Removes all suites and cases.`)) del.mutate(p._id);
            }} onOpen={() => navigate(`/projects/${p._id}`)} />
          ))}
        </ul>
      )}

      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} />}
    </AppShell>
  );
}

function ProjectCard({ project: p, onOpen, onDelete }) {
  return (
    <li className="card card-hover group relative flex flex-col p-5">
      <button className="flex-1 text-left" onClick={onOpen}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current" style={{ color: 'var(--accent)', width: '1.125rem', height: '1.125rem' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
          </div>
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </div>

        <p className="mt-3 truncate text-[15px] font-semibold text-app">{p.name}</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted">{p.description || 'No description'}</p>

        {p.github?.owner && (
          <span className="chip mt-3 font-mono text-xs">
            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" style={{ color: 'var(--muted)' }}><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" /></svg>
            {p.github.owner}/{p.github.repo}
          </span>
        )}
      </button>

      {/* Delete — shows on hover */}
      <button
        onClick={onDelete}
        className="absolute right-4 top-4 rounded-md p-1 text-xs text-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-clay-100 hover:text-clay-600 dark:hover:bg-clay-500/15 dark:hover:text-clay-300"
        title="Delete project"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
      </button>
    </li>
  );
}

function EmptyState({ onNew }) {
  return (
    <div className="card mt-8 flex flex-col items-center justify-center gap-4 border-dashed p-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" style={{ color: 'var(--accent)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-app">No projects yet</p>
        <p className="mt-0.5 text-sm text-muted">Create your first QA workspace</p>
      </div>
      <button onClick={onNew} className="btn btn-primary btn-sm">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
        New Project
      </button>
    </div>
  );
}

function CreateProjectModal({ onClose }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
      onClose();
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to create project'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-app">New Project</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted transition-colors hover:bg-[var(--surface-2)] hover:text-app">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); setError(''); create.mutate({ name, description }); }}>
          <div>
            <label className="label">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="My QA project" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input" placeholder="Optional description…" />
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--accent)' }}>{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
            <button type="submit" disabled={create.isPending} className="btn btn-primary btn-sm">
              {create.isPending ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
