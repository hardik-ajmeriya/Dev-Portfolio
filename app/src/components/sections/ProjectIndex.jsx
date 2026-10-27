import { useEffect, useRef, useState } from 'react';
import { projectImages } from '../../data/projects';

const FILTERS = ['All', 'Websites', 'Full-stack', 'DevOps'];

/** "VARAKH — Indian Sweets Brand Landing Page" -> ["VARAKH", "Indian Sweets Brand Landing Page"] */
function splitTitle(title) {
  const [name, ...rest] = title.split(' — ');
  return [name, rest.join(' — ')];
}

/**
 * Screenshot that trails the cursor while a row is hovered (mouse/trackpad only).
 * One fixed element for the whole list, eased with a single rAF loop that only
 * runs while something is hovered, so an idle page costs nothing.
 */
function HoverPreview({ project, visible }) {
  const ref = useRef(null);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || !visible) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame;
    const onMove = (e) => {
      pos.current.tx = e.clientX + 28;
      pos.current.ty = e.clientY - 120;
    };
    const tick = () => {
      const p = pos.current;
      const k = reduce ? 1 : 0.18;
      p.x += (p.tx - p.x) * k;
      p.y += (p.ty - p.y) * k;
      // keep the card on screen
      const x = Math.min(p.x, window.innerWidth - 380);
      el.style.transform = `translate3d(${x}px, ${p.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove);
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, [visible]);

  const img = project ? projectImages(project)[0] : null;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-50 hidden w-[340px] overflow-hidden rounded-xl border border-ink/10 bg-white
                  shadow-[0_24px_60px_-18px_rgba(11,11,13,0.35)] transition-opacity duration-200 [@media(hover:hover)_and_(pointer:fine)]:block ${
                    visible ? 'opacity-100' : 'opacity-0'
                  }`}
    >
      {img ? (
        <img src={img.src} alt="" width={1536} height={1024} className="block aspect-[3/2] w-full object-cover object-top" />
      ) : null}
    </div>
  );
}

function Links({ p }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {p.liveUrl ? (
        <a
          href={p.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[13px] font-semibold text-paper no-underline transition duration-300 hover:bg-accent"
        >
          Visit live site →
        </a>
      ) : null}
      {p.githubUrl ? (
        <a
          href={p.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-[13px] font-semibold no-underline transition duration-300 hover:border-ink hover:bg-ink hover:text-paper"
        >
          Source code →
        </a>
      ) : null}
      {p.status === 'In development' ? (
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-accent2Text">
          <span aria-hidden="true" className="h-[7px] w-[7px] animate-pulseDot rounded-full bg-accent2" />
          In active development
        </span>
      ) : null}
    </div>
  );
}

/**
 * Compact list of the non-featured projects: filter tabs, one row per project.
 * Hover a row (desktop) for a floating screenshot; click / tap / Enter to open
 * the full details inline. Only one row is open at a time.
 */
export default function ProjectIndex({ items, startAt = 1 }) {
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState(null);
  const [hovered, setHovered] = useState(null);

  const counts = Object.fromEntries(
    FILTERS.map((f) => [f, f === 'All' ? items.length : items.filter((p) => p.category === f).length])
  );
  const shown = filter === 'All' ? items : items.filter((p) => p.category === filter);

  return (
    <div className="pt-24">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ink pb-5">
        <div>
          <div className="font-mono text-[12px] tracking-[0.1em] text-muted">MORE PROJECTS</div>
          <h3 className="display mt-3 text-[clamp(1.6rem,2.6vw,2.4rem)]">Project index</h3>
        </div>
        <div role="group" aria-label="Filter projects" className="flex flex-wrap gap-2">
          {FILTERS.filter((f) => counts[f] > 0).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => {
                setFilter(f);
                setOpen(null);
              }}
              className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition duration-300 ${
                filter === f ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'
              }`}
            >
              {f} <span className="ml-1 font-mono text-[11px] opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      <ul onPointerLeave={() => setHovered(null)}>
        {shown.map((p) => {
          const n = items.indexOf(p) + startAt;
          const [name, sub] = splitTitle(p.title);
          const isOpen = open === p.id;
          const img = projectImages(p)[0];
          return (
            <li key={p.id} className="border-b border-line">
              <h4>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`pi-${p.id}`}
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(p.id)}
                  className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 py-6 text-left
                             sm:grid-cols-[3rem_minmax(0,1.1fr)_minmax(0,1fr)_auto] lg:grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1fr)_9rem_auto]"
                >
                  <span className="font-mono text-[12px] text-muted">{String(n).padStart(2, '0')}</span>
                  <span className="display text-[clamp(1.25rem,2.2vw,1.9rem)] transition-transform duration-500 ease-smooth group-hover:translate-x-2">
                    {name}
                  </span>
                  <span className="hidden truncate text-[15px] text-muted sm:block">{sub}</span>
                  <span className="hidden font-mono text-[11px] uppercase tracking-[0.06em] text-muted lg:block">
                    {p.category}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 items-center justify-center rounded-full border border-line text-[15px] transition duration-300
                                group-hover:border-ink ${isOpen ? 'rotate-45 border-ink bg-ink text-paper' : ''}`}
                  >
                    +
                  </span>
                </button>
              </h4>

              {/* grid-rows 0fr -> 1fr animates to the panel's real height without measuring it */}
              <div
                id={`pi-${p.id}`}
                role="region"
                aria-label={`${name} details`}
                className={`grid transition-[grid-template-rows] duration-500 ease-smooth motion-reduce:transition-none ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden" inert={isOpen ? undefined : ''}>
                  <div className="grid gap-8 pb-10 pt-2 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
                    {img ? (
                      <img
                        src={img.src}
                        alt={img.caption ? `${p.title} — ${img.caption}` : `${p.title} — project screenshot`}
                        loading="lazy"
                        decoding="async"
                        width={1536}
                        height={1024}
                        className="aspect-[3/2] w-full rounded-xl border border-ink/10 bg-[#eee] object-cover object-top"
                      />
                    ) : null}
                    <div className="lg:pt-2">
                      <p className="max-w-[460px] text-base leading-[1.7] text-muted">{p.description}</p>
                      <div className="my-7 flex flex-wrap gap-2">
                        {p.tech.map((t) => (
                          <span key={t} className="pill">
                            {t}
                          </span>
                        ))}
                      </div>
                      <Links p={p} />
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <HoverPreview project={items.find((p) => p.id === hovered)} visible={hovered !== null && open !== hovered} />
    </div>
  );
}
