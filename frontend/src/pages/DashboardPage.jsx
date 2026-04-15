import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SectionCard } from '../components/ui/SectionCard';
import { StatCard } from '../components/ui/StatCard';
import { DashboardPageSkeleton } from '../components/ui/LoadingSkeleton';

function formatLongDate(ymd) {
  if (!ymd || typeof ymd !== 'string') return '';
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(iso) {
  if (!iso) return '—';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '—';
  return t.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(totalMinutes) {
  if (totalMinutes == null || Number.isNaN(Number(totalMinutes))) return '—';
  const m = Number(totalMinutes);
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h <= 0) return `${min}m`;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

const STATUS_META = {
  NOT_CHECKED_IN: {
    label: 'Not checked in',
    badgeClass:
      'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80 border-amber-100',
    dotClass: 'bg-amber-500',
  },
  CHECKED_IN: {
    label: 'Checked in',
    badgeClass:
      'bg-sky-50 text-sky-900 ring-1 ring-sky-200/80 border-sky-100',
    dotClass: 'bg-sky-500',
  },
  CHECKED_OUT: {
    label: 'Checked out',
    badgeClass:
      'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80 border-emerald-100',
    dotClass: 'bg-emerald-500',
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchToday = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) {
      setError('');
      setLoading(true);
    }
    try {
      const { data: body } = await apiClient.get('/api/v1/attendance/today');
      setToday(body?.data ?? null);
    } catch (err) {
      if (!silent) {
        setToday(null);
        setError(
          getApiErrorMessage(
            err,
            'Could not load today’s attendance. Please try again.'
          )
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const status = today?.status ?? null;
  const meta = status ? STATUS_META[status] : null;
  const attendance = today?.attendance;

  const handleCheckIn = async () => {
    setSuccess('');
    setError('');
    setActionLoading(true);
    try {
      await apiClient.post('/api/v1/attendance/checkin');
      setSuccess('You have checked in successfully.');
      await fetchToday({ silent: true });
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Check-in failed. Please try again.')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setSuccess('');
    setError('');
    setActionLoading(true);
    try {
      await apiClient.post('/api/v1/attendance/checkout');
      setSuccess('You have checked out successfully. Have a great rest of your day.');
      await fetchToday({ silent: true });
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Check-out failed. Please try again.')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const firstName =
    typeof user?.full_name === 'string'
      ? user.full_name.trim().split(/\s+/)[0]
      : '';

  return (
    <div className="space-y-8">
      <SectionCard variant="hero" className="sm:p-8 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-700">
              {formatLongDate(today?.date) || '—'}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {firstName ? (
                <>Welcome back, {firstName}</>
              ) : (
                <>Welcome back</>
              )}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
              Track today’s attendance, check in when you start, and check out
              when you finish. Your status updates instantly.
            </p>
          </div>
          {meta && status && (
            <Badge dotClassName={meta.dotClass} className={meta.badgeClass}>
              {meta.label}
            </Badge>
          )}
        </div>
      </SectionCard>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      {loading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Current status">
              <p className="text-lg font-semibold text-slate-900">
                {meta?.label ?? '—'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {status === 'NOT_CHECKED_IN' &&
                  'Start your day with a check-in.'}
                {status === 'CHECKED_IN' &&
                  'Remember to check out when you leave.'}
                {status === 'CHECKED_OUT' &&
                  'Your attendance for today is complete.'}
              </p>
            </StatCard>

            <StatCard title="Check-in time">
              <p className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
                {formatTime(attendance?.check_in)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Local time when you started
              </p>
            </StatCard>

            <StatCard
              title="Check-out & total"
              className="sm:col-span-2 lg:col-span-1"
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <p className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
                  {formatTime(attendance?.check_out)}
                </p>
                <span className="text-slate-300">·</span>
                <p className="text-lg font-semibold text-brand-700">
                  {formatDuration(attendance?.total_minutes)}
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Check-out time and time on record today
              </p>
            </StatCard>
          </div>

          <SectionCard>
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Today’s actions
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {status === 'NOT_CHECKED_IN' &&
                    'Check in to begin recording your work day.'}
                  {status === 'CHECKED_IN' &&
                    'You are checked in. Check out when your day ends.'}
                  {status === 'CHECKED_OUT' &&
                    'No further actions needed for today.'}
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                {status === 'NOT_CHECKED_IN' && (
                  <Button
                    type="button"
                    onClick={handleCheckIn}
                    loading={actionLoading}
                    loadingLabel="Processing…"
                    className="w-full sm:w-auto sm:min-w-[200px]"
                  >
                    Check in
                  </Button>
                )}

                {status === 'CHECKED_IN' && (
                  <Button
                    type="button"
                    onClick={handleCheckOut}
                    loading={actionLoading}
                    loadingLabel="Processing…"
                    className="w-full sm:w-auto sm:min-w-[200px]"
                  >
                    Check out
                  </Button>
                )}

                {status === 'CHECKED_OUT' && (
                  <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                    <span className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800">
                      Day complete
                    </span>
                    <Button
                      type="button"
                      disabled
                      variant="muted"
                      size="md"
                      className="px-6 py-3"
                    >
                      No actions available
                    </Button>
                  </div>
                )}

                {!status && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fetchToday()}
                    className="w-full sm:w-auto"
                  >
                    Retry load
                  </Button>
                )}
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
