import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code,
  Database,
  Wrench,
  Award,
  Zap,
  Palette,
  Globe,
  Smartphone,
  Server,
  GitBranch,
  Monitor,
  Layers,
  Star,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

const About = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hoveredSkill, setHoveredSkill] = useState(null);

  const skillCategories = [
    { id: "all", label: "All Skills", icon: Layers },
    { id: "cloud", label: "Cloud & AWS", icon: Code },
    { id: "automation", label: "Automation", icon: Database },
    { id: "tools", label: "DevOps Tools", icon: Wrench },
  ];

  const skills = {
    cloud: [
      {
        name: "AWS",
        logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
        category: "cloud",
      },
      { name: "EC2", logo: "/images/EC2.png", category: "cloud" },
      { name: "S3", logo: "/images/S3.png", category: "cloud" },
      { name: "RDS", logo: "/images/RSD.png", category: "cloud" },
      {
        name: "Docker",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
        category: "cloud",
      },
      {
        name: "Kubernetes",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg",
        category: "cloud",
      },
    ],
    automation: [
      {
        name: "Jenkins",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg",
        category: "automation",
      },
      {
        name: "Ansible",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ansible/ansible-original.svg",
        category: "automation",
      },
      {
        name: "Python",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
        category: "automation",
      },
      {
        name: "Bash",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg",
        category: "automation",
      },
      {
        name: "Linux",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
        category: "automation",
      },
      {
        name: "CI/CD",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg",
        category: "automation",
      },
    ],
    tools: [
      {
        name: "Git",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
        category: "tools",
      },
      {
        name: "GitHub",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
        category: "tools",
      },
      {
        name: "GitLab",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg",
        category: "tools",
      },
      {
        name: "VS Code",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg",
        category: "tools",
      },
      {
        name: "Terraform",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/terraform/terraform-original.svg",
        category: "tools",
      },
      {
        name: "Prometheus",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prometheus/prometheus-original.svg",
        category: "tools",
      },
    ],
  };

  const getAllSkills = () => {
    return [...skills.cloud, ...skills.automation, ...skills.tools];
  };

  const getFilteredSkills = () => {
    if (selectedCategory === "all") {
      return getAllSkills();
    }
    return skills[selectedCategory] || [];
  };

  const getSkillColor = (index) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-green-500 to-green-600",
      "from-purple-500 to-purple-600",
      "from-orange-500 to-orange-600",
      "from-pink-500 to-pink-600",
      "from-cyan-500 to-cyan-600",
    ];
    return colors[index % colors.length];
  };

  const experiences = [
    {
      title: "DevOps Engineer Intern",
      company: "cognifyz technologies",
      period: "2025 - Present",
      description:
        "Working on cloud infrastructure automation and CI/CD pipeline development using AWS services, Docker, and Jenkins. Learning modern DevOps practices and tools.",
      achievements: [
        "Automated deployment processes",
        "Learned AWS core services",
        "Implemented Docker containerization",
      ],
    },
    /*{
      title: 'Cloud Infrastructure Trainee',
      company: 'Tech Solutions Inc.',
      period: '2024 - 2025',
      description: 'Gained hands-on experience with AWS services and infrastructure automation. Worked on containerization and orchestration projects.',
      achievements: ['Set up EC2 instances', 'Configured S3 storage', 'Created Docker containers']
    },
    {
      title: 'Linux System Admin Intern',
      company: 'Digital Systems',
      period: '2024 - 2024',
      description: 'Created interactive websites and web applications with focus on user experience and modern design principles.',
      achievements: ['Improved user engagement by 35%', 'Created reusable component library', 'Optimized for mobile devices']
    },*/
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
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

  const skillVariants = {
    hidden: { width: 0 },
    visible: (level) => ({
      width: `${level}%`,
      transition: {
        duration: 1.5,
        ease: "easeOut",
      },
    }),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <motion.h1
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              About{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Me
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Passionate DevOps engineer fresher with hands-on experience in
              cloud technologies and automation practices.
            </motion.p>
          </motion.div>

          {/* Bio Section */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 lg:p-12"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold text-gray-900 dark:text-white mb-6"
                >
                  My Journey
                </motion.h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 text-justify"
                  >
                    My journey into technology began during my 11th–12th grade,
                    when I first discovered my interest in Linux scripting and
                    system fundamentals. After buying my first laptop during my
                    12th vacation, I started learning programming with C, which
                    opened the door to a much bigger world. Over time, I
                    explored Android XML, Java, Flutter, and later stepped into
                    cloud and DevOps. Building DevOps projects and working with
                    AWS IaaS made me realize how much I enjoy automating
                    workflows, improving systems, and working with modern
                    infrastructure.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 dark:text-gray-300 leading-relaxed text-justify"
                  >
                    Today, my main focus is on cloud engineering, DevOps, and
                    full-stack development. I see myself as a fast learner,
                    curious problem-solver, and someone who adapts quickly to
                    new technologies and trends. With a strong interest in
                    building scalable, automated systems, I’m excited to grow
                    into a Cloud Engineer or DevOps Engineer, where I can apply
                    my passion for cloud platforms and modern engineering
                    practices to create meaningful impact.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 text-center"
                  >
                    <blockquote className="mx-auto max-w-xl italic font-medium text-gray-700 dark:text-gray-200 relative">
                      <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" aria-hidden="true" />
                      <span className="relative block py-4 px-6">
                        “Learning is my journey, but sharing is my way of giving back.”
                        <span className="mt-3 block text-sm font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">— Hardik Ajmeriya</span>
                      </span>
                    </blockquote>
                  </motion.div>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative flex justify-center"
              >
                <div className="relative w-80 h-80 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-600 p-1">
                  <img
                    src="/public/images/Me.png"
                    alt="Working"
                    className="w-full h-full rounded-2xl object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute -top-8 -right-8 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center"
                  >
                    <Award className="h-8 w-8 text-white" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Skills Section */}
          <motion.div variants={itemVariants}>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center"
            >
              Skills & Technologies
            </motion.h2>

            {/* Skill Category Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="flex flex-wrap justify-center gap-2 mb-12"
            >
              {skillCategories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-md"
                  }`}
                >
                  <category.icon className="h-4 w-4" />
                  <span>{category.label}</span>
                </motion.button>
              ))}
            </motion.div>

            {/* Skills Grid */}
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
            >
              <AnimatePresence mode="wait">
                {getFilteredSkills().map((skill, index) => (
                  <motion.div
                    key={skill.name}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{
                      scale: 1.1,
                      y: -5,
                      transition: { duration: 0.2 },
                    }}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col items-center text-center"
                  >
                    {/* Skill Logo */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-gray-700 mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                      <img
                        src={skill.logo}
                        alt={skill.name}
                        className="h-12 w-12 object-contain"
                        onError={(e) => {
                          // Fallback logos for problematic ones
                          if (skill.name === "AWS") {
                            e.target.src =
                              "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg";
                          } else if (skill.name === "Tailwind CSS") {
                            e.target.src =
                              "https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-icon.svg";
                          } else {
                            e.target.style.display = "none";
                          }
                        }}
                      />
                    </div>

                    {/* Skill Name */}
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {skill.name}
                    </h3>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Skills Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-gray-600 dark:text-gray-400">
                Proficient in{" "}
                <span className="font-semibold text-blue-600">
                  {getAllSkills().length}
                </span>{" "}
                technologies across cloud infrastructure, automation, and DevOps
                tools
              </p>
            </motion.div>
          </motion.div>

          {/* Experience Section */}
          <motion.div variants={itemVariants}>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center"
            >
              Professional Experience
            </motion.h2>
            <div className="space-y-8">
              {experiences.map((exp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {exp.title}
                      </h3>
                      <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">
                        {exp.company}
                      </p>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                      {exp.period}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {exp.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {exp.achievements.map((achievement, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full"
                      >
                        {achievement}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
