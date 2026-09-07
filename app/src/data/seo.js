/**
 * SEO CONSTANTS
 * ---------------------------------------------------------------
 * The facts about Hardik that structured data is built from.
 *
 * Everything else in the JSON-LD is DERIVED at build time from the same data
 * files the page renders from — faq.js, projects.js, services.js — by
 * scripts/build-schema.mjs. That is the point: structured data that is
 * hand-copied alongside the content it describes drifts, and Google treats a
 * mismatch between schema and visible text as a reason to drop the rich
 * result entirely.
 *
 * This file holds only the things that have no on-page equivalent to derive
 * from: identity, location, profile URLs.
 */

export const SITE_URL = 'https://hardikajmeriya.com';

/** Stable @id for the Person node. Every other block references this. */
export const PERSON_ID = `${SITE_URL}/#hardik`;
export const SITE_ID = `${SITE_URL}/#website`;
export const BUSINESS_ID = `${SITE_URL}/#business`;

export const PERSON = {
  name: 'Hardik Ajmeriya',
  givenName: 'Hardik',
  familyName: 'Ajmeriya',
  jobTitle: 'Full-Stack Developer & Cloud Engineer',
  email: 'hardik.ajmeriya89@gmail.com',
  image: `${SITE_URL}/images/Me.webp`,
  description:
    'Full-stack developer who builds MERN applications and deploys them to production on AWS with Docker, Kubernetes, Terraform and CI/CD pipelines.',
  address: {
    locality: 'Rajkot',
    region: 'Gujarat',
    country: 'IN',
  },
  /**
   * Every URL here MUST resolve. A 404 in sameAs weakens the entity rather
   * than strengthening it — this is the main signal tying this domain to the
   * name "Hardik Ajmeriya", so a dead link actively works against you.
   *
   * Add X, Instagram, Dev.to, Stack Overflow here only once the account
   * genuinely exists and links back to hardikajmeriya.com. The link back
   * matters: sameAs is a claim, and a reciprocal link is what confirms it.
   */
  sameAs: [
    'https://github.com/hardik-ajmeriya',
    'https://www.linkedin.com/in/hardik-ajmeriya',
  ],
  knowsLanguage: ['en', 'gu', 'hi'],
};

/**
 * The business face of the same person.
 *
 * Separate from Person because they answer different queries. Person answers
 * "who is Hardik Ajmeriya". ProfessionalService answers "freelance web
 * developer in Rajkot" — a service with a place, a price range and an area
 * served, which is what a local or service-intent search matches against.
 */
export const BUSINESS = {
  name: 'Hardik Ajmeriya — Web Development & Cloud Deployment',
  serviceType: 'Web application development and cloud infrastructure',
  /**
   * Worldwide, not just India. The site says "available worldwide" and the FAQ
   * says "clients in any timezone" — areaServed must not contradict the page.
   */
  areaServed: ['IN', 'US', 'GB', 'AE', 'AU', 'CA', 'SG', 'DE'],
  availableLanguage: ['English', 'Gujarati', 'Hindi'],
};
