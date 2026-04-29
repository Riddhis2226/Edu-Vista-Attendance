import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';

const bullets = [
  'Face embeddings stored inside Luxand Cloud — never inside your database',
  'Student metadata isolated with Postgres Row-Level Security',
  'Only a non-reversible UUID links a student to their biometric template',
  'All API calls encrypted in transit with TLS 1.3 and signed tokens',
];

/* Animated data packet that travels along a path */
const DataPacket: React.FC<{
  pathD: string;
  color: string;
  delay?: number;
  duration?: number;
}> = ({ pathD, color, delay = 0, duration = 2.5 }) => (
  <>
    {/* Glow trail */}
    <motion.circle
      r="4"
      fill="none"
      stroke={color}
      strokeWidth="6"
      opacity="0.15"
      filter="url(#glow)"
    >
      <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`}>
        <mpath href={`#${pathD}`} />
      </animateMotion>
    </motion.circle>
    {/* Core dot */}
    <motion.circle r="3" fill={color}>
      <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`}>
        <mpath href={`#${pathD}`} />
      </animateMotion>
    </motion.circle>
    {/* Inner bright core */}
    <motion.circle r="1.5" fill="white" opacity="0.9">
      <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`}>
        <mpath href={`#${pathD}`} />
      </animateMotion>
    </motion.circle>
  </>
);

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
            EduVista separates biometric processing from data storage. A dedicated AI service handles face detection and matching; your database only stores metadata and attendance records.
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

        {/* Right - Architecture diagram with flowing packets */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center"
        >
          <svg className="w-full max-w-sm" viewBox="0 0 400 280" fill="none">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Paths for packets to follow */}
              <path id="path-photo-ai" d="M 100 60 C 140 60 160 60 200 60" />
              <path id="path-ai-db" d="M 280 60 C 310 60 330 100 340 140" />
              <path id="path-photo-down" d="M 80 80 C 80 120 80 160 80 200" />
            </defs>

            {/* ── Photo Node ── */}
            <motion.g
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 }}
            >
              <rect x="30" y="20" width="100" height="80" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <text x="80" y="52" textAnchor="middle" fontSize="22">📷</text>
              <text x="80" y="72" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.6)" fontWeight="600">Class Photo</text>
              <text x="80" y="86" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)">Upload / Capture</text>
            </motion.g>

            {/* ── AI Node ── */}
            <motion.g
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.5 }}
            >
              <rect x="170" y="20" width="120" height="80" rx="14" fill="rgba(0,194,255,0.06)" stroke="rgba(0,194,255,0.25)" strokeWidth="1" />
              {/* Pulsing glow */}
              <motion.rect
                x="170" y="20" width="120" height="80" rx="14"
                fill="none"
                stroke="rgba(0,194,255,0.15)"
                strokeWidth="2"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <text x="230" y="50" textAnchor="middle" fontSize="20">☁️</text>
              <text x="230" y="68" textAnchor="middle" fontSize="9" fill="hsl(195 100% 50%)" fontWeight="700">Luxand Cloud AI</text>
              <text x="230" y="82" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)">Embeddings stored here</text>
            </motion.g>

            {/* ── Database Node ── */}
            <motion.g
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.7 }}
            >
              <rect x="270" y="140" width="110" height="80" rx="14" fill="rgba(255,107,43,0.06)" stroke="rgba(255,107,43,0.25)" strokeWidth="1" />
              <motion.rect
                x="270" y="140" width="110" height="80" rx="14"
                fill="none"
                stroke="rgba(255,107,43,0.15)"
                strokeWidth="2"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              />
              <text x="325" y="172" textAnchor="middle" fontSize="20">🗄️</text>
              <text x="325" y="190" textAnchor="middle" fontSize="9" fill="hsl(18 100% 58%)" fontWeight="700">Database</text>
              <text x="325" y="204" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)">Metadata only</text>
            </motion.g>

            {/* ── Attendance Node ── */}
            <motion.g
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.9 }}
            >
              <rect x="20" y="170" width="110" height="70" rx="14" fill="rgba(0,229,160,0.06)" stroke="rgba(0,229,160,0.2)" strokeWidth="1" />
              <text x="75" y="200" textAnchor="middle" fontSize="18">📋</text>
              <text x="75" y="218" textAnchor="middle" fontSize="8" fill="hsl(160 100% 45%)" fontWeight="600">Records</text>
              <text x="75" y="230" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)">CSV / Sheet</text>
            </motion.g>

            {/* ── Connection Lines ── */}
            {/* Photo → AI */}
            <line x1="130" y1="60" x2="170" y2="60" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="4 3" />
            {/* AI → DB */}
            <path d="M 290 100 C 310 110 330 125 330 140" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
            {/* Photo → Records */}
            <line x1="75" y1="100" x2="75" y2="170" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="4 3" />
            {/* DB → Records */}
            <line x1="270" y1="200" x2="130" y2="200" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="4 3" />

            {/* ── Animated flowing packets ── */}
            {/* Photo → AI packets */}
            {[0, 1.2, 2.4].map((delay, i) => (
              <React.Fragment key={`pa-${i}`}>
                <circle r="3" fill="hsl(195 100% 50%)">
                  <animateMotion dur="2s" repeatCount="indefinite" begin={`${delay}s`}>
                    <mpath href="#path-photo-ai" />
                  </animateMotion>
                </circle>
                <circle r="1.2" fill="white" opacity="0.8">
                  <animateMotion dur="2s" repeatCount="indefinite" begin={`${delay}s`}>
                    <mpath href="#path-photo-ai" />
                  </animateMotion>
                </circle>
              </React.Fragment>
            ))}

            {/* AI → DB packets */}
            {[0.5, 1.8, 3.0].map((delay, i) => (
              <React.Fragment key={`ad-${i}`}>
                <circle r="3" fill="hsl(18 100% 58%)">
                  <animateMotion dur="2.5s" repeatCount="indefinite" begin={`${delay}s`}>
                    <mpath href="#path-ai-db" />
                  </animateMotion>
                </circle>
                <circle r="1.2" fill="white" opacity="0.8">
                  <animateMotion dur="2.5s" repeatCount="indefinite" begin={`${delay}s`}>
                    <mpath href="#path-ai-db" />
                  </animateMotion>
                </circle>
              </React.Fragment>
            ))}

            {/* Photo → Records packets */}
            {[0.3, 1.6].map((delay, i) => (
              <React.Fragment key={`pr-${i}`}>
                <circle r="2.5" fill="hsl(160 100% 45%)">
                  <animateMotion dur="2s" repeatCount="indefinite" begin={`${delay}s`}>
                    <mpath href="#path-photo-down" />
                  </animateMotion>
                </circle>
                <circle r="1" fill="white" opacity="0.8">
                  <animateMotion dur="2s" repeatCount="indefinite" begin={`${delay}s`}>
                    <mpath href="#path-photo-down" />
                  </animateMotion>
                </circle>
              </React.Fragment>
            ))}

            {/* Label on the link */}
            <text x="230" y="122" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.2)" fontStyle="italic">biometric_ref_id</text>
          </svg>
        </motion.div>
      </div>
    </section>
  );
};

export default SecuritySection;
