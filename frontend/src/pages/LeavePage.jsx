import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { cn } from '../utils/cn';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { FormField, formControlClassName } from '../components/ui/FormField';
import { SectionCard } from '../components/ui/SectionCard';
import { LeaveHistorySkeleton } from '../components/ui/LoadingSkeleton';

const LEAVE_TYPES = [
  { value: 'SICK', label: 'Sick' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'PAID', label: 'Paid' },
  { value: 'UNPAID', label: 'Unpaid' },
];

const STATUS_BADGE = {
  PENDING: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  APPROVED: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80',
  REJECTED: 'bg-red-50 text-red-900 ring-red-200/80',
};

function formatRange(start, end) {
  if (!start || !end) return '—';
  const a = formatShortDate(start);
  const b = formatShortDate(end);
  return `${a} → ${b}`;
}

function formatShortDate(ymd) {
  if (!ymd) return '—';
  const [y, m, d] = String(ymd).split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCreatedAt(iso) {
  if (!iso) return '—';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '—';
  return t.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const initialForm = {
  start_date: '',
  end_date: '',
  leave_type: 'CASUAL',
  reason: '',
};

function ClockIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default function LeavePage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLeaves = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) {
      setError('');
      setLoading(true);
    }
    try {
      const { data: body } = await apiClient.get('/api/v1/leaves');
      setLeaves(body?.data?.leaves ?? []);
    } catch (err) {
      setLeaves([]);
      if (!silent) {
        setError(
          getApiErrorMessage(
            err,
            'Could not load leave requests. Please try again.'
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
    fetchLeaves({});
  }, [fetchLeaves]);

  const validate = () => {
    const next = {};
    if (!form.start_date) {
      next.start_date = 'Start date is required';
    }
    if (!form.end_date) {
      next.end_date = 'End date is required';
    }
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      next.end_date = 'End date must be on or after start date';
    }
    if (!form.leave_type) {
      next.leave_type = 'Leave type is required';
    }
    if (!form.reason || !form.reason.trim()) {
      next.reason = 'Reason is required';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/api/v1/leaves', {
        start_date: form.start_date,
        end_date: form.end_date,
        leave_type: form.leave_type,
        reason: form.reason.trim(),
      });
      setSuccess('Your leave request was submitted successfully.');
      setForm(initialForm);
      setFieldErrors({});
      await fetchLeaves({ silent: true });
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Could not submit leave request. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess('');
    setError('');
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
    }
  };

  const controlDisabled = submitting;
  const dateClass = formControlClassName('disabled:bg-slate-50');
  const selectClass = formControlClassName('max-w-md disabled:bg-slate-50');
  const textareaClass = formControlClassName(
    'resize-y placeholder:text-slate-400 disabled:bg-slate-50'
  );

  const tableColumns = useMemo(
    () => [
      {
        id: 'type',
        label: 'Type',
        cellClassName: 'whitespace-nowrap font-medium text-slate-900',
        render: (row) => row.leave_type,
      },
      {
        id: 'dates',
        label: 'Dates',
        cellClassName: 'whitespace-nowrap text-slate-700',
        render: (row) => formatRange(row.start_date, row.end_date),
      },
      {
        id: 'reason',
        label: 'Reason',
        headerClassName: 'min-w-[12rem] whitespace-normal',
        cellClassName: 'max-w-md text-slate-600',
        render: (row) => (
          <span className="line-clamp-2" title={row.reason}>
            {row.reason}
          </span>
        ),
      },
      {
        id: 'status',
        label: 'Status',
        cellClassName: 'whitespace-nowrap',
        render: (row) => (
          <Badge
            className={
              STATUS_BADGE[row.status] ||
              'bg-slate-100 text-slate-700 ring-slate-200/80'
            }
          >
            {row.status}
          </Badge>
        ),
      },
      {
        id: 'submitted',
        label: 'Submitted',
        cellClassName:
          'whitespace-nowrap font-mono text-xs text-slate-600',
        render: (row) => formatCreatedAt(row.created_at),
      },
    ],
    []
  );

  return (
    <div className="space-y-8">
      <SectionCard variant="hero" className="sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-brand-600">
          Time away
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Leave requests
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Apply for leave and review your history. Submissions start as{' '}
          <span className="font-medium text-slate-800">Pending</span> until
          processed.
        </p>
      </SectionCard>

      {error && !loading ? <Alert variant="error">{error}</Alert> : null}

      {success ? <Alert variant="success">{success}</Alert> : null}

      <SectionCard>
        <h2 className="text-lg font-semibold text-slate-900">New request</h2>
        <p className="mt-1 text-sm text-slate-500">
          All fields are required. Dates use your local calendar input.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              label="Start date"
              htmlFor="leave-start"
              error={fieldErrors.start_date}
            >
              <input
                id="leave-start"
                type="date"
                value={form.start_date}
                onChange={(e) => updateField('start_date', e.target.value)}
                disabled={controlDisabled}
                className={dateClass}
              />
            </FormField>
            <FormField
              label="End date"
              htmlFor="leave-end"
              error={fieldErrors.end_date}
            >
              <input
                id="leave-end"
                type="date"
                value={form.end_date}
                onChange={(e) => updateField('end_date', e.target.value)}
                disabled={controlDisabled}
                className={dateClass}
              />
            </FormField>
          </div>

          <FormField
            label="Leave type"
            htmlFor="leave-type"
            error={fieldErrors.leave_type}
          >
            <select
              id="leave-type"
              value={form.leave_type}
              onChange={(e) => updateField('leave_type', e.target.value)}
              disabled={controlDisabled}
              className={selectClass}
            >
              {LEAVE_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Reason"
            htmlFor="leave-reason"
            error={fieldErrors.reason}
          >
            <textarea
              id="leave-reason"
              rows={4}
              value={form.reason}
              onChange={(e) => updateField('reason', e.target.value)}
              disabled={controlDisabled}
              placeholder="Briefly describe the reason for your leave…"
              className={textareaClass}
            />
          </FormField>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="submit"
              loading={submitting}
              loadingLabel="Submitting…"
              className="w-full sm:w-auto sm:min-w-[180px]"
            >
              Submit request
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard variant="flush">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">Your history</h2>
          <p className="mt-0.5 text-sm text-slate-500">Newest requests first</p>
        </div>

        {loading ? (
          <LeaveHistorySkeleton />
        ) : leaves.length === 0 ? (
          <EmptyState
            icon={<ClockIcon className="h-8 w-8 text-slate-400" />}
            title="No leave requests yet"
            description="Submit a request above to see it listed here."
          />
        ) : (
          <>
            <div className="hidden md:block">
              <DataTable columns={tableColumns} rows={leaves} />
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {leaves.map((row) => (
                <li key={row.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {row.leave_type}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatRange(row.start_date, row.end_date)}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        'shrink-0',
                        STATUS_BADGE[row.status] ||
                          'bg-slate-100 text-slate-700 ring-slate-200/80'
                      )}
                    >
                      {row.status}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {row.reason}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    Submitted {formatCreatedAt(row.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </SectionCard>
    </div>
  );
}
