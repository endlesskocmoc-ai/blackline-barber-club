import React, { useState } from 'react';
import { Clock, Check, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatPrice, formatDuration } from '../utils/validation';

export const ServicesSection: React.FC = () => {
  const { services, selectedServiceId, setSelectedServiceId, scrollToBooking } = useApp();
  const [filter, setFilter] = useState<'all' | 'hair' | 'beard' | 'combo' | 'care'>('all');

  const visibleServices = services
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order);

  const filteredServices = visibleServices.filter((s) => {
    if (filter === 'all') return true;
    return s.category === filter;
  });

  const handleSelectService = (id: string) => {
    setSelectedServiceId(id);
    scrollToBooking();
  };

  const categories = [
    { key: 'all', label: 'Все услуги' },
    { key: 'hair', label: 'Стрижки' },
    { key: 'beard', label: 'Борода и бритьё' },
    { key: 'combo', label: 'Комплексы' },
    { key: 'care', label: 'Уход и камуфляж' },
  ];

  return (
    <section id="services" className="py-24 bg-[#0e0f12] relative border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#c59b67] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Прайс-лист</span>
            </div>
            <h2 className="font-serif-brand text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Услуги и цены
            </h2>
            <p className="mt-3 text-[#a1a1aa] text-base sm:text-lg">
              Выбери свой формат — остальное мы обсудим на месте.
            </p>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key as any)}
                className={`px-4 py-2 text-xs font-medium rounded transition-colors ${
                  filter === c.key
                    ? 'bg-[#c59b67] text-[#0b0c0e] font-semibold shadow-md shadow-[#c59b67]/20'
                    : 'bg-[#18191d] text-[#a1a1aa] hover:text-white border border-white/5 hover:border-white/10'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredServices.map((service) => {
            const isSelected = selectedServiceId === service.id;
            const categoryLabels: Record<string, string> = {
              hair: 'Стрижка',
              beard: 'Борода и бритьё',
              combo: 'Комплекс',
              care: 'Уход',
            };

            return (
              <div
                key={service.id}
                className={`group relative rounded-xl p-6 sm:p-7 transition-all duration-200 flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-[#171920] border-[#c59b67] shadow-xl shadow-[#c59b67]/10'
                    : 'bg-[#121316] border-white/[0.06] hover:border-white/20 hover:bg-[#15171d]'
                }`}
              >
                <div>
                  {/* Category & Duration row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono tracking-wider uppercase text-[#c59b67] bg-[#c59b67]/10 px-2.5 py-0.5 rounded border border-[#c59b67]/20">
                      {categoryLabels[service.category] || service.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa]">
                      <Clock className="w-3.5 h-3.5 text-[#c59b67]" />
                      <span>{formatDuration(service.durationMinutes)}</span>
                    </div>
                  </div>

                  {/* Title & Price row */}
                  <div className="flex items-baseline justify-between gap-4 mb-2.5">
                    <h3 className="font-serif-brand text-xl sm:text-2xl font-bold text-white group-hover:text-[#c59b67] transition-colors">
                      {service.title}
                    </h3>
                    <span className="font-serif-brand text-2xl font-bold text-[#c59b67] shrink-0">
                      {formatPrice(service.price)}
                    </span>
                  </div>

                  {/* Description without artificial truncation */}
                  <p className="text-sm text-[#9ca3af] leading-relaxed mb-6 font-normal">
                    {service.description}
                  </p>
                </div>

                {/* Clean action row */}
                <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-xs text-[#71717a]">
                    {isSelected ? 'Услуга выбрана для записи' : 'Оплата после визита'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSelectService(service.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#c59b67] text-[#0b0c0e]'
                        : 'bg-white/[0.05] hover:bg-[#c59b67] text-white hover:text-[#0b0c0e] border border-white/10 hover:border-transparent'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Выбрано</span>
                      </>
                    ) : (
                      <>
                        <span>Выбрать услугу</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12 text-[#a1a1aa]">
            В данной категории пока нет активных услуг.
          </div>
        )}
      </div>
    </section>
  );
};
