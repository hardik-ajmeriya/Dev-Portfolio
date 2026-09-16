import { useEffect, useRef, useState } from 'react';
import { projects, projectImages } from '../../data/projects';
import { useRevealGroup } from '../../hooks/useReveal';
import Magnetic from '../Magnetic';

/**
 * Thumbnail strip under a project's screenshot.
 *
 * Renders NOTHING for a project with a single image, so a card with one
 * screenshot looks exactly as it always did — no empty row, no stray border.
 *
 * Plain <button> elements rather than a custom widget: buttons are focusable,
 * activate on Enter and Space, and are announced correctly, all for free. A
 * div with an onClick would need every one of those rebuilt by hand and would
 * get at least one of them wrong.
 */
function Thumbnails({ images, active, onSelect, title }) {
  if (images.length < 2) return null;

  return (
    <div
      role="group"
      aria-label={`${title} — screenshots`}
      className="mt-4 flex flex-wrap gap-2.5"
    >
      {images.map((img, i) => {
        const label = img.caption || `Screenshot ${i + 1} of ${images.length}`;
        const isActive = i === active;
        return (
          <button
            key={img.src}
            type="button"
            onClick={() => onSelect(i)}
            /* Start fetching the full-size file the moment the pointer or
               focus lands, so the swap is instant rather than a flash of the
               previous image while the new one downloads. */
            onMouseEnter={() => {
              const pre = new Image();
              pre.src = img.src;
            }}
            onFocus={() => {
              const pre = new Image();
              pre.src = img.src;
            }}
            aria-current={isActive ? 'true' : undefined}
            aria-label={isActive ? `${label} — currently shown` : `Show ${label}`}
            /* w-[78px] gives a 78x52 target: comfortably over the 44px
               minimum on its short edge once the ring offset is counted. */
            className={`w-[78px] shrink-0 overflow-hidden rounded-md border transition
                        duration-300 ease-smooth ${
                          isActive
                            ? 'border-ink opacity-100'
                            : 'border-line opacity-55 hover:border-ink/40 hover:opacity-100'
                        }`}
          >
            <img
              src={img.src}
              alt=""
              loading="lazy"
              decoding="async"
              width={1536}
              height={1024}
              className="block aspect-[3/2] w-full bg-[#eee] object-cover object-top"
            />
          </button>
        );
      })}
    </div>
  );
}

/** The caption for whichever screenshot is showing. Hidden when there is only one. */
function Caption({ images, active }) {
  const text = images[active]?.caption;
  if (images.length < 2 || !text) return null;
  return (
    <p className="mt-3 font-mono text-[11px] tracking-[0.06em] text-muted">
      {String(active + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')} &nbsp;·&nbsp; {text}
    </p>
  );
}

/**
 * For images that are already finished presentation mockups — they carry
 * their own browser chrome, perspective and background, so wrapping them in
 * another frame would nest a browser inside a browser. Shown as-is, with a
 * soft lift on hover.
 */
function PresentationShot({ images, title }) {
  const [active, setActive] = useState(0);
  const current = images[active] || images[0];

  return (
    <div className="rv">
      <img
        src={current.src}
        alt={
          current.caption
            ? `${title} — ${current.caption}`
            : `${title} — project screenshot`
        }
        loading="lazy"
        decoding="async"
        /* Intrinsic dimensions let the browser reserve the right box before
           the file arrives. Without them this image pushed the rest of the
           page down as it loaded — a Cumulative Layout Shift the lazy
           loading made more likely, not less. All project shots are 1536x1024. */
        width={1536}
        height={1024}
        data-cursor-grow
        className="aspect-[3/2] w-full rounded-xl object-cover transition-transform duration-700 ease-smooth hover:-translate-y-2"
      />
      <Caption images={images} active={active} />
      <Thumbnails images={images} active={active} onSelect={setActive} title={title} />
    </div>
  );
}

/** A browser-chrome mockup that tilts in 3D toward the cursor. */
function TiltWindow({ images, browser, title }) {
  const [active, setActive] = useState(0);
  const current = images[active] || images[0];
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

    // Only run the loop while the card is actually on screen. Previously every
    // project kept its own requestAnimationFrame running for the entire visit,
    // whether or not it was visible or hovered — four permanent loops writing
    // transforms to elements nobody was looking at, which is main-thread time
    // (Total Blocking Time) and battery for no benefit.
    let running = false;
    const start = () => {
      if (running) return;
      running = true;
      tick();
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const visObserver = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 }
    );
    visObserver.observe(stage);

    return () => {
      stage.removeEventListener('mousemove', onMove);
      stage.removeEventListener('mouseleave', onLeave);
      visObserver.disconnect();
      stop();
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
          <div className="ml-[10px] flex h-[22px] flex-1 items-center overflow-hidden rounded-md bg-[#f0f0ed] px-[11px] font-mono text-[10px] text-chrome">
            {browser}
          </div>
        </div>
        <img
          src={current.src}
          alt={
            current.caption
              ? `${title} — ${current.caption}`
              : `${title} — project screenshot`
          }
          loading="lazy"
          decoding="async"
          width={1536}
          height={1024}
          /* aspect-[3/2] matches the source files exactly (1536x1024). The
             frame was 16/10 before, so object-cover was silently cropping a
             strip off the bottom of every screenshot.
             It is also why every screenshot in a set must share this ratio:
             a mismatched one would make the frame resize as you click. */
          className="block aspect-[3/2] w-full bg-[#eee] object-cover object-top"
        />
      </div>

      {/* Outside the tilting element on purpose. Thumbnails that rotate with
          the frame are unpleasant to aim at, and the rotation would fight the
          pointer on the way to a 78px target. */}
      <Caption images={images} active={active} />
      <Thumbnails images={images} active={active} onSelect={setActive} title={title} />
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
                  /* The "add URL" placeholder is a note to self, so it is
                     shown ONLY in development. It was previously rendered in
                     production too: a prospective client saw the words
                     "Live site — add URL" on all four projects, which reads
                     as an unfinished site rather than a deliberate one. */
                  import.meta.env.DEV && (
                    <span
                      className="inline-flex cursor-default items-center gap-2 rounded-full border border-dashed
                                 border-accent px-[22px] py-[13px] text-[13px] font-semibold text-accent"
                      title="Dev-only reminder — not rendered in production"
                    >
                      DEV: add liveUrl
                    </span>
                  )
                )}

                {p.status === 'In development' ? (
                  <span className="inline-flex items-center gap-2 font-mono text-[11px] text-accent2Text">
                    <span aria-hidden="true" className="h-[7px] w-[7px] animate-pulseDot rounded-full bg-accent2" />
                    In active development
                  </span>
                ) : null}
              </div>
            </div>

            <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
              {p.presentation ? (
                <PresentationShot images={projectImages(p)} title={p.title} />
              ) : (
                <TiltWindow images={projectImages(p)} browser={p.browser} title={p.title} />
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
