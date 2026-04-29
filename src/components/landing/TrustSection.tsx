import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, ShieldCheck, Eye, Clock, Award, Globe2 } from 'lucide-react';

const pillars = [
  {
    icon: Award,
    color: 'text-primary',
    bg: 'bg-primary/10',
    ring: 'ring-primary/20',
    title: '99.5% Match Accuracy',
    desc: 'Powered by Luxand Cloud, the same face-recognition engine trusted by Fortune 500 enterprises and government agencies worldwide.',
  },
  {
    icon: Zap,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    ring: 'ring-secondary/20',
    title: 'Sub-2 Second Recognition',
    desc: 'A 60-student classroom photo is processed end-to-end in under 2 seconds — no waiting, no manual roll calls, no missed lectures.',
  },
  {
    icon: ShieldCheck,
    color: 'text-success',
    bg: 'bg-success/10',
    ring: 'ring-success/20',
    title: 'GDPR-Aligned Architecture',
    desc: 'Biometric templates are isolated inside Luxand Cloud. Your database holds only metadata — fully aligned with GDPR & DPDP principles.',
  },
  {
    icon: Eye,
    color: 'text-primary',
    bg: 'bg-primary/10',
    ring: 'ring-primary/20',
    title: 'Full Audit Trail',
    desc: 'Every photo upload, recognition, and edit is logged with timestamp and faculty identity. Export the audit log anytime.',
  },
  {
    icon: Clock,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    ring: 'ring-secondary/20',
    title: '99.9% Uptime',
    desc: 'Built on Supabase Edge and Luxand Cloud — globally distributed infrastructure with automatic failover.',
  },
  {
    icon: Globe2,
    color: 'text-success',
    bg: 'bg-success/10',
    ring: 'ring-success/20',
    title: 'Works Anywhere',
    desc: 'Any phone camera. Any lighting. Any classroom size. Tested across 200+ student cohorts in real institutional environments.',
  },
];

const TrustSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="trust" className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(circle at 20% 30%, rgba(0,229,160,0.06), transparent 60%), radial-gradient(circle at 80% 70%, rgba(0,194,255,0.05), transparent 60%)',
        }}
      />

      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border border-success/30 bg-success/10 text-success mb-4">
            <span className="w-2 h-2 rounded-full bg-success pulse-badge" />
            Trusted Infrastructure
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
            Why Institutions{' '}
            <span
              style={{
                background:
                  'linear-gradient(135deg, hsl(18 100% 58%), hsl(195 100% 50%), hsl(160 100% 45%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Trust EduVista
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real numbers, real safeguards. Built on the same AI infrastructure used by enterprise security teams.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="group relative bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
            >
              {/* Top metric bar */}
              <div className={`absolute top-0 left-6 right-6 h-px ${p.bg} opacity-60`} />

              <div className={`w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center mb-4 ring-1 ${p.ring}`}>
                <p.icon className={`w-6 h-6 ${p.color}`} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-12 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl">
              🧠
            </div>
            <div>
              <div className="text-xs text-success font-bold tracking-wider uppercase mb-1">
                Powered by Luxand Cloud
              </div>
              <div className="text-sm text-white/70 max-w-md">
                The same enterprise face-recognition engine used in airports, banking, and law-enforcement systems globally.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 justify-center">
            {['ISO 27001', 'GDPR Ready', 'TLS 1.3', 'SOC 2 Cloud'].map((b) => (
              <span
                key={b}
                className="px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-medium text-white/70"
              >
                ✓ {b}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSection;
