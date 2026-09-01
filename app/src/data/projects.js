/**
 * PROJECTS
 * ---------------------------------------------------------------
 * This is the only file you edit to change the Work section.
 * Add a project by copying one object and filling it in.
 *
 * liveUrl : leave as "" until the project is deployed.
 *           An empty value renders a greyed-out "Live site" slot,
 *           which is a visible reminder to go and deploy it.
 * image   : file inside /public/images (use the .webp versions)
 * browser : the fake URL shown in the mockup's address bar
 */

export const projects = [
  {
    id: 'cureneed',
    title: 'CureNeed — Medicine E-commerce Platform',
    description:
      'A structured medicine management and storefront system with automated categorisation and real-time backend synchronisation, integrated into a wider medical platform.',
    image: '/images/cureneed.webp',
    browser: 'cureneed.app',
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
    image: '/images/dcpvas.webp',
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
    image: '/images/pipeline.webp',
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
    image: '/images/prometheus.webp',
    browser: 'grafana.local',
    tech: ['Kubernetes', 'Prometheus', 'Grafana', 'Helm', 'Linux'],
    githubUrl: 'https://github.com/hardik-ajmeriya/k8s-kind-voting-app',
    liveUrl: '',
    status: 'Completed',
  },
  {
    id: 'outpass',
    title: 'Hostel OutPass Manager',
    description:
      'A Flutter application with separate student and warden portals, backed by a Node and MongoDB API, that digitises hostel outpass approvals end to end.',
    image: '/images/outpass.webp',
    browser: 'outpass.app',
    tech: ['Flutter', 'Dart', 'Node.js', 'MongoDB'],
    githubUrl: 'https://github.com/hardik-ajmeriya/hostel_outpass_manager',
    liveUrl: '',
    status: 'Completed',
  },
];

export const stats = [
  { value: 5, suffix: '', label: 'Projects built end-to-end' },
  { value: 18, suffix: '+', label: 'CI/CD pipelines configured' },
  { value: 20, suffix: '+', label: 'Tools & services used' },
  { value: null, display: '<48h', label: 'Typical reply time' },
];
