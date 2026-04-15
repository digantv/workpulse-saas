import { cloneElement, isValidElement } from 'react';
import { cn } from '../../utils/cn';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

export function formControlClassName(extra = '') {
  return cn(inputClass, extra);
}

export function FormField({
  label,
  htmlFor,
  error,
  className = '',
  children,
}) {
  const errorId = `${htmlFor}-error`;
  let control = children;

  if (isValidElement(children)) {
    control = cloneElement(children, {
      id: children.props.id ?? htmlFor,
      'aria-invalid': error ? true : children.props['aria-invalid'],
      'aria-describedby': error
        ? errorId
        : children.props['aria-describedby'],
      className: cn(children.props.className),
    });
  }

  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {control}
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
