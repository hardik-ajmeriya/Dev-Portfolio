import { CONTACT_EMAIL } from './sections/Contact';

const socials = [
  { label: 'GitHub', href: 'https://github.com/hardik-ajmeriya' },
  { label: 'Email', href: `mailto:${CONTACT_EMAIL}` },
];

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="shell">
        <div className="flex flex-wrap justify-between gap-5 py-11 text-[13px] text-muted">
          <span>© {new Date().getFullYear()} Hardik — Full-stack development &amp; deployment</span>

          <div className="flex gap-6">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith('http') ? '_blank' : undefined}
                rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="no-underline transition-colors hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </div>

          <span className="font-mono">Built with React · Deployed on AWS</span>
        </div>
      </div>
    </footer>
  );
}
