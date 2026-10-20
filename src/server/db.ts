import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  INITIAL_SERVICES,
  INITIAL_MASTERS,
  INITIAL_SITE_INFO,
  INITIAL_SCHEDULE,
  INITIAL_BOOKINGS,
} from '../data/initialData';
import type {
  Service,
  Master,
  SiteInfo,
  ScheduleConfig,
  BookingRecord,
  BookingStatus,
} from '../types/index';

// Initialize Supabase if environment variables are set
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[BLACKLINE SERVER] Connected to Supabase PostgreSQL at', supabaseUrl);
  } catch (err) {
    console.warn('[BLACKLINE SERVER] Supabase initialization failed, using file store:', err);
  }
}

// Local persistent file store for fallback
interface DataStore {
  adminPasswordHash: string;
  services: Service[];
  masters: Master[];
  siteInfo: SiteInfo;
  schedule: ScheduleConfig;
  bookings: BookingRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

function ensureDataStore(): DataStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(STORE_FILE)) {
    try {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[BLACKLINE SERVER] Error reading store.json, re-initializing:', e);
    }
  }

  // Default initial store with bcrypt hash of 'admin123' (salt rounds 10)
  const defaultHash = bcrypt.hashSync('admin123', 10);
  const initialStore: DataStore = {
    adminPasswordHash: defaultHash,
    services: INITIAL_SERVICES,
    masters: INITIAL_MASTERS,
    siteInfo: INITIAL_SITE_INFO,
    schedule: INITIAL_SCHEDULE,
    bookings: INITIAL_BOOKINGS,
  };

  fs.writeFileSync(STORE_FILE, JSON.stringify(initialStore, null, 2), 'utf-8');
  return initialStore;
}

function saveStore(store: DataStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[BLACKLINE SERVER] Failed to save store.json:', err);
  }
}

// Database helper functions (Abstracting Supabase vs Local Store)

export async function getAdminPasswordHash(): Promise<string> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('password_hash')
        .eq('username', 'admin')
        .single();
      if (!error && data?.password_hash) {
        return data.password_hash;
      }
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  return store.adminPasswordHash;
}

export async function updateAdminPasswordHash(newHash: string): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('admin_users')
        .upsert({ username: 'admin', password_hash: newHash, updated_at: new Date().toISOString() });
      if (!error) return true;
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  store.adminPasswordHash = newHash;
  saveStore(store);
  return true;
}

export async function getServices(): Promise<Service[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('order_num', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          title: d.title,
          price: d.price,
          durationMinutes: d.duration_minutes,
          description: d.description || '',
          category: d.category,
          isVisible: d.is_visible,
          order: d.order_num,
        }));
      }
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  return store.services;
}

export async function saveServices(services: Service[]): Promise<boolean> {
  if (supabase) {
    try {
      // Delete existing and insert new
      await supabase.from('services').delete().neq('id', 'dummy');
      const rows = services.map((s) => ({
        id: s.id,
        title: s.title,
        price: s.price,
        duration_minutes: s.durationMinutes,
        description: s.description,
        category: s.category,
        is_visible: s.isVisible,
        order_num: s.order,
      }));
      const { error } = await supabase.from('services').insert(rows);
      if (!error) return true;
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  store.services = services;
  saveStore(store);
  return true;
}

export async function getMasters(): Promise<Master[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('masters')
        .select('*')
        .order('order_num', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((m: any) => ({
          id: m.id,
          name: m.name,
          specialization: m.specialization || '',
          bio: m.bio || '',
          photoUrl: m.photo_url || '',
          isVisible: m.is_visible,
          order: m.order_num,
        }));
      }
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  return store.masters;
}

export async function saveMasters(masters: Master[]): Promise<boolean> {
  if (supabase) {
    try {
      await supabase.from('masters').delete().neq('id', 'dummy');
      const rows = masters.map((m) => ({
        id: m.id,
        name: m.name,
        specialization: m.specialization,
        bio: m.bio,
        photo_url: m.photoUrl,
        is_visible: m.isVisible,
        order_num: m.order,
      }));
      const { error } = await supabase.from('masters').insert(rows);
      if (!error) return true;
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  store.masters = masters;
  saveStore(store);
  return true;
}

export async function getSchedule(): Promise<ScheduleConfig> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('schedule_config')
        .select('*')
        .eq('id', 'default')
        .single();
      if (!error && data) {
        return {
          workDays: data.work_days,
          openTime: data.open_time,
          closeTime: data.close_time,
          intervalMinutes: data.interval_minutes,
          breakStart: data.break_start,
          breakEnd: data.break_end,
          blockedDates: data.blocked_dates || [],
        };
      }
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  return store.schedule;
}

export async function saveSchedule(schedule: ScheduleConfig): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase.from('schedule_config').upsert({
        id: 'default',
        work_days: schedule.workDays,
        open_time: schedule.openTime,
        close_time: schedule.closeTime,
        interval_minutes: schedule.intervalMinutes,
        break_start: schedule.breakStart,
        break_end: schedule.breakEnd,
        blocked_dates: schedule.blockedDates,
        updated_at: new Date().toISOString(),
      });
      if (!error) return true;
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  store.schedule = schedule;
  saveStore(store);
  return true;
}

export async function getSiteInfo(): Promise<SiteInfo> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('site_info')
        .select('*')
        .eq('id', 'default')
        .single();
      if (!error && data) {
        return {
          brandName: data.brand_name,
          city: data.city,
          address: data.address,
          metro: data.metro || '',
          lat: data.lat || 55.760884,
          lng: data.lng || 37.616355,
          zoom: data.zoom || 16,
          phone: data.phone,
          phoneRaw: data.phone_raw,
          workingHours: data.working_hours,
          routeUrl: data.route_url,
          socialVk: data.social_vk,
          socialTelegram: data.social_telegram,
          heroTitleLine1: data.hero_title_line1,
          heroTitleLine2: data.hero_title_line2,
          heroSubtitle: data.hero_subtitle,
          aboutTitle: data.about_title,
          aboutText: data.about_text,
          aboutPillars: data.about_pillars || [],
          heroFacts: data.hero_facts || [],
          advantages: data.advantages || [],
          themeColor: data.theme_color || '#c59b67',
          disclaimerText: data.disclaimer_text || '',
        };
      }
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  return store.siteInfo;
}

export async function saveSiteInfo(siteInfo: SiteInfo): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase.from('site_info').upsert({
        id: 'default',
        brand_name: siteInfo.brandName,
        city: siteInfo.city,
        address: siteInfo.address,
        metro: siteInfo.metro,
        lat: siteInfo.lat,
        lng: siteInfo.lng,
        zoom: siteInfo.zoom,
        phone: siteInfo.phone,
        phone_raw: siteInfo.phoneRaw,
        working_hours: siteInfo.workingHours,
        route_url: siteInfo.routeUrl,
        social_vk: siteInfo.socialVk,
        social_telegram: siteInfo.socialTelegram,
        hero_title_line1: siteInfo.heroTitleLine1,
        hero_title_line2: siteInfo.heroTitleLine2,
        hero_subtitle: siteInfo.heroSubtitle,
        about_title: siteInfo.aboutTitle,
        about_text: siteInfo.aboutText,
        about_pillars: siteInfo.aboutPillars,
        hero_facts: siteInfo.heroFacts,
        advantages: siteInfo.advantages,
        theme_color: siteInfo.themeColor,
        disclaimer_text: siteInfo.disclaimerText,
        updated_at: new Date().toISOString(),
      });
      if (!error) return true;
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  store.siteInfo = siteInfo;
  saveStore(store);
  return true;
}

