import React from 'react';
import { motion } from 'framer-motion';

interface AttendanceRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  centerLabel?: React.ReactNode;
  subLabel?: string;
  delay?: number;
}

const ringColor = (pct: number) => {
  if (pct >= 75) return 'hsl(160, 100%, 45%)'; // success
  if (pct >= 40) return 'hsl(43, 100%, 70%)';  // warning/amber
  return 'hsl(195, 100%, 50%)';                 // secondary blue (low completion)
};

const AttendanceRing: React.FC<AttendanceRingProps> = ({
  percentage,
  size = 96,
  strokeWidth = 8,
  centerLabel,
  subLabel,
  delay = 0,
}) => {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(217, 30%, 20%)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor(clamped)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1, delay, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        {centerLabel && <div className="font-bold text-foreground leading-none">{centerLabel}</div>}
        {subLabel && <div className="text-[10px] text-muted-foreground mt-1">{subLabel}</div>}
      </div>
    </div>
  );
};

export default AttendanceRing;
