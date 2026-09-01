import { useEffect, useState } from 'react';

const links = [
  { href: '#work', label: 'Work' },
  { href: '#services', label: 'Services' },
  { href: '#tech', label: 'Tech' },
  { href: '#process', label: 'Process' },
  { href: '#about', label: 'About' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 text-white mix-blend-difference">
        <div className="mx-auto flex max-w-shell items-center justify-between px-6 py-6 md:px-10">
          <a href="#top" className="font-display text-[19px] font-extrabold tracking-[-0.03em]">
            Hardik
          </a>

          <div className="hidden gap-9 md:flex">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-[13px] font-medium tracking-[0.02em]">
                {l.label}
              </a>
            ))}
          </div>

          <a href="#contact" className="hidden text-[13px] font-medium md:block">
            Start a project →
          </a>

          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-6 w-7 flex-col justify-center gap-[5px] md:hidden"
          >
            <span
              className={`block h-[1.5px] w-full bg-white transition-transform duration-300 ${
                open ? 'translate-y-[6.5px] rotate-45' : ''
              }`}
            />
            <span
              className={`block h-[1.5px] w-full bg-white transition-opacity duration-300 ${
                open ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-[1.5px] w-full bg-white transition-transform duration-300 ${
                open ? '-translate-y-[6.5px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
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
