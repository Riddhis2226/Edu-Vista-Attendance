import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';

const bullets = [
  'Face embeddings stored exclusively in Azure — never in your database',
  'Student metadata isolated in Supabase with Row-Level Security',
  'azure_person_id is the only link — a non-reversible reference',
  'All API calls encrypted in transit with TLS 1.2+',
];

const SecuritySection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section className="py-20 sm:py-28 relative" style={{ background: '#112240' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center" ref={ref}>
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
            Your Biometric Data,{' '}
            <span className="relative">
              Protected.
              <motion.span
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary origin-left"
              />
            </span>
          </h2>
          <p className="text-muted-foreground mt-4 mb-6 leading-relaxed">
            EduVista separates biometric processing from data storage. Azure handles face detection and matching; your database only stores metadata and attendance records.
          </p>
          <div className="space-y-3">
            {bullets.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 w-5 h-5 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <span className="text-sm text-white/70">{b}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right - Architecture diagram */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center"
        >
          <div className="relative w-full max-w-sm">
            {/* Photo box */}
            <div className="absolute top-0 left-0 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-center">
              <div className="text-xl mb-1">📷</div>
              <div className="text-[10px] text-white/60 font-medium">Class Photo</div>
            </div>

            {/* Azure box */}
            <motion.div
              animate={{ boxShadow: ['0 0 20px rgba(0,194,255,0.1)', '0 0 40px rgba(0,194,255,0.2)', '0 0 20px rgba(0,194,255,0.1)'] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-0 left-1/2 -translate-x-1/2 bg-white/[0.04] border border-secondary/20 rounded-xl px-4 py-3 text-center"
            >
              <div className="text-xl mb-1">☁️</div>
              <div className="text-[10px] text-secondary font-medium">Azure Face API</div>
              <div className="text-[8px] text-white/30 mt-1">Embeddings stored here</div>
            </motion.div>

            {/* Supabase box */}
            <motion.div
              animate={{ boxShadow: ['0 0 20px rgba(255,107,43,0.1)', '0 0 40px rgba(255,107,43,0.2)', '0 0 20px rgba(255,107,43,0.1)'] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              className="absolute top-0 right-0 bg-white/[0.04] border border-primary/20 rounded-xl px-4 py-3 text-center"
            >
              <div className="text-xl mb-1">🗄️</div>
              <div className="text-[10px] text-primary font-medium">Database</div>
              <div className="text-[8px] text-white/30 mt-1">Metadata only</div>
            </motion.div>

            {/* Connector lines with flowing dots */}
            <svg className="w-full" viewBox="0 0 400 120" fill="none" style={{ marginTop: '80px' }}>
              <line x1="70" y1="10" x2="160" y2="10" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <line x1="240" y1="10" x2="330" y2="10" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <motion.circle
                cx="0" cy="10" r="2" fill="hsl(195 100% 50%)"
                animate={{ cx: [70, 160] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.circle
                cx="0" cy="10" r="2" fill="hsl(18 100% 58%)"
                animate={{ cx: [240, 330] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 1 }}
              />
              <text x="190" y="30" fill="rgba(255,255,255,0.25)" fontSize="8" textAnchor="middle">azure_person_id</text>
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SecuritySection;
