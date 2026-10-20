import React from 'react';
import { UserCheck, Calendar, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MastersSection: React.FC = () => {
  const { masters, selectedMasterId, setSelectedMasterId, scrollToBooking, setIsPhotoCreditsOpen } = useApp();

  const handleSelectMaster = (id: string) => {
    setSelectedMasterId(id);
    scrollToBooking();
  };

  const visibleMasters = masters
    .filter((m) => m.isVisible)
    .sort((a, b) => a.order - b.order);

  return (
    <section id="masters" className="py-24 bg-[#0b0c0e] relative border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#c59b67] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Команда мастеров</span>
          </div>
          <h2 className="font-serif-brand text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Люди, которые знают своё дело
          </h2>
          <p className="mt-3 text-[#a1a1aa] text-base sm:text-lg">
            Каждый барбер в клубе имеет свой профиль и почерк. Выбирайте мастера под вашу задачу.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {visibleMasters.map((master) => {
            const isSelected = selectedMasterId === master.id;

            return (
              <div
                key={master.id}
                className={`group rounded-xl overflow-hidden flex flex-col justify-between border transition-all duration-300 ${
                  isSelected
                    ? 'bg-[#181a20] border-[#c59b67] shadow-xl shadow-[#c59b67]/10'
                    : 'bg-[#121316] border-white/[0.06] hover:border-white/20'
                }`}
              >
                {/* Unobstructed natural documentary photo */}
                <div className="relative aspect-[4/5] overflow-hidden bg-[#1a1b20]">
                  <img
                    src={master.photoUrl}
                    alt={`Барбер ${master.name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top sm:object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback to neutral stylized barber silhouette avatar
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" fill="%231a1b20"><rect width="400" height="500" fill="%231a1b20"/><circle cx="200" cy="180" r="70" fill="%232d2f38"/><path d="M100 380c0-60 45-100 100-100s100 40 100 100v40H100v-40z" fill="%232d2f38"/><text x="200" y="440" font-family="sans-serif" font-size="16" fill="%2371717a" text-anchor="middle">Мастер</text></svg>';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121316]/40 via-transparent to-transparent opacity-40 pointer-events-none" />
                </div>

                {/* Bio & Details */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="mb-2">
                      <span className="inline-block text-[11px] font-mono tracking-wider text-[#c59b67] uppercase bg-[#c59b67]/10 px-2.5 py-0.5 rounded border border-[#c59b67]/20">
                        {master.specialization}
                      </span>
                    </div>
                    <h3 className="font-serif-brand text-2xl font-bold text-white mb-3 group-hover:text-[#c59b67] transition-colors">
                      {master.name}
                    </h3>
                    <p className="text-sm text-[#9ca3af] leading-relaxed mb-6 font-normal">
                      {master.bio}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectMaster(master.id)}
                    className={`w-full py-3 px-4 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-[#c59b67] text-[#0b0c0e]'
                        : 'bg-white/[0.05] hover:bg-[#c59b67] text-white hover:text-[#0b0c0e] border border-white/10'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Мастер выбран</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Записаться к мастеру</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Attribution note */}
        <div className="mt-8 text-center text-xs text-[#71717a]">
          <span>Иллюстративные фотографии мастеров из открытых фотоколлекций. </span>
          <button
            type="button"
            onClick={() => setIsPhotoCreditsOpen(true)}
            className="text-[#c59b67] hover:underline cursor-pointer"
          >
            Смотреть авторов и лицензии
          </button>
        </div>
      </div>
    </section>
  );
};
