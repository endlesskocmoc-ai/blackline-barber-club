import React from 'react';
import { Star, MessageSquareQuote } from 'lucide-react';
import { REVIEWS_DATA } from '../data/initialData';

export const ReviewsSection: React.FC = () => {
  return (
    <section className="py-24 bg-[#0b0c0e] relative border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#c59b67] mb-3">
            <MessageSquareQuote className="w-3.5 h-3.5" />
            <span>Впечатления гостей</span>
          </div>
          <h2 className="font-serif-brand text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Отзывы о сервисе
          </h2>
          <p className="mt-3 text-[#a1a1aa] text-base">
            Мнения постоянных гостей клуба о стрижках, мастерах и клубной атмосфере.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS_DATA.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-xl bg-[#121316] border border-white/[0.06] hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-[#c59b67]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#c59b67]" />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-white/[0.05] text-[#a1a1aa] px-2 py-0.5 rounded">
                    {rev.date}
                  </span>
                </div>
                <p className="text-sm text-[#d4d4d8] leading-relaxed mb-6 italic">
                  «{rev.text}»
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.05] flex items-center justify-between">
                <div>
                  <h3 className="font-serif-brand text-base font-bold text-white">
                    {rev.author}
                  </h3>
                  <span className="text-xs text-[#c59b67]">
                    {rev.service}
                  </span>
                </div>
                <span className="text-[10px] text-[#8e909a] font-mono">
                  Проверенный визит
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
