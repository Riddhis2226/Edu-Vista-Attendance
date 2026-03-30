import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AuthLayout from '@/layouts/AuthLayout';
import eduvistaLogo from '@/assets/eduvista-logo.png';

/* ── Floating label input ── */
const FloatingInput: React.FC<{
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  showToggle?: boolean;
}> = ({ id, label, type = 'text', value, onChange, error, showToggle }) => {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const active = focused || value.length > 0;
  const inputType = showToggle ? (showPw ? 'text' : 'password') : type;

  return (
    <div className="relative">
      <input
        id={id}
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required
        className={`
          peer w-full px-4 pt-5 pb-2 rounded-xl text-sm text-foreground
          bg-white/[0.04] border backdrop-blur-md
          outline-none transition-all duration-300
          ${error
            ? 'border-destructive shadow-[0_0_15px_rgba(255,50,50,0.15)] animate-shake'
            : focused
              ? 'border-primary shadow-[0_0_20px_rgba(255,107,43,0.15)]'
              : 'border-white/10 hover:border-white/20'
          }
        `}
      />
      <label
        htmlFor={id}
        className={`
          absolute left-4 transition-all duration-200 pointer-events-none
          ${active
            ? 'top-1.5 text-[10px] text-primary font-medium'
            : 'top-3.5 text-sm text-muted-foreground'
          }
        `}
      >
        {label}
      </label>
      {showToggle && (
        <button
          type="button"
          onClick={() => setShowPw(!showPw)}
          className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const { signIn, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'faculty') navigate('/faculty');
  }, [role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) {
      setLoading(false);
      setError(true);
      toast.error('Invalid credentials. Please try again.');
      setTimeout(() => setError(false), 1500);
    } else {
      setLoading(false);
      setSuccess(true);
    }
  };

  return (
    <AuthLayout>
      <div className="glass-card p-8 space-y-6">
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
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Login to access your dashboard</p>
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
            <p className="text-foreground font-semibold">Authenticated!</p>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard…</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatingInput
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              error={error}
            />
            <FloatingInput
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              error={error}
              showToggle
            />

            <div className="flex justify-end">
              <button type="button" className="text-xs text-muted-foreground hover:text-primary transition-colors relative group">
                Forgot Password?
                <span className="absolute bottom-0 left-0 w-full h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-orange-600 btn-shimmer transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,43,0.3)] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating…
                </>
              ) : (
                'Login'
              )}
            </motion.button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign up →
          </Link>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          {['🔒 Secured Auth', '🤖 AI Powered', '🛡️ No local biometrics'].map((s) => (
            <span key={s} className="text-[10px] text-white/30">{s}</span>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
