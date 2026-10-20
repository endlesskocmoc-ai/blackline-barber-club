import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Service,
  Master,
  SiteInfo,
  WorkItem,
  ExportDataPayload,
  ScheduleConfig,
  BookingRecord,
  BookingStatus,
  BookingFormData,
} from '../types/index';
import {
  INITIAL_SERVICES,
  INITIAL_MASTERS,
  INITIAL_SITE_INFO,
  INITIAL_SCHEDULE,
  INITIAL_BOOKINGS,
} from '../data/initialData';
import {
  fetchPublicSiteData,
  fetchPublicSchedule,
  submitBooking,
  apiLogin,
  apiVerifyToken,
  apiChangePassword,
  apiLogout,
  apiGetAdminBookings,
  apiCreateAdminBooking,
  apiUpdateBookingStatus,
  apiUpdateBookingNotes,
  apiDeleteBooking,
  apiUpdateServices,
  apiUpdateMasters,
  apiUpdateSchedule,
  apiUpdateSiteInfo,
  apiGetBackup,
  apiRestoreBackup,
  apiResetTemplate,
  getStoredToken,
} from '../services/apiClient';

interface AppContextType {
  services: Service[];
  masters: Master[];
  siteInfo: SiteInfo;
  schedule: ScheduleConfig;
  bookings: BookingRecord[];
  selectedServiceId: string | null;
  selectedMasterId: string | null;
  activeGalleryItem: WorkItem | null;
  isPrivacyOpen: boolean;
  isPhotoCreditsOpen: boolean;
  activeRoute: 'home' | 'admin';
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  setSelectedServiceId: (id: string | null) => void;
  setSelectedMasterId: (id: string | null) => void;
  setActiveGalleryItem: (item: WorkItem | null) => void;
  setIsPrivacyOpen: (open: boolean) => void;
  setIsPhotoCreditsOpen: (open: boolean) => void;
  setActiveRoute: (route: 'home' | 'admin') => void;
  updateServices: (newServices: Service[]) => Promise<boolean>;
  updateMasters: (newMasters: Master[]) => Promise<boolean>;
  updateSiteInfo: (newSiteInfo: SiteInfo) => Promise<boolean>;
  updateSchedule: (newSchedule: ScheduleConfig) => Promise<boolean>;
  addBookingPublic: (data: BookingFormData) => Promise<{ success: boolean; booking: any }>;
  addBookingAdmin: (data: any) => Promise<BookingRecord>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<boolean>;
  updateBookingNotes: (id: string, adminNotes: string) => Promise<boolean>;
  deleteBooking: (id: string) => Promise<boolean>;
  getAvailableTimeSlots: (date: string, masterId?: string) => Promise<{ time: string; isAvailable: boolean; reason?: string }[]>;
  loginAdmin: (password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => void;
  changeAdminPassword: (oldPwd: string, newPwd: string) => Promise<{ success: boolean; error?: string }>;
  resetToDefaults: () => Promise<boolean>;
  exportDataJson: () => Promise<string>;
  importDataJson: (jsonStr: string) => Promise<{ success: boolean; message: string }>;
  scrollToBooking: () => void;
  refreshAdminData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [masters, setMasters] = useState<Master[]>(INITIAL_MASTERS);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(INITIAL_SITE_INFO);
  const [schedule, setSchedule] = useState<ScheduleConfig>(INITIAL_SCHEDULE);
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [activeGalleryItem, setActiveGalleryItem] = useState<WorkItem | null>(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isPhotoCreditsOpen, setIsPhotoCreditsOpen] = useState(false);

  // Sync route
  const [activeRoute, setActiveRouteState] = useState<'home' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('/admin') || hash.includes('#admin')) {
        return 'admin';
      }
    }
    return 'home';
  });

  const setActiveRoute = (route: 'home' | 'admin') => {
    setActiveRouteState(route);
    if (typeof window !== 'undefined') {
      if (route === 'admin') {
        window.history.pushState(null, '', '/admin');
      } else {
        window.history.pushState(null, '', '/');
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('/admin') || hash.includes('#admin')) {
        setActiveRouteState('admin');
      } else {
        setActiveRouteState('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Fetch initial public data from server
  const loadPublicData = useCallback(async () => {
    try {
      const data = await fetchPublicSiteData();
      if (data.siteInfo) setSiteInfo(data.siteInfo);
      if (data.services) setServices(data.services);
      if (data.masters) setMasters(data.masters);

      const schedData = await fetchPublicSchedule();
      if (schedData.schedule) setSchedule(schedData.schedule);
    } catch (err) {
      console.warn('[BLACKLINE] Could not load public data from API, using defaults:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch admin protected data
  const refreshAdminData = useCallback(async () => {
    try {
      const bList = await apiGetAdminBookings();
      setBookings(bList);
    } catch (err) {
      console.warn('[BLACKLINE] Error refreshing admin bookings:', err);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    loadPublicData();

    if (getStoredToken()) {
      apiVerifyToken().then((isValid) => {
        setIsAdminAuthenticated(isValid);
        if (isValid) {
          refreshAdminData();
        }
      });
    }
  }, [loadPublicData, refreshAdminData]);

  // Public Booking
  const addBookingPublic = async (formData: BookingFormData) => {
    const result = await submitBooking(formData);
    return result;
  };

  // Admin Manual Booking
  const addBookingAdmin = async (data: any): Promise<BookingRecord> => {
    const newRecord = await apiCreateAdminBooking(data);
    setBookings((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  // Change Booking Status
  const updateBookingStatus = async (id: string, status: BookingStatus): Promise<boolean> => {
    const ok = await apiUpdateBookingStatus(id, status);
    if (ok) {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    }
    return ok;
  };

  // Update Booking Notes
  const updateBookingNotes = async (id: string, adminNotes: string): Promise<boolean> => {
    const ok = await apiUpdateBookingNotes(id, adminNotes);
    if (ok) {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, adminNotes } : b)));
    }
    return ok;
  };

  // Delete Booking
  const deleteBooking = async (id: string): Promise<boolean> => {
    const ok = await apiDeleteBooking(id);
    if (ok) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
    }
    return ok;
  };

  // Services Update
  const updateServices = async (newServices: Service[]): Promise<boolean> => {
    setServices(newServices);
    try {
      await apiUpdateServices(newServices);
      return true;
    } catch (err) {
      console.error('Failed to save services to server:', err);
      return false;
    }
  };

  // Masters Update
  const updateMasters = async (newMasters: Master[]): Promise<boolean> => {
    setMasters(newMasters);
    try {
      await apiUpdateMasters(newMasters);
      return true;
    } catch (err) {
      console.error('Failed to save masters to server:', err);
      return false;
    }
  };

  // Site Info Update
  const updateSiteInfo = async (newSiteInfo: SiteInfo): Promise<boolean> => {
    setSiteInfo(newSiteInfo);
    try {
      await apiUpdateSiteInfo(newSiteInfo);
      return true;
    } catch (err) {
      console.error('Failed to save siteInfo to server:', err);
      return false;
    }
  };

  // Schedule Update
  const updateSchedule = async (newSchedule: ScheduleConfig): Promise<boolean> => {
    setSchedule(newSchedule);
    try {
      await apiUpdateSchedule(newSchedule);
      return true;
    } catch (err) {
      console.error('Failed to save schedule to server:', err);
      return false;
    }
  };

  // Dynamic slot availability calculation
  const getAvailableTimeSlots = async (date: string, masterId?: string) => {
    const slots: { time: string; isAvailable: boolean; reason?: string }[] = [];

    try {
      const serverData = await fetchPublicSchedule(date, masterId);
      const currSchedule = serverData.schedule || schedule;
      const busyTimes = serverData.busySlots || [];

      const isDateBlocked = currSchedule.blockedDates.includes(date);
      const dateObj = new Date(date);
      const dayOfWeek = !isNaN(dateObj.getTime()) ? dateObj.getDay() : -1;
      const isDayOff = dayOfWeek !== -1 && !currSchedule.workDays.includes(dayOfWeek);

      const [openH] = currSchedule.openTime.split(':').map((n) => parseInt(n, 10));
      const [closeH] = currSchedule.closeTime.split(':').map((n) => parseInt(n, 10));
      const interval = currSchedule.intervalMinutes || 60;

      const startMinutes = (isNaN(openH) ? 10 : openH) * 60;
      const endMinutes = (isNaN(closeH) ? 22 : closeH) * 60;

      for (let m = startMinutes; m < endMinutes; m += interval) {
        const hh = String(Math.floor(m / 60)).padStart(2, '0');
        const mm = String(m % 60).padStart(2, '0');
        const timeStr = `${hh}:${mm}`;

        if (isDateBlocked) {
          slots.push({ time: timeStr, isAvailable: false, reason: 'Выходной день' });
          continue;
        }
        if (isDayOff) {
          slots.push({ time: timeStr, isAvailable: false, reason: 'Нерабочий день' });
          continue;
        }
        if (currSchedule.breakStart && currSchedule.breakEnd && timeStr >= currSchedule.breakStart && timeStr < currSchedule.breakEnd) {
          slots.push({ time: timeStr, isAvailable: false, reason: 'Перерыв' });
          continue;
        }

        const isBusy = busyTimes.includes(timeStr);
        slots.push({
          time: timeStr,
          isAvailable: !isBusy,
          reason: isBusy ? 'Время занято' : undefined,
        });
      }
    } catch {
      // Fallback generator
      for (let h = 10; h <= 21; h++) {
        slots.push({ time: `${String(h).padStart(2, '0')}:00`, isAvailable: true });
      }
    }

    return slots;
  };

  // Auth
  const loginAdmin = async (pwd: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiLogin(pwd);
      setIsAdminAuthenticated(true);
      await refreshAdminData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка авторизации' };
    }
  };

  const logoutAdmin = () => {
    apiLogout();
    setIsAdminAuthenticated(false);
  };

  const changeAdminPassword = async (oldPwd: string, newPwd: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiChangePassword(oldPwd, newPwd);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка смены пароля' };
    }
  };

  const resetToDefaults = async (): Promise<boolean> => {
    try {
      await apiResetTemplate();
      await loadPublicData();
      await refreshAdminData();
      return true;
    } catch (err) {
      console.error('Reset failed:', err);
      return false;
    }
  };

  const exportDataJson = async (): Promise<string> => {
    try {
      const data = await apiGetBackup();
      return JSON.stringify(data, null, 2);
    } catch {
      const fallbackPayload: ExportDataPayload = {
        version: 3,
        exportedAt: new Date().toISOString(),
        services,
        masters,
        siteInfo,
        schedule,
        bookings,
      };
      return JSON.stringify(fallbackPayload, null, 2);
    }
  };

  const importDataJson = async (jsonStr: string): Promise<{ success: boolean; message: string }> => {
    try {
      const parsed = JSON.parse(jsonStr);
      const res = await apiRestoreBackup(parsed);
      await loadPublicData();
      await refreshAdminData();
      return { success: true, message: res.message || 'Данные успешно импортированы' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Неверный формат JSON' };
    }
  };

  const scrollToBooking = () => {
    if (activeRoute !== 'home') {
      setActiveRoute('home');
      setTimeout(() => {
        const el = document.getElementById('booking');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('booking');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AppContext.Provider
      value={{
        services,
        masters,
        siteInfo,
        schedule,
        bookings,
        selectedServiceId,
        selectedMasterId,
        activeGalleryItem,
        isPrivacyOpen,
        isPhotoCreditsOpen,
        activeRoute,
        isAdminAuthenticated,
        isLoading,
        setSelectedServiceId,
        setSelectedMasterId,
        setActiveGalleryItem,
        setIsPrivacyOpen,
        setIsPhotoCreditsOpen,
        setActiveRoute,
        updateServices,
        updateMasters,
        updateSiteInfo,
        updateSchedule,
        addBookingPublic,
        addBookingAdmin,
        updateBookingStatus,
        updateBookingNotes,
        deleteBooking,
        getAvailableTimeSlots,
        loginAdmin,
        logoutAdmin,
        changeAdminPassword,
        resetToDefaults,
        exportDataJson,
        importDataJson,
        scrollToBooking,
        refreshAdminData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
