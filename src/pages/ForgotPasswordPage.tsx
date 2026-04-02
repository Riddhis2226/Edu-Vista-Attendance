import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AuthLayout from '@/layouts/AuthLayout';
import FloatingInput from '@/components/FloatingInput';
import eduvistaLogo from '@/assets/eduvista-logo.png';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <AuthLayout>
      <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </Link>
      <div className="glass-card p-8 space-y-6">
        <div className="text-center space-y-1">
          <motion.img
            src={eduvistaLogo}
            alt="EduVista"
            className="h-12 w-auto mx-auto mb-3 glow-pulse lg:hidden"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          />
          <h1 className="text-2xl font-bold text-foreground">Forgot Password</h1>
          <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
        </div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            >
              <Mail className="w-16 h-16 text-primary" />
            </motion.div>
            <p className="text-foreground font-semibold">Check Your Email</p>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              We've sent a password reset link to <span className="text-foreground font-medium">{email}</span>. Check your inbox and spam folder.
            </p>
            <Link
              to="/login"
              className="mt-4 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              ← Back to Login
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatingInput
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
            />

            <motion.button
              type="submit"
              disabled={loading || !email}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-orange-600 btn-shimmer transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,43,0.3)] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                'Send Reset Link'
              )}
            </motion.button>
          </form>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Login →
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
