import React from 'react';
import { ArrowDown, Calendar, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Hero: React.FC = () => {
  const { siteInfo, scrollToBooking } = useApp();

  const handleScrollToServices = () => {
    const el = document.getElementById('services');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-[#0b0c0e]"
    >
      {/* Background Graphic & Barber Atmosphere */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/stock_hero_interior.jpg"
          alt="Интерьер мужского барбершопа BLACKLINE BARBER CLUB с винтажными креслами"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-45 filter contrast-[1.05] brightness-95"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c0e] via-[#0b0c0e]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e] via-transparent to-[#0b0c0e]/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl">
          {/* Subtle badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18191d]/90 border border-[#c59b67]/30 text-xs text-[#c59b67] tracking-wider uppercase font-medium mb-6 backdrop-blur-sm shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#c59b67]" />
            <span>Премиальный мужской барбершоп</span>
          </div>

          {/* Main Title */}
          <h1 className="font-serif-brand text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] mb-6">
            <span className="block text-white">{siteInfo.heroTitleLine1}</span>
            <span className="block text-[#c59b67] italic font-serif">{siteInfo.heroTitleLine2}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-[#a1a1aa] leading-relaxed max-w-2xl mb-10 font-normal">
            {siteInfo.heroSubtitle}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4 mb-14">
            <button
              type="button"
              onClick={scrollToBooking}
              className="bg-[#c59b67] hover:bg-[#d8af7b] active:scale-[0.98] text-[#0b0c0e] font-bold text-base px-8 py-4 rounded transition-all shadow-xl shadow-[#c59b67]/20 flex items-center gap-3 group"
            >
              <Calendar className="w-5 h-5 text-[#0b0c0e]" />
              <span>Записаться</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={handleScrollToServices}
              className="bg-[#18191d] hover:bg-[#22242a] active:scale-[0.98] text-white border border-white/10 hover:border-white/20 font-medium text-base px-7 py-4 rounded transition-all flex items-center gap-2"
            >
              <span>Смотреть услуги</span>
              <ArrowDown className="w-4 h-4 text-[#a1a1aa]" />
            </button>
          </div>

          {/* 3 Compact Facts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-white/[0.08]">
            {siteInfo.heroFacts.map((fact) => (
              <div key={fact.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <CheckCircle2 className="w-4 h-4 text-[#c59b67] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[#f4f4f5] leading-tight mb-1">
                    {fact.title}
                  </h4>
                  <p className="text-xs text-[#71717a] leading-snug">
                    {fact.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
