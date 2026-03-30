import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import eduvistaLogo from '@/assets/eduvista-logo.png';

/* ── Floating orbs ── */
const orbs = [
  { w: 260, color: 'rgba(255,107,43,0.12)', top: '8%', left: '5%', dur: 13 },
  { w: 180, color: 'rgba(0,194,255,0.09)', top: '55%', left: '60%', dur: 16 },
  { w: 220, color: 'rgba(0,229,160,0.07)', top: '70%', left: '15%', dur: 11 },
  { w: 140, color: 'rgba(255,107,43,0.08)', top: '20%', left: '70%', dur: 14 },
  { w: 300, color: 'rgba(0,194,255,0.06)', top: '35%', left: '30%', dur: 18 },
  { w: 100, color: 'rgba(0,229,160,0.1)', top: '10%', left: '45%', dur: 9 },
];

/* ── Typewriter ── */
const TypewriterLine: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        setDisplayed(text.slice(0, ++i));
        if (i >= text.length) clearInterval(iv);
      }, 40);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);
  return (
    <span className="text-sm text-white/50 font-mono">
      {displayed}
      <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} className="text-primary">|</motion.span>
    </span>
  );
};

/* ── Animated pipeline node ── */
const PipelineNode: React.FC<{ icon: string; label: string; delay: number; active?: boolean }> = ({ icon, label, delay, active }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.7 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 200 }}
    className="flex flex-col items-center gap-1"
  >
    <motion.div
      animate={active ? { boxShadow: ['0 0 15px rgba(255,107,43,0.2)', '0 0 30px rgba(255,107,43,0.4)', '0 0 15px rgba(255,107,43,0.2)'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-xl"
    >
      {icon}
    </motion.div>
    <span className="text-[10px] text-white/50 font-medium">{label}</span>
  </motion.div>
);

const PipelineArrow: React.FC<{ delay: number }> = ({ delay }) => (
  <motion.div
    initial={{ opacity: 0, scaleX: 0 }}
    animate={{ opacity: 1, scaleX: 1 }}
    transition={{ delay, duration: 0.3 }}
    className="flex items-center"
  >
    <div className="w-8 h-px bg-gradient-to-r from-primary/40 to-secondary/40" />
    <div className="w-0 h-0 border-t-[3px] border-b-[3px] border-l-[5px] border-transparent border-l-secondary/40" />
  </motion.div>
);

/* ── Glass info card ── */
const InfoCard: React.FC<{ icon: string; text: string; delay: number }> = ({ icon, text, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md"
  >
    <span className="text-lg">{icon}</span>
    <span className="text-sm text-white/70 font-medium">{text}</span>
  </motion.div>
);

/* ── Staggered taglines ── */
const taglines = ['AI-Powered Attendance', 'Secure by Design', 'Built for Institutions'];

/* ── Main layout ── */
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const panelRef = useRef<HTMLDivElement>(null);

  // Mouse parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });
  const orbX = useTransform(sx, [-1, 1], [-15, 15]);
  const orbY = useTransform(sy, [-1, 1], [-15, 15]);

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const r = panelRef.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  }, [mx, my]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background overflow-hidden">
      {/* ── LEFT PANEL ── */}
      <div
        ref={panelRef}
        onMouseMove={handleMouse}
        className="relative w-full lg:w-[60%] min-h-[40vh] lg:min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Orbs */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{ x: orbX, y: orbY }}>
          {orbs.map((o, i) => (
            <div
              key={i}
              className="orb"
              style={{
                width: o.w, height: o.w,
                background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
                top: o.top, left: o.left,
                animationDuration: `${o.dur}s`,
              }}
            />
          ))}
        </motion.div>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        {/* Content */}
        <div className="relative z-10 px-8 py-12 lg:py-0 max-w-lg w-full space-y-8">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <img src={eduvistaLogo} alt="EduVista" className="h-10 w-auto glow-pulse" />
            <span className="text-lg font-bold text-foreground">EduVista</span>
          </motion.div>

          {/* Route-specific content */}
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login-visual"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                <InfoCard icon="✓" text="42 Faces Recognized" delay={0.3} />
                <InfoCard icon="📊" text="Attendance Generated" delay={0.5} />
                <InfoCard icon="🔒" text="Secure Session Active" delay={0.7} />

                {/* Pipeline */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="flex items-center gap-2 pt-4 overflow-x-auto"
                >
                  <PipelineNode icon="📷" label="Photo" delay={1.0} active />
                  <PipelineArrow delay={1.1} />
                  <PipelineNode icon="🤖" label="AI" delay={1.2} active />
                  <PipelineArrow delay={1.3} />
                  <PipelineNode icon="📋" label="Records" delay={1.4} />
                  <PipelineArrow delay={1.5} />
                  <PipelineNode icon="📥" label="Export" delay={1.6} />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="signup-visual"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                <InfoCard icon="📂" text="Upload Student CSV" delay={0.3} />
                <InfoCard icon="🤖" text="Enroll Faces via AI" delay={0.5} />
                <InfoCard icon="✅" text="System Ready in Minutes" delay={0.7} />

                {/* Pipeline */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="flex items-center gap-2 pt-4 overflow-x-auto"
                >
                  <PipelineNode icon="📂" label="CSV" delay={1.0} active />
                  <PipelineArrow delay={1.1} />
                  <PipelineNode icon="🤖" label="AI" delay={1.2} active />
                  <PipelineArrow delay={1.3} />
                  <PipelineNode icon="👥" label="Students" delay={1.4} />
                  <PipelineArrow delay={1.5} />
                  <PipelineNode icon="✅" label="Ready" delay={1.6} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Taglines */}
          <div className="space-y-2 pt-4">
            {taglines.map((t, i) => (
              <motion.p
                key={t}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8 + i * 0.15 }}
                className="text-sm text-white/30 font-medium"
              >
                ✦ {t}
              </motion.p>
            ))}
          </div>

          {/* Typewriter */}
          <div className="pt-2">
            <TypewriterLine text="Initializing secure session…" delay={2500} />
          </div>

          {/* System status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-success pulse-badge" />
            <span className="text-xs text-white/40">All systems operational</span>
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-[40%] min-h-[60vh] lg:min-h-screen flex items-center justify-center px-4 sm:px-8 py-12 relative">
        {/* Subtle glow behind card */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full bg-secondary/8 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
