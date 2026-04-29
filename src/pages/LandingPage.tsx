import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import StatsTicker from '@/components/landing/StatsTicker';
import DemoSection from '@/components/landing/DemoSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import SecuritySection from '@/components/landing/SecuritySection';
import TrustSection from '@/components/landing/TrustSection';
import TechnologySection from '@/components/landing/TechnologySection';
import LandingFooter from '@/components/landing/LandingFooter';

const LandingPage: React.FC = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      navigate(role === 'admin' ? '/admin' : '/faculty', { replace: true });
    }
  }, [user, role, loading, navigate]);

  if (loading) return null;
  if (user && role) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>
      {/* Fixed background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,107,43,0.06), transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,194,255,0.05), transparent 70%)' }} />
      </div>

      <div className="relative z-10">
        <LandingNavbar />
        <HeroSection />
        <StatsTicker />
        <DemoSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SecuritySection />
        <TrustSection />
        <TechnologySection />
        <LandingFooter />
      </div>
    </div>
  );
};

export default LandingPage;
