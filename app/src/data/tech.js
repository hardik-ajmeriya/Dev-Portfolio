/**
 * TECHNOLOGY
 * ---------------------------------------------------------------
 * Logos come from the Devicon CDN. To add a technology, find its
 * slug at https://devicon.dev and add an entry below.
 *
 * If a logo does not exist (or fails to load), the component falls
 * back to a monospace initials tile automatically — so it is safe
 * to add an entry with no `icon`.
 */

const D = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/';

export const techCategories = [
  { id: 'all', label: 'All' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend & Data' },
  { id: 'devops', label: 'Cloud & DevOps' },
  { id: 'tools', label: 'Tools' },
];

export const technologies = [
  // ---- Frontend ----
  { name: 'React', cat: 'frontend', icon: `${D}react/react-original.svg` },
  { name: 'Next.js', cat: 'frontend', icon: `${D}nextjs/nextjs-original.svg` },
  { name: 'JavaScript', cat: 'frontend', icon: `${D}javascript/javascript-original.svg` },
  { name: 'TypeScript', cat: 'frontend', icon: `${D}typescript/typescript-original.svg` },
  { name: 'Tailwind CSS', cat: 'frontend', icon: `${D}tailwindcss/tailwindcss-original.svg` },
  { name: 'HTML5', cat: 'frontend', icon: `${D}html5/html5-original.svg` },
  { name: 'CSS3', cat: 'frontend', icon: `${D}css3/css3-original.svg` },
  { name: 'Flutter', cat: 'frontend', icon: `${D}flutter/flutter-original.svg` },

  // ---- Backend & Data ----
  { name: 'Node.js', cat: 'backend', icon: `${D}nodejs/nodejs-original.svg` },
  { name: 'Express', cat: 'backend', icon: `${D}express/express-original.svg` },
  { name: 'MongoDB', cat: 'backend', icon: `${D}mongodb/mongodb-original.svg` },
  { name: 'MySQL', cat: 'backend', icon: `${D}mysql/mysql-original.svg` },
  { name: 'Python', cat: 'backend', icon: `${D}python/python-original.svg` },
  { name: 'Java', cat: 'backend', icon: `${D}java/java-original.svg` },
  { name: 'Go', cat: 'backend', icon: `${D}go/go-original.svg` },
  { name: 'REST APIs', cat: 'backend', fallback: '{ }' },

  // ---- Cloud & DevOps ----
  { name: 'AWS', cat: 'devops', icon: `${D}amazonwebservices/amazonwebservices-original-wordmark.svg` },
  { name: 'Docker', cat: 'devops', icon: `${D}docker/docker-original.svg` },
  { name: 'Kubernetes', cat: 'devops', icon: `${D}kubernetes/kubernetes-plain.svg` },
  { name: 'Terraform', cat: 'devops', icon: `${D}terraform/terraform-original.svg` },
  { name: 'Jenkins', cat: 'devops', icon: `${D}jenkins/jenkins-original.svg` },
  { name: 'GitHub Actions', cat: 'devops', icon: `${D}githubactions/githubactions-original.svg` },
  { name: 'Argo CD', cat: 'devops', fallback: 'ACD' },
  { name: 'Ansible', cat: 'devops', icon: `${D}ansible/ansible-original.svg` },
  { name: 'Prometheus', cat: 'devops', icon: `${D}prometheus/prometheus-original.svg` },
  { name: 'Grafana', cat: 'devops', icon: `${D}grafana/grafana-original.svg` },
  { name: 'Linux', cat: 'devops', icon: `${D}linux/linux-original.svg` },
  { name: 'Nginx', cat: 'devops', icon: `${D}nginx/nginx-original.svg` },

  // ---- Tools ----
  { name: 'Git', cat: 'tools', icon: `${D}git/git-original.svg` },
  { name: 'GitHub', cat: 'tools', icon: `${D}github/github-original.svg` },
  { name: 'VS Code', cat: 'tools', icon: `${D}vscode/vscode-original.svg` },
  { name: 'Postman', cat: 'tools', icon: `${D}postman/postman-original.svg` },
  { name: 'Vite', cat: 'tools', icon: `${D}vitejs/vitejs-original.svg` },
  { name: 'npm', cat: 'tools', icon: `${D}npm/npm-original-wordmark.svg` },
  { name: 'Bash', cat: 'tools', icon: `${D}bash/bash-original.svg` },
];

/** Words that scroll in the ticker under the hero. */
export const tickerItems = [
  'React',
  'Node.js',
  'MongoDB',
  'Express',
  'AWS',
  'Docker',
  'Kubernetes',
  'Terraform',
  'CI/CD',
];
