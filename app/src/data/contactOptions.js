/**
 * Contact form dropdown options.
 *
 * Kept out of the component so the wording can be changed without touching
 * form logic. Every "required" select includes a no-commitment escape hatch
 * ("Not sure yet", "Flexible") — requiring a choice qualifies the lead, but
 * nobody should be blocked from contacting you because they haven't decided.
 */

export const PROJECT_TYPES = [
  'New web application',
  'SaaS product',
  'Rebuild or redesign of an existing app',
  'API or backend work',
  'Cloud setup and deployment',
  'DevOps and CI/CD',
  'Ongoing support and maintenance',
  'Something else',
];

export const BUDGET_RANGES = [
  'Under $500',
  '$500 – $1,000',
  '$1,000 – $3,000',
  '$3,000 – $5,000',
  '$5,000+',
  'Not sure yet',
];

export const TIMELINES = [
  'ASAP',
  'Within 2 weeks',
  'Within 1 month',
  'Within 2–3 months',
  'Flexible',
];
