import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRevealGroup } from '../../hooks/useReveal';
import Magnetic from '../Magnetic';

export const CONTACT_EMAIL = 'hardik.ajmeriya89@gmail.com';

const schema = yup.object().shape({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().email('Invalid email').required('Email is required'),
  subject: yup
    .string()
    .required('Subject is required')
    .min(5, 'Subject must be at least 5 characters'),
  budget: yup.string(),
  message: yup
    .string()
    .required('Message is required')
    .min(10, 'Message must be at least 10 characters'),
});

const inputBase =
  'w-full rounded-xl border border-line bg-white px-4 py-3.5 text-[15px] text-ink ' +
  'placeholder:text-muted/70 outline-none transition focus:border-ink focus:ring-2 focus:ring-accent/25';

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
        {label}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-[12px] text-red-600">{error}</span> : null}
    </label>
  );
}

export default function Contact() {
  const groupRef = useRevealGroup();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { ok: boolean, message: string }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setSubmitting(true);
    setResult(null);

    try {
      const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

      const formData = new FormData();
      formData.append('access_key', accessKey || '');
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('replyto', data.email);
      formData.append('from_name', 'Portfolio Contact Form');
      formData.append('subject', data.subject);
      formData.append('budget', data.budget || 'Not specified');
      formData.append('message', data.message);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });
      const json = await response.json();

      if (json.success) {
        setResult({ ok: true, message: "Message sent. I'll reply within 48 hours." });
        reset();
      } else {
        setResult({ ok: false, message: json.message || 'Something went wrong. Please try again.' });
      }
    } catch {
      setResult({ ok: false, message: 'Network error. Please try again later.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" ref={groupRef} className="border-t border-line">
      <div className="shell">
        <div className="grid grid-cols-1 gap-14 py-32 lg:grid-cols-[1fr_1fr] lg:gap-24">
          {/* Left: pitch */}
          <div className="rv">
            <div className="sec-num">06 / CONTACT</div>
            <h2 className="display mt-4 text-[clamp(2.8rem,7vw,6rem)]">
              Let&rsquo;s build
              <br />
              something.
            </h2>

            <p className="mt-8 max-w-[420px] text-[17px] leading-[1.65] text-muted">
              Tell me what you&rsquo;re trying to build and roughly when you need it. If I&rsquo;m
              not the right fit, I&rsquo;ll say so.
            </p>

            <div className="mt-12 space-y-6">
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
                  Response time
                </div>
                <div className="mt-1.5 text-lg">Usually within 48 hours</div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="rv space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Your name" error={errors.name?.message}>
                <input {...register('name')} className={inputBase} placeholder="Jane Doe" />
              </Field>

              <Field label="Email" error={errors.email?.message}>
                <input
                  {...register('email')}
                  type="email"
                  className={inputBase}
                  placeholder="jane@company.com"
                />
              </Field>
            </div>

            <Field label="Subject" error={errors.subject?.message}>
              <input
                {...register('subject')}
                className={inputBase}
                placeholder="New web app for my business"
              />
            </Field>

            <Field label="Budget range (optional)" error={errors.budget?.message}>
              <select {...register('budget')} className={inputBase} defaultValue="">
                <option value="">Prefer not to say</option>
                <option>Under ₹50,000</option>
                <option>₹50,000 – ₹1,50,000</option>
                <option>₹1,50,000 – ₹4,00,000</option>
                <option>₹4,00,000+</option>
              </select>
            </Field>

            <Field label="What are you looking to build?" error={errors.message?.message}>
              <textarea
                {...register('message')}
                rows={5}
                className={`${inputBase} resize-y`}
                placeholder="A short description of the project, who it's for, and any deadline you have in mind."
              />
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-ink py-[18px] text-sm font-semibold text-paper
                         transition duration-300 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send message'}
            </button>

            {result ? (
              <p
                role="status"
                className={`text-center text-sm ${result.ok ? 'text-accent2' : 'text-red-600'}`}
              >
                {result.message}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
