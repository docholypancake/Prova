// Simple shimmer skeleton blocks. Usage: <Skeleton className="h-6 w-40" />
export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--surface-2)] ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card space-y-3 p-5">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
