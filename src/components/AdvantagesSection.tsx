import React from 'react';
import { Tag, Users, CalendarDays, Sparkles, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdvantagesSection: React.FC = () => {
  const { siteInfo } = useApp();

  const getAdvIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return <Tag className="w-5 h-5 text-[#c59b67]" />;
      case 1:
        return <Users className="w-5 h-5 text-[#c59b67]" />;
      case 2:
        return <CalendarDays className="w-5 h-5 text-[#c59b67]" />;
      default:
        return <CheckCircle className="w-5 h-5 text-[#c59b67]" />;
    }
  };

  return (
    <section className="py-20 bg-[#0e0f12] relative border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#c59b67] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Стандарты сервиса</span>
          </div>
          <h2 className="font-serif-brand text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Почему нам доверяют
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#a1a1aa]">
            Честный мужской сервис с открытыми условиями и уважением к вашему времени.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {siteInfo.advantages.map((adv, idx) => (
            <div
              key={adv.id}
              className="p-6 rounded-xl bg-[#141519] border border-white/[0.06] hover:border-white/20 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-11 h-11 rounded-lg bg-[#181a20] border border-white/10 flex items-center justify-center mb-5 group-hover:border-[#c59b67]/50 transition-colors">
                  {getAdvIcon(idx)}
                </div>
                <h3 className="font-serif-brand text-lg font-bold text-white mb-2 group-hover:text-[#c59b67] transition-colors">
                  {adv.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#8e909a] leading-relaxed">
                  {adv.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