export async function getBookings(): Promise<BookingRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((b: any) => ({
          id: b.id,
          createdAt: b.created_at,
          customerName: b.customer_name,
          customerPhone: b.customer_phone,
          serviceId: b.service_id,
          serviceTitle: b.service_title,
          price: b.price,
          masterId: b.master_id,
          masterName: b.master_name,
          date: b.date,
          time: b.time,
          paymentMethod: b.payment_method,
          status: b.status,
          comment: b.comment || '',
          adminNotes: b.admin_notes || '',
        }));
      }
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  return store.bookings;
}

export async function createBooking(
  bookingData: Omit<BookingRecord, 'id' | 'createdAt'>
): Promise<BookingRecord> {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newBooking: BookingRecord = {
    ...bookingData,
    id: `BL-${randomSuffix}`,
    createdAt: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { error } = await supabase.from('bookings').insert({
        id: newBooking.id,
        created_at: newBooking.createdAt,
        customer_name: newBooking.customerName,
        customer_phone: newBooking.customerPhone,
        service_id: newBooking.serviceId,
        service_title: newBooking.serviceTitle,
        price: newBooking.price,
        master_id: newBooking.masterId,
        master_name: newBooking.masterName,
        date: newBooking.date,
        time: newBooking.time,
        payment_method: newBooking.paymentMethod,
        status: newBooking.status,
        comment: newBooking.comment || '',
        admin_notes: newBooking.adminNotes || '',
      });
      if (!error) return newBooking;
    } catch {
      // fallback
    }
  }

  const store = ensureDataStore();
  store.bookings = [newBooking, ...store.bookings];
  saveStore(store);
  return newBooking;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
      if (!error) return true;
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  store.bookings = store.bookings.map((b) => (b.id === id ? { ...b, status } : b));
  saveStore(store);
  return true;
}

export async function updateBookingNotes(id: string, adminNotes: string): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase.from('bookings').update({ admin_notes: adminNotes }).eq('id', id);
      if (!error) return true;
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  store.bookings = store.bookings.map((b) => (b.id === id ? { ...b, adminNotes } : b));
  saveStore(store);
  return true;
}

export async function deleteBooking(id: string): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (!error) return true;
    } catch {
      // fallback
    }
  }
  const store = ensureDataStore();
  store.bookings = store.bookings.filter((b) => b.id !== id);
  saveStore(store);
  return true;
}

export async function resetStoreToDefaults(): Promise<void> {
  const defaultHash = bcrypt.hashSync('admin123', 10);
  const initialStore: DataStore = {
    adminPasswordHash: defaultHash,
    services: INITIAL_SERVICES,
    masters: INITIAL_MASTERS,
    siteInfo: INITIAL_SITE_INFO,
    schedule: INITIAL_SCHEDULE,
    bookings: INITIAL_BOOKINGS,
  };
  saveStore(initialStore);
}
