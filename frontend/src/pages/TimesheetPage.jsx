import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { FormField } from '../components/ui/FormField';
import { SectionCard } from '../components/ui/SectionCard';
import { StatCard } from '../components/ui/StatCard';
import { TimesheetPageSkeleton } from '../components/ui/LoadingSkeleton';

function currentMonthValue() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatRowDate(ymd) {
  if (!ymd) return '—';
  const [y, mo, d] = String(ymd).split('-').map(Number);
  if (!y || !mo || !d) return ymd;
  return new Date(y, mo - 1, d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
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

function hoursDisplay(record) {
  if (record.total_hours != null && !Number.isNaN(Number(record.total_hours))) {
    return `${Number(record.total_hours).toFixed(2)}h`;
  }
  if (record.total_minutes == null) return '—';
  const m = Number(record.total_minutes);
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h <= 0) return `${min}m`;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

const STATUS_STYLES = {
  PRESENT: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80',
  ABSENT: 'bg-slate-100 text-slate-700 ring-slate-200/80',
  HALF_DAY: 'bg-amber-50 text-amber-900 ring-amber-200/80',
};

function computeStats(records) {
  const list = Array.isArray(records) ? records : [];
  const withHours = list.filter(
    (r) => r.total_minutes != null && Number(r.total_minutes) > 0
  );
  const daysPresent = list.filter((r) =>
    ['PRESENT', 'HALF_DAY'].includes(r.status)
  ).length;

  let totalHours = 0;
  for (const r of withHours) {
    if (r.total_hours != null) {
      totalHours += Number(r.total_hours);
    } else {
      totalHours += Number(r.total_minutes) / 60;
    }
  }

  const avg =
    withHours.length > 0 ? totalHours / withHours.length : 0;

  return {
    daysPresent,
    totalHours,
    avgHours: avg,
    daysWithHours: withHours.length,
  };
}

export default function TimesheetPage() {
  const [monthValue, setMonthValue] = useState(currentMonthValue);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTimesheet = useCallback(async (params = {}) => {
    setError('');
    setLoading(true);
    try {
      const { data: body } = await apiClient.get(
        '/api/v1/attendance/timesheet',
        { params }
      );
      setPayload(body?.data ?? null);
    } catch (err) {
      setPayload(null);
      setError(
        getApiErrorMessage(
          err,
          'Could not load timesheet. Please try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimesheet({});
  }, [fetchTimesheet]);

  useEffect(() => {
    const f = payload?.filter;
    if (f?.type === 'month' && typeof f.value === 'string') {
      setMonthValue(f.value);
    }
  }, [payload]);

  const applyMonth = () => {
    fetchTimesheet({ month: monthValue });
  };

  const applyRange = () => {
    if (!startDate || !endDate) {
      setError('Select both start and end dates.');
      return;
    }
    if (startDate > endDate) {
      setError('End date must be on or after start date.');
      return;
    }
    setError('');
    fetchTimesheet({ start_date: startDate, end_date: endDate });
  };

  const records = payload?.records ?? [];
  const timezone = payload?.timezone ?? '';
  const filterInfo = payload?.filter;

  const stats = useMemo(() => computeStats(records), [records]);

  const filterDescription = useMemo(() => {
    if (!filterInfo) return '';
    if (filterInfo.type === 'month') {
      const v = filterInfo.value || '';
      const [y, m] = v.split('-');
      if (y && m) {
        return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
          undefined,
          { month: 'long', year: 'numeric' }
        );
      }
      return v;
    }
    if (filterInfo.type === 'range') {
      return `${formatRowDate(filterInfo.start_date)} – ${formatRowDate(filterInfo.end_date)}`;
    }
    return '';
  }, [filterInfo]);

  const tableColumns = useMemo(
    () => [
      {
        id: 'date',
        label: 'Date',
        cellClassName: 'whitespace-nowrap font-medium text-slate-900',
        render: (row) => formatRowDate(row.attendance_date),
      },
      {
        id: 'in',
        label: 'Check in',
        cellClassName:
          'whitespace-nowrap font-mono text-sm tabular-nums text-slate-700',
        render: (row) => formatTime(row.check_in),
      },
      {
        id: 'out',
        label: 'Check out',
        cellClassName:
          'whitespace-nowrap font-mono text-sm tabular-nums text-slate-700',
        render: (row) => formatTime(row.check_out),
      },
      {
        id: 'hours',
        label: 'Total hours',
        cellClassName:
          'whitespace-nowrap font-mono text-sm tabular-nums text-slate-800',
        render: (row) => hoursDisplay(row),
      },
      {
        id: 'status',
        label: 'Status',
        cellClassName: 'whitespace-nowrap',
        render: (row) => (
          <Badge
            className={
              STATUS_STYLES[row.status] ||
              'bg-slate-100 text-slate-700 ring-slate-200/80'
            }
          >
            {row.status ?? '—'}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-8">
      <SectionCard variant="hero" className="sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-brand-600">
          Attendance history
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Timesheet
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Review check-in and check-out times by month or custom range. Summary
          stats update for the selected period.
        </p>
      </SectionCard>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {loading ? (
        <TimesheetPageSkeleton />
      ) : (
        <>
          <SectionCard>
            <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  By month
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <FormField label="Month" htmlFor="timesheet-month">
                      <input
                        id="timesheet-month"
                        type="month"
                        value={monthValue}
                        onChange={(e) => setMonthValue(e.target.value)}
                        className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                      />
                    </FormField>
                  </div>
                  <Button
                    type="button"
                    size="md"
                    onClick={applyMonth}
                    className="w-full shrink-0 sm:w-auto"
                  >
                    Apply month
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Date range
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <FormField label="From" htmlFor="timesheet-start" className="min-w-0">
                    <input
                      id="timesheet-start"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full min-w-[10rem] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                    />
                  </FormField>
                  <FormField label="To" htmlFor="timesheet-end" className="min-w-0">
                    <input
                      id="timesheet-end"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full min-w-[10rem] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                    />
                  </FormField>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={applyRange}
                    className="w-full shrink-0 sm:w-auto"
                  >
                    Apply range
                  </Button>
                </div>
              </div>
            </div>
            {filterDescription ? (
              <p className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <span className="font-medium text-slate-800">Showing:</span>{' '}
                {filterDescription}
                {timezone ? (
                  <span className="text-slate-500"> · {timezone}</span>
                ) : null}
              </p>
            ) : null}
          </SectionCard>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Days present"
              value={stats.daysPresent}
              hint="PRESENT or HALF_DAY in range"
            />
            <StatCard
              title="Total hours"
              value={
                stats.totalHours > 0
                  ? `${stats.totalHours.toFixed(2)}h`
                  : '0.00h'
              }
              hint="Sum of logged hours"
            />
            <StatCard
              title="Average hours / day"
              value={
                stats.daysWithHours > 0
                  ? `${stats.avgHours.toFixed(2)}h`
                  : '—'
              }
              hint={
                stats.daysWithHours > 0
                  ? `Across ${stats.daysWithHours} day(s) with hours`
                  : 'No completed hours in range'
              }
            />
          </div>

          <SectionCard variant="flush">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-slate-900">Records</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Newest dates first · suitable for export or print
              </p>
            </div>

            {records.length === 0 ? (
              <EmptyState
                title="No attendance in this period"
                description="Try another month or adjust the date range to see records."
              />
            ) : (
              <DataTable columns={tableColumns} rows={records} />
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
