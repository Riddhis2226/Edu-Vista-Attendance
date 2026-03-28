import React from 'react';
import { motion } from 'framer-motion';

const EmptyState: React.FC<{ message?: string }> = ({ message = 'No data found' }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-muted-foreground"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-4 opacity-50">
        <circle cx="60" cy="60" r="50" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="8 4" />
        <path d="M40 70 Q60 50 80 70" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="45" cy="50" r="3" fill="hsl(var(--muted-foreground))" />
        <circle cx="75" cy="50" r="3" fill="hsl(var(--muted-foreground))" />
      </svg>
      <p className="text-lg font-medium">{message}</p>
    </motion.div>
  );
};

export default EmptyState;
