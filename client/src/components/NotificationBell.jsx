import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listNotifications, markNotificationRead } from '../api';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
    refetchInterval: 30000,
  });
  const notifications = data?.notifications || [];
  const unread = data?.unread || 0;

  const read = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn btn-ghost relative px-2.5 py-2" aria-label="Notifications">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-clay-500 px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="card absolute right-0 z-50 mt-2 w-80 overflow-hidden shadow-xl">
          <div className="border-b border-app px-4 py-2.5 text-sm font-semibold text-app">Notifications</div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">Nothing yet</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n._id} className={`border-b border-app px-4 py-3 text-sm ${n.read ? 'opacity-60' : ''}`}>
                  <p className="text-app">{n.message}</p>
                  <div className="mt-1 flex items-center gap-3">
                    {n.prNumber && (
                      <button
                        className="text-xs font-semibold text-clay-500 hover:underline"
                        onClick={() => {
                          read.mutate(n._id);
                          setOpen(false);
                          navigate(`/projects/${n.projectId}/runs`, {
                            state: { pr: { number: n.prNumber, title: n.prTitle, sha: n.prSha } },
                          });
                        }}
                      >
                        Create test run for PR #{n.prNumber}
                      </button>
                    )}
                    {!n.read && (
                      <button className="text-xs text-muted hover:underline" onClick={() => read.mutate(n._id)}>
                        Mark read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
