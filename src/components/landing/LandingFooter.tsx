import React from 'react';
import { Link } from 'react-router-dom';
import eduvistaLogo from '@/assets/eduvista-logo.png';

const LandingFooter: React.FC = () => (
  <footer className="relative border-t border-transparent pt-12 pb-6" style={{ borderImage: 'linear-gradient(90deg, transparent, rgba(255,107,43,0.4), transparent) 1' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid sm:grid-cols-3 gap-8 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <img src={eduvistaLogo} alt="EduVista" className="h-7 w-auto" />
            <span className="text-base font-bold text-foreground">EduVista</span>
          </div>
          <p className="text-xs text-muted-foreground">AI-Powered Smart Attendance System</p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 items-start">
          {['#features', '#how-it-works', '#demo', '#technology'].map((href) => (
            <a key={href} href={href} className="text-sm text-white/50 hover:text-primary transition-colors relative group">
              {href.replace('#', '').replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
            </a>
          ))}
          <Link to="/login" className="text-sm text-white/50 hover:text-primary transition-colors relative group">
            Login
            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
          </Link>
        </div>

        <div className="text-sm text-white/30 sm:text-right">
          Built with React & Supabase
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-4 text-center text-xs text-white/25">
        © 2025 EduVista — Final Year Major Project
      </div>
    </div>
  </footer>
);

export default LandingFooter;
