import { useCallback, useRef } from 'react';

/**
 * A textarea with a Markdown formatting toolbar.
 *
 * Deliberately NOT a contenteditable WYSIWYG:
 *  - Web3Forms delivers the enquiry as a plain-text email, so HTML would
 *    arrive as raw tags or be stripped entirely. Markdown arrives readable.
 *  - contenteditable is the buggiest API in the browser across engines.
 *  - A real <textarea> keeps native validation, autofill, mobile keyboards,
 *    screen-reader behaviour and react-hook-form integration for free.
 *
 * This is the same approach GitHub and Linear use for comment boxes.
 */

const WRAP_ACTIONS = {
  bold: { marker: '**', label: 'Bold', shortcut: 'b' },
  italic: { marker: '_', label: 'Italic', shortcut: 'i' },
};

function ToolbarButton({ label, shortcut, onApply, children }) {
  return (
    <button
      type="button" // never "submit" — inside a form this would send it
      // Keeps the textarea's selection alive: focusing the button would
      // otherwise collapse it before the handler runs.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onApply}
      title={shortcut ? `${label} (Ctrl+${shortcut.toUpperCase()})` : label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted
                 transition-colors duration-200
                 hover:bg-ink/[0.06] hover:text-ink
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
                 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export default function RichTextArea({
  id,
  registration, // spread from react-hook-form's register()
  getValue,
  setValue,
  invalid,
  minLength,
  ...textareaProps
}) {
  const localRef = useRef(null);

  // react-hook-form owns a ref too, so merge rather than overwrite.
  const setRefs = useCallback(
    (node) => {
      localRef.current = node;
      if (typeof registration.ref === 'function') registration.ref(node);
    },
    [registration]
  );

  /** Write a new value and restore the caret, keeping RHF in sync. */
  const commit = useCallback(
    (next, selStart, selEnd) => {
      setValue(next);
      requestAnimationFrame(() => {
        const ta = localRef.current;
        if (!ta) return;
        ta.focus();
        ta.setSelectionRange(selStart, selEnd);
      });
    },
    [setValue]
  );

  /** Wrap the selection in a marker, or unwrap it if already wrapped. */
  const applyWrap = useCallback(
    (marker) => {
      const ta = localRef.current;
      if (!ta) return;
      const value = ta.value;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.slice(start, end);
      const len = marker.length;

      const alreadyWrapped =
        value.slice(start - len, start) === marker && value.slice(end, end + len) === marker;

      if (alreadyWrapped) {
        const next = value.slice(0, start - len) + selected + value.slice(end + len);
        commit(next, start - len, end - len);
        return;
      }

      const placeholder = selected || 'text';
      const next = value.slice(0, start) + marker + placeholder + marker + value.slice(end);
      // With no selection, land the caret inside the markers on the word.
      commit(next, start + len, start + len + placeholder.length);
    },
    [commit]
  );

  /**
   * Toggle a list prefix across every line the selection touches.
   * Numbered lists renumber from 1 down the block.
   */
  const applyList = useCallback(
    (kind) => {
      const ta = localRef.current;
      if (!ta) return;
      const value = ta.value;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;

      // expand the selection to whole lines
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineEndRaw = value.indexOf('\n', end);
      const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw;

      const block = value.slice(lineStart, lineEnd);
      const lines = block.split('\n');

      const bulletRe = /^- /;
      const numberRe = /^\d+\. /;
      const allPrefixed = lines.every((l) =>
        kind === 'bullet' ? bulletRe.test(l) : numberRe.test(l)
      );

      const next = lines
        .map((line, i) => {
          const bare = line.replace(bulletRe, '').replace(numberRe, '');
          if (allPrefixed) return bare; // toggle off
          return kind === 'bullet' ? `- ${bare}` : `${i + 1}. ${bare}`;
        })
        .join('\n');

      const updated = value.slice(0, lineStart) + next + value.slice(lineEnd);
      commit(updated, lineStart, lineStart + next.length);
    },
    [commit]
  );

  const onKeyDown = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    const action = Object.values(WRAP_ACTIONS).find((a) => a.shortcut === key);
    if (action) {
      e.preventDefault();
      applyWrap(action.marker);
    }
  };

  const value = getValue() || '';
  const count = value.trim().length;
  const short = minLength && count > 0 && count < minLength;

  const border = invalid
    ? 'border-red-400 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10'
    : 'border-line hover:border-ink/25 focus-within:border-ink focus-within:ring-4 focus-within:ring-accent/12';

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white
                  transition-[border-color,box-shadow] duration-300 ease-smooth ${border}`}
    >
      <div
        role="toolbar"
        aria-label="Text formatting"
        aria-controls={id}
        className="flex items-center gap-0.5 border-b border-line bg-paper/60 px-2 py-1.5"
      >
        <ToolbarButton
          label="Bold"
          shortcut={WRAP_ACTIONS.bold.shortcut}
          onApply={() => applyWrap(WRAP_ACTIONS.bold.marker)}
        >
          <span className="text-[13px] font-bold">B</span>
        </ToolbarButton>

        <ToolbarButton
          label="Italic"
          shortcut={WRAP_ACTIONS.italic.shortcut}
          onApply={() => applyWrap(WRAP_ACTIONS.italic.marker)}
        >
          <span className="font-serif text-[14px] italic">I</span>
        </ToolbarButton>

        <span aria-hidden="true" className="mx-1.5 h-4 w-px bg-line" />

        <ToolbarButton label="Bulleted list" onApply={() => applyList('bullet')}>
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="2.5" cy="4" r="1" fill="currentColor" stroke="none" />
            <circle cx="2.5" cy="8" r="1" fill="currentColor" stroke="none" />
            <circle cx="2.5" cy="12" r="1" fill="currentColor" stroke="none" />
            <path d="M6 4h8M6 8h8M6 12h8" strokeLinecap="round" />
          </svg>
        </ToolbarButton>

        <ToolbarButton label="Numbered list" onApply={() => applyList('number')}>
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <text x="0" y="5.5" fontSize="5" fill="currentColor" stroke="none">1</text>
            <text x="0" y="10" fontSize="5" fill="currentColor" stroke="none">2</text>
            <text x="0" y="14.5" fontSize="5" fill="currentColor" stroke="none">3</text>
            <path d="M6 4h8M6 8.5h8M6 13h8" strokeLinecap="round" />
          </svg>
        </ToolbarButton>

        <span className="ml-auto pr-1 font-mono text-[10px] text-muted/70">Markdown</span>
      </div>

      <textarea
        {...registration}
        {...textareaProps}
        id={id}
        ref={setRefs}
        onKeyDown={onKeyDown}
        className="block w-full resize-y bg-transparent px-4 py-3.5 text-[15px] text-ink
                   outline-none placeholder:text-muted/60"
      />

      <div className="flex items-center justify-between border-t border-line px-4 py-2">
        <span className="text-[11px] text-muted/70">
          Select text, then use the buttons above
        </span>
        <span
          className={`font-mono text-[11px] tabular-nums ${short ? 'text-red-600' : 'text-muted/70'}`}
        >
          {count}
          {minLength ? ` / ${minLength}` : ''}
        </span>
      </div>
    </div>
  );
}
