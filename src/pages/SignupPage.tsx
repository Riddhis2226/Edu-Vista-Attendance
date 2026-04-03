import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, ShieldCheck, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AuthLayout from '@/layouts/AuthLayout';
import FloatingInput from '@/components/FloatingInput';
import eduvistaLogo from '@/assets/eduvista-logo.png';

/* ── Role card ── */
const RoleCard: React.FC<{
  role: 'admin' | 'faculty';
  selected: boolean;
  onSelect: () => void;
}> = ({ role, selected, onSelect }) => {
  const isAdmin = role === 'admin';
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex-1 p-4 rounded-xl border text-left transition-all duration-300
        ${selected
          ? isAdmin
            ? 'border-secondary bg-secondary/10 shadow-[0_0_25px_rgba(0,194,255,0.15)]'
            : 'border-primary bg-primary/10 shadow-[0_0_25px_rgba(255,107,43,0.15)]'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20'
        }
      `}
    >
      <motion.div
        animate={selected ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.4 }}
        className="mb-2"
      >
        {isAdmin ? (
          <ShieldCheck className={`w-6 h-6 ${selected ? 'text-secondary' : 'text-white/40'}`} />
        ) : (
          <BookOpen className={`w-6 h-6 ${selected ? 'text-primary' : 'text-white/40'}`} />
        )}
      </motion.div>
      <div className={`text-sm font-semibold ${selected ? 'text-foreground' : 'text-white/60'}`}>
        {isAdmin ? 'Admin' : 'Faculty'}
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5">
        {isAdmin ? 'Manage students, analytics & system' : 'Upload attendance & manage sessions'}
      </div>
    </motion.button>
  );
};

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'faculty'>('faculty');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState(false);
  const { signUp, role: authRole, user } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect once role is resolved after signup
  useEffect(() => {
    if (success && user && authRole) {
      const target = authRole === 'admin' ? '/admin' : '/faculty';
      const timer = setTimeout(() => navigate(target, { replace: true }), 1200);
      return () => clearTimeout(timer);
    }
  }, [success, user, authRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPw) {
      setFieldError(true);
      toast.error('Passwords do not match.');
      setTimeout(() => setFieldError(false), 1500);
      return;
    }
    if (password.length < 6) {
      setFieldError(true);
      toast.error('Password must be at least 6 characters.');
      setTimeout(() => setFieldError(false), 1500);
      return;
    }
    setFieldError(false);
    setLoading(true);
    const { error } = await signUp(email, password, name, selectedRole);
    setLoading(false);
    if (error) {
      setFieldError(true);
      toast.error(error.message || 'Signup failed. Please try again.');
      setTimeout(() => setFieldError(false), 1500);
    } else {
      setSuccess(true);
      toast.success('Account created! Redirecting to dashboard…');
    }
  };

  return (
    <AuthLayout>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
      <div className="glass-card p-8 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <motion.img
            src={eduvistaLogo}
            alt="EduVista"
            className="h-12 w-auto mx-auto mb-3 glow-pulse lg:hidden"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          />
          <h1 className="text-2xl font-bold text-foreground">Create Your Account</h1>
          <p className="text-sm text-muted-foreground">Set up EduVista for your institution</p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              >
                <CheckCircle2 className="w-16 h-16 text-success" />
              </motion.div>
              <p className="text-foreground font-semibold text-lg">Account Created!</p>
              <p className="text-sm text-muted-foreground text-center">
                Redirecting to your {selectedRole === 'admin' ? 'Admin' : 'Faculty'} dashboard…
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Setting up your workspace</span>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="space-y-3"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FloatingInput id="name" label="Full Name" value={name} onChange={setName} error={fieldError} />
              <FloatingInput id="email" label="Email Address" type="email" value={email} onChange={setEmail} error={fieldError} />
              <FloatingInput id="password" label="Password" type="password" value={password} onChange={setPassword} error={fieldError} showToggle />
              <FloatingInput id="confirm-pw" label="Confirm Password" type="password" value={confirmPw} onChange={setConfirmPw} error={fieldError} showToggle />

              {/* Role selector */}
              <div className="space-y-2 pt-1">
                <label className="text-xs text-muted-foreground font-medium">Select Your Role</label>
                <div className="flex gap-3">
                  <RoleCard role="admin" selected={selectedRole === 'admin'} onSelect={() => setSelectedRole('admin')} />
                  <RoleCard role="faculty" selected={selectedRole === 'faculty'} onSelect={() => setSelectedRole('faculty')} />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-orange-600 btn-shimmer transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,43,0.3)] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account…
                  </>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        {!success && (
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Login →
            </Link>
          </div>
        )}

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-4 pt-1">
          {['🔒 Secured Auth', '🤖 AI Powered', '🛡️ No local biometrics'].map((s) => (
            <span key={s} className="text-[10px] text-white/30">{s}</span>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
