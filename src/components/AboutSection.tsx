import React from 'react';
import { Compass, Sparkles, Coffee, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AboutSection: React.FC = () => {
  const { siteInfo } = useApp();

  const iconMap: Record<number, React.ReactNode> = {
    0: <Compass className="w-5 h-5 text-[#c59b67]" />,
    1: <ShieldCheck className="w-5 h-5 text-[#c59b67]" />,
    2: <Coffee className="w-5 h-5 text-[#c59b67]" />,
  };

  return (
    <section id="about" className="py-24 bg-[#0b0c0e] relative border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Image with editorial framing */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#141519] border border-white/10 shadow-2xl">
              <img
                src="/images/stock_about_craft.jpg"
                alt="Мастер за работой в барбершопе"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e]/80 via-transparent to-transparent opacity-50" />
            </div>

            {/* Floating brass detail card */}
            <div className="absolute -bottom-6 -right-4 sm:right-6 bg-[#16171b]/95 border border-[#c59b67]/40 p-5 rounded-xl shadow-2xl max-w-xs backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-mono text-[#c59b67] uppercase tracking-wider mb-1">
                <span>Эстетика & Качество</span>
              </div>
              <p className="text-xs text-[#d4d4d8] leading-relaxed">
                Стрижки, которые сохраняют форму и не требуют часовой укладки каждое утро.
              </p>
            </div>
          </div>

          {/* Right Column: Text & 3 Pillars */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#c59b67] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Философия клуба</span>
            </div>

            <h2 className="font-serif-brand text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
              {siteInfo.aboutTitle}
            </h2>

            <p className="text-base sm:text-lg text-[#a1a1aa] leading-relaxed mb-10">
              {siteInfo.aboutText}
            </p>

            {/* 3 Pillars */}
            <div className="space-y-4">
              {siteInfo.aboutPillars.map((pillar, idx) => (
                <div
                  key={pillar.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#18191e] border border-[#c59b67]/30 flex items-center justify-center shrink-0">
                    {iconMap[idx] || <Sparkles className="w-5 h-5 text-[#c59b67]" />}
                  </div>
                  <div>
                    <h3 className="font-serif-brand text-lg font-bold text-white mb-1">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8e909a] leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
