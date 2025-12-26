import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, ExternalLink, Star, Filter, Search } from "lucide-react";

const Projects = () => {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const projects = [
    {
      id: 1,
      title:
        "Cloud-Native DevOps Pipeline on AWS (Kubernetes + Terraform + GitOps + ArgoCD)",
      description:
        "End-to-end DevOps pipeline with automated builds, cloud provisioning, GitOps deployment, and real-time monitoring on AWS EKS.",
      image: "/images/pipeline.png",
      techStack: [
        "Terraform",
        "AWS EKS",
        "AWS IAM",
        "AWS VPC",
        "Kubernetes",
        "Argo CD",
        "GitHub Actions",
        "Docker",
        "Docker Hub",
        "Git",
        "GitOps",
        "OpenTelemetry",
        "CloudWatch",
        "Go",
        "Java",
        "Python",
        "Bash",
      ],
      githubUrl:
        "https://github.com/hardik-ajmeriya/ultimate-devops-project-demo.git",
      category: "fullstack",
      featured: true,
    },
    {
      id: 2,
      title: "CureNeed Medicine E-commerce Platform",
      description:
        "A structured medicine management system built with a full-stack architecture, enabling automated categorization and real-time backend synchronization. Fully integrated with the main medical website for unified management.",
      image: "/images/cureneed.png",
      techStack: [
        "Next.js",
        "React",
        "JavaScript",
        "Tailwind CSS",
        "Node.js",
        "Express.js",
        "JSON Storage",
        "GitHub Copilot",
        "Postman/Thunder Client",
      ],
      githubUrl: "https://github.com/hardik-ajmeriya/MedCare.git",
      liveUrl: "",
      category: "frontend",
      featured: false,
    },
    {
      id: 3,
      title: "Hostel OutPass Manager",
      description:
        "Hostel Outpass Manager is a Flutter-based mobile application designed to streamline the process of managing outpass requests for students and wardens. The app features separate portals for students and wardens, ensuring a smooth and efficient workflow.",
      image: "/images/outpass.png",
      techStack: [
        "Flutter",
        "Dart",
        "Provider",
        "Android (Kotlin/Java)",
        "Kotlin",
        "Java",
        "Gradle",
        "Android Studio",
        "Node.js",
        "JavaScript",
        "npm",
        "MongoDB",
        "pub",
      ],
      githubUrl:
        "https://github.com/hardik-ajmeriya/hostel_outpass_manager.git",
      liveUrl: "",
      category: "frontend",
      featured: false,
    },
    {
      id: 4,
      title: "Kubernetes Monitoring with Prometheus & Grafana",
      description:
        "A cloud-native Kubernetes monitoring project where Prometheus and Grafana were deployed to collect and visualize cluster and application metrics. Implemented real-time monitoring for pod health, CPU and memory usage, and service performance using Grafana dashboards.",
      image: "/images/prometheus.png",
      techStack: [
        "Kubernetes",
        "Docker",
        "Prometheus",
        "Grafana",
        "Helm",
        "Linux",
      ],
      githubUrl: "https://github.com/hardik-ajmeriya/k8s-kind-voting-app.git",
      liveUrl: "",
      category: "devops",
      featured: true,
    },
  ];

  const categories = [
    { id: "all", label: "All Projects" },
    { id: "frontend", label: "Frontend" },
    { id: "backend", label: "Backend" },
    { id: "fullstack", label: "Full Stack" },
  ];

  const filteredProjects = projects.filter((project) => {
    const matchesFilter = filter === "all" || project.category === filter;
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.techStack.some((tech) =>
        tech.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesFilter && matchesSearch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <motion.h1
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              My{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Projects
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Here are some of my featured projects that showcase my skills and
              passion for development
            </motion.p>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col md:flex-row gap-4 items-center justify-between"
          >
            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilter(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filter === category.id
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {category.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          {/* Projects Grid */}
          <AnimatePresence>
            <motion.div
              layout
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ y: -10 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group"
                >
                  <div className="relative overflow-hidden">
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                      src={project.image}
                      alt={project.title}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    {project.featured && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium flex items-center"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </motion.div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="p-6">
                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xl font-bold text-gray-900 dark:text-white mb-2"
                    >
                      {project.title}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed"
                    >
                      {project.description}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-wrap gap-2 mb-4"
                    >
                      {project.techStack.map((tech, index) => (
                        <motion.span
                          key={tech}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.1 }}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium"
                        >
                          {tech}
                        </motion.span>
                      ))}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center space-x-3"
                    >
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors text-sm"
                      >
                        <Github className="h-4 w-4 mr-1" />
                        Code
                      </motion.a>
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Live Demo
                      </motion.a>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* No Results */}
          {filteredProjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No projects found matching your criteria.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Projects;
