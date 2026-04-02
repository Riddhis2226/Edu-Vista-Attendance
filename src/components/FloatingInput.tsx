import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  showToggle?: boolean;
}

const FloatingInput = forwardRef<HTMLDivElement, FloatingInputProps>(
  ({ id, label, type = 'text', value, onChange, error, showToggle }, ref) => {
    const [focused, setFocused] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const active = focused || value.length > 0;
    const inputType = showToggle ? (showPw ? 'text' : 'password') : type;

    return (
      <div className="relative" ref={ref}>
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
  }
);

FloatingInput.displayName = 'FloatingInput';

export default FloatingInput;
