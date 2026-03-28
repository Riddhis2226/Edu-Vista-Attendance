import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

interface Step {
  label: string;
  status: 'pending' | 'active' | 'done';
}

interface StepProgressProps {
  steps: Step[];
}

const StepProgress: React.FC<StepProgressProps> = ({ steps }) => {
  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <motion.div
              className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                step.status === 'done'
                  ? 'bg-success border-success'
                  : step.status === 'active'
                  ? 'border-primary bg-primary/20'
                  : 'border-muted bg-muted/20'
              }`}
              animate={step.status === 'done' ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {step.status === 'done' && <Check className="h-4 w-4 text-success-foreground" />}
              {step.status === 'active' && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
            </motion.div>
            {i < steps.length - 1 && (
              <motion.div
                className="w-0.5 h-6"
                style={{
                  background: step.status === 'done' ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                }}
                animate={step.status === 'done' ? { scaleY: [0, 1] } : {}}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
          <span className={`text-sm ${step.status === 'done' ? 'text-success' : step.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StepProgress;
