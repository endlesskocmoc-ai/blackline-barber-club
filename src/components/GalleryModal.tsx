import React, { useEffect, useRef } from 'react';
import { X, Sparkles, ExternalLink } from 'lucide-react';
import type { WorkItem } from '../types/index';

interface GalleryModalProps {
  item: WorkItem | null;
  onClose: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({ item, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) return;

    // Focus close button on mount
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-modal-title"
      aria-describedby="gallery-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative max-w-4xl w-full bg-[#121316] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Close Button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Закрыть просмотр работы"
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 text-white hover:text-[#c59b67] border border-white/10 hover:border-[#c59b67] transition-all backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Image preview with fallback */}
        <div className="w-full md:w-3/5 bg-black flex items-center justify-center overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="w-full h-full max-h-[60vh] md:max-h-[80vh] object-cover object-center"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" fill="%231a1b20"><rect width="600" height="600" fill="%231a1b20"/><text x="300" y="300" font-family="sans-serif" font-size="20" fill="%2371717a" text-anchor="middle">Работа мастера</text></svg>';
            }}
          />
        </div>

        {/* Details side */}
        <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#c59b67] bg-[#c59b67]/10 px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{item.category}</span>
            </div>

            <h3
              id="gallery-modal-title"
              className="font-serif-brand text-2xl sm:text-3xl font-bold text-white mb-4"
            >
              {item.title}
            </h3>

            <p id="gallery-modal-desc" className="text-sm text-[#a1a1aa] leading-relaxed mb-6">
              {item.description}
            </p>

            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-[#71717a] space-y-1">
              <p>• Индивидуальный подбор геометрии</p>
              <p>• Фиксация премиальной мужской косметикой</p>
              <p>• Консультация мастера по уходу</p>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-[#71717a]">BLACKLINE BARBER CLUB</span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#c59b67] hover:underline font-medium"
            >
              Закрыть окно (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
