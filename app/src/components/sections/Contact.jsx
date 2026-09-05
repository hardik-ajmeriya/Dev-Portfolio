import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRevealGroup } from '../../hooks/useReveal';
import Magnetic from '../Magnetic';

export const CONTACT_EMAIL = 'hardik.ajmeriya89@gmail.com';

/**
 * Deliberately minimal: four inputs.
 *
 * Every additional field measurably reduces completion, and this is a first
 * contact, not an intake form. Project type, timeline, company, required
 * services and preferred contact method are all things you can ask in the
 * reply — by which point the person is already talking to you.
 *
 * Budget is the one qualifier kept, because it filters out mismatches before
 * you spend a call on them. It stays optional so it never blocks a send.
 */

const schema = yup.object().shape({
  name: yup.string().required('Please add your name').min(2, 'That looks too short'),
  email: yup.string().email('That email address looks wrong').required('Please add your email'),
  budget: yup.string(),
  message: yup
    .string()
    .required('Please tell me a little about the project')
    .min(20, 'A sentence or two would help me reply properly'),
  // Honeypot. Must be declared or yupResolver strips it before the handler.
  botcheck: yup.string(),
});

/** Minimum seconds between two submissions from the same browser. */
const COOLDOWN_SECONDS = 45;
/** Nobody reads and completes this form faster than this. */
const MIN_FILL_SECONDS = 3;

const field =
  'w-full rounded-xl border border-line bg-white px-4 py-3.5 text-[15px] text-ink ' +
  'placeholder:text-muted/60 outline-none transition duration-300 ' +
  'focus:border-ink focus:ring-4 focus:ring-accent/10';

function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">{label}</span>
        {hint ? <span className="text-[11px] text-muted/70">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-[12px] text-red-600">{error}</span> : null}
    </label>
  );
}

export default function Contact() {
  const groupRef = useRevealGroup();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const mountedAt = useRef(Date.now());
  const lastSentAt = useRef(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    // Honeypot tripped — pretend it worked, tell the bot nothing.
    if (data.botcheck) {
      setResult({ ok: true, message: "Thanks — I'll reply within 24 hours." });
      reset();
      return;
    }

    if ((Date.now() - mountedAt.current) / 1000 < MIN_FILL_SECONDS) {
      setResult({ ok: false, message: 'That was a bit quick — please try again.' });
      return;
    }

    const sinceLast = (Date.now() - lastSentAt.current) / 1000;
    if (lastSentAt.current && sinceLast < COOLDOWN_SECONDS) {
      setResult({
        ok: false,
        message: `Already sent — please wait ${Math.ceil(COOLDOWN_SECONDS - sinceLast)}s.`,
      });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('access_key', import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '');
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('replyto', data.email);
      formData.append('from_name', 'hardikajmeriya.com');
      // Built rather than asked for — one less thing on screen.
      formData.append('subject', `New project enquiry from ${data.name}`);
      formData.append('budget', data.budget || 'Not specified');
      formData.append('message', data.message);
      formData.append('botcheck', '');

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });
      const json = await response.json();

      if (json.success) {
        lastSentAt.current = Date.now();
        setResult({ ok: true, message: "Thanks — I'll reply within 24 hours." });
        reset();
      } else {
        setResult({ ok: false, message: json.message || 'Something went wrong. Please try again.' });
      }
    } catch {
      setResult({
        ok: false,
        message: `Network error. You can also email me directly at ${CONTACT_EMAIL}.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" ref={groupRef} className="border-t border-line">
      <div className="shell">
        <div className="grid grid-cols-1 gap-14 py-32 lg:grid-cols-[1fr_1fr] lg:gap-24">
          {/* Left: the pitch and the direct details */}
          <div className="rv">
            <div className="sec-num">07 / CONTACT</div>
            <h2 className="display mt-4 text-[clamp(2.8rem,7vw,6rem)]">
              Let&rsquo;s build
              <br />
              something.
            </h2>

            <p className="mt-8 max-w-[420px] text-[17px] leading-[1.65] text-muted">
              Tell me what you&rsquo;re trying to build and roughly when you need it. If I&rsquo;m
              not the right fit, I&rsquo;ll say so.
            </p>

            <div className="mt-12 space-y-7">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  Email
                </div>
                <Magnetic strength={0.12}>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-1.5 inline-block border-b border-ink pb-1 text-lg no-underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </Magnetic>
              </div>

              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  Average response time
                </div>
                <div className="mt-1.5 text-lg">Within 24 hours</div>
                <div className="text-[13px] text-muted">Monday &ndash; Saturday</div>
              </div>

              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  Location
                </div>
                <div className="mt-1.5 text-lg">Rajkot, Gujarat, India</div>
                <div className="text-[13px] text-muted">Working with clients worldwide</div>
              </div>
            </div>
          </div>

          {/* Right: four fields, nothing more */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="rv">
            {/* Honeypot — off-screen, hidden from assistive tech. */}
            <div
              aria-hidden="true"
              className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
            >
              <label>
                Do not fill this in
                <input {...register('botcheck')} type="text" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Your name" error={errors.name?.message}>
                  <input
                    {...register('name')}
                    className={field}
                    placeholder="Jane Doe"
                    autoComplete="name"
                  />
                </Field>

                <Field label="Email" error={errors.email?.message}>
                  <input
                    {...register('email')}
                    type="email"
                    className={field}
                    placeholder="jane@company.com"
                    autoComplete="email"
                  />
                </Field>
              </div>

              <Field label="Budget" hint="optional" error={errors.budget?.message}>
                <select {...register('budget')} className={field} defaultValue="">
                  <option value="">Prefer not to say</option>
                  <option>Under ₹50,000</option>
                  <option>₹50,000 – ₹1,50,000</option>
                  <option>₹1,50,000 – ₹4,00,000</option>
                  <option>₹4,00,000+</option>
                </select>
              </Field>

              <Field label="What do you need built?" error={errors.message?.message}>
                <textarea
                  {...register('message')}
                  rows={6}
                  className={`${field} resize-y`}
                  placeholder="A few lines about the project, who it's for, and any deadline you have in mind."
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-ink py-[18px] text-sm font-semibold text-paper
                           transition duration-300 hover:bg-accent
                           disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Sending…' : 'Send message'}
              </button>

              {result ? (
                <p
                  role="status"
                  aria-live="polite"
                  className={`text-center text-sm ${result.ok ? 'text-accent2' : 'text-red-600'}`}
                >
                  {result.message}
                </p>
              ) : (
                <p className="text-center text-[13px] text-muted">
                  Prefer email? Write to{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-ink underline">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
