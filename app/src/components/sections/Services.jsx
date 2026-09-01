import { services } from '../../data/services';
import { useRevealGroup } from '../../hooks/useReveal';

export default function Services() {
  const groupRef = useRevealGroup();

  return (
    <section id="services" ref={groupRef}>
      <div className="shell">
        <div className="sec-head rv">
          <div>
            <div className="sec-num">02 / SERVICES</div>
            <h2 className="sec-title">
              What I
              <br />
              provide
            </h2>
          </div>
          <p className="sec-note">
            Most developers hand you a repository. I hand you a running application with the
            infrastructure behind it, and stay on to keep it running.
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        {services.map((s) => (
          <div
            key={s.code}
            className="rv group grid grid-cols-1 items-start gap-4 border-b border-line px-6 py-10
                       transition-colors duration-500 hover:bg-paperAlt
                       md:grid-cols-[76px_1.05fr_1.15fr_54px] md:gap-10 md:px-10 md:py-12"
          >
            <div className="pt-2 font-mono text-[12px] tracking-[0.1em] text-accent">{s.code}</div>

            <h3 className="font-display text-[clamp(1.4rem,2.5vw,2.15rem)] font-semibold leading-[1.15] tracking-[-0.03em]">
              {s.title.split('\n').map((part, i) => (
                <span key={part} className="block">
                  {i > 0 ? part : part}
                </span>
              ))}
            </h3>

            <div>
              <p className="mb-[18px] text-[15px] leading-[1.72] text-muted">{s.description}</p>

              <div className="flex flex-wrap gap-[7px]">
                {s.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-line bg-paper px-[11px] py-1.5 font-mono text-[10.5px] text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {s.price ? (
                <div className="mt-4 font-mono text-[12px] text-ink">{s.price}</div>
              ) : null}
            </div>

            <div
              aria-hidden="true"
              className="hidden justify-self-end pt-2 text-xl text-muted opacity-0 transition-all
                         duration-400 group-hover:translate-x-0 group-hover:text-accent
                         group-hover:opacity-100 md:block md:-translate-x-2.5"
            >
              →
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
