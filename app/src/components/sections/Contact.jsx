import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRevealGroup } from '../../hooks/useReveal';
import Magnetic from '../Magnetic';
import { Field, TextInput, Select, SubmitButton } from '../form/FormControls';
import RichTextArea from '../form/RichTextArea';
import { PROJECT_TYPES, BUDGET_RANGES, TIMELINES } from '../../data/contactOptions';

export const CONTACT_EMAIL = 'hardik.ajmeriya89@gmail.com';

/** Seconds a browser must wait between successful sends. */
const COOLDOWN_SECONDS = 45;
/** Nobody legitimately completes this form faster than this. */
const MIN_FILL_SECONDS = 3;

const schema = yup.object({
  name: yup
    .string()
    .trim()
    .required('Please enter your full name.')
    .min(2, 'Please enter your full name.'),
  email: yup
    .string()
    .trim()
    .required('Please enter a valid business email.')
    .email('Please enter a valid business email.'),
  company: yup.string().trim(),
  projectType: yup.string().required('Please select a project type.'),
  budget: yup.string().required('Please select an estimated budget.'),
  timeline: yup.string().required('Please select a project timeline.'),
  message: yup
    .string()
    .trim()
    .required('Please describe your project.')
    .min(30, 'Project overview must contain at least 30 characters.'),
  // Honeypot — must be declared or yupResolver strips it before submit.
  botcheck: yup.string(),
});

/** Animated confirmation shown in place of the form after a successful send. */
function SuccessPanel({ onReset }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-line bg-white px-8 py-16 text-center"
    >
      <div className="animate-popIn mb-7 flex h-16 w-16 items-center justify-center rounded-full bg-accent2/10">
        <svg viewBox="0 0 32 32" className="h-8 w-8 text-accent2" aria-hidden="true">
          <path
            d="M8 16.5 13.5 22 24 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            // Drawn on rather than popped in — the stroke animates to 0 offset.
            style={{ strokeDasharray: 30, strokeDashoffset: 30 }}
            className="animate-checkDraw"
          />
        </svg>
      </div>

      <h3 className="display mb-4 text-[clamp(1.6rem,3vw,2.2rem)]">Thank you.</h3>

      <p className="max-w-[380px] text-[15px] leading-[1.7] text-muted">
        Your project inquiry has been received. I&rsquo;ll personally review your requirements and
        get back to you within one business day.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-8 border-b border-line pb-1 text-[13px] text-muted transition-colors duration-300 hover:border-ink hover:text-ink"
      >
        Send another message
      </button>
    </div>
  );
}

