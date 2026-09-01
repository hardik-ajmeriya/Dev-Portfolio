/**
 * SERVICES
 * ---------------------------------------------------------------
 * Edit this file to change what you offer.
 *
 * price : optional. Add a string like 'from ₹40,000' to show a
 *         price on the row. Leave it out (or null) to hide it.
 */

export const services = [
  {
    code: 'S/01',
    title: 'Full-Stack Web\nApplication Development',
    description:
      'Custom applications built on the MERN stack — client portals, admin dashboards, storefronts, booking systems and internal tools. Built to your requirements, not a template.',
    tags: ['React', 'Node.js', 'Express', 'MongoDB', 'Responsive UI'],
    price: null,
  },
  {
    code: 'S/02',
    title: 'API Development\n& Integration',
    description:
      'REST APIs designed, documented and secured — plus integration of third-party services like payments, authentication, email and external data sources into your product.',
    tags: ['REST', 'JWT Auth', 'Payments', 'Webhooks', 'Postman Docs'],
    price: null,
  },
  {
    code: 'S/03',
    title: 'Cloud Deployment\n& Infrastructure',
    description:
      'Your application provisioned and deployed on AWS — networking, compute, storage and databases set up properly, with SSL, domains and environment separation handled.',
    tags: ['AWS EC2', 'S3', 'RDS', 'Terraform', 'SSL & DNS'],
    price: null,
  },
  {
    code: 'S/04',
    title: 'CI/CD Pipeline\nAutomation',
    description:
      'Automated build, test and deploy pipelines so shipping an update is one merge instead of a manual afternoon. Includes rollback paths for when a release goes wrong.',
    tags: ['GitHub Actions', 'Jenkins', 'Argo CD', 'GitOps', 'Rollbacks'],
    price: null,
  },
  {
    code: 'S/05',
    title: 'Containerisation\n& Kubernetes',
    description:
      'Services packaged into Docker images and orchestrated on Kubernetes, so the application scales under load and behaves the same in every environment.',
    tags: ['Docker', 'Kubernetes', 'Helm', 'Autoscaling'],
    price: null,
  },
  {
    code: 'S/06',
    title: 'Monitoring,\nMaintenance & Support',
    description:
      'Dashboards and alerting so problems surface before your customers report them — plus ongoing bug fixes, feature work and infrastructure care after handover.',
    tags: ['Prometheus', 'Grafana', 'Alerting', 'Retainer'],
    price: null,
  },
];

export const processSteps = [
  {
    n: '01',
    title: 'Discovery call',
    body: "A free twenty-minute conversation about what you need, who it's for, and whether I'm the right person to build it.",
  },
  {
    n: '02',
    title: 'Scope & fixed quote',
    body: 'A written breakdown of features, timeline and price before anything is built. If the scope changes later, we agree on it first.',
  },
  {
    n: '03',
    title: 'Build in the open',
    body: 'Regular check-ins with a staging URL you can click through, so nothing is a surprise at the end.',
  },
  {
    n: '04',
    title: 'Deploy & look after it',
    body: "Live on production infrastructure with monitoring in place, and continued support once it's running.",
  },
];
