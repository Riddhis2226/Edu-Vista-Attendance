import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, Upload, Cpu, CheckCircle2, FileSpreadsheet, ChevronLeft, ChevronRight, Users, ScanFace, BarChart3 } from 'lucide-react';

const steps = [
  {
    title: 'Capture & Upload',
    description: 'A faculty member takes a photo of the classroom or collects RFID data from IoT devices. Upload directly through the EduVista dashboard.',
    icon: Camera,
    color: 'primary',
    visual: 'upload',
  },
  {
    title: 'AI Face Detection',
    description: 'Azure Face API scans the uploaded image, detecting and identifying every student face with 95%+ accuracy in under 2 seconds.',
    icon: ScanFace,
    color: 'secondary',
    visual: 'detect',
  },
  {
    title: 'Match & Verify',
    description: 'Detected faces are matched against enrolled students using azure_person_id. Each match returns a confidence score for verification.',
    icon: Users,
    color: 'success',
    visual: 'match',
  },
  {
    title: 'Generate Records',
    description: 'Attendance records are automatically created — Present, Absent, or Unrecognized — with full audit trails stored securely.',
    icon: CheckCircle2,
    color: 'primary',
    visual: 'records',
  },
  {
    title: 'Export Anywhere',
    description: 'Download as CSV or push directly to Google Sheets with one click. Every session is exportable and shareable instantly.',
    icon: FileSpreadsheet,
    color: 'secondary',
    visual: 'export',
  },
];

const colorMap: Record<string, string> = {
  primary: 'bg-primary/15 text-primary border-primary/20',
  secondary: 'bg-secondary/15 text-secondary border-secondary/20',
  success: 'bg-success/15 text-success border-success/20',
};

const glowMap: Record<string, string> = {
  primary: 'rgba(255,107,43,0.15)',
  secondary: 'rgba(0,194,255,0.15)',
  success: 'rgba(0,229,160,0.15)',
};

const UploadVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.div
      animate={{ y: [-4, 4, -4] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className="w-48 h-32 rounded-xl bg-white/[0.04] border border-dashed border-primary/30 flex flex-col items-center justify-center gap-2"
    >
      <Upload className="w-8 h-8 text-primary/60" />
      <span className="text-xs text-white/40">Drop photo here</span>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '60%' }}
        transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
        className="h-1 rounded-full bg-primary/40"
      />
    </motion.div>
  </div>
);

const DetectVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <div className="relative w-48 h-32 rounded-xl bg-white/[0.04] border border-secondary/20 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-2 p-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.2, duration: 0.4 }}
            className="rounded-md border-2 border-secondary/50 bg-secondary/5 flex items-center justify-center"
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              className="w-3 h-3 rounded-full bg-secondary/40"
            />
          </motion.div>
        ))}
      </div>
      <motion.div
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 right-0 h-0.5 bg-secondary/60"
        style={{ boxShadow: '0 0 12px rgba(0,194,255,0.5)' }}
      />
    </div>
  </div>
);

const MatchVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center gap-4">
    {[
      { name: 'Alice', conf: '98%' },
      { name: 'Bob', conf: '95%' },
      { name: 'Carol', conf: '97%' },
    ].map((s, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 + i * 0.25 }}
        className="flex flex-col items-center gap-1"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          className="w-10 h-10 rounded-full bg-success/10 border border-success/30 flex items-center justify-center"
        >
          <CheckCircle2 className="w-5 h-5 text-success" />
        </motion.div>
        <span className="text-[10px] text-white/60">{s.name}</span>
        <span className="text-[10px] text-success font-bold">{s.conf}</span>
      </motion.div>
    ))}
  </div>
);

const RecordsVisual = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-52 space-y-1.5">
      {['Present', 'Present', 'Absent', 'Present'].map((status, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + i * 0.15 }}
          className="flex items-center justify-between bg-white/[0.03] rounded px-2 py-1"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white/10" />
            <div className="w-16 h-1.5 bg-white/10 rounded" />
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${status === 'Present' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
            {status}
          </span>
        </motion.div>
      ))}
    </div>
  </div>
);

const ExportVisual = () => (
  <div className="w-full h-full flex items-center justify-center gap-6">
    {[
      { label: 'CSV', icon: '📄' },
      { label: 'Google Sheet', icon: '📊' },
    ].map((exp, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 + i * 0.2 }}
        className="flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
          className="w-14 h-14 rounded-xl bg-white/[0.04] border border-secondary/20 flex items-center justify-center text-2xl"
        >
          {exp.icon}
        </motion.div>
        <span className="text-[10px] text-white/60">{exp.label}</span>
      </motion.div>
    ))}
  </div>
);

const visuals: Record<string, React.FC> = {
  upload: UploadVisual,
  detect: DetectVisual,
  match: MatchVisual,
  records: RecordsVisual,
  export: ExportVisual,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DemoWalkthroughModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const [current, setCurrent] = useState(0);
  const step = steps[current];
  const Icon = step.icon;
  const Visual = visuals[step.visual];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden">
        <div className="relative">
          {/* Glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{ background: `radial-gradient(circle at 50% 30%, ${glowMap[step.color]}, transparent 70%)` }}
          />

          <div className="relative p-6 sm:p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${colorMap[step.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={current}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    {step.title}
                  </motion.span>
                </AnimatePresence>
              </DialogTitle>
              <DialogDescription className="sr-only">Interactive walkthrough step {current + 1} of {steps.length}</DialogDescription>
            </DialogHeader>

            {/* Visual area */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="h-40 sm:h-48 rounded-xl bg-white/[0.02] border border-white/5 mb-6"
              >
                <Visual />
              </motion.div>
            </AnimatePresence>

            {/* Description */}
            <AnimatePresence mode="wait">
              <motion.p
                key={current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground leading-relaxed mb-6"
              >
                {step.description}
              </motion.p>
            </AnimatePresence>

            {/* Progress & navigation */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-primary' : 'w-1.5 bg-white/15 hover:bg-white/25'}`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrent(Math.max(0, current - 1))}
                  disabled={current === 0}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (current === steps.length - 1) {
                      onOpenChange(false);
                      setCurrent(0);
                    } else {
                      setCurrent(current + 1);
                    }
                  }}
                  className="px-4 h-8 rounded-full bg-primary/15 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/25 transition-all"
                >
                  {current === steps.length - 1 ? 'Done' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoWalkthroughModal;
