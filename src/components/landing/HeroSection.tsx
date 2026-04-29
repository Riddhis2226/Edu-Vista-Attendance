import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis } from 'recharts';
import DemoWalkthroughModal from './DemoWalkthroughModal';

const wordReveal = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const wordItem = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5 } },
};

const chartData = [
  { day: 'Mon', present: 42 },
  { day: 'Tue', present: 38 },
  { day: 'Wed', present: 45 },
  { day: 'Thu', present: 30 },
  { day: 'Fri', present: 47 },
  { day: 'Sat', present: 35 },
  { day: 'Sun', present: 41 },
];

const MiniStatCard: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div className={`rounded-lg px-3 py-2 text-center ${accent ? 'bg-primary/15 border border-primary/25' : 'bg-white/[0.06]'}`}>
    <div className={`text-xs font-bold ${accent ? 'text-primary' : 'text-primary'}`}>{value}</div>
    <div className="text-[10px] text-white/50">{label}</div>
  </div>
);

/* ── Gradient border wrapper ── */
const GradientBorderCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`relative rounded-2xl p-[1.5px] ${className}`}>
    <div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: 'conic-gradient(from var(--border-angle, 0deg), hsl(18 100% 58%), hsl(195 100% 50%), hsl(160 100% 45%), hsl(18 100% 58%))',
        animation: 'spin-border 4s linear infinite',
      }}
    />
    <div className="relative rounded-2xl bg-card/90 backdrop-blur-xl">
      {children}
    </div>
  </div>
);

