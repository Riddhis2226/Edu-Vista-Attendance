import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AuthLayout from '@/layouts/AuthLayout';
import FloatingInput from '@/components/FloatingInput';
import eduvistaLogo from '@/assets/eduvista-logo.png';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  // Check for recovery token in URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('type=recovery')) {
      // No recovery token — user might have navigated here directly
      // We'll still show the form; supabase.auth.updateUser will fail if no session
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setError(true);
      setTimeout(() => setError(false), 1500);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      setError(true);
      setTimeout(() => setError(false), 1500);
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      toast.error(err.message);
      setError(true);
      setTimeout(() => setError(false), 1500);
    } else {
      setSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/login'), 2500);
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
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="text-sm text-muted-foreground">Enter your new password below</p>
        </div>

        {success ? (
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
              <CheckCircle2 className="w-16 h-16 text-success" />
            </motion.div>
            <p className="text-foreground font-semibold">Password Updated!</p>
            <p className="text-sm text-muted-foreground">Redirecting to login…</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatingInput
              id="new-password"
              label="New Password"
              type="password"
              value={password}
              onChange={setPassword}
              error={error}
              showToggle
            />
            <FloatingInput
              id="confirm-password"
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={error}
              showToggle
            />

            <motion.button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-orange-600 btn-shimmer transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,43,0.3)] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating…
                </>
              ) : (
                'Update Password'
              )}
            </motion.button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
