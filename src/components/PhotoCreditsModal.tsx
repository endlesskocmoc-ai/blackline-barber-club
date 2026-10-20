import React, { useEffect, useRef } from 'react';
import { X, ExternalLink, ShieldCheck, Camera, Info } from 'lucide-react';
import { PHOTO_CREDITS } from '../data/photoCreditsData';

interface PhotoCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoCreditsModal: React.FC<PhotoCreditsModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-credits-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative max-w-3xl w-full bg-[#121316] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08] bg-[#16171b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#c59b67]/10 border border-[#c59b67]/30 flex items-center justify-center text-[#c59b67]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 id="photo-credits-title" className="font-serif-brand text-lg font-bold text-white">
                Источники и лицензии фотографий
              </h3>
              <p className="text-xs text-[#a1a1aa]">
                Атрибуция авторов и открытые лицензии (Unsplash, Pexels, Wikimedia Commons)
              </p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно лицензий"
            className="p-2 rounded-lg bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="p-4 mx-6 mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-200/90">
          <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Иллюстративные материалы:</strong> Фотографии интерьера, рабочих процессов и мастеров подобраны из открытых фотоколлекций (Unsplash, Pexels, Wikimedia Commons) для оформления сайта барбершопа в соответствии с условиями открытых лицензий.
          </p>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {PHOTO_CREDITS.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#c59b67] bg-[#c59b67]/10 px-2.5 py-0.5 rounded border border-[#c59b67]/20 w-fit">
                  {item.section}
                </span>
                <span className="text-xs font-semibold text-white/90">
                  Источник: {item.source}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-[#a1a1aa] mb-3 leading-relaxed">{item.notes}</p>

              <div className="pt-2.5 border-t border-white/[0.04] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-[#8e909a]">
                  Автор:{' '}
                  {item.authorUrl ? (
                    <a
                      href={item.authorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-[#c59b67] underline inline-flex items-center gap-1 font-medium"
                    >
                      {item.author}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-white font-medium">{item.author}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={item.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#c59b67] hover:underline flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{item.license}</span>
                  </a>

                  <a
                    href={item.sourcePageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#71717a] hover:text-white underline inline-flex items-center gap-1"
                  >
                    <span>Страница оригинала</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#16171b] flex items-center justify-between text-xs text-[#71717a]">
          <span>Всего изображений: {PHOTO_CREDITS.length}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-[#c59b67] text-[#0b0c0e] font-bold hover:bg-[#d8af7b] transition-colors"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
