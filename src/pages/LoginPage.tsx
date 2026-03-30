import React, { useState } from 'react';
import eduvistaLogo from '@/assets/eduvista-logo.png';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, role } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'faculty') navigate('/faculty');
  }, [role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error('Invalid credentials. Please try again.');
    }
  };

  const orbs = [
    { size: 200, color: 'hsl(18 100% 58% / 0.15)', x: '10%', y: '20%', delay: 0 },
    { size: 150, color: 'hsl(195 100% 50% / 0.1)', x: '70%', y: '10%', delay: 2 },
    { size: 180, color: 'hsl(160 100% 45% / 0.08)', x: '80%', y: '70%', delay: 4 },
    { size: 120, color: 'hsl(18 100% 58% / 0.1)', x: '20%', y: '80%', delay: 1 },
    { size: 100, color: 'hsl(195 100% 50% / 0.12)', x: '50%', y: '50%', delay: 3 },
    { size: 160, color: 'hsl(18 100% 58% / 0.08)', x: '40%', y: '15%', delay: 5 },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Floating orbs */}
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="orb"
          style={{
            width: orb.size,
            height: orb.size,
            background: orb.color,
            left: orb.x,
            top: orb.y,
            animationDelay: `${orb.delay}s`,
            animationDuration: `${8 + i * 2}s`,
          }}
        />
      ))}

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-card w-full max-w-md p-8 z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            className="glow-pulse mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <img src={eduvistaLogo} alt="EduVista" className="h-16 w-auto" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">EduVista</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-Powered Smart Attendance</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@eduvista.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-muted/50 border-border focus:border-primary transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-muted/50 border-border focus:border-primary transition-colors"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full btn-shimmer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
