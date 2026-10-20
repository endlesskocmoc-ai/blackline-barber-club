import React from 'react';
import { Eye, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GALLERY_WORKS } from '../data/initialData';
import type { WorkItem } from '../types/index';

export const GallerySection: React.FC = () => {
  const { setActiveGalleryItem, setIsPhotoCreditsOpen } = useApp();

  return (
    <section id="gallery" className="py-24 bg-[#0e0f12] relative border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#c59b67] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Портфолио</span>
          </div>
          <h2 className="font-serif-brand text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Детали решают
          </h2>
          <p className="mt-3 text-[#a1a1aa] text-base sm:text-lg">
            Примеры выполненных стрижек, укладок и оформления бороды. Нажмите на фото для детального просмотра.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_WORKS.map((work: WorkItem) => (
            <button
              key={work.id}
              type="button"
              onClick={() => setActiveGalleryItem(work)}
              className="group relative rounded-xl overflow-hidden aspect-[4/5] bg-[#141519] border border-white/[0.06] text-left hover:border-[#c59b67]/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#c59b67]"
            >
              <img
                src={work.imageUrl}
                alt={work.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="%231a1b20"><rect width="600" height="750" fill="%231a1b20"/><text x="300" y="375" font-family="sans-serif" font-size="22" fill="%2371717a" text-anchor="middle">Работа барбера</text></svg>';
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e]/90 via-[#0b0c0e]/20 to-transparent opacity-65 group-hover:opacity-75 transition-opacity" />

              {/* Hover icon */}
              <div className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 group-hover:text-[#c59b67] group-hover:border-[#c59b67] transition-all">
                <Eye className="w-4 h-4" />
              </div>

              {/* Bottom text info */}
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-mono tracking-wider uppercase text-[#c59b67] bg-black/75 px-2 py-0.5 rounded border border-[#c59b67]/20 backdrop-blur-sm">
                  {work.category}
                </span>
                <h3 className="font-serif-brand text-lg sm:text-xl font-bold text-white mt-2 group-hover:text-[#c59b67] transition-colors">
                  {work.title}
                </h3>
                <p className="text-xs text-[#a1a1aa] mt-1 line-clamp-2 leading-relaxed">
                  {work.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Gallery bottom note */}
        <div className="mt-8 text-center text-xs text-[#71717a]">
          <span>Реальные фотографии стрижек и рабочих процессов из открытых фотобанков Unsplash, Pexels и Wikimedia Commons. </span>
          <button
            type="button"
            onClick={() => setIsPhotoCreditsOpen(true)}
            className="text-[#c59b67] hover:underline cursor-pointer"
          >
            Информация об авторах и лицензиях
          </button>
        </div>
      </div>
    </section>
  );
};
