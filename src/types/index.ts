export type PaymentMethod = 'card_offline' | 'cash_offline';

export type BookingStatus = 'new' | 'confirmed' | 'completed' | 'cancelled';

export interface Service {
  id: string;
  title: string;
  price: number;
  durationMinutes: number;
  description: string;
  category: 'hair' | 'beard' | 'combo' | 'care';
  isVisible: boolean;
  order: number;
}

export interface Master {
  id: string;
  name: string;
  specialization: string;
  bio: string;
  photoUrl: string;
  isVisible: boolean;
  order: number;
}

export interface WorkItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  service: string;
  rating: number;
  date: string;
  text: string;
}

export interface HeroFact {
  id: string;
  title: string;
  description: string;
}

export interface Advantage {
  id: string;
  title: string;
  description: string;
}

export interface ScheduleConfig {
  workDays: number[]; // 0=Вс, 1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб
  openTime: string; // '10:00'
  closeTime: string; // '22:00'
  intervalMinutes: number; // 60
  breakStart?: string; // '14:00'
  breakEnd?: string; // '15:00'
  blockedDates: string[]; // YYYY-MM-DD
}

export interface BookingRecord {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceTitle: string;
  price: number;
  masterId: string;
  masterName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  comment?: string;
  adminNotes?: string;
}

export interface SiteInfo {
  brandName: string;
  city: string;
  address: string;
  metro: string;
  lat: number;
  lng: number;
  zoom: number;
  phone: string;
  phoneRaw: string;
  workingHours: string;
  routeUrl: string;
  socialVk: string;
  socialTelegram: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutText: string;
  aboutPillars: {
    title: string;
    description: string;
  }[];
  heroFacts: HeroFact[];
  advantages: Advantage[];
  themeColor: string;
  disclaimerText: string;
}

export interface BookingFormData {
  customerName: string;
  customerPhone: string;
  serviceId: string;
  masterId: string;
  date: string;
  time: string;
  paymentMethod: PaymentMethod;
  comment: string;
  consent: boolean;
}

export interface PhotoCredit {
  id: string;
  section: string;
  title: string;
  localPath: string;
  author: string;
  authorUrl?: string;
  source: 'Unsplash' | 'Pexels' | 'Wikimedia Commons';
  sourcePageUrl: string;
  license: string;
  licenseUrl: string;
  notes: string;
}

export interface ExportDataPayload {
  version: number;
  exportedAt: string;
  services: Service[];
  masters: Master[];
  siteInfo: SiteInfo;
  schedule: ScheduleConfig;
  bookings: BookingRecord[];
}
