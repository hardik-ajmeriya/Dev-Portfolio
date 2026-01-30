import React, { Suspense, lazy, useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Projects = lazy(() => import('./pages/Projects'));
const Contact = lazy(() => import('./pages/Contact'));

const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.98
  },
  in: { 
    opacity: 1, 
    y: 0,
    scale: 1
  },
  out: { 
    opacity: 0, 
    y: -20,
    scale: 1.02
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

const AnimatedRoute = ({ children }) => {
  const location = useLocation();
  
  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
};

const AppContent = () => {
  const location = useLocation();

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navbar />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Suspense
            fallback={
              <div className="py-24 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <AnimatedRoute>
                  <Home />
                </AnimatedRoute>
              }
            />
            <Route
              path="/about"
              element={
                <AnimatedRoute>
                  <About />
                </AnimatedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <AnimatedRoute>
                  <Projects />
                </AnimatedRoute>
              }
            />
            <Route
              path="/contact"
              element={
                <AnimatedRoute>
                  <Contact />
                </AnimatedRoute>
              }
            />
          </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
      <Footer />
      {/* Vercel Speed Insights for performance telemetry */}
      <SpeedInsights />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;