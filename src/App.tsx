import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { MastersSection } from './components/MastersSection';
import { GallerySection } from './components/GallerySection';
import { AboutSection } from './components/AboutSection';
import { AdvantagesSection } from './components/AdvantagesSection';
import { ReviewsSection } from './components/ReviewsSection';
import { BookingSection } from './components/BookingSection';
import { ContactsSection } from './components/ContactsSection';
import { Footer } from './components/Footer';
import { GalleryModal } from './components/GalleryModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { PhotoCreditsModal } from './components/PhotoCreditsModal';
import { AdminPanel } from './components/AdminPanel';

const AppContent: React.FC = () => {
  const { activeRoute, activeGalleryItem, setActiveGalleryItem, isPhotoCreditsOpen, setIsPhotoCreditsOpen } = useApp();

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#f4f4f5] selection:bg-[#c59b67] selection:text-black">
      {activeRoute === 'admin' ? (
        <AdminPanel />
      ) : (
        <>
          <Header />
          <main>
            <Hero />
            <ServicesSection />
            <MastersSection />
            <GallerySection />
            <AboutSection />
            <AdvantagesSection />
            <ReviewsSection />
            <BookingSection />
            <ContactsSection />
          </main>
          <Footer />
        </>
      )}

      {/* Global Modals */}
      <GalleryModal
        item={activeGalleryItem}
        onClose={() => setActiveGalleryItem(null)}
      />
      <PrivacyPolicyModal />
      <PhotoCreditsModal
        isOpen={isPhotoCreditsOpen}
        onClose={() => setIsPhotoCreditsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
