import { useEffect, useRef } from 'react';
import { projects } from '../../data/projects';
import { useRevealGroup } from '../../hooks/useReveal';
import Magnetic from '../Magnetic';

/** A browser-chrome mockup that tilts in 3D toward the cursor. */
function TiltWindow({ image, browser, title }) {
  const stageRef = useRef(null);
  const winRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const win = winRef.current;
    if (!stage || !win) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      win.style.transform = 'rotateY(-9deg) rotateX(4deg)';
      return undefined;
    }

    const REST_X = -9;
    const REST_Y = 4;
    let targetX = REST_X;
    let targetY = REST_Y;
    let curX = REST_X;
    let curY = REST_Y;
    let hovering = false;
    let frame;

    const onMove = (e) => {
      const rect = stage.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * -26;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 16;
      hovering = true;
    };
    const onLeave = () => {
      hovering = false;
    };

    const tick = () => {
      if (!hovering) {
        targetX += (REST_X - targetX) * 0.05;
        targetY += (REST_Y - targetY) * 0.05;
      }
      curX += (targetX - curX) * 0.09;
      curY += (targetY - curY) * 0.09;
      win.style.transform = `rotateY(${curX}deg) rotateX(${curY}deg)`;
      frame = requestAnimationFrame(tick);
    };

    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('mouseleave', onLeave);
    tick();

    return () => {
      stage.removeEventListener('mousemove', onMove);
      stage.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={stageRef} className="rv [perspective:1600px]">
      <div
        ref={winRef}
        data-cursor-grow
        className="overflow-hidden rounded-[14px] border border-ink/10 bg-white
                   shadow-[0_2px_4px_rgba(11,11,13,0.04),0_12px_24px_rgba(11,11,13,0.06),0_44px_80px_-20px_rgba(11,11,13,0.22)]
                   transition-shadow duration-500 [transform-style:preserve-3d] will-change-transform
                   hover:shadow-[0_2px_4px_rgba(11,11,13,0.04),0_18px_34px_rgba(61,46,245,0.10),0_60px_110px_-22px_rgba(61,46,245,0.30)]"
      >
        <div className="flex items-center gap-2 border-b border-ink/[0.07] bg-[#fbfbfa] px-4 py-[13px]">
          <span className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
          <span className="h-[10px] w-[10px] rounded-full bg-[#febc2e]" />
          <span className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
          <div className="ml-[10px] flex h-[22px] flex-1 items-center overflow-hidden rounded-md bg-[#f0f0ed] px-[11px] font-mono text-[10px] text-[#9a9aa2]">
            {browser}
          </div>
        </div>
        <img
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          className="block aspect-[16/10] w-full bg-[#eee] object-cover object-top"
        />
      </div>
    </div>
  );
}

export default function Work() {
  const groupRef = useRevealGroup();

  return (
    <section id="work" ref={groupRef}>
      <div className="shell">
        <div className="sec-head rv">
          <div>
            <div className="sec-num">01 / SELECTED WORK</div>
            <h2 className="sec-title">
              Things I&rsquo;ve
              <br />
              shipped
            </h2>
          </div>
          <p className="sec-note">
            Projects built end-to-end — application code, infrastructure and deployment. Hover a
            screen to look around it.
          </p>
        </div>

        {projects.map((p, i) => (
          <article
            key={p.id}
            className="grid grid-cols-1 items-center gap-11 border-b border-line py-28 lg:grid-cols-[1fr_1.25fr] lg:gap-20"
          >
            <div className={`rv ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
              <div className="mb-6 font-mono text-[12px] tracking-[0.1em] text-muted">
                PROJECT {String(i + 1).padStart(2, '0')}
              </div>

              <h3 className="display mb-6 text-[clamp(1.9rem,3.4vw,3.1rem)]">{p.title}</h3>

              <p className="mb-7 max-w-[460px] text-base leading-[1.7] text-muted">
                {p.description}
              </p>

              <div className="mb-8 flex flex-wrap gap-2">
                {p.tech.map((t) => (
                  <span key={t} className="pill">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3.5">
                {p.githubUrl ? (
                  <Magnetic strength={0.15}>
                    <a
                      href={p.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-line px-[22px] py-[13px]
                                 text-[13px] font-semibold no-underline transition duration-300
                                 hover:border-ink hover:bg-ink hover:text-paper"
                    >
                      Source code →
                    </a>
                  </Magnetic>
                ) : null}

                {p.liveUrl ? (
                  <Magnetic strength={0.15}>
                    <a
                      href={p.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-[22px] py-[13px]
                                 text-[13px] font-semibold text-paper no-underline
                                 transition duration-300 hover:bg-accent"
                    >
                      Visit live site →
                    </a>
                  </Magnetic>
                ) : (
                  <span
                    className="inline-flex cursor-default items-center gap-2 rounded-full border border-line
                               px-[22px] py-[13px] text-[13px] font-semibold text-muted opacity-40"
                    title="Not deployed yet"
                  >
                    Live site — add URL
                  </span>
                )}

                {p.status === 'In development' ? (
                  <span className="inline-flex items-center gap-2 font-mono text-[11px] text-accent2">
                    <span className="h-[7px] w-[7px] animate-pulseDot rounded-full bg-accent2" />
                    In active development
                  </span>
                ) : null}
              </div>
            </div>

            <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
              <TiltWindow image={p.image} browser={p.browser} title={p.title} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
