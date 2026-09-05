import { useRevealGroup } from '../../hooks/useReveal';

export default function About() {
  const groupRef = useRevealGroup();

  return (
    <section id="about" ref={groupRef}>
      <div className="shell">
        <div className="grid grid-cols-1 items-center gap-11 py-32 lg:grid-cols-[0.6fr_1.4fr] lg:gap-20">
          <div className="rv">
            <img
              src="/images/Me.webp"
              alt="Hardik"
              loading="lazy"
              decoding="async"
              className="w-full rounded-[14px] grayscale transition-[filter] duration-700 hover:grayscale-0"
            />
          </div>

          <div className="rv">
            <div className="sec-num">05 / ABOUT</div>

            <p className="mt-6 font-display text-[clamp(1.6rem,3vw,2.6rem)] font-semibold leading-[1.32] tracking-[-0.03em]">
              I&rsquo;m Hardik — a full-stack developer who also does the infrastructure. That
              combination means your project doesn&rsquo;t stall at the handover, waiting for
              someone else to work out how to deploy it.
            </p>

            <p className="mt-7 max-w-[620px] text-base leading-[1.75] text-muted">
              I work with React, Node and MongoDB on the application side, and Docker, Kubernetes,
              Terraform and AWS on the infrastructure side. If you need something built and actually
              running, that&rsquo;s the job I take.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
