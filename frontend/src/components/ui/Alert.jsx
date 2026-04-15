import { cn } from '../../utils/cn';

const styles = {
  error:
    'border-red-200 bg-red-50 text-red-800',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-900',
};

export function Alert({ variant = 'error', className = '', children, ...rest }) {
  const isError = variant === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cn(
        'rounded-xl border px-4 py-3 text-sm shadow-sm',
        styles[variant] ?? styles.error,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
