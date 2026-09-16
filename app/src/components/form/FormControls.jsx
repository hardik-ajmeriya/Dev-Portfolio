import { forwardRef } from 'react';

/**
 * Shared form primitives.
 *
 * Split out so the Contact section stays readable and so every control gets
 * identical focus, error and accessibility behaviour. Each control is a plain
 * styled element — no state of its own — so react-hook-form stays the single
 * source of truth.
 */

/** Base input styling. Shared so inputs, selects and textareas match exactly. */
export const controlBase =
  'w-full rounded-xl border bg-white px-4 py-3.5 text-[15px] text-ink ' +
  'placeholder:text-muted/60 outline-none ' +
  'transition-[border-color,box-shadow,background-color] duration-300 ease-smooth ' +
  'disabled:cursor-not-allowed disabled:opacity-55';

const stateClasses = (invalid) =>
  invalid
    ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
    : 'border-line hover:border-ink/25 focus:border-ink focus:ring-4 focus:ring-accent/12';

/**
 * Label + hint + error wrapper.
 *
 * Children is a function so the control receives the ids this component
 * generates — that keeps `htmlFor`, `aria-describedby` and `aria-invalid`
 * wired together without the caller repeating itself.
 */
export function Field({ id, label, hint, error, optional, children }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted"
        >
          {label}
        </label>
        {optional || hint ? (
          <span id={hint ? hintId : undefined} className="text-[11px] text-muted/70">
            {hint || 'optional'}
          </span>
        ) : null}
      </div>

      {children({
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': describedBy || undefined,
      })}

      {/* Space is reserved whether or not an error is showing, so validating
          a field never shifts the rest of the form. */}
      <div className="min-h-[20px] pt-1.5">
        {error ? (
          <p id={errorId} role="alert" className="text-[12px] leading-tight text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * All three controls are wrapped in forwardRef.
 *
 * This is REQUIRED, not stylistic: react-hook-form's register() returns a
 * `ref`, and spreading that onto a plain function component silently drops it.
 * The ref never reaches the DOM node, so RHF reads an empty value and every
 * field fails validation even when the user has clearly filled it in.
 */
export const TextInput = forwardRef(function TextInput(
  { invalid, className = '', ...props },
  ref
) {
  return (
    <input ref={ref} {...props} className={`${controlBase} ${stateClasses(invalid)} ${className}`} />
  );
});

export const TextArea = forwardRef(function TextArea({ invalid, className = '', ...props }, ref) {
  return (
    <textarea
      ref={ref}
      {...props}
      className={`${controlBase} ${stateClasses(invalid)} resize-y ${className}`}
    />
  );
});

/**
 * Native select, restyled. Native is deliberate: it gives correct keyboard
 * behaviour and the platform picker on mobile, which a custom dropdown would
 * have to reimplement badly.
 */
export const Select = forwardRef(function Select(
  { invalid, className = '', children, ...props },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        {...props}
        className={`${controlBase} ${stateClasses(invalid)} cursor-pointer appearance-none pr-11 ${className}`}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      >
        <path
          d="M5 7.5 10 12.5 15 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});

/** Submit button with an inline spinner while the request is in flight. */
export function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden
                 rounded-full bg-ink py-[18px] text-sm font-semibold text-paper
                 transition-[background-color,transform] duration-300 ease-smooth
                 hover:bg-accent focus-visible:outline-none focus-visible:ring-4
                 focus-visible:ring-accent/30 active:scale-[0.99]
                 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-ink"
    >
      {loading ? (
        <>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 animate-spin">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          Sending…
        </>
      ) : (
        <>
          {children}
          <span
            aria-hidden="true"
            className="transition-transform duration-300 ease-smooth group-hover:translate-x-1"
          >
            →
          </span>
        </>
      )}
    </button>
  );
}
