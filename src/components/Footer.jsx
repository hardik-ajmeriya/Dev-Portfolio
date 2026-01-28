import React from 'react';
import { Github, Linkedin, Twitter, Mail, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
  const socialLinks = [
    { icon: Github, href: 'https://github.com/hardik-ajmeriya', label: 'GitHub', color: 'hover:text-gray-900 dark:hover:text-gray-100' },
    { icon: Linkedin, href: 'https://linkedin.com/in/hardik-ajmeriya', label: 'LinkedIn', color: 'hover:text-blue-700' },
    { icon: Twitter, href: 'https://twitter.com/yourhandle', label: 'Twitter', color: 'hover:text-sky-500' },
    { icon: Mail, href: 'mailto:your@email.com', label: 'Email', color: 'hover:text-red-600' },
  ];

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center md:text-left"
          >
            <p className="text-gray-600 dark:text-gray-400 flex items-center">
              Made with <Heart className="h-4 w-4 mx-1 text-red-500" /> by Hardik Ajmeriya
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              © 2026 All rights reserved.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-4"
          >
            {socialLinks.map(({ icon: Icon, href, label, color }, index) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2, y: -2 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-2 text-gray-600 dark:text-gray-400 ${color} transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800`}
                aria-label={label}
              >
                <Icon className="h-5 w-5" />
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;