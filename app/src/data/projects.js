/**
 * PROJECTS
 * ---------------------------------------------------------------
 * This is the only file you edit to change the Work section.
 * Add a project by copying one object and filling it in.
 *
 * liveUrl : leave as "" until the project is deployed.
 *           An empty value renders a greyed-out "Live site" slot,
 *           which is a visible reminder to go and deploy it.
 * browser : the fake URL shown in the mockup's address bar
 *
 * images  : one OR MORE screenshots, in /public/images (.webp).
 *
 *           With one image nothing changes — the card looks exactly as it
 *           always has and no gallery UI is rendered. Add a second and a
 *           thumbnail strip appears under the frame automatically.
 *
 *             images: [
 *               { src: '/images/cureneed.webp',       caption: 'Storefront' },
 *               { src: '/images/cureneed-admin.webp', caption: 'Admin dashboard' },
 *               { src: '/images/cureneed-cart.webp',  caption: 'Checkout' },
 *             ],
 *
 *           `caption` is not decoration: it becomes the button label a screen
 *           reader announces, and it is appended to the image's alt text. Two
 *           or three words describing what the screen shows. Skip it and the
 *           gallery falls back to "screenshot 2 of 4", which works but tells
 *           a blind visitor nothing.
 *
 *           Keep every screenshot the SAME aspect ratio (the existing ones are
 *           1536x1024, 3:2). Mixed ratios make the frame jump as you click
 *           through, which is the one thing a gallery must not do.
 *
 *           Before adding files, run them through:
 *               python scripts/optimise-images.py
 *           A raw 2 MB PNG screenshot becomes a ~70 KB webp. Four projects
 *           with four raw PNGs each would put 30 MB back into the deploy —
 *           which is exactly how this repo ended up shipping 29 MB of unused
 *           images once before.
 *
 * presentation:
 *   true  -> the image is already a finished mockup (it has its own
 *            browser chrome / perspective / background), so it is shown
 *            as-is with a soft float. Do NOT wrap it in more chrome.
 *   false -> a plain screenshot; the site wraps it in a browser frame
 *            and tilts it in 3D toward the cursor.
 */

export const projects = [
  {
    id: 'cureneed',
    title: 'CureNeed — Medicine E-commerce Platform',
    description:
      'A structured medicine management and storefront system with automated categorisation and real-time backend synchronisation, integrated into a wider medical platform.',
    images: [{ src: '/images/cureneed.webp', caption: 'Storefront and product catalogue' }],
    browser: 'cureneed.app',
    presentation: true,
    tech: ['Next.js', 'React', 'Node.js', 'Express', 'Tailwind CSS'],
    githubUrl: 'https://github.com/hardik-ajmeriya/MedCare',
    liveUrl: '',
    status: 'Completed',
  },
  {
    id: 'dcpvas',
    title: 'DCPVAS — CI/CD Visualiser with AI Failure Analysis',
    description:
      'Real-time visualisation of Jenkins pipeline runs with AI-assisted failure analysis. Streams build stages over SSE, processes logs deterministically and generates structured failure insights.',
    images: [{ src: '/images/dcpvas.webp', caption: 'Pipeline run visualiser' }],
    browser: 'dcpvas.dev',
    tech: ['React', 'Node.js', 'Express', 'MongoDB', 'Jenkins', 'SSE'],
    githubUrl: '',
    liveUrl: '',
    status: 'In development',
  },
  {
    id: 'devops-pipeline',
    title: 'Cloud-Native DevOps Pipeline on AWS',
    description:
      'End-to-end delivery pipeline: Terraform-provisioned EKS, GitOps deployment through Argo CD, automated builds in GitHub Actions, and OpenTelemetry-based monitoring.',
    images: [{ src: '/images/pipeline.webp', caption: 'Argo CD deployment view' }],
    browser: 'argocd.internal',
    tech: ['Terraform', 'AWS EKS', 'Argo CD', 'GitHub Actions', 'Docker'],
    githubUrl: 'https://github.com/hardik-ajmeriya/ultimate-devops-project-demo',
    liveUrl: '',
    status: 'Completed',
  },
  {
    id: 'k8s-monitoring',
    title: 'Kubernetes Monitoring — Prometheus & Grafana',
    description:
      'Cluster observability stack collecting and visualising pod health, CPU and memory usage, and service performance through Grafana dashboards.',
    images: [{ src: '/images/prometheus.webp', caption: 'Grafana cluster dashboard' }],
    browser: 'grafana.local',
    tech: ['Kubernetes', 'Prometheus', 'Grafana', 'Helm', 'Linux'],
    githubUrl: 'https://github.com/hardik-ajmeriya/k8s-kind-voting-app',
    liveUrl: '',
    status: 'Completed',
  },
];

export const stats = [
  { value: 4, suffix: '', label: 'Projects built end-to-end' },
  { value: 18, suffix: '+', label: 'CI/CD pipelines configured' },
  { value: 20, suffix: '+', label: 'Tools & services used' },
  { value: null, display: '<24h', label: 'Typical reply time' },
];

/**
 * Normalise a project's screenshots to a list.
 *
 * Exported and used by BOTH the Work section and scripts/build-schema.mjs, so
 * the gallery and the structured data can never disagree about which images a
 * project has. `image` (singular) is still accepted so an older entry keeps
 * working rather than rendering an empty frame.
 */
export function projectImages(project) {
  if (Array.isArray(project.images) && project.images.length) return project.images;
  if (project.image) return [{ src: project.image }];
  return [];
}
