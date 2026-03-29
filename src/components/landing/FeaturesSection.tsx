import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Bot, FolderUp, Shield, BarChart3, Download, Lock } from 'lucide-react';

const features = [
  { icon: Bot, color: 'text-primary', bg: 'bg-primary/10', title: 'Azure AI Face Recognition', desc: 'Detects and identifies all student faces from uploaded classroom photos. Any image format accepted.' },
  { icon: FolderUp, color: 'text-secondary', bg: 'bg-secondary/10', title: 'IoT Dataset Upload', desc: 'Upload RFID-generated CSV or Google Sheet from your hardware. Column mapping and validation built in.' },
  { icon: Shield, color: 'text-success', bg: 'bg-success/10', title: 'Split Security Architecture', desc: 'Student metadata in Supabase. Face embeddings exclusively in Azure. Biometrics never touch your database.' },
  { icon: BarChart3, color: 'text-secondary', bg: 'bg-secondary/10', title: 'Real-Time Analytics', desc: 'Live attendance trends, department-wise charts, heatmap calendars, and instant low-attendance alerts.' },
  { icon: Download, color: 'text-primary', bg: 'bg-primary/10', title: 'Dual Export Always', desc: 'Every session instantly available as CSV download and Google Sheet push with one click.' },
  { icon: Lock, color: 'text-success', bg: 'bg-success/10', title: 'Role-Based Access', desc: 'Admin controls the institution. Faculty manages their sessions. Fully isolated with Row-Level Security.' },
];

const FeaturesSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="features" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">Everything Built In</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">A complete attendance management system, from face detection to export.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon className={`w-6 h-6 ${f.color}`} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
