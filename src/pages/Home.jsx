import React from "react";
import { motion } from "framer-motion";
import { Download, ArrowRight, Code, Palette, Database, Star, Zap, Award, Coffee, Network, Cloud, GitBranch, Settings } from "lucide-react";
import { Link } from "react-router-dom";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const floatingAnimation = {
  y: [0, -20, 0],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
};

export default function Home() {
  const stats = [
    { number: "50+", label: "Projects", icon: Code },
    { number: "3+", label: "Years", icon: Award },
    { number: "100+", label: "Commits", icon: Database },
    { number: "24/7", label: "Learning", icon: Coffee },
  ];

  const techStack = [
    { name: "AWS", color: "text-orange-500" },
    { name: "Docker", color: "text-blue-500" },
    { name: "Kubernetes", color: "text-blue-600" },
    { name: "Jenkins", color: "text-red-500" },
    { name: "Ansible", color: "text-red-600" },
    { name: "Git", color: "text-orange-600" },
    { name: "Linux", color: "text-yellow-600" },
    { name: "Python", color: "text-green-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background Elements (hidden on small screens for performance) */}
      <div className="absolute inset-0 overflow-hidden hidden sm:block">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-600/20 rounded-full blur-3xl"
        />
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, 50, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              delay: i * 2,
            }}
            className={`absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full`}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
          />
        ))}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20"
      >
        <div className="max-w-7xl w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
            
            {/* Left Section - Content */}
            <div className="space-y-6 lg:space-y-8 text-center lg:text-left order-2 lg:order-1 pt-8">
              {/* Status Badge */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                className="flex justify-center lg:justify-start mb-8"
              >
                <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/40 rounded-full text-sm font-medium text-green-600 dark:text-green-400 shadow-lg backdrop-blur-0 sm:backdrop-blur-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse" />
                  Available for new opportunities
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>

              {/* Main Heading */}
              <div className="space-y-4">
                <motion.p 
                  className="text-lg font-medium text-gray-600 dark:text-gray-400"
                  variants={itemVariants}
                >
                  Hello World! I'm
                </motion.p>
                
                <motion.h1 
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold leading-relaxed"
                  variants={itemVariants}
                  style={{ lineHeight: '1.2' }}
                >
                  <span className="block text-gray-900 dark:text-white mb-2">Hardik</span>
                  <motion.span 
                    className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 pb-2"
                    animate={{ 
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                    }}
                    style={{ 
                      backgroundSize: '200% 200%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'inline-block',
                      lineHeight: '1.2'
                    }}
                  >
                    Ajmeriya
                  </motion.span>
                </motion.h1>
              </div>

              {/* Role & Description */}
              <motion.div className="space-y-4 lg:space-y-6" variants={itemVariants}>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800 dark:text-gray-200">
                  <span className="text-indigo-600 dark:text-indigo-400">DevOps Engineer</span> & 
                  <span className="text-purple-600 dark:text-purple-400"> Cloud Enthusiast</span>
                </h2>
                
                <p className="text-base lg:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Passionate about automating infrastructure and streamlining development workflows. 
                  As a fresher, I bring enthusiasm for cloud technologies and modern DevOps practices to build scalable, reliable systems.
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {techStack.map((tech, index) => (
                    <motion.span
                      key={tech.name}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      className={`px-2 lg:px-3 py-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full text-xs lg:text-sm font-medium ${tech.color} border border-gray-200/50 dark:border-gray-700/50`}
                    >
                      {tech.name}
                    </motion.span>
                  ))}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center lg:justify-start pt-6"
                variants={itemVariants}
              >
                <Link to="/projects" className="group">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <span className="relative flex items-center">
                      <Palette className="mr-2 h-5 w-5" />
                      View My Work
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>
                </Link>
                
                <motion.a
                  href="/resume.pdf"
                  download
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Resume
                </motion.a>
              </motion.div>
            </motion.div>
            </div>

            {/* Right Section - Profile Image */}
            <motion.div 
              className="relative flex justify-center lg:justify-end order-1 lg:order-2"
              variants={itemVariants}
            >
              <div className="relative">
                {/* Background decoration */}
                <motion.div
                  animate={floatingAnimation}
                  className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl"
                />
                
                {/* Main image container */}
                <motion.div 
                  whileHover={{ scale: 1.02, rotate: 1 }}
                  className="relative w-72 h-80 sm:w-80 sm:h-96 lg:w-80 lg:h-96 xl:w-96 xl:h-[26rem] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900"
                >
                  <img
                    src="/images/hero_pic.jpg"
                    alt="Hardik Ajmeriya"
                    className="w-full h-full object-cover object-center rounded-2xl transition-all duration-300 hover:brightness-105"
                    style={{
                      imageRendering: 'high-quality',
                      filter: 'none',
                      backgroundColor: 'transparent',
                      WebkitMaskImage: 'linear-gradient(rgba(0,0,0,1), rgba(0,0,0,1))'
                    }}
                    loading="eager"
                    decoding="async"
                    fetchpriority="high"
                  />
                </motion.div>

                {/* Floating elements */}
                <motion.div
                  animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-4 lg:-top-6 -right-4 lg:-right-6 w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Code className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                </motion.div>
                
                <motion.div
                  animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -bottom-4 lg:-bottom-6 -left-4 lg:-left-6 w-10 h-10 lg:w-14 lg:h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg"
                >
                  <Zap className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* What I Do Section */}
          <motion.div 
            className="mt-12 lg:mt-20"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h3 
              className="text-2xl lg:text-3xl font-bold text-center text-gray-900 dark:text-white mb-8 lg:mb-12"
              variants={itemVariants}
            >
              What I Do Best
            </motion.h3>
            
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  icon: Cloud,
                  title: "Cloud Infrastructure",
                  description: "Designing and managing scalable cloud infrastructure on AWS with EC2, S3, RDS, and other core services.",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  icon: GitBranch,
                  title: "CI/CD Automation", 
                  description: "Building automated deployment pipelines using Jenkins, Git workflows, and container orchestration with Docker and Kubernetes.",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  icon: Settings,
                  title: "Configuration Management",
                  description: "Automating server configuration and application deployment using Ansible, ensuring consistent and reliable infrastructure.",
                  gradient: "from-purple-500 to-pink-500"
                }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-0 sm:backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r ${item.gradient} rounded-2xl mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                  </div>
                  
                  <h4 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {item.title}
                  </h4>
                  
                  <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    {item.description}
                  </p>
                  
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center text-gray-400 dark:text-gray-500"
        >
          <span className="text-xs mb-2 font-medium">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-3 bg-gray-400 dark:bg-gray-500 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
