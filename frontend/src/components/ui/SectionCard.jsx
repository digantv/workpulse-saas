import { cn } from '../../utils/cn';

const shells = {
  solid:
    'rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card sm:p-8',
  hero: 'overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-brand-50/55 to-slate-100/85 p-6 shadow-card sm:p-8',
  flush: 'overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card',
};

export function SectionCard({ variant = 'solid', className = '', children }) {
  return (
    <section className={cn(shells[variant] ?? shells.solid, className)}>
      {children}
    </section>
  );
}
