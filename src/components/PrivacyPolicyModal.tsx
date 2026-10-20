import React, { useEffect, useRef } from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PrivacyPolicyModal: React.FC = () => {
  const { isPrivacyOpen, setIsPrivacyOpen, siteInfo } = useApp();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isPrivacyOpen) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPrivacyOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isPrivacyOpen, setIsPrivacyOpen]);

  if (!isPrivacyOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsPrivacyOpen(false);
      }}
    >
      <div className="relative max-w-2xl w-full bg-[#121316] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#18191e] border border-[#c59b67]/30 flex items-center justify-center text-[#c59b67]">
              <FileText className="w-4 h-4" />
            </div>
            <h2 id="privacy-title" className="font-serif-brand text-xl font-bold text-white">
              Политика конфиденциальности
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setIsPrivacyOpen(false)}
            aria-label="Закрыть модальное окно"
            className="p-2 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable text */}
        <div className="overflow-y-auto py-5 space-y-4 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed pr-2">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3 text-white">
            <ShieldCheck className="w-5 h-5 text-[#c59b67] shrink-0 mt-0.5" />
            <div className="text-xs text-[#a1a1aa]">
              Обработка персональных данных клиентов осуществляется в строгом соответствии с требованиями законодательства о защите персональных данных (ФЗ № 152-ФЗ).
            </div>
          </div>

          <h3 className="font-bold text-white text-base">1. Общие положения</h3>
          <p>
            Настоящая политика обработки персональных данных определяет порядок сбора, систематизации и обеспечения безопасности данных, предпринимаемые {siteInfo.brandName} (далее — Оператор).
          </p>

          <h3 className="font-bold text-white text-base">2. Цели обработки данных</h3>
          <p>
            Персональные данные (имя клиента, контактный номер телефона) собираются исключительно для:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Предварительной записи на услуги барбершопа;</li>
            <li>Телефонного подтверждения времени и деталей визита администратором;</li>
            <li>Уведомления о статусе бронирования.</li>
          </ul>

          <h3 className="font-bold text-white text-base">3. Безопасность и третьи лица</h3>
          <p>
            Оператор не передаёт контактные данные третьим лицам без согласия субъекта данных, за исключением случаев, предусмотренных действующим законодательством.
          </p>

          <h3 className="font-bold text-white text-base">4. Отзыв согласия</h3>
          <p>
            Клиент может в любой момент отозвать своё согласие на обработку данных, связавшись с администратором по телефону {siteInfo.phone} или обратившись лично по адресу: г. {siteInfo.city}, {siteInfo.address}.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] text-[#71717a] font-mono">
            {siteInfo.brandName} • Конфиденциальность
          </span>
          <button
            type="button"
            onClick={() => setIsPrivacyOpen(false)}
            className="bg-[#c59b67] text-[#0b0c0e] font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-[#d8af7b] transition-colors cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
