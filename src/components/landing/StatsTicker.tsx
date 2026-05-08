import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import CountUp from '@/components/CountUp';

const stats = [
  { value: 99.5, suffix: '%', label: 'Maximum Face Match Accuracy (Luxand AI)' },
  { value: 2, prefix: '< ', suffix: ' sec', label: 'Avg. Recognition Latency' },
  { value: 30, prefix: '', suffix: '+ faces', label: 'Detected Per Photo' },
  { value: 256, suffix: '-bit', label: 'AES Encryption In Transit' },
];

const StatsTicker: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="relative border-y border-white/[0.05]"
      style={{ background: '#112240' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="text-center relative">
            <div className="text-3xl sm:text-4xl font-extrabold text-primary">
              {isInView ? (
                <CountUp end={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              ) : (
                <span>0</span>
              )}
            </div>
            <div className="text-xs sm:text-sm text-white/50 mt-1 font-medium">{stat.label}</div>
            {i < stats.length - 1 && (
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 bg-white/[0.08]" />
            )}
          </div>
        ))}
      </div>
    </motion.section>
  );
};

export default StatsTicker;
