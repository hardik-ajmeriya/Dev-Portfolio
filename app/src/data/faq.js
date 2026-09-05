/**
 * FAQ
 * ---------------------------------------------------------------
 * Two jobs at once:
 *
 *  1. Answers the questions a client actually has before enquiring,
 *     which removes friction from the contact form.
 *  2. Adds substantial indexable text in a question/answer shape.
 *     Google can surface these as rich results, and language models
 *     quote Q&A far more readily than marketing prose.
 *
 * Keep answers factual and specific. Vague answers help nobody and
 * are not quotable.
 *
 * NOTE: if you edit these, mirror the change in the FAQPage JSON-LD
 * block in app/index.html — Google requires the structured data to
 * match the visible text.
 */

export const faqs = [
  {
    q: 'What kind of projects do you take on?',
    a: 'Web applications built on the MERN stack — React, Node.js, Express and MongoDB. Typically client portals, admin dashboards, storefronts, booking systems and internal business tools. I also take on the cloud side: deploying to AWS, setting up CI/CD pipelines, containerising with Docker and Kubernetes, and putting monitoring in place.',
  },
  {
    q: 'What makes you different from other freelance developers?',
    a: 'Most freelance developers hand over a repository and stop there, which leaves you to work out hosting, deployment and monitoring on your own. I do both halves — the application and the infrastructure it runs on. You get a deployed, monitored, running system rather than code you still need someone else to launch.',
  },
  {
    q: 'How do you price a project?',
    a: 'Fixed price, agreed before any work starts. After a free twenty-minute discovery call I send a written breakdown of scope, timeline and cost. If the scope changes later we agree the change first, so there are no surprise invoices. I do not bill hourly for defined projects.',
  },
  {
    q: 'How long does a project usually take?',
    a: 'It depends entirely on scope, so I give a specific timeline in the written quote rather than a generic estimate. A focused MVP is usually a few weeks; a larger application with integrations and custom infrastructure takes longer. You will have a staging URL to click through throughout, so progress is visible rather than something you take on trust.',
  },
  {
    q: 'Can you take over a project someone else started?',
    a: 'Yes. Inheriting an existing codebase is common, whether the previous developer left, the project stalled, or it works locally but was never deployed. I will review what exists and tell you honestly whether it is better to continue with it or rebuild — including when continuing is the cheaper answer.',
  },
  {
    q: 'What happens after the project launches?',
    a: 'The application goes live on production infrastructure with monitoring and alerting configured, so problems surface before your customers report them. I stay available afterwards for bug fixes, new features and infrastructure maintenance. You are not handed a system and left alone with it.',
  },
  {
    q: 'Do you work with clients remotely?',
    a: 'Yes, entirely remotely, and with clients in any timezone. Communication is over email and scheduled calls, with regular written updates. I reply to enquiries within 48 hours.',
  },
];