const HeroSection: React.FC = () => {
  const [demoOpen, setDemoOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  // Parallax transforms at different intensities
  const orbX = useTransform(smoothX, [-1, 1], [-20, 20]);
  const orbY = useTransform(smoothY, [-1, 1], [-20, 20]);
  const cardX = useTransform(smoothX, [-1, 1], [-8, 8]);
  const cardY = useTransform(smoothY, [-1, 1], [-8, 8]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const orbs = [
    { w: 400, color: 'rgba(255,107,43,0.08)', top: '10%', left: '-5%', dur: 12 },
    { w: 300, color: 'rgba(0,194,255,0.06)', top: '60%', right: '0%', dur: 15 },
    { w: 200, color: 'rgba(0,229,160,0.05)', top: '30%', right: '20%', dur: 10 },
    { w: 500, color: 'rgba(255,107,43,0.05)', bottom: '10%', left: '10%', dur: 18 },
    { w: 150, color: 'rgba(0,194,255,0.08)', top: '15%', right: '35%', dur: 9 },
    { w: 350, color: 'rgba(0,229,160,0.04)', bottom: '30%', right: '5%', dur: 14 },
    { w: 80, color: 'rgba(255,107,43,0.1)', top: '50%', left: '40%', dur: 8 },
    { w: 250, color: 'rgba(0,194,255,0.05)', top: '5%', left: '50%', dur: 16 },
  ];

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center overflow-hidden pt-20"
    >
      {/* Floating orbs with parallax */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ x: orbX, y: orbY }}>
        {orbs.map((orb, i) => (
          <div
            key={i}
            className="orb pointer-events-none"
            style={{
              width: orb.w,
              height: orb.w,
              background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
              top: orb.top,
              left: orb.left,
              right: (orb as any).right,
              bottom: (orb as any).bottom,
              animationDuration: `${orb.dur}s`,
            }}
          />
        ))}
      </motion.div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        animation: 'float-orb 20s linear infinite',
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
        {/* Left content */}
        <div className="space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border"
            style={{
              background: 'linear-gradient(135deg, rgba(0,229,160,0.1), rgba(0,194,255,0.05))',
              borderColor: 'rgba(0,229,160,0.3)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-success pulse-badge" />
            <span className="text-success/90">✦ Powered by Luxand Cloud AI · 99.5% Accuracy · Real-Time</span>
          </motion.div>

          <motion.h1
            variants={wordReveal}
            initial="hidden"
            animate="visible"
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight"
          >
            {['Attendance', 'That'].map((w, i) => (
              <motion.span key={i} variants={wordItem} className="inline-block mr-3 text-foreground">{w}</motion.span>
            ))}
            <br />
            {['Thinks', 'For', 'You.'].map((w, i) => (
              <motion.span
                key={i}
                variants={wordItem}
                className="inline-block mr-3"
                style={{
                  background: 'linear-gradient(135deg, hsl(18 100% 58%), hsl(195 100% 50%), hsl(160 100% 45%))',
                  backgroundSize: '200% 200%',
                  animation: 'gradient-shift 4s ease infinite',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >{w}</motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed"
          >
            EduVista uses AI to recognize student faces from classroom photos and processes IoT RFID data — generating attendance records in seconds, exportable as CSV or Google Sheet.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              to="/signup"
              className="px-6 py-3 bg-gradient-to-r from-primary to-orange-600 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_0_30px_rgba(255,107,43,0.4)] btn-shimmer"
            >
              Get Started Free
            </Link>
            <a
              href="#demo"
              onClick={(e) => { e.preventDefault(); setDemoOpen(true); }}
              className="px-6 py-3 border border-white/20 text-white/80 font-medium rounded-lg transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]"
            >
              Watch Demo ▶
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="flex flex-wrap gap-3"
          >
            {['🔒 TLS 1.3 Encrypted', '⚡ < 2s Recognition', '🧠 Luxand AI Engine', '📊 CSV + Sheets Export'].map((badge) => (
              <span key={badge} className="px-3 py-1 text-xs font-medium text-white/60 bg-white/[0.04] rounded-full border border-white/[0.08]">
                {badge}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right - Floating dashboard mockup with mouse parallax */}
        <motion.div
          style={{ x: cardX, y: cardY }}
          className="relative hidden lg:flex items-center justify-center min-h-[500px]"
        >
          {/* Background glow */}
          <div className="absolute w-80 h-80 rounded-full bg-primary/20 blur-[100px] pointer-events-none" />

          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-full max-w-md"
          >
            <GradientBorderCard>
              <div className="p-4">
                {/* Mini sidebar + header */}
                <div className="flex gap-3">
                  <div className="w-10 bg-white/[0.04] rounded-lg flex flex-col items-center py-2 gap-2">
                    <div className="w-5 h-5 rounded bg-primary/30" />
                    <div className="w-4 h-0.5 bg-white/10 rounded" />
                    <div className="w-4 h-0.5 bg-white/10 rounded" />
                    <div className="w-4 h-0.5 bg-primary/40 rounded" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] font-bold text-foreground/80">EduVista Dashboard</div>
                      <div className="w-6 h-6 rounded-full bg-primary/20" />
                    </div>

                    {/* Orange stat cards */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <MiniStatCard label="Students" value="248" accent />
                      <MiniStatCard label="Present" value="87%" accent />
                      <MiniStatCard label="Sessions" value="12" />
                    </div>

                    {/* Recharts mini bar chart */}
                    <div className="bg-white/[0.03] rounded-lg p-2 mb-3">
                      <div className="text-[8px] text-white/40 mb-1 font-medium">Weekly Attendance</div>
                      <div className="h-16">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} barSize={10}>
                            <XAxis dataKey="day" tick={{ fontSize: 7, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                            <Bar dataKey="present" fill="hsl(18 100% 58%)" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Mini attendance table */}
                    <div className="space-y-1">
                      {[
                        { name: 'Arjun Patel', status: 'present' },
                        { name: 'Priya Sharma', status: 'present' },
                        { name: 'Rahul Gupta', status: 'absent' },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/[0.02] rounded px-2 py-1">
                          <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center">
                            <span className="text-[6px]">👤</span>
                          </div>
                          <div className="flex-1 text-[8px] text-white/60">{row.name}</div>
                          <div className={`px-1.5 py-0.5 rounded-full text-[7px] font-medium ${
                            row.status === 'present'
                              ? 'bg-success/15 text-success'
                              : 'bg-destructive/15 text-destructive'
                          }`}>
                            {row.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GradientBorderCard>
          </motion.div>

          {/* Floating accent pills */}
          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute top-4 -right-4"
          >
            <GradientBorderCard>
              <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success pulse-badge" />
                ✓ 47 Faces Recognized
              </div>
            </GradientBorderCard>
          </motion.div>

          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-8 -left-4"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-medium text-primary">
              📥 CSV + Sheet Ready
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute top-1/2 -left-8"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-[11px] font-medium text-secondary">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>🔄</motion.span>
              Syncing...
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll-down chevron */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: scrolled ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none"
      >
        <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5 text-primary/70" />
        </motion.div>
      </motion.div>

      <DemoWalkthroughModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
};

export default HeroSection;
