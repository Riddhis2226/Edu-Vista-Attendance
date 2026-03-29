import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DemoWalkthroughModal from './DemoWalkthroughModal';

const wordReveal = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const wordItem = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5 } },
};

const FloatingCard: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = '', delay = 0 }) => (
  <motion.div
    animate={{ y: [-6, 6, -6] }}
    transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const MiniStatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white/[0.06] rounded-lg px-3 py-2 text-center">
    <div className="text-xs text-primary font-bold">{value}</div>
    <div className="text-[10px] text-white/50">{label}</div>
  </div>
);

const HeroSection: React.FC = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Floating orbs */}
      {[
        { w: 400, color: 'rgba(255,107,43,0.08)', top: '10%', left: '-5%', dur: 12 },
        { w: 300, color: 'rgba(0,194,255,0.06)', top: '60%', right: '0%', dur: 15 },
        { w: 200, color: 'rgba(0,229,160,0.05)', top: '30%', right: '20%', dur: 10 },
        { w: 500, color: 'rgba(255,107,43,0.05)', bottom: '10%', left: '10%', dur: 18 },
        { w: 150, color: 'rgba(0,194,255,0.08)', top: '15%', right: '35%', dur: 9 },
        { w: 350, color: 'rgba(0,229,160,0.04)', bottom: '30%', right: '5%', dur: 14 },
        { w: 80, color: 'rgba(255,107,43,0.1)', top: '50%', left: '40%', dur: 8 },
        { w: 250, color: 'rgba(0,194,255,0.05)', top: '5%', left: '50%', dur: 16 },
      ].map((orb, i) => (
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
            <span className="text-success/90">✦ Powered by Azure Face API · IoT Ready · Real-Time</span>
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
            EduVista uses Azure AI to recognize student faces from classroom photos and processes IoT RFID data — generating attendance records in seconds, exportable as CSV or Google Sheet.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              to="/login"
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
            {['🔒 Azure Secured', '⚡ 2-Second Recognition', '📊 Dual Export'].map((badge) => (
              <span key={badge} className="px-3 py-1 text-xs font-medium text-white/60 bg-white/[0.04] rounded-full border border-white/[0.08]">
                {badge}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right - Floating dashboard mockup */}
        <div className="relative hidden lg:flex items-center justify-center min-h-[500px]">
          {/* Background glow */}
          <div className="absolute w-80 h-80 rounded-full bg-primary/20 blur-[100px] pointer-events-none" />

          <FloatingCard className="relative w-full max-w-md">
            <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
              {/* Mini sidebar + header */}
              <div className="flex gap-3 mb-3">
                <div className="w-10 bg-white/[0.04] rounded-lg flex flex-col items-center py-2 gap-2">
                  <div className="w-5 h-5 rounded bg-primary/30" />
                  <div className="w-4 h-0.5 bg-white/10 rounded" />
                  <div className="w-4 h-0.5 bg-white/10 rounded" />
                  <div className="w-4 h-0.5 bg-primary/40 rounded" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-bold text-white/80">Dashboard Overview</div>
                    <div className="w-6 h-6 rounded-full bg-primary/20" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <MiniStatCard label="Students" value="248" />
                    <MiniStatCard label="Today" value="87%" />
                    <MiniStatCard label="Sessions" value="5" />
                  </div>
                  {/* Mini chart */}
                  <div className="bg-white/[0.03] rounded-lg p-2 mb-3">
                    <div className="flex items-end gap-1 h-12">
                      {[60, 80, 45, 90, 70, 85, 55].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 1.2 + i * 0.1, duration: 0.4 }}
                          className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary/80"
                        />
                      ))}
                    </div>
                  </div>
                  {/* Mini table */}
                  <div className="space-y-1">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/[0.02] rounded px-2 py-1">
                        <div className="w-4 h-4 rounded-full bg-white/10" />
                        <div className="flex-1 h-1.5 bg-white/10 rounded" />
                        <div className={`w-8 h-3 rounded-full ${i < 2 ? 'bg-success/20' : 'bg-destructive/20'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FloatingCard>

          {/* Floating accent pills */}
          <FloatingCard delay={1} className="absolute top-4 -right-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-[11px] font-medium text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success pulse-badge" />
              ✓ 47 Faces Recognized
            </div>
          </FloatingCard>

          <FloatingCard delay={2} className="absolute bottom-8 -left-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-medium text-primary">
              📥 CSV + Sheet Ready
            </div>
          </FloatingCard>

          <FloatingCard delay={0.5} className="absolute top-1/2 -left-8">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-[11px] font-medium text-secondary">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>🔄</motion.span>
              Syncing...
            </div>
          </FloatingCard>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
