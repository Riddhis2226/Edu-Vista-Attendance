import React from 'react';
import { motion } from 'framer-motion';

const techs = [
  '🧠 Luxand Cloud AI',
  '⚛️ React + TypeScript',
  '🟠 Supabase',
  '🔐 Row-Level Security',
  '📊 Google Sheets API',
  '🎨 Tailwind CSS',
  '🧩 shadcn/ui',
  '📡 ESP32 + RC522 RFID',
  '⚡ Edge Functions',
  '🎞️ Framer Motion',
];

const TechnologySection: React.FC = () => (
  <section id="technology" className="py-20 sm:py-28 relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">Built With</h2>
    </div>

    <div className="relative group">
      <div className="flex gap-4 animate-marquee hover:[animation-play-state:paused]">
        {[...techs, ...techs].map((tech, i) => (
          <div
            key={i}
            className="flex-shrink-0 px-5 py-2.5 bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-full text-sm font-medium text-white/70 whitespace-nowrap transition-all duration-200 hover:scale-110 hover:border-primary/40 hover:text-white hover:bg-white/[0.08]"
          >
            {tech}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TechnologySection;
