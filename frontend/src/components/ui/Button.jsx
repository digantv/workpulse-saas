import { cn } from '../../utils/cn';

const variants = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60',
  secondary:
    'border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-brand-500',
  muted:
    'cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400',
};

const sizes = {
  md: 'px-6 py-2.5',
  lg: 'px-8 py-3.5',
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2';

export function Button({
  variant = 'primary',
  size = 'lg',
  loading = false,
  loadingLabel = 'Please wait…',
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}) {
  const isDisabled = disabled || loading;
  const spinnerBorder =
    variant === 'primary'
      ? 'border-2 border-white border-t-transparent'
      : 'border-2 border-brand-600 border-t-transparent';
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        base,
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.lg,
        className
      )}
      {...rest}
    >
      {loading ? (
        <>
          <span
            className={cn('h-4 w-4 animate-spin rounded-full', spinnerBorder)}
            aria-hidden
          />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
