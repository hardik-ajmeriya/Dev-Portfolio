import { processSteps } from '../../data/services';
import { useRevealGroup } from '../../hooks/useReveal';

export default function Process() {
  const groupRef = useRevealGroup();

  return (
    <section id="process" ref={groupRef}>
      <div className="shell">
        <div className="grid grid-cols-1 gap-10 py-28 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="rv self-start lg:sticky lg:top-32">
            <div className="sec-num">04 / PROCESS</div>
            <h2 className="display mt-4 text-[clamp(2.2rem,4.4vw,4rem)]">
              How we&rsquo;d
              <br />
              work
            </h2>
            <p className="sec-note mt-7">
              Four steps, fixed scope, no surprise invoices. You always know what stage we&rsquo;re
              at.
            </p>
          </div>

          <div>
            {processSteps.map((s) => (
              <div
                key={s.n}
                className="rv grid grid-cols-[52px_1fr] gap-6 border-b border-line py-12 md:grid-cols-[70px_1fr] md:py-14"
              >
                <div className="pt-[7px] font-mono text-[12px] tracking-[0.1em] text-accent">
                  {s.n}
                </div>
                <div>
                  <h3 className="mb-3 font-display text-2xl font-semibold tracking-[-0.02em]">
                    {s.title}
                  </h3>
                  <p className="text-[15px] leading-[1.7] text-muted">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
