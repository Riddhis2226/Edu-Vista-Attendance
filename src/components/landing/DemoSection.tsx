import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';

const AdminTile: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="group relative rounded-3xl overflow-hidden min-h-[480px] flex flex-col transition-all duration-500 hover:scale-[1.02]"
      style={{
        background: 'linear-gradient(135deg, rgba(0,194,255,0.08), rgba(0,229,160,0.04))',
        border: '1px solid rgba(0,194,255,0.2)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,194,255,0.5)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 60px rgba(0,194,255,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,194,255,0.2)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2.5 py-1 rounded-full bg-secondary/20 text-secondary text-[11px] font-bold uppercase tracking-wider">Admin</span>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-1">Administrator Dashboard</h3>
        <p className="text-sm text-muted-foreground mb-5">Full institutional control</p>

        {/* Mini preview */}
        <div className="bg-white/[0.03] rounded-xl p-4 flex-1 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Students', val: '248' },
              { label: 'Faculty', val: '12' },
              { label: 'Today', val: '87%' },
              { label: 'Sessions', val: '5' },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.04] rounded-lg p-2 text-center">
                <div className="text-xs font-bold text-secondary">{inView ? s.val : '0'}</div>
                <div className="text-[9px] text-white/40">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Mini chart */}
          <div className="flex items-end gap-1 h-16 bg-white/[0.02] rounded-lg p-2">
            {[55, 72, 45, 88, 63, 91, 50].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={inView ? { height: `${h}%` } : {}}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                className="flex-1 rounded-t bg-gradient-to-t from-secondary/30 to-secondary/70"
              />
            ))}
          </div>

          {/* Mini table */}
          <div className="space-y-1.5">
            {['Alice Johnson', 'Bob Smith', 'Carol Lee'].map((name, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white/[0.02] rounded text-[10px]">
                <div className="w-4 h-4 rounded-full bg-white/10" />
                <span className="text-white/60 flex-1">{name}</span>
                <span className="text-white/30">EN00{i + 1}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${i < 2 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                  {i < 2 ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>

          {/* Alert */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/[0.08] border border-warning/20">
            <span className="w-1.5 h-1.5 rounded-full bg-warning pulse-badge" />
            <span className="text-[10px] text-warning/80 font-medium">Low Attendance ⚠️ — 3 students below 75%</span>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <Link
            to="/login"
            className="block text-center px-5 py-2.5 border border-secondary/40 text-secondary text-sm font-medium rounded-lg transition-all duration-300 hover:bg-secondary hover:text-white"
          >
            Explore Admin Dashboard →
          </Link>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {['Student CSV Import', 'Face Enrollment', 'Attendance Logs', 'Faculty Management'].map((c) => (
              <span key={c} className="text-[9px] text-white/30 px-2 py-0.5 rounded-full border border-white/[0.06]">{c}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FacultyTile: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.25 }}
      className="group relative rounded-3xl overflow-hidden min-h-[480px] flex flex-col transition-all duration-500 hover:scale-[1.02]"
      style={{
        background: 'linear-gradient(135deg, rgba(255,107,43,0.08), rgba(255,209,102,0.04))',
        border: '1px solid rgba(255,107,43,0.2)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,107,43,0.5)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 60px rgba(255,107,43,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,107,43,0.2)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider">Faculty</span>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-1">Faculty Dashboard</h3>
        <p className="text-sm text-muted-foreground mb-5">Take attendance in seconds</p>

        <div className="bg-white/[0.03] rounded-xl p-4 flex-1 space-y-3">
          {/* Upload cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/[0.04] rounded-lg p-3 text-center">
              <div className="text-lg mb-1">📷</div>
              <div className="text-[10px] font-bold text-white/70">Photo Upload</div>
              <div className="mt-2 border border-dashed border-white/10 rounded p-2">
                <div className="w-full h-8 bg-white/[0.03] rounded relative overflow-hidden">
                  {/* Face boxes */}
                  <div className="absolute top-1 left-1 w-3 h-3 border border-primary/60 rounded-sm" />
                  <div className="absolute top-1 left-5 w-3 h-3 border border-primary/60 rounded-sm" />
                  <div className="absolute top-1 left-9 w-3 h-3 border border-primary/60 rounded-sm" />
                </div>
              </div>
            </div>
            <div className="bg-white/[0.04] rounded-lg p-3 text-center">
              <div className="text-lg mb-1">📂</div>
              <div className="text-[10px] font-bold text-white/70">Dataset Upload</div>
              <div className="mt-2 flex items-center justify-center gap-1">
                <div className="w-6 h-8 bg-white/[0.06] rounded border border-white/10 flex items-center justify-center text-[7px] text-white/40">.csv</div>
                <span className="px-1.5 py-0.5 rounded-full bg-success/15 text-success text-[8px] font-bold">Valid</span>
              </div>
            </div>
          </div>

          {/* Progress tracker */}
          <div className="flex items-center gap-1 px-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                  step < 3 ? 'bg-primary/30 text-primary' : step === 3 ? 'bg-primary text-white' : 'bg-white/10 text-white/30'
                }`}>
                  {step === 3 ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="inline-block">⟳</motion.span>
                  ) : step}
                </div>
                {step < 5 && <div className={`flex-1 h-0.5 ${step < 3 ? 'bg-primary/40' : 'bg-white/10'}`} />}
              </React.Fragment>
            ))}
          </div>
          <div className="text-[9px] text-primary/80 text-center font-medium">Step 3: Detecting Faces...</div>

          {/* Result table */}
          <div className="space-y-1">
            {[
              { name: 'Alice Johnson', enr: 'EN001', status: 'Present', color: 'success' },
              { name: 'Bob Smith', enr: 'EN002', status: 'Present', color: 'success' },
              { name: 'Carol Lee', enr: 'EN003', status: 'Absent', color: 'destructive' },
              { name: 'Unknown', enr: '—', status: 'Unrecognized', color: 'warning' },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white/[0.02] rounded text-[10px]">
                <span className="text-white/60 flex-1">{row.name}</span>
                <span className="text-white/30">{row.enr}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-${row.color}/15 text-${row.color}`}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <Link
            to="/login"
            className="block text-center px-5 py-2.5 border border-primary/40 text-primary text-sm font-medium rounded-lg transition-all duration-300 hover:bg-primary hover:text-white"
          >
            Explore Faculty Dashboard →
          </Link>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {['Photo AI Upload', 'IoT Dataset Upload', 'CSV Export', 'Google Sheet Export'].map((c) => (
              <span key={c} className="text-[9px] text-white/30 px-2 py-0.5 rounded-full border border-white/[0.06]">{c}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DemoSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="demo" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">Explore the Dashboard</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Two roles. One powerful system. Click either panel to explore.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 relative">
          <AdminTile />

          {/* OR divider */}
          <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex-col items-center justify-center z-10">
            <div className="flex-1 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-xs font-bold text-white/40 my-3">OR</div>
            <div className="flex-1 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          </div>

          <FacultyTile />
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
