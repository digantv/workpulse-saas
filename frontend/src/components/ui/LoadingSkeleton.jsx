export function DashboardPageSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="min-h-[140px] rounded-2xl bg-gradient-to-br from-slate-200/90 to-slate-100/80" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-2xl bg-slate-200/80" />
        <div className="h-28 rounded-2xl bg-slate-200/80" />
        <div className="h-28 rounded-2xl bg-slate-200/80" />
      </div>
      <div className="h-40 rounded-2xl bg-slate-200/80" />
    </div>
  );
}

export function TimesheetPageSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-10 max-w-md rounded-lg bg-slate-200/80" />
      <div className="h-24 rounded-2xl bg-slate-200/80" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-2xl bg-slate-200/80" />
        <div className="h-28 rounded-2xl bg-slate-200/80" />
        <div className="h-28 rounded-2xl bg-slate-200/80" />
      </div>
      <div className="h-64 rounded-2xl bg-slate-200/80" />
    </div>
  );
}

export function LeaveHistorySkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-24 rounded-xl bg-slate-100" />
      <div className="h-24 rounded-xl bg-slate-100" />
      <div className="h-24 rounded-xl bg-slate-100" />
    </div>
  );
}
