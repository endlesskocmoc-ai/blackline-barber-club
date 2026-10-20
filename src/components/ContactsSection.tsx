import React, { useState } from 'react';
import { MapPin, Phone, Clock, Navigation, ExternalLink, Sparkles, Copy, Check, Compass } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ContactsSection: React.FC = () => {
  const { siteInfo } = useApp();
  const [copied, setCopied] = useState(false);
  const [mapProvider, setMapProvider] = useState<'yandex' | 'osm'>('yandex');

  const fullAddress = `г. ${siteInfo.city}, ${siteInfo.address}`;

  // Direct route links
  const yandexRouteUrl = siteInfo.routeUrl || `https://yandex.ru/maps/?rtext=~${siteInfo.lat},${siteInfo.lng}&rtt=auto`;
  const gisRouteUrl = `https://2gis.ru/moscow/search/${siteInfo.lat}%2C${siteInfo.lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${siteInfo.lat},${siteInfo.lng}`;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const yandexEmbedUrl = `https://yandex.ru/map-widget/v1/?ll=${siteInfo.lng}%2C${siteInfo.lat}&z=${siteInfo.zoom || 16}&pt=${siteInfo.lng}%2C${siteInfo.lat},pm2rdm`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${siteInfo.lng - 0.007}%2C${siteInfo.lat - 0.004}%2C${siteInfo.lng + 0.007}%2C${siteInfo.lat + 0.004}&layer=mapnik&marker=${siteInfo.lat}%2C${siteInfo.lng}`;

  return (
    <section id="contacts" className="py-24 bg-[#0b0c0e] relative border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#c59b67] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Локация и контакты</span>
          </div>
          <h2 className="font-serif-brand text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Как нас найти
          </h2>
          <p className="mt-3 text-[#a1a1aa] text-base sm:text-lg">
            Ждём вас в центре Москвы. Удобный заезд с бульварного кольца, парковка рядом, приветственный кофе и безупречный сервис.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left info column: 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            {/* Main Info Card */}
            <div className="p-6 sm:p-7 rounded-2xl bg-[#121316] border border-white/[0.08] shadow-xl space-y-6">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#18191e] border border-[#c59b67]/30 flex items-center justify-center shrink-0 mt-0.5 text-[#c59b67]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[#71717a] mb-1">
                    Адрес барбершопа
                  </span>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base sm:text-lg font-bold text-white leading-snug">
                      {fullAddress}
                    </span>
                    <button
                      type="button"
                      onClick={copyAddress}
                      title="Скопировать адрес"
                      className="text-[#a1a1aa] hover:text-[#c59b67] p-1 rounded transition-colors shrink-0 cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {siteInfo.metro && (
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded bg-[#18191e] border border-white/5 text-xs text-[#c59b67] font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#c59b67]" />
                      {siteInfo.metro}
                    </span>
                  )}
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-start gap-4 pt-5 border-t border-white/[0.04]">
                <div className="w-11 h-11 rounded-xl bg-[#18191e] border border-[#c59b67]/30 flex items-center justify-center shrink-0 mt-0.5 text-[#c59b67]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[#71717a] mb-1">
                    Режим работы
                  </span>
                  <span className="text-base font-bold text-white block">
                    {siteInfo.workingHours}
                  </span>
                  <span className="text-xs text-[#a1a1aa] mt-0.5 block">
                    Приём гостей строго по предварительной записи
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 pt-5 border-t border-white/[0.04]">
                <div className="w-11 h-11 rounded-xl bg-[#18191e] border border-[#c59b67]/30 flex items-center justify-center shrink-0 mt-0.5 text-[#c59b67]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[#71717a] mb-1">
                    Прямая связь
                  </span>
                  <a
                    href={`tel:${siteInfo.phoneRaw}`}
                    className="text-lg font-bold text-white hover:text-[#c59b67] transition-colors block"
                  >
                    {siteInfo.phone}
                  </a>
                  <span className="text-xs text-[#71717a] mt-0.5 block">
                    Администратор ответит и поможет с выбором мастера
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Buttons Card */}
            <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.08] space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] block mb-2">
                Построить маршрут
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={yandexRouteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#c59b67] hover:bg-[#d8af7b] active:scale-[0.98] text-[#0b0c0e] font-bold text-xs sm:text-sm py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4 shrink-0" />
                  <span>Яндекс.Карты</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
                </a>
                <a
                  href={gisRouteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#18191e] hover:bg-[#22242a] text-white border border-white/10 font-semibold text-xs sm:text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4 text-[#c59b67] shrink-0" />
                  <span>2ГИС</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#71717a]" />
                </a>
              </div>
              <div className="pt-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#8e909a] hover:text-[#c59b67] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Открыть точку в Google Карты</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Map Container: 7 cols */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#121316] shadow-2xl flex flex-col h-[480px] sm:h-[520px]">
              {/* Map Provider Selector Bar */}
              <div className="relative z-10 px-5 py-3.5 bg-[#16171b] border-b border-white/[0.08] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    {siteInfo.brandName} • Центральный клуб
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#0e0f12] p-1 rounded-lg border border-white/5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setMapProvider('yandex')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      mapProvider === 'yandex'
                        ? 'bg-[#c59b67] text-[#0b0c0e] font-semibold'
                        : 'text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    Яндекс
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapProvider('osm')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      mapProvider === 'osm'
                        ? 'bg-[#c59b67] text-[#0b0c0e] font-semibold'
                        : 'text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    OpenStreetMap
                  </button>
                </div>
              </div>

              {/* Map Iframe */}
              <div className="relative flex-1 w-full bg-[#16171b]">
                <iframe
                  title="Карта расположения барбершопа"
                  src={mapProvider === 'yandex' ? yandexEmbedUrl : osmEmbedUrl}
                  className="w-full h-full border-0 filter contrast-[1.05] brightness-95"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  allowFullScreen
                />

                {/* Floating location card badge */}
                <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm p-4 rounded-xl bg-[#121316]/95 border border-[#c59b67]/40 shadow-2xl backdrop-blur-md z-10">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#c59b67]">
                      {siteInfo.metro || 'Центр Москвы'}
                    </span>
                    <a
                      href={yandexRouteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#c59b67] hover:underline flex items-center gap-1"
                    >
                      <span>Маршрут</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <h4 className="text-sm font-bold text-white">{fullAddress}</h4>
                  <p className="text-[11px] text-[#a1a1aa] mt-0.5">
                    Удобный подъезд, городская парковка вдоль улицы.
                  </p>
                </div>
              </div>

              {/* Map Sub-footer with coordinates */}
              <div className="px-5 py-2.5 bg-[#16171b] border-t border-white/[0.08] flex items-center justify-between text-[11px] text-[#71717a]">
                <span className="font-mono">
                  Координаты: {siteInfo.lat.toFixed(6)}, {siteInfo.lng.toFixed(6)}
                </span>
                <a
                  href={yandexRouteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#a1a1aa] hover:text-[#c59b67] transition-colors"
                >
                  Развернуть на весь экран
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
