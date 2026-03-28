import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        className="text-center space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block"
        >
          <div className="h-24 w-24 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <GraduationCap className="h-14 w-14 text-primary opacity-50" />
          </div>
        </motion.div>
        <h1 className="text-8xl font-bold text-primary/30">404</h1>
        <div>
          <p className="text-xl font-semibold text-foreground">Page Not Found</p>
          <p className="text-muted-foreground mt-1">The page you're looking for doesn't exist.</p>
        </div>
        <Button onClick={() => navigate('/login')} className="btn-shimmer" size="lg">Back to Home</Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
