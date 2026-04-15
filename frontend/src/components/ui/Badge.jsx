import { cn } from '../../utils/cn';

/**
 * Small pill (ring) or hero-style pill with optional status dot.
 * Pass tone classes via className, e.g. STATUS_BADGE.PENDING from the page.
 */
export function Badge({ children, className = '', dotClassName }) {
  if (dotClassName) {
    return (
      <div
        className={cn(
          'inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-semibold shadow-sm md:self-auto',
          className
        )}
      >
        <span
          className={cn('h-2 w-2 rounded-full', dotClassName)}
          aria-hidden
        />
        {children}
      </div>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
        className
      )}
    >
      {children}
    </span>
  );
}
