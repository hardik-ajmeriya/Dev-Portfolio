import { useEffect, useState } from 'react';
import HeroCanvas from '../HeroCanvas';
import Magnetic from '../Magnetic';

const HEADLINE = ['I build web', 'apps & put them', 'into production.'];

export default function Hero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <header id="top" className="relative flex min-h-screen items-center px-6 md:px-10">
      <HeroCanvas />

      <div className="relative z-10 mx-auto w-full max-w-shell">
        <div
          className={`mb-10 flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.16em] text-muted
                      transition-all duration-700 ease-smooth ${
                        loaded ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                      }`}
        >
          <span className="h-[7px] w-[7px] animate-pulseDot rounded-full bg-accent2 shadow-[0_0_0_0_rgba(0,212,160,0.6)]" />
          Available for new projects
        </div>

        <h1 className="display text-[clamp(3.2rem,10.5vw,11rem)]">
          {HEADLINE.map((line, i) => (
            <span key={line} className="block overflow-hidden">
              <span
                className="block transition-transform duration-[1050ms] ease-smooth"
                style={{
                  transform: loaded ? 'translateY(0)' : 'translateY(105%)',
                  transitionDelay: `${i * 90}ms`,
                }}
              >
                {i === HEADLINE.length - 1 ? <span className="text-accent">{line}</span> : line}
              </span>
            </span>
          ))}
        </h1>

        <div
          className={`mt-14 flex flex-wrap items-end justify-between gap-x-16 gap-y-8
                      transition-all duration-700 ease-smooth ${
                        loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}
          style={{ transitionDelay: '450ms' }}
        >
          <p className="max-w-[400px] text-[17px] leading-[1.6] text-muted">
            Full-stack development on the MERN stack, deployed to AWS with CI/CD, containers and
            monitoring. One person, from first commit to live URL.
          </p>

          <div className="flex flex-wrap gap-4">
            <Magnetic>
              <a href="#contact" className="btn">
                Start a project <span aria-hidden="true">→</span>
              </a>
            </Magnetic>
            <Magnetic>
              <a href="#work" className="btn btn-ghost">
                See the work
              </a>
            </Magnetic>
          </div>
        </div>
      </div>
    </header>
  );
}
