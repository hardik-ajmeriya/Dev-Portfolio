import { useState } from 'react';
import { faqs } from '../../data/faq';
import { useRevealGroup } from '../../hooks/useReveal';

/**
 * Accordion FAQ.
 *
 * Every answer stays in the DOM whether or not it is expanded — it is
 * hidden with max-height rather than conditional rendering. That matters:
 * crawlers and language models read the prerendered HTML, so content
 * removed from the DOM when collapsed would be invisible to them.
 */
function Item({ q, a, isOpen, onToggle, index }) {
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;

  return (
    <div className="rv border-b border-line">
      <h3>
        <button
          id={buttonId}
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex w-full items-start justify-between gap-8 py-8 text-left transition-colors duration-300 hover:text-accent"
        >
          <span className="font-display text-[clamp(1.1rem,1.9vw,1.5rem)] font-semibold tracking-[-0.02em]">
            {q}
          </span>
          <span
            aria-hidden="true"
            className={`mt-1 shrink-0 text-2xl leading-none transition-transform duration-400 ease-smooth ${
              isOpen ? 'rotate-45' : ''
            }`}
          >
            +
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-smooth ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="max-w-[720px] pb-8 text-[15px] leading-[1.75] text-muted">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  // First one open by default so the section doesn't read as a wall of headings.
  const [openIndex, setOpenIndex] = useState(0);
  const groupRef = useRevealGroup();

  return (
    <section id="faq" ref={groupRef}>
      <div className="shell">
        <div className="sec-head rv">
          <div>
            <div className="sec-num">06 / QUESTIONS</div>
            <h2 className="sec-title">
              Before you
              <br />
              get in touch
            </h2>
          </div>
          <p className="sec-note">
            The things most people ask before starting a project. If yours isn&rsquo;t here, just
            ask.
          </p>
        </div>

        <div className="pt-6">
          {faqs.map((f, i) => (
            <Item
              key={f.q}
              index={i}
              q={f.q}
              a={f.a}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
