import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Camera, Upload, Cpu, CheckCircle2, FileSpreadsheet } from 'lucide-react';

const photoSteps = [
  { icon: Camera, label: 'Capture class photo' },
  { icon: Upload, label: 'Upload to EduVista' },
  { icon: Cpu, label: 'Azure detects faces' },
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

const HowItWorksSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">How It Works</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Two powerful methods, one simple workflow.</p>
        </motion.div>

        <div className="space-y-16">
          {/* Photo method */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6 }}
              className="bg-white/[0.03] rounded-2xl p-6 border border-primary/10"
            >
              <div className="text-center mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">📷 Photo Method</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-4">
                {['👤', '→', '☁️', '→', '📊', '→', '✅'].map((icon, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className={`text-xl ${icon === '→' ? 'text-primary/40' : ''}`}
                  >
                    {icon}
                  </motion.span>
                ))}
              </div>
            </motion.div>
            <StepList steps={photoSteps} color="primary" />
          </div>

          {/* Dataset method */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <StepList steps={datasetSteps} color="secondary" />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/[0.03] rounded-2xl p-6 border border-secondary/10 order-1 md:order-2"
            >
              <div className="text-center mb-4">
                <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold">📂 Dataset Method</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-4">
                {['📡', '→', '📄', '→', '☁️', '→', '📊'].map((icon, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    className={`text-xl ${icon === '→' ? 'text-secondary/40' : ''}`}
                  >
                    {icon}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
