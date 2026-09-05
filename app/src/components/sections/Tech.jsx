import { useMemo, useState } from 'react';
import { techCategories, technologies } from '../../data/tech';
import { useRevealGroup } from '../../hooks/useReveal';

const initials = (name) =>
  name
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

function TechCell({ item, index }) {
  const [failed, setFailed] = useState(false);
  const showFallback = !item.icon || failed;

  return (
    <div
      style={{ animationDelay: `${Math.min(index * 22, 420)}ms` }}
      className="group flex animate-cellIn flex-col items-center gap-[15px] border-b border-r
                 border-line px-[18px] py-[34px] transition-colors duration-300 hover:bg-paperAlt"
    >
      {showFallback ? (
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink font-mono text-xs
                     font-medium text-paper opacity-50 transition-all duration-400
                     group-hover:-translate-y-[5px] group-hover:bg-accent group-hover:opacity-100"
        >
          {item.fallback || initials(item.name)}
        </div>
      ) : (
        <img
          src={item.icon}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-9 w-9 object-contain opacity-50 grayscale transition-all duration-400 ease-smooth
                     group-hover:-translate-y-[5px] group-hover:scale-[1.08] group-hover:opacity-100
                     group-hover:grayscale-0"
        />
      )}
      <div className="text-center text-[12.5px] text-muted transition-colors duration-300 group-hover:text-ink">
        {item.name}
      </div>
    </div>
  );
}

export default function Tech() {
  const [active, setActive] = useState('all');
  const groupRef = useRevealGroup();

  const visible = useMemo(
    () => (active === 'all' ? technologies : technologies.filter((t) => t.cat === active)),
    [active]
  );

  return (
    <section id="tech" ref={groupRef}>
      <div className="shell">
        <div className="sec-head rv">
          <div>
            <div className="sec-num">03 / TECHNOLOGY</div>
            <h2 className="sec-title">
              What I
              <br />
              work with
            </h2>
          </div>
          <p className="sec-note">
            The stack I use day to day, across the application layer and the infrastructure
            underneath it.
          </p>
        </div>

        <div className="pt-14">
          <div className="rv flex flex-wrap gap-2.5 pb-11">
            {techCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                aria-pressed={active === c.id}
                className={`rounded-full border px-5 py-[11px] font-mono text-[11.5px] uppercase
                            tracking-[0.06em] transition duration-300 ${
                              active === c.id
                                ? 'border-ink bg-ink text-paper'
                                : 'border-line text-muted hover:border-ink hover:text-ink'
                            }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div
            className="rv grid border-l border-t border-line
                       [grid-template-columns:repeat(auto-fill,minmax(148px,1fr))]"
          >
            {visible.map((item, i) => (
              <TechCell key={`${active}-${item.name}`} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
