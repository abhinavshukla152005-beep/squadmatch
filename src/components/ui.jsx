const VARIANTS = {
  primary:
    'bg-ink text-paper hover:bg-brand shadow-card enabled:hover:bg-brand-dark disabled:opacity-40',
  brand: 'bg-brand text-white hover:bg-brand-dark shadow-card disabled:opacity-40',
  outline: 'border border-line bg-surface text-ink hover:border-ink/30 hover:bg-paper',
  ghost: 'text-ink-soft hover:text-ink hover:bg-ink/5',
  danger: 'text-rose border border-rose/30 hover:bg-rose/10',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-[15px] rounded-xl gap-2',
};

export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98] ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  );
}

export function Card({ className = '', hover = false, children, ...props }) {
  return (
    <div
      {...props}
      className={`bg-surface border border-line rounded-[20px] ${
        hover ? 'shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-[13px] font-semibold tracking-wide uppercase text-ink-soft">{label}</span>
        {hint && <span className="text-xs text-muted normal-case tracking-normal">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 outline-none transition focus:border-brand/60 focus:ring-4 focus:ring-brand/10';

export function Step({ index, title, subtitle, children }) {
  return (
    <section className="relative pl-10 sm:pl-12">
      <span className="absolute left-0 top-0 h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-ink text-paper font-display text-sm grid place-items-center">
        {index}
      </span>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function Spinner({ className = '' }) {
  return (
    <span
      className={`inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
    />
  );
}
