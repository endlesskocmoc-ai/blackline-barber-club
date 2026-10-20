import React from 'react';
import { Scissors, ArrowUp, Phone, MapPin, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { siteInfo, setIsPrivacyOpen, setIsPhotoCreditsOpen, setActiveRoute } = useApp();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#08090b] border-t border-white/[0.08] text-[#a1a1aa] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded border border-[#c59b67]/40 bg-[#16171b] flex items-center justify-center text-[#c59b67]">
                <Scissors className="w-4 h-4" />
              </div>
              <span className="font-serif-brand font-bold text-lg text-white tracking-wider">
                {siteInfo.brandName}
              </span>
            </div>
            <p className="text-xs text-[#71717a] leading-relaxed mb-4">
              Премиальный мужской барбершоп в центре Москвы. Точные стрижки, классическое королевское бритьё и профессиональный уход.
            </p>
            <div className="text-xs text-[#8e909a]">
              {siteInfo.metro && <span>{siteInfo.metro}</span>}
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-serif-brand text-sm font-bold text-white uppercase tracking-wider mb-4">
              Разделы
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#services" className="hover:text-[#c59b67] transition-colors">
                  Услуги и цены
                </a>
              </li>
              <li>
                <a href="#masters" className="hover:text-[#c59b67] transition-colors">
                  Мастера клуба
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-[#c59b67] transition-colors">
                  Примеры работ
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#c59b67] transition-colors">
                  О клубе
                </a>
              </li>
              <li>
                <a href="#booking" className="hover:text-[#c59b67] transition-colors">
                  Онлайн-запись
                </a>
              </li>
              <li>
                <a href="#contacts" className="hover:text-[#c59b67] transition-colors">
                  Контакты и карта
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contacts & Hours */}
          <div>
            <h4 className="font-serif-brand text-sm font-bold text-white uppercase tracking-wider mb-4">
              Контакты
            </h4>
            <div className="space-y-3 text-xs">
              <p className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#c59b67] shrink-0 mt-0.5" />
                <span>г. {siteInfo.city}, {siteInfo.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#c59b67]" />
                <span>{siteInfo.workingHours}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#c59b67] shrink-0" />
                <a href={`tel:${siteInfo.phoneRaw}`} className="text-white hover:text-[#c59b67]">
                  {siteInfo.phone}
                </a>
              </p>
            </div>
          </div>

          {/* Col 4: Quick Links */}
          <div>
            <h4 className="font-serif-brand text-sm font-bold text-white uppercase tracking-wider mb-4">
              Информация
            </h4>
            <div className="space-y-3 text-xs">
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(true)}
                className="text-left text-[#a1a1aa] hover:text-[#c59b67] underline block cursor-pointer"
              >
                Политика обработки данных
              </button>
              <button
                type="button"
                onClick={() => setIsPhotoCreditsOpen(true)}
                className="text-left text-[#a1a1aa] hover:text-[#c59b67] underline block cursor-pointer"
              >
                Источники и лицензии фото
              </button>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Наверх страницы</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Hidden Unobtrusive Admin Link */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717a]">
          <p>© {currentYear} {siteInfo.brandName}. Все права защищены.</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveRoute('admin')}
              className="text-[11px] text-[#52525b] hover:text-[#a1a1aa] transition-colors cursor-pointer"
            >
              Вход для администратора
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
