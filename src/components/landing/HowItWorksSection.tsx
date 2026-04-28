import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Camera, Upload, Cpu, CheckCircle2, FileSpreadsheet, Cloud, ScanFace, Database } from 'lucide-react';

const photoSteps = [
  { icon: Camera, label: 'Capture class photo' },
  { icon: Upload, label: 'Upload to EduVista' },
  { icon: Cpu, label: 'AI detects faces' },
  { icon: CheckCircle2, label: 'Match to enrolled students' },
  { icon: FileSpreadsheet, label: 'Export attendance' },
];

const datasetSteps = [
  { icon: Cpu, label: 'IoT device records RFID' },
  { icon: FileSpreadsheet, label: 'Generate CSV file' },
  { icon: Upload, label: 'Upload to EduVista' },
  { icon: CheckCircle2, label: 'Validate & map columns' },
  { icon: FileSpreadsheet, label: 'Export to Google Sheet' },
];

const StepList: React.FC<{ steps: typeof photoSteps; color: string }> = ({ steps, color }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div ref={ref} className="space-y-4">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: i * 0.12, duration: 0.4 }}
          className="flex items-center gap-4"
        >
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color === 'primary' ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'}`}>
              <step.icon className="w-5 h-5" />
            </div>
            {i < steps.length - 1 && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : {}}
                transition={{ delay: i * 0.12 + 0.2, duration: 0.3 }}
                className={`absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-4 origin-top ${color === 'primary' ? 'bg-primary/30' : 'bg-secondary/30'}`}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${color === 'primary' ? 'text-primary' : 'text-secondary'}`}>{i + 1}.</span>
            <span className="text-sm text-white/70">{step.label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/* Animated flow illustration for Photo method */
const PhotoFlowIllustration: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  const nodes = [
    { icon: Camera, label: 'Photo', color: 'primary' },
    { icon: Cloud, label: 'AI Engine', color: 'secondary' },
    { icon: ScanFace, label: 'Detect', color: 'secondary' },
    { icon: CheckCircle2, label: 'Match', color: 'success' },
  ];

  return (
    <motion.div ref={ref} style={{ y: parallaxY }} className="bg-white/[0.03] rounded-2xl p-6 border border-primary/10 relative overflow-hidden">
      <div className="text-center mb-5">
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">📷 Photo Method</span>
      </div>

      {/* Animated node flow */}
      <div className="flex items-center justify-between px-2 py-4 relative">
        {/* Connecting line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          className="absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-primary/40 via-secondary/40 to-success/40 origin-left"
          style={{ transform: 'translateY(-50%)' }}
        />

        {nodes.map((node, i) => {
          const colorClasses = {
            primary: 'bg-primary/15 text-primary border-primary/20',
            secondary: 'bg-secondary/15 text-secondary border-secondary/20',
            success: 'bg-success/15 text-success border-success/20',
          }[node.color];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="relative z-10 flex flex-col items-center gap-1.5"
            >
              <motion.div
                animate={inView ? { boxShadow: [`0 0 0px ${node.color === 'primary' ? 'rgba(255,107,43,0)' : node.color === 'secondary' ? 'rgba(0,194,255,0)' : 'rgba(0,229,160,0)'}`, `0 0 15px ${node.color === 'primary' ? 'rgba(255,107,43,0.3)' : node.color === 'secondary' ? 'rgba(0,194,255,0.3)' : 'rgba(0,229,160,0.3)'}`, `0 0 0px ${node.color === 'primary' ? 'rgba(255,107,43,0)' : node.color === 'secondary' ? 'rgba(0,194,255,0)' : 'rgba(0,229,160,0)'}`] } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                className={`w-11 h-11 rounded-full flex items-center justify-center border ${colorClasses}`}
              >
                <node.icon className="w-5 h-5" />
              </motion.div>
              <span className="text-[10px] text-white/50 font-medium">{node.label}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Traveling data packets */}
      {inView && [0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ left: ['5%', '90%'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: 'linear' }}
          className="absolute top-[58%] w-1.5 h-1.5 rounded-full bg-primary"
          style={{ boxShadow: '0 0 6px rgba(255,107,43,0.6)' }}
        />
      ))}
    </motion.div>
  );
};

/* Animated flow illustration for Dataset method */
const DatasetFlowIllustration: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  const nodes = [
    { icon: Cpu, label: 'RFID', color: 'secondary' },
    { icon: FileSpreadsheet, label: 'CSV', color: 'secondary' },
    { icon: Database, label: 'Validate', color: 'primary' },
    { icon: CheckCircle2, label: 'Export', color: 'success' },
  ];

  return (
    <motion.div ref={ref} style={{ y: parallaxY }} className="bg-white/[0.03] rounded-2xl p-6 border border-secondary/10 relative overflow-hidden">
      <div className="text-center mb-5">
        <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold">📂 Dataset Method</span>
      </div>

      <div className="flex items-center justify-between px-2 py-4 relative">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          className="absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-secondary/40 via-primary/40 to-success/40 origin-left"
          style={{ transform: 'translateY(-50%)' }}
        />

        {nodes.map((node, i) => {
          const colorClasses = {
            primary: 'bg-primary/15 text-primary border-primary/20',
            secondary: 'bg-secondary/15 text-secondary border-secondary/20',
            success: 'bg-success/15 text-success border-success/20',
          }[node.color];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="relative z-10 flex flex-col items-center gap-1.5"
            >
              <motion.div
                animate={inView ? { boxShadow: [`0 0 0px rgba(0,194,255,0)`, `0 0 15px rgba(0,194,255,0.3)`, `0 0 0px rgba(0,194,255,0)`] } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                className={`w-11 h-11 rounded-full flex items-center justify-center border ${colorClasses}`}
              >
                <node.icon className="w-5 h-5" />
              </motion.div>
              <span className="text-[10px] text-white/50 font-medium">{node.label}</span>
            </motion.div>
          );
        })}
      </div>

      {inView && [0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ left: ['5%', '90%'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: 'linear' }}
          className="absolute top-[58%] w-1.5 h-1.5 rounded-full bg-secondary"
          style={{ boxShadow: '0 0 6px rgba(0,194,255,0.6)' }}
        />
      ))}
    </motion.div>
  );
};

const HowItWorksSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const headingY = useTransform(scrollYProgress, [0, 1], [40, -20]);

  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative overflow-hidden">
      {/* Parallax background accents */}
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, -60]) }}
        className="absolute top-20 right-0 w-72 h-72 rounded-full pointer-events-none"
        aria-hidden
      >
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,107,43,0.06), transparent 70%)' }} />
      </motion.div>
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, -40]) }}
        className="absolute bottom-20 left-0 w-60 h-60 rounded-full pointer-events-none"
        aria-hidden
      >
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,194,255,0.05), transparent 70%)' }} />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <motion.div style={{ y: headingY }} className="text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15 }}
            className="text-muted-foreground max-w-lg mx-auto"
          >
            Two powerful methods, one simple workflow.
          </motion.p>
        </motion.div>

        <div className="space-y-16">
          {/* Photo method */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <PhotoFlowIllustration />
            <StepList steps={photoSteps} color="primary" />
          </div>

          {/* Dataset method */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <StepList steps={datasetSteps} color="secondary" />
            </div>
            <div className="order-1 md:order-2">
              <DatasetFlowIllustration />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
