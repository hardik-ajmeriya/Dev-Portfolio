import { CONTACT_EMAIL } from './sections/Contact';

const socials = [
  /* Internal first: /resume was previously reachable only by guessing the
     old /DevOps_V1.2.pdf filename, so nothing crawled it and no visitor
     found it. A link here makes it part of the site rather than an orphan. */
  { label: 'Résumé', href: '/resume' },
  { label: 'GitHub', href: 'https://github.com/hardik-ajmeriya' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hardik-ajmeriya' },
  { label: 'Email', href: `mailto:${CONTACT_EMAIL}` },
];

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="shell">
        <div className="flex flex-wrap justify-between gap-5 py-11 text-[13px] text-muted">
          <span>
            © {new Date().getFullYear()} Hardik Ajmeriya — Full-stack development &amp; cloud
            deployment
          </span>

          <div className="flex flex-wrap gap-x-6">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith('http') ? '_blank' : undefined}
                rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                /* py-3 -mt-3 -mb-3 grows the touch target to ~44px without
                   changing the visual position of the text. */
                className="-my-3 py-3 no-underline transition-colors hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </div>

          {/* This used to read "Deployed on AWS". It is not — the site runs on
              Cloudflare Workers. On a portfolio whose entire pitch is that the
              deployment half is done properly, a footer that misstates its own
              hosting is the one factual error a technical client is most
              likely to check. */}
          <span className="font-mono">Built with React · Deployed on Cloudflare</span>
        </div>
      </div>
    </footer>
  );
}
