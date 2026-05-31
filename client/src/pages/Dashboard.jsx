import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listProjects, createProject, deleteProject } from '../api';
import AppShell from '../components/AppShell';

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-app">Projects</h1>
          <p className="mt-1 text-sm text-muted">Your QA workspaces.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + New Project
        </button>
      </div>

      {isLoading ? (
        <p className="mt-8 text-muted">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="card mt-8 border-dashed p-12 text-center">
          <p className="text-muted">No projects yet — create your first one.</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary mt-4">
            + New Project
          </button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <li key={p._id} className="card card-hover group flex items-start justify-between p-5">
              <button className="min-w-0 text-left" onClick={() => navigate(`/projects/${p._id}`)}>
                <p className="truncate text-lg font-semibold text-app">{p.name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description || 'No description'}</p>
                {p.github?.owner && (
                  <span className="chip mt-3 font-mono">
                    {p.github.owner}/{p.github.repo}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete project "${p.name}"? This removes all suites and cases.`)) del.mutate(p._id);
                }}
                className="btn-danger ml-3 shrink-0 text-sm opacity-0 transition-opacity group-hover:opacity-100"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} />}
    </AppShell>
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
      onClose();
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to create project'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md animate-fade-up p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-app">New Project</h3>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            create.mutate({ name, description });
          }}
        >
          <div>
            <label className="label">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="My QA project" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input" />
          </div>
          {error && <p className="text-sm text-clay-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={create.isPending} className="btn btn-primary">
              {create.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
