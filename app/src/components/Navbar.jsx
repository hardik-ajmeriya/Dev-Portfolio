import { useEffect, useState } from 'react';

const links = [
  { href: '#work', label: 'Work' },
  { href: '#services', label: 'Services' },
  { href: '#tech', label: 'Tech' },
  { href: '#process', label: 'Process' },
  { href: '#about', label: 'About' },
  { href: '#faq', label: 'FAQ' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  // Solid bar once the page has scrolled. The old transparent mix-blend-difference
  // bar let section headings show through the logo ("Project index" under
  // "Hardik Ajmeriya"); a real background keeps the nav readable on any section.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Escape closes the menu. Expected of anything that covers the screen, and
  // without it a keyboard user who opened the menu had no way to dismiss it
  // except finding the toggle again.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b text-ink transition-[background-color,border-color] duration-300 ${
          scrolled || open ? 'border-line bg-paper' : 'border-transparent bg-transparent'
        }`}
      >
        <div
          className={`mx-auto flex max-w-shell items-center justify-between px-6 transition-[padding] duration-300 md:px-10 ${
            scrolled ? 'py-4' : 'py-6'
          }`}
        >
          <a href="#top" className="font-display text-[19px] font-extrabold tracking-[-0.03em]">
            Hardik Ajmeriya
          </a>

          <div className="hidden gap-9 md:flex">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-[13px] font-medium tracking-[0.02em] transition-colors hover:text-accent">
                {l.label}
              </a>
            ))}
          </div>

          <a href="#contact" className="hidden text-[13px] font-medium transition-colors hover:text-accent md:block">
            Start a project →
          </a>

          {/* The visible bars stay 28x24, but the button itself is 44x44 —
              the minimum comfortable touch target (WCAG 2.5.8 / Lighthouse
              tap-target audit). -mr-2.5 keeps the bars optically aligned with
              the edge despite the extra padding. */}
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="-mr-2.5 flex h-11 w-11 flex-col items-center justify-center gap-[5px] md:hidden"
          >
            <span
              className={`block h-[1.5px] w-7 bg-ink transition-transform duration-300 ${
                open ? 'translate-y-[6.5px] rotate-45' : ''
              }`}
            />
            <span
              className={`block h-[1.5px] w-7 bg-ink transition-opacity duration-300 ${
                open ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-[1.5px] w-7 bg-ink transition-transform duration-300 ${
                open ? '-translate-y-[6.5px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 bg-paper transition-[opacity,visibility] duration-500 md:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className="flex h-full flex-col justify-center gap-2 px-8">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${100 + i * 60}ms` : '0ms' }}
              className={`display text-[2.6rem] transition-all duration-500 ease-smooth ${
                open ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
              }`}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            style={{ transitionDelay: open ? '400ms' : '0ms' }}
            className={`display mt-4 text-[2.6rem] text-accent transition-all duration-500 ease-smooth ${
              open ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
            }`}
          >
            Contact
          </a>
        </div>
      </div>
    </>
  );
}