export default function Contact() {
  const groupRef = useRevealGroup();
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [formError, setFormError] = useState(null);

  const mountedAt = useRef(Date.now());
  const lastSentAt = useRef(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({ resolver: yupResolver(schema), mode: 'onBlur' });

  // Watched so the toolbar and character counter re-render as the
  // Project Overview changes, including edits the toolbar makes itself.
  const messageValue = watch('message');

  const onSubmit = async (data) => {
    setFormError(null);

    // Honeypot tripped: report success so the bot learns nothing, send nothing.
    if (data.botcheck) {
      setSucceeded(true);
      reset();
      return;
    }

    if ((Date.now() - mountedAt.current) / 1000 < MIN_FILL_SECONDS) {
      setFormError('That was submitted unusually fast. Please try again.');
      return;
    }

    const sinceLast = (Date.now() - lastSentAt.current) / 1000;
    if (lastSentAt.current && sinceLast < COOLDOWN_SECONDS) {
      setFormError(
        `Your message was already sent. Please wait ${Math.ceil(COOLDOWN_SECONDS - sinceLast)} seconds before sending another.`
      );
      return;
    }

    setSubmitting(true);

    try {
      // Posts to our own Worker (app/worker/index.js), not to Web3Forms
      // directly. The Worker re-validates server-side, forwards the
      // notification, and sends the client auto-reply — which keeps both the
      // Resend and Web3Forms keys out of this bundle entirely.
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          company: data.company,
          projectType: data.projectType,
          budget: data.budget,
          timeline: data.timeline,
          message: data.message,
          botcheck: data.botcheck || '',
        }),
      });
      const json = await response.json();

      if (json.success) {
        lastSentAt.current = Date.now();
        setSucceeded(true);
        reset();
      } else {
        setFormError(json.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setFormError(`Network error. You can also email me directly at ${CONTACT_EMAIL}.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" ref={groupRef} className="border-t border-line">
      <div className="shell">
        <div className="grid grid-cols-1 gap-14 py-32 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* ---------------- Left: pitch and direct details ---------------- */}
          <div className="rv lg:sticky lg:top-32 lg:self-start">
            <div className="sec-num">07 / CONTACT</div>
            <h2 className="display mt-4 text-[clamp(2.8rem,6.5vw,5.5rem)]">
              Let&rsquo;s build
              <br />
              something.
            </h2>

            <p className="mt-8 max-w-[400px] text-[17px] leading-[1.65] text-muted">
              Tell me what you&rsquo;re trying to build and roughly when you need it. If I&rsquo;m
              not the right fit, I&rsquo;ll say so.
            </p>

            <dl className="mt-12 space-y-7">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  Email
                </dt>
                <dd className="mt-1.5">
                  <Magnetic strength={0.12}>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="inline-block border-b border-ink pb-1 text-lg no-underline"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </Magnetic>
                </dd>
              </div>

              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  Average response time
                </dt>
                <dd className="mt-1.5 text-lg">Within 24 hours</dd>
                <dd className="text-[13px] text-muted">Monday &ndash; Saturday</dd>
              </div>

              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  Location
                </dt>
                <dd className="mt-1.5 text-lg">Rajkot, Gujarat, India</dd>
                <dd className="text-[13px] text-muted">Available worldwide</dd>
              </div>
            </dl>
          </div>

          {/* ---------------- Right: the form ---------------- */}
          <div className="rv">
            {succeeded ? (
              <SuccessPanel
                onReset={() => {
                  setSucceeded(false);
                  mountedAt.current = Date.now();
                }}
              />
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Honeypot: off-screen and hidden from assistive tech. */}
                <div
                  aria-hidden="true"
                  className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
                >
                  <label>
                    Do not fill this in
                    <input {...register('botcheck')} type="text" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                {/* A disabled fieldset disables every control inside it at
                    once — no need to thread `disabled` through each input. */}
                <fieldset disabled={submitting} className="space-y-1">
                  <legend className="sr-only">Project enquiry</legend>

                  <div className="grid gap-x-5 sm:grid-cols-2">
                    <Field id="name" label="Full name" error={errors.name?.message}>
                      {(a11y) => (
                        <TextInput
                          {...register('name')}
                          {...a11y}
                          invalid={!!errors.name}
                          placeholder="Jane Doe"
                          autoComplete="name"
                        />
                      )}
                    </Field>

                    <Field id="email" label="Business email" error={errors.email?.message}>
                      {(a11y) => (
                        <TextInput
                          {...register('email')}
                          {...a11y}
                          type="email"
                          invalid={!!errors.email}
                          placeholder="jane@company.com"
                          autoComplete="email"
                        />
                      )}
                    </Field>
                  </div>

                  <div className="grid gap-x-5 sm:grid-cols-2">
                    <Field id="company" label="Company name" optional error={errors.company?.message}>
                      {(a11y) => (
                        <TextInput
                          {...register('company')}
                          {...a11y}
                          invalid={!!errors.company}
                          placeholder="Acme Inc."
                          autoComplete="organization"
                        />
                      )}
                    </Field>

                    <Field id="projectType" label="Project type" error={errors.projectType?.message}>
                      {(a11y) => (
                        <Select {...register('projectType')} {...a11y} invalid={!!errors.projectType} defaultValue="">
                          <option value="" disabled>
                            Select a project type
                          </option>
                          {PROJECT_TYPES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </Select>
                      )}
                    </Field>
                  </div>

                  <div className="grid gap-x-5 sm:grid-cols-2">
                    <Field id="budget" label="Estimated budget" error={errors.budget?.message}>
                      {(a11y) => (
                        <Select {...register('budget')} {...a11y} invalid={!!errors.budget} defaultValue="">
                          <option value="" disabled>
                            Select a budget range
                          </option>
                          {BUDGET_RANGES.map((b) => (
                            <option key={b}>{b}</option>
                          ))}
                        </Select>
                      )}
                    </Field>

                    <Field id="timeline" label="Project timeline" error={errors.timeline?.message}>
                      {(a11y) => (
                        <Select {...register('timeline')} {...a11y} invalid={!!errors.timeline} defaultValue="">
                          <option value="" disabled>
                            Select a timeline
                          </option>
                          {TIMELINES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </Select>
                      )}
                    </Field>
                  </div>

                  <Field id="message" label="Project overview" error={errors.message?.message}>
                    {(a11y) => (
                      <RichTextArea
                        id="message"
                        registration={register('message')}
                        getValue={() => messageValue}
                        setValue={(next) =>
                          setValue('message', next, { shouldValidate: true, shouldDirty: true })
                        }
                        invalid={!!errors.message}
                        minLength={30}
                        rows={7}
                        aria-invalid={a11y['aria-invalid']}
                        aria-describedby={a11y['aria-describedby']}
                        placeholder="Describe your project, goals, target users, desired features, preferred technologies (if any), and expected timeline."
                      />
                    )}
                  </Field>

                  <div className="pt-2">
                    <SubmitButton loading={submitting}>Start your project</SubmitButton>
                  </div>
                </fieldset>

                {formError ? (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] text-red-700"
                  >
                    {formError}
                  </p>
                ) : (
                  <p className="mt-4 text-center text-[13px] text-muted">
                    Prefer email? Write to{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-ink underline">
                      {CONTACT_EMAIL}
                    </a>
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
