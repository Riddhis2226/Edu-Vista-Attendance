import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Demo', href: '#demo' },
  { label: 'Technology', href: '#technology' },
];

const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-[400ms] ease-out ${
          scrolled
            ? 'backdrop-blur-xl bg-white/[0.03] border-b border-white/[0.08]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="glow-pulse">
                <path d="M16 4L4 12V20L16 28L28 20V12L16 4Z" fill="hsl(18 100% 58% / 0.15)" stroke="hsl(18 100% 58%)" strokeWidth="1.5" />
                <path d="M16 4L4 12L16 20L28 12L16 4Z" fill="hsl(18 100% 58% / 0.3)" />
                <circle cx="16" cy="10" r="3" fill="hsl(18 100% 58%)" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-foreground tracking-tight">EduVista</span>
              <span className="text-[10px] text-muted-foreground -mt-1 hidden sm:block">AI Attendance System</span>
            </div>
          </a>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative text-sm font-medium text-white/70 hover:text-white transition-colors group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-full group-hover:left-0" />
              </a>
            ))}
          </div>

          {/* Login button */}
          <div className="hidden md:block">
            <Link
              to="/login"
              className="relative px-5 py-2 text-sm font-medium text-primary border border-primary/60 rounded-lg overflow-hidden transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(255,107,43,0.4)] btn-shimmer"
            >
              Login
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white/80 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X size={24} />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu size={24} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="text-2xl font-bold text-white/90 hover:text-primary transition-colors"
              >
                {link.label}
              </motion.a>
            ))}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="px-8 py-3 bg-primary text-white font-semibold rounded-lg"
              >
                Login
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavbar;
