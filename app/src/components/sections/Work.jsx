import { useEffect, useRef, useState } from 'react';
import { projects, projectImages } from '../../data/projects';
import { useRevealGroup } from '../../hooks/useReveal';
import Magnetic from '../Magnetic';
import ProjectIndex from './ProjectIndex';

/**
 * THE SCREENSHOT GALLERY
 * ---------------------------------------------------------------
 * A project with more than one screenshot crossfades through them on its
 * own, and the thumbnail of the shot currently showing fills with a hairline
 * that says when the next one is due.
 *
 * WHY A CROSSFADE AND NOT A SLIDE
 *
 *   - The frame is already moving. It tilts in 3D toward the cursor, and a
 *     horizontal slide is a second motion on a different axis at the same
 *     time, which reads as busy rather than as one deliberate thing.
 *   - Every shot in a set is the same application. A dissolve reads as the
 *     interface changing screens; a slide reads as unrelated pictures being
 *     dealt out of a tray.
 *   - The frame has a fixed address bar. Content sliding along behind a
 *     window that is itself standing still looks wrong, and clipping it
 *     would fight the parent's perspective.
 *
 * WHY THE MOVEMENT IS A SCALE AND NOT A LIFT
 *
 * Halfway through a crossfade both shots are half-transparent at once. Two
 * near-identical dashboards offset by even a few pixels show that as a
 * visible double image of every line of UI text. A 1.2% scale keeps the
 * centre of the frame registered and only softens the edges. The caption
 * does the vertical lift instead: it is one short line, so it stays crisp.
 *
 * WHY AUTOPLAY IS EASY TO STOP
 *
 * Moving content that cannot be stopped is an accessibility failure and an
 * irritation, so it gives way to the visitor at the first sign of interest:
 *
 *   - pointer anywhere over the gallery pauses it. This one matters most
 *     here, because hovering is also how the frame tilts: a screenshot must
 *     never change under someone who is leaning in to look at it.
 *   - clicking a thumbnail ends it for the rest of the visit. They are
 *     driving now, and nothing should take the wheel back.
 *   - it never runs while the card is off screen. Three featured projects
 *     would otherwise all be cycling at once in a tab nobody is reading.
 *   - prefers-reduced-motion switches it off completely.
 */
function useGallery(count) {
  const rootRef = useRef(null);
  const [active, setActive] = useState(0);
  const [takenOver, setTakenOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Read as state rather than at render time: this component is prerendered
  // to static HTML on the server, where matchMedia does not exist, and the
  // first client render has to produce the same markup to hydrate cleanly.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return {
    rootRef,
    active,
    paused,
    autoplay: count > 1 && !takenOver && !reduced && onScreen,
    advance: () => setActive((i) => (i + 1) % count),
    select: (i) => {
      setActive(i);
      setTakenOver(true);
    },
    /* Pointer type is checked because a tap on a touch screen also fires
       pointerenter, and there is no matching leave — autoplay would pause
       on first touch and never resume. */
    pauseProps: {
      onPointerEnter: (e) => e.pointerType === 'mouse' && setPaused(true),
      onPointerLeave: () => setPaused(false),
      onFocusCapture: () => setPaused(true),
      onBlurCapture: () => setPaused(false),
    },
  };
}

/**
 * The screenshots themselves: all of them stacked in one box, with the
 * current one faded up over the rest.
 *
 * Every shot is in the DOM rather than swapped into a single <img>, because
 * a crossfade needs both frames on screen at once, and because the browser
 * has already downloaded all of them for the thumbnail strip below — the
 * strip points at these same files. The wrapper owns the 3:2 box, so the
 * stack reserves its space before any file arrives and nothing shifts.
 */
function Shots({ images, active, title, className = '' }) {
  return (
    <div className={`relative aspect-[3/2] w-full overflow-hidden bg-[#eee] ${className}`}>
      {images.map((img, i) => {
        const shown = i === active;
        return (
          <img
            key={img.src}
            src={img.src}
            /* Only the visible shot carries a description. With all seven
               described, a screen reader would read out the whole set as if
               they were seven separate pictures on the page. */
            alt={
              shown
                ? img.caption
                  ? `${title} — ${img.caption}`
                  : `${title} — project screenshot`
                : ''
            }
            aria-hidden={shown ? undefined : 'true'}
            loading="lazy"
            decoding="async"
            width={1536}
            height={1024}
            className={`gallery-shot absolute inset-0 h-full w-full object-cover object-top
                        ${shown ? 'scale-100 opacity-100' : 'scale-[1.012] opacity-0'}`}
          />
        );
      })}
    </div>
  );
}

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
function Thumbnails({ images, active, onSelect, title, autoplay, paused, onAdvance }) {
  if (images.length < 2) return null;

  return (
    <div role="group" aria-label={`${title} — screenshots`} className="mt-4 flex flex-wrap gap-2.5">
      {images.map((img, i) => {
        const label = img.caption || `Screenshot ${i + 1} of ${images.length}`;
        const isActive = i === active;
        return (
          <button
            key={img.src}
            type="button"
            onClick={() => onSelect(i)}
            aria-current={isActive ? 'true' : undefined}
            aria-label={isActive ? `${label} — currently shown` : `Show ${label}`}
            /* w-[78px] gives a 78x52 target: comfortably over the 44px
               minimum on its short edge once the ring offset is counted. */
            className={`relative w-[78px] shrink-0 overflow-hidden rounded-md border transition
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

            {/* The countdown to the next shot, and the clock that drives it.
                There is no timer in JavaScript: the bar's own animationend
                is what advances the gallery, so the two can never drift, and
                pausing the animation pauses the gallery with it — the bar
                simply stops where it is. It is not rendered at all when
                autoplay is off, which also keeps it away from the global
                prefers-reduced-motion rule that collapses every animation to
                0.01ms: that would fire animationend immediately, over and
                over, and spin the gallery. */}
            {isActive && autoplay ? (
              <span
                aria-hidden="true"
                onAnimationEnd={onAdvance}
                /* Accent rather than ink: the active thumbnail already has an
                   ink border, and a 2px ink bar sitting on top of it just
                   looks like the border got thicker on one side. */
                className={`animate-thumbProgress absolute inset-x-0 bottom-0 h-[2px] origin-left
                            bg-accent ${paused ? '[animation-play-state:paused]' : ''}`}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The caption for whichever screenshot is showing. Hidden when there is only
 * one. Re-keyed on every change so it fades and lifts back in rather than
 * flicking from one string to another — this is where the gallery's vertical
 * movement lives, since the screenshots themselves cannot afford any.
 *
 * The counter stays even for an image with no caption text, so the line
 * never disappears and pulls the thumbnails up with it.
 */
function Caption({ images, active }) {
  if (images.length < 2) return null;
  const text = images[active]?.caption;

  return (
    <p
      key={active}
      className="animate-captionIn mt-3 font-mono text-[11px] tracking-[0.06em] text-muted"
    >
      {String(active + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
      {text ? <>&nbsp;·&nbsp; {text}</> : null}
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
  const g = useGallery(images.length);

  return (
    <div ref={g.rootRef} className="rv" {...g.pauseProps}>
      <Shots
        images={images}
        active={g.active}
        title={title}
        className="rounded-xl transition-transform duration-700 ease-smooth hover:-translate-y-2"
      />
      <Caption images={images} active={g.active} />
      <Thumbnails
        images={images}
        active={g.active}
        onSelect={g.select}
        title={title}
        autoplay={g.autoplay}
        paused={g.paused}
        onAdvance={g.advance}
      />
    </div>
  );
}

/** A browser-chrome mockup that tilts in 3D toward the cursor. */
function TiltWindow({ images, browser, title }) {
  const g = useGallery(images.length);
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
    <div ref={g.rootRef} className="rv" {...g.pauseProps}>
      {/* The tilt stage is only the window. It used to be this whole block,
          which meant aiming at a thumbnail swung the big frame around as the
          pointer travelled down to it. */}
      <div ref={stageRef} className="[perspective:1600px]">
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

          {/* aspect-[3/2] matches the source files exactly (1536x1024). The
              frame was 16/10 before, so object-cover was silently cropping a
              strip off the bottom of every screenshot.
              It is also why every screenshot in a set must share this ratio:
              a mismatched one would make the frame resize as it crossfades. */}
          <Shots images={images} active={g.active} title={title} />
        </div>
      </div>

      {/* Outside the tilting element on purpose. Thumbnails that rotate with
          the frame are unpleasant to aim at, and the rotation would fight the
          pointer on the way to a 78px target. */}
      <Caption images={images} active={g.active} />
      <Thumbnails
        images={images}
        active={g.active}
        onSelect={g.select}
        title={title}
        autoplay={g.autoplay}
        paused={g.paused}
        onAdvance={g.advance}
      />
    </div>
  );
}

export default function Work() {
  const groupRef = useRevealGroup();
  // Featured projects get the full showcase; everything else goes in the compact index.
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

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
            Three featured builds, then the full index. Hover a screen to look around it, or open
            any project in the list for details.
          </p>
        </div>

        {featured.map((p, i) => (
          <article
            key={p.id}
            className="grid grid-cols-1 items-center gap-11 border-b border-line py-20 lg:grid-cols-[1fr_1.25fr] lg:gap-20"
          >
            <div className={`rv ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
              <div className="mb-6 font-mono text-[12px] tracking-[0.1em] text-muted">
                FEATURED {String(i + 1).padStart(2, '0')}
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

        <ProjectIndex items={rest} startAt={featured.length + 1} />
      </div>
    </section>
  );
}
