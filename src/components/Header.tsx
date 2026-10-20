import React, { useState, useEffect } from 'react';
import { Scissors, Phone, Menu, X, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const { siteInfo, activeRoute, setActiveRoute, scrollToBooking } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Услуги', href: '#services' },
    { label: 'Мастера', href: '#masters' },
    { label: 'Работы', href: '#gallery' },
    { label: 'О клубе', href: '#about' },
    { label: 'Контакты', href: '#contacts' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (activeRoute !== 'home') {
      setActiveRoute('home');
      setTimeout(() => {
        const target = document.querySelector(href);
        target?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const target = document.querySelector(href);
      target?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0b0c0e]/95 backdrop-blur-md border-b border-white/[0.08] shadow-2xl py-3.5'
          : 'bg-gradient-to-b from-[#0b0c0e]/90 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            type="button"
            onClick={() => handleNavClick('#hero')}
            className="flex items-center gap-3 text-left group focus-visible:ring-2 focus-visible:ring-[#c59b67] rounded-sm p-1 cursor-pointer"
          >
            <div className="w-10 h-10 rounded border border-[#c59b67]/40 bg-[#16171b] flex items-center justify-center text-[#c59b67] group-hover:border-[#c59b67] transition-colors shadow-inner">
              <Scissors className="w-5 h-5 transition-transform group-hover:rotate-12 duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif-brand font-bold text-lg sm:text-xl tracking-wider text-white uppercase group-hover:text-[#c59b67] transition-colors">
                {siteInfo.brandName.split(' ')[0] || 'BLACKLINE'}
              </span>
              <span className="text-[10px] tracking-[0.25em] text-[#a1a1aa] uppercase font-mono">
                {siteInfo.brandName.split(' ').slice(1).join(' ') || 'BARBER CLUB'}
              </span>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#d4d4d8]" aria-label="Основная навигация">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="hover:text-[#c59b67] transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#c59b67] hover:after:w-full after:transition-all after:duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Block */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Phone */}
            <div className="flex flex-col items-end">
              <a
                href={`tel:${siteInfo.phoneRaw}`}
                className="text-sm font-semibold tracking-wide text-white hover:text-[#c59b67] transition-colors flex items-center gap-1.5"
                title="Позвонить в барбершоп"
              >
                <Phone className="w-3.5 h-3.5 text-[#c59b67]" />
                {siteInfo.phone}
              </a>
              <span className="text-[10px] text-[#71717a] font-normal tracking-tight">
                {siteInfo.workingHours}
              </span>
            </div>

            {/* CTA Booking Button */}
            <button
              type="button"
              onClick={scrollToBooking}
              className="bg-[#c59b67] hover:bg-[#d8af7b] active:scale-[0.98] text-[#0b0c0e] font-semibold text-sm px-5 py-2.5 rounded transition-all shadow-lg shadow-[#c59b67]/15 flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Записаться</span>
            </button>
          </div>

          {/* Mobile Buttons */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={scrollToBooking}
              className="bg-[#c59b67] hover:bg-[#d8af7b] text-[#0b0c0e] text-xs font-bold px-3 py-2 rounded transition-colors"
            >
              Запись
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-[#d4d4d8] hover:text-white border border-white/10 hover:border-white/20 bg-[#16171b]"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#c59b67]" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[60px] bg-[#0e0f12]/98 border-b border-white/10 backdrop-blur-xl px-5 py-6 shadow-2xl transition-all">
          <nav className="flex flex-col gap-4 text-base font-medium">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="text-[#e4e4e7] hover:text-[#c59b67] py-2 border-b border-white/[0.04] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-3">
              <a
                href={`tel:${siteInfo.phoneRaw}`}
                className="flex items-center gap-2 text-sm text-[#e4e4e7] hover:text-[#c59b67]"
              >
                <Phone className="w-4 h-4 text-[#c59b67]" />
                <span>{siteInfo.phone}</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollToBooking();
                }}
                className="w-full mt-2 bg-[#c59b67] text-[#0b0c0e] font-bold py-3 rounded text-center shadow-lg"
              >
                Записаться на стрижку
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
