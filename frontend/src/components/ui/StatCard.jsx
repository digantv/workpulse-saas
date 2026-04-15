import { cn } from '../../utils/cn';

export function StatCard({ title, value, hint, children, className = '' }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card',
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>
      {children != null ? (
        <div className="mt-3">{children}</div>
      ) : (
        <>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
