import React, { useState, useMemo } from 'react';
import {
  Scissors,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Download,
  Upload,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Users,
  Settings,
  Lock,
  Unlock,
  Clock,
  Sparkles,
  Calendar,
  Search,
  Filter,
  Check,
  X,
  Phone,
  User,
  MapPin,
  Palette,
  LayoutDashboard,
  CalendarDays,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatPrice, formatDuration, formatPhoneInput } from '../utils/validation';
import type {
  Service,
  Master,
  SiteInfo,
  BookingRecord,
  BookingStatus,
  ScheduleConfig,
} from '../types/index';

export const AdminPanel: React.FC = () => {
  const {
    services,
    masters,
    siteInfo,
    schedule,
    bookings,
    isAdminAuthenticated,
    loginAdmin,
    logoutAdmin,
    changeAdminPassword,
    updateServices,
    updateMasters,
    updateSiteInfo,
    updateSchedule,
    addBookingAdmin,
    updateBookingStatus,
    updateBookingNotes,
    deleteBooking,
    resetToDefaults,
    exportDataJson,
    importDataJson,
    setActiveRoute,
  } = useApp();

  // Active section tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'bookings' | 'services' | 'schedule' | 'masters' | 'site' | 'appearance' | 'settings'
  >('dashboard');

  // Login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Bookings filter & search state
  const [bookingPeriod, setBookingPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | BookingStatus>('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [selectedBookingForNotes, setSelectedBookingForNotes] = useState<BookingRecord | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [deleteConfirmBookingId, setDeleteConfirmBookingId] = useState<string | null>(null);

  // Manual new booking modal
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [manualBookingData, setManualBookingData] = useState({
    customerName: '',
    customerPhone: '',
    serviceId: services[0]?.id || '',
    masterId: 'any',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    paymentMethod: 'card_offline' as const,
    comment: '',
    adminNotes: 'Создано администратором',
  });
  const [manualBookingError, setManualBookingError] = useState('');

  // Edit / Add state for Service
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isNewService, setIsNewService] = useState(false);
  const [deleteConfirmServiceId, setDeleteConfirmServiceId] = useState<string | null>(null);

  // Edit / Add state for Master
  const [editingMaster, setEditingMaster] = useState<Master | null>(null);
  const [isNewMaster, setIsNewMaster] = useState(false);
  const [deleteConfirmMasterId, setDeleteConfirmMasterId] = useState<string | null>(null);

  // Editable site info & schedule state
  const [siteForm, setSiteForm] = useState<SiteInfo>(siteInfo);
  const [scheduleForm, setScheduleForm] = useState<ScheduleConfig>(schedule);
  const [newBlockedDate, setNewBlockedDate] = useState('');

  // Reset confirmation modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // JSON import text state
  const [importJsonText, setImportJsonText] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // --- Auth Handlers ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await loginAdmin(passwordInput);
    if (res.success) {
      setLoginError('');
      setPasswordInput('');
    } else {
      setLoginError(res.error || 'Неверный пароль администратора');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('error', 'Новый пароль и подтверждение не совпадают');
      return;
    }
    const res = await changeAdminPassword(oldPassword, newPassword);
    if (res.success) {
      showToast('success', 'Пароль администратора успешно изменён');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast('error', res.error || 'Ошибка смены пароля');
    }
  };

  // --- Dashboard calculations ---
  const dashboardStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const filtered = bookings.filter((b) => {
      if (bookingPeriod === 'all') return true;
      const bDate = new Date(b.date);
      if (isNaN(bDate.getTime())) return false;

      if (bookingPeriod === 'today') {
        return b.date === todayStr;
      }
      if (bookingPeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return bDate >= weekAgo;
      }
      if (bookingPeriod === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return bDate >= monthAgo;
      }
      return true;
    });

    const total = filtered.length;
    const newCount = filtered.filter((b) => b.status === 'new').length;
    const confirmedCount = filtered.filter((b) => b.status === 'confirmed').length;
    const completedCount = filtered.filter((b) => b.status === 'completed').length;
    const cancelledCount = filtered.filter((b) => b.status === 'cancelled').length;
    const expectedRevenue = filtered
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.price || 0), 0);

    // Popular services counts
    const serviceCounts: Record<string, { title: string; count: number; totalRub: number }> = {};
    filtered.forEach((b) => {
      if (b.status === 'cancelled') return;
      const key = b.serviceTitle || b.serviceId;
      if (!serviceCounts[key]) {
        serviceCounts[key] = { title: key, count: 0, totalRub: 0 };
      }
      serviceCounts[key].count += 1;
      serviceCounts[key].totalRub += b.price || 0;
    });
    const popularServices = Object.values(serviceCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    // Upcoming bookings (sorted by date & time ascending)
    const upcoming = bookings
      .filter((b) => b.status === 'new' || b.status === 'confirmed')
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .slice(0, 6);

    return {
      total,
      newCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      expectedRevenue,
      popularServices,
      upcoming,
    };
  }, [bookings, bookingPeriod]);

  // --- Bookings Table filtering ---
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (bookingStatusFilter !== 'all' && b.status !== bookingStatusFilter) {
        return false;
      }
      if (bookingDateFilter && b.date !== bookingDateFilter) {
        return false;
      }
      if (bookingSearch.trim()) {
        const q = bookingSearch.toLowerCase().trim();
        const matchesName = b.customerName.toLowerCase().includes(q);
        const matchesPhone = b.customerPhone.toLowerCase().includes(q);
        const matchesId = b.id.toLowerCase().includes(q);
        const matchesService = b.serviceTitle.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesId && !matchesService) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, bookingStatusFilter, bookingDateFilter, bookingSearch]);

  // --- Manual Booking Handler ---
  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualBookingError('');

    if (!manualBookingData.customerName.trim() || manualBookingData.customerName.length < 2) {
      setManualBookingError('Укажите имя клиента (минимум 2 буквы)');
      return;
    }
    if (!manualBookingData.customerPhone.trim() || manualBookingData.customerPhone.length < 10) {
      setManualBookingError('Укажите корректный номер телефона');
      return;
    }
    if (!manualBookingData.date || !manualBookingData.time) {
      setManualBookingError('Укажите дату и время');
      return;
    }

    try {
      await addBookingAdmin({
        customerName: manualBookingData.customerName.trim(),
        customerPhone: formatPhoneInput(manualBookingData.customerPhone),
        serviceId: manualBookingData.serviceId,
        masterId: manualBookingData.masterId,
        date: manualBookingData.date,
        time: manualBookingData.time,
        paymentMethod: manualBookingData.paymentMethod,
        comment: manualBookingData.comment.trim(),
        adminNotes: manualBookingData.adminNotes.trim(),
      });

      showToast('success', 'Запись успешно создана');
      setShowNewBookingModal(false);
      setManualBookingData({
        customerName: '',
        customerPhone: '',
        serviceId: services[0]?.id || '',
        masterId: 'any',
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
        paymentMethod: 'card_offline',
        comment: '',
        adminNotes: 'Создано администратором',
      });
    } catch (err: any) {
      setManualBookingError(err.message || 'Ошибка создания записи');
    }
  };

  // --- Service operations ---
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    if (!editingService.title.trim()) {
      showToast('error', 'Укажите название услуги');
      return;
    }
    if (editingService.price <= 0) {
      showToast('error', 'Стоимость должна быть положительным числом');
      return;
    }

    let updated: Service[];
    if (isNewService) {
      const newService = {
        ...editingService,
        id: `srv-${Date.now()}`,
        order: services.length + 1,
      };
      updated = [...services, newService];
      showToast('success', 'Услуга успешно добавлена');
    } else {
      updated = services.map((s) => (s.id === editingService.id ? editingService : s));
      showToast('success', 'Изменения в услуге сохранены');
    }
    updateServices(updated);
    setEditingService(null);
  };

  const handleDeleteService = (id: string) => {
    const updated = services.filter((s) => s.id !== id);
    updateServices(updated);
    setDeleteConfirmServiceId(null);
    showToast('success', 'Услуга удалена');
  };

  const handleToggleServiceVisibility = (id: string) => {
    const updated = services.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s));
    updateServices(updated);
  };

  const handleMoveService = (id: string, direction: 'up' | 'down') => {
    const index = services.findIndex((s) => s.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === services.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newServices = [...services];
    const temp = newServices[index];
    newServices[index] = newServices[targetIndex];
    newServices[targetIndex] = temp;

    // reindex order
    const reordered = newServices.map((s, idx) => ({ ...s, order: idx + 1 }));
    updateServices(reordered);
  };

  // --- Master operations ---
  const handleSaveMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaster) return;
    if (!editingMaster.name.trim()) {
      showToast('error', 'Укажите имя мастера');
      return;
    }
    let updated: Master[];
    if (isNewMaster) {
      const newMst = {
        ...editingMaster,
        id: `mst-${Date.now()}`,
        order: masters.length + 1,
      };
      updated = [...masters, newMst];
      showToast('success', 'Мастер успешно добавлен');
    } else {
      updated = masters.map((m) => (m.id === editingMaster.id ? editingMaster : m));
      showToast('success', 'Данные мастера сохранены');
    }
    updateMasters(updated);
    setEditingMaster(null);
  };

  const handleDeleteMaster = (id: string) => {
    const updated = masters.filter((m) => m.id !== id);
    updateMasters(updated);
    setDeleteConfirmMasterId(null);
    showToast('success', 'Мастер удалён из публичного списка (история записей сохранена)');
  };

  const handleToggleMasterVisibility = (id: string) => {
    const updated = masters.map((m) => (m.id === id ? { ...m, isVisible: !m.isVisible } : m));
    updateMasters(updated);
  };

  // --- Site Content & Schedule operations ---
  const handleSaveSiteInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteInfo(siteForm);
    showToast('success', 'Настройки сайта и контактов успешно сохранены');
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchedule(scheduleForm);
    showToast('success', 'Настройки расписания и рабочих интервалов сохранены');
  };

  const toggleWorkDay = (dayIndex: number) => {
    setScheduleForm((prev) => {
      const exists = prev.workDays.includes(dayIndex);
      const updatedDays = exists
        ? prev.workDays.filter((d) => d !== dayIndex)
        : [...prev.workDays, dayIndex].sort((a, b) => a - b);
      return { ...prev, workDays: updatedDays };
    });
  };

  const addBlockedDate = () => {
    if (!newBlockedDate) return;
    if (scheduleForm.blockedDates.includes(newBlockedDate)) {
      showToast('error', 'Эта дата уже заблокирована');
      return;
    }
    setScheduleForm((prev) => ({
      ...prev,
      blockedDates: [...prev.blockedDates, newBlockedDate].sort(),
    }));
    setNewBlockedDate('');
  };

  const removeBlockedDate = (dateToRemove: string) => {
    setScheduleForm((prev) => ({
      ...prev,
      blockedDates: prev.blockedDates.filter((d) => d !== dateToRemove),
    }));
  };

  // --- Backup operations ---
  const handleDownloadBackup = async () => {
    try {
      const jsonStr = await exportDataJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blackline_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Резервная копия скачана в формате JSON');
    } catch {
      showToast('error', 'Ошибка выгрузки резервной копии');
    }
  };

  const handleImportBackup = async () => {
    if (!importJsonText.trim()) {
      showToast('error', 'Вставьте JSON-данные для импорта');
      return;
    }
    const res = await importDataJson(importJsonText);
    if (res.success) {
      showToast('success', res.message);
      setImportJsonText('');
      setSiteForm(siteInfo);
    } else {
      showToast('error', res.message);
    }
  };

  const handleResetToDefaults = async () => {
    const ok = await resetToDefaults();
    setShowResetConfirm(false);
    if (ok) {
      showToast('success', 'Все данные сброшены к базовым значениям шаблона');
    } else {
      showToast('error', 'Ошибка сброса шаблона');
    }
  };

  // ==========================================
  // 1. LOGIN SCREEN (If not authenticated)
  // ==========================================
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] text-[#f4f4f5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121316] border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Brand header */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/[0.08]">
            <div className="w-10 h-10 rounded-lg border border-[#c59b67]/40 bg-[#16171b] flex items-center justify-center text-[#c59b67]">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif-brand font-bold text-lg text-white block">
                {siteInfo.brandName}
              </span>
              <span className="text-xs text-[#a1a1aa] font-mono uppercase tracking-wider">
                Панель управления
              </span>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="adminPassword"
                className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2"
              >
                Пароль администратора
              </label>
              <div className="relative">
                <input
                  id="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Введите пароль..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-[#18191e] text-white px-4 py-3 pr-11 rounded-lg border border-white/10 focus:border-[#c59b67] text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#71717a] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginError && <p className="mt-2 text-xs text-red-400">{loginError}</p>}
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-[#8e909a] leading-relaxed">
              💡 Базовый пароль шаблона: <code className="text-[#c59b67] font-mono">admin123</code>. Пароль можно сменить в разделе «Настройки и доступ».
            </div>

            <button
              type="submit"
              className="w-full bg-[#c59b67] hover:bg-[#d8af7b] text-[#0b0c0e] font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#c59b67]/20"
            >
              <Unlock className="w-4 h-4" />
              <span>Войти в панель</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveRoute('home')}
                className="text-xs text-[#71717a] hover:text-white inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Вернуться на сайт</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. MAIN ADMIN PANEL (Authenticated)
  // ==========================================
  const newBookingsCount = bookings.filter((b) => b.status === 'new').length;

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#f4f4f5] pb-24">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium flex items-center gap-3 animate-fadeIn backdrop-blur-md ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : 'bg-red-950/90 text-red-200 border-red-500/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#121316]/95 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-[#c59b67]/40 bg-[#16171b] flex items-center justify-center text-[#c59b67]">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif-brand font-bold text-base text-white block">
                {siteInfo.brandName}
              </span>
              <span className="text-[10px] text-[#a1a1aa] uppercase font-mono tracking-wider">
                Панель управления сайтом
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveRoute('home')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-xs text-[#a1a1aa] hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>На сайт</span>
            </button>
            <button
              type="button"
              onClick={logoutAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-xs text-red-300 border border-red-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-white/[0.08] scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#c59b67] text-[#0b0c0e] shadow-lg shadow-[#c59b67]/20 font-bold'
                : 'bg-[#16171b] text-[#a1a1aa] hover:text-white hover:bg-[#1c1d22] border border-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Сводка</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-[#c59b67] text-[#0b0c0e] shadow-lg shadow-[#c59b67]/20 font-bold'
                : 'bg-[#16171b] text-[#a1a1aa] hover:text-white hover:bg-[#1c1d22] border border-white/5'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Записи</span>
            {newBookingsCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'bookings'
                    ? 'bg-[#0b0c0e] text-[#c59b67]'
                    : 'bg-[#c59b67] text-[#0b0c0e]'
                }`}
              >
                {newBookingsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'services'
                ? 'bg-[#c59b67] text-[#0b0c0e] shadow-lg shadow-[#c59b67]/20 font-bold'
                : 'bg-[#16171b] text-[#a1a1aa] hover:text-white hover:bg-[#1c1d22] border border-white/5'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Услуги и цены</span>
            <span className="text-[10px] text-[#71717a] font-mono">({services.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-[#c59b67] text-[#0b0c0e] shadow-lg shadow-[#c59b67]/20 font-bold'
                : 'bg-[#16171b] text-[#a1a1aa] hover:text-white hover:bg-[#1c1d22] border border-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Расписание</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('masters')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'masters'
                ? 'bg-[#c59b67] text-[#0b0c0e] shadow-lg shadow-[#c59b67]/20 font-bold'
                : 'bg-[#16171b] text-[#a1a1aa] hover:text-white hover:bg-[#1c1d22] border border-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Мастера</span>
            <span className="text-[10px] text-[#71717a] font-mono">({masters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('site')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'site'
                ? 'bg-[#c59b67] text-[#0b0c0e] shadow-lg shadow-[#c59b67]/20 font-bold'
                : 'bg-[#16171b] text-[#a1a1aa] hover:text-white hover:bg-[#1c1d22] border border-white/5'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Контент и карта</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-[#c59b67] text-[#0b0c0e] shadow-lg shadow-[#c59b67]/20 font-bold'
                : 'bg-[#16171b] text-[#a1a1aa] hover:text-white hover:bg-[#1c1d22] border border-white/5'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Оформление</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#c59b67] text-[#0b0c0e] shadow-lg shadow-[#c59b67]/20 font-bold'
                : 'bg-[#16171b] text-[#a1a1aa] hover:text-white hover:bg-[#1c1d22] border border-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Доступ и бэкап</span>
          </button>
        </div>

        {/* ==============================================
            TAB 1: DASHBOARD (Сводка)
           ============================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header with period toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif-brand text-2xl font-bold text-white">
                  Сводка показателей
                </h2>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Реальные данные по записи клиентов и эффективности клуба
                </p>
              </div>

              {/* Period selector */}
              <div className="flex items-center gap-1.5 p-1 bg-[#16171b] border border-white/10 rounded-xl text-xs">
                {(
                  [
                    { key: 'today', label: 'Сегодня' },
                    { key: 'week', label: '7 дней' },
                    { key: 'month', label: 'Месяц' },
                    { key: 'all', label: 'Всё время' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setBookingPeriod(p.key)}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      bookingPeriod === p.key
                        ? 'bg-[#c59b67] text-[#0b0c0e] font-bold'
                        : 'text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total */}
              <div className="p-5 rounded-2xl bg-[#121316] border border-white/[0.08] shadow-lg">
                <span className="text-[11px] font-mono text-[#a1a1aa] uppercase tracking-wider block mb-1">
                  Всего заявок
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-serif-brand text-white">
                    {dashboardStats.total}
                  </span>
                  <CalendarDays className="w-5 h-5 text-[#c59b67]" />
                </div>
                <span className="text-[11px] text-[#71717a] mt-2 block">
                  За выбранный период
                </span>
              </div>

              {/* Card 2: New requests */}
              <div className="p-5 rounded-2xl bg-[#121316] border border-amber-500/30 shadow-lg">
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block mb-1">
                  Новые заявки
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-serif-brand text-amber-400">
                    {dashboardStats.newCount}
                  </span>
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-[11px] text-[#71717a] mt-2 block">
                  Требуют звонка и подтверждения
                </span>
              </div>

              {/* Card 3: Confirmed / Completed */}
              <div className="p-5 rounded-2xl bg-[#121316] border border-emerald-500/20 shadow-lg">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                  Подтверждено / Завершено
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-serif-brand text-emerald-400">
                    {dashboardStats.confirmedCount + dashboardStats.completedCount}
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[11px] text-[#71717a] mt-2 block">
                  {dashboardStats.confirmedCount} ожидает, {dashboardStats.completedCount} завершено
                </span>
              </div>

              {/* Card 4: Revenue */}
              <div className="p-5 rounded-2xl bg-[#121316] border border-white/[0.08] shadow-lg">
                <span className="text-[11px] font-mono text-[#c59b67] uppercase tracking-wider block mb-1">
                  Сумма услуг (выручка)
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-serif-brand text-[#c59b67]">
                    {formatPrice(dashboardStats.expectedRevenue)}
                  </span>
                  <DollarSign className="w-5 h-5 text-[#c59b67]" />
                </div>
                <span className="text-[11px] text-[#71717a] mt-2 block">
                  Без учёта отмен ({dashboardStats.cancelledCount} отмен)
                </span>
              </div>
            </div>

            {/* Split row: Upcoming Bookings & Top Services */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Upcoming Bookings (7 cols) */}
              <div className="lg:col-span-7 bg-[#121316] border border-white/[0.08] rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#c59b67]" />
                    <h3 className="font-serif-brand text-lg font-bold text-white">
                      Ближайшие записи
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs text-[#c59b67] hover:underline cursor-pointer"
                  >
                    Все записи →
                  </button>
                </div>

                {dashboardStats.upcoming.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardStats.upcoming.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/15 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm truncate">
                              {b.customerName}
                            </span>
                            <span className="text-xs text-[#a1a1aa] font-mono">
                              {b.customerPhone}
                            </span>
                          </div>
                          <div className="text-xs text-[#71717a] mt-0.5 truncate">
                            {b.serviceTitle} • Мастер: {b.masterName}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-xs font-bold text-[#c59b67] block">
                            {b.date} в {b.time}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                              b.status === 'new'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {b.status === 'new' ? 'Новая' : 'Подтверждена'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#71717a]">
                    Нет ближайших подтверждённых записей
                  </div>
                )}
              </div>

              {/* Popular Services (5 cols) */}
              <div className="lg:col-span-5 bg-[#121316] border border-white/[0.08] rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-[#c59b67]" />
                  <h3 className="font-serif-brand text-lg font-bold text-white">
                    Популярные услуги
                  </h3>
                </div>

                {dashboardStats.popularServices.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardStats.popularServices.map((ps, idx) => (
                      <div
                        key={ps.title}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-[#18191e] border border-[#c59b67]/30 text-[#c59b67] font-mono text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-medium text-white truncate">
                            {ps.title}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-white block">
                            {ps.count} визитов
                          </span>
                          <span className="text-[10px] text-[#71717a]">
                            {formatPrice(ps.totalRub)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#71717a]">
                    За выбранный период данных по услугам нет
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
            TAB 2: BOOKINGS (Управление записями)
           ============================================== */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif-brand text-2xl font-bold text-white">
                  Журнал записей
                </h2>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Всего записей: {bookings.length} • Показано: {filteredBookings.length}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewBookingModal(true)}
                  className="bg-[#c59b67] hover:bg-[#d8af7b] text-[#0b0c0e] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Создать запись</span>
                </button>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="p-4 rounded-2xl bg-[#121316] border border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#71717a]" />
                <input
                  type="text"
                  placeholder="Поиск по имени, телефону, ID..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full bg-[#18191e] text-white pl-9 pr-3 py-2 rounded-lg border border-white/10 text-xs focus:border-[#c59b67]"
                />
              </div>

              {/* Status Filter */}
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value as any)}
                className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10 text-xs focus:border-[#c59b67]"
              >
                <option value="all">Все статусы</option>
                <option value="new">Новые</option>
                <option value="confirmed">Подтверждённые</option>
                <option value="completed">Завершённые</option>
                <option value="cancelled">Отменённые</option>
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={bookingDateFilter}
                onChange={(e) => setBookingDateFilter(e.target.value)}
                className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10 text-xs focus:border-[#c59b67]"
              />
            </div>

            {/* Bookings Table / Cards */}
            <div className="bg-[#121316] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
              {filteredBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#16171b] border-b border-white/[0.08] text-[#a1a1aa] uppercase font-mono text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Бронь / Клиент</th>
                        <th className="py-3 px-4">Услуга и мастер</th>
                        <th className="py-3 px-4">Дата и время</th>
                        <th className="py-3 px-4">Сумма / Оплата</th>
                        <th className="py-3 px-4">Статус</th>
                        <th className="py-3 px-4 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Client */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[10px] text-[#c59b67] block">
                              #{b.id}
                            </span>
                            <span className="font-bold text-white block text-sm">
                              {b.customerName}
                            </span>
                            <a
                              href={`tel:${b.customerPhone}`}
                              className="text-xs text-[#a1a1aa] hover:text-[#c59b67]"
                            >
                              {b.customerPhone}
                            </a>
                            {b.comment && (
                              <p className="text-[11px] text-[#71717a] italic mt-1 max-w-xs">
                                «{b.comment}»
                              </p>
                            )}
                          </td>

                          {/* Service & Master */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-white block">
                              {b.serviceTitle}
                            </span>
                            <span className="text-[#a1a1aa]">Мастер: {b.masterName}</span>
                            {b.adminNotes && (
                              <span className="block text-[10px] text-amber-400 font-mono mt-1">
                                Заметка: {b.adminNotes}
                              </span>
                            )}
                          </td>

                          {/* Date & Time */}
                          <td className="py-3.5 px-4 font-mono">
                            <span className="text-white font-bold block">{b.date}</span>
                            <span className="text-[#c59b67]">{b.time}</span>
                          </td>

                          {/* Price & Payment */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">
                              {formatPrice(b.price)}
                            </span>
                            <span className="text-[11px] text-[#71717a]">
                              {b.paymentMethod === 'card_offline'
                                ? 'Карта (терминал)'
                                : 'Наличные'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <select
                              value={b.status}
                              onChange={(e) =>
                                updateBookingStatus(b.id, e.target.value as BookingStatus)
                              }
                              className={`text-[11px] font-mono px-2 py-1 rounded border font-semibold ${
                                b.status === 'new'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : b.status === 'confirmed'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : b.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}
                            >
                              <option value="new" className="bg-[#18191e] text-white">Новая</option>
                              <option value="confirmed" className="bg-[#18191e] text-white">Подтверждена</option>
                              <option value="completed" className="bg-[#18191e] text-white">Завершена</option>
                              <option value="cancelled" className="bg-[#18191e] text-white">Отменена</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                title="Редактировать заметку"
                                onClick={() => {
                                  setSelectedBookingForNotes(b);
                                  setTempNotes(b.adminNotes || '');
                                }}
                                className="p-1.5 rounded bg-white/[0.04] hover:bg-white/10 text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Удалить запись"
                                onClick={() => setDeleteConfirmBookingId(b.id)}
                                className="p-1.5 rounded bg-red-950/30 hover:bg-red-900/50 text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-[#71717a]">
                  Записей по заданным критериям не найдено
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==============================================
            TAB 3: SERVICES (Услуги и цены)
           ============================================== */}
        {activeTab === 'services' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif-brand text-2xl font-bold text-white">
                  Прайс-лист услуг
                </h2>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Управляйте названиями, описанием, стоимостью и порядком отображения
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingService({
                    id: '',
                    title: '',
                    price: 2000,
                    durationMinutes: 45,
                    category: 'hair',
                    description: '',
                    isVisible: true,
                    order: services.length + 1,
                  });
                  setIsNewService(true);
                }}
                className="bg-[#c59b67] hover:bg-[#d8af7b] text-[#0b0c0e] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить услугу</span>
              </button>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service, idx) => (
                <div
                  key={service.id}
                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                    service.isVisible
                      ? 'bg-[#121316] border-white/[0.08]'
                      : 'bg-[#121316]/60 border-white/[0.04] opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#c59b67] bg-[#c59b67]/10 px-2 py-0.5 rounded border border-[#c59b67]/20">
                        {service.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMoveService(service.id, 'up')}
                          disabled={idx === 0}
                          title="Поднять выше"
                          className="p-1 rounded bg-white/[0.03] hover:bg-white/10 disabled:opacity-20 text-[#a1a1aa]"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveService(service.id, 'down')}
                          disabled={idx === services.length - 1}
                          title="Опустить ниже"
                          className="p-1 rounded bg-white/[0.03] hover:bg-white/10 disabled:opacity-20 text-[#a1a1aa]"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleServiceVisibility(service.id)}
                          title={service.isVisible ? 'Скрыть с сайта' : 'Показать на сайте'}
                          className="p-1 rounded bg-white/[0.03] hover:bg-white/10 text-[#a1a1aa] hover:text-white"
                        >
                          {service.isVisible ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <h3 className="font-serif-brand text-lg font-bold text-white mb-1">
                      {service.title}
                    </h3>
                    <p className="text-xs text-[#a1a1aa] leading-relaxed mb-4">
                      {service.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
                    <div>
                      <span className="font-serif-brand text-lg font-bold text-[#c59b67]">
                        {formatPrice(service.price)}
                      </span>
                      <span className="text-xs text-[#71717a] ml-2">
                        {formatDuration(service.durationMinutes)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingService(service);
                          setIsNewService(false);
                        }}
                        className="px-2.5 py-1.5 rounded bg-white/[0.04] hover:bg-white/10 text-xs text-white"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmServiceId(service.id)}
                        className="p-1.5 rounded bg-red-950/40 hover:bg-red-900/50 text-red-400 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==============================================
            TAB 4: SCHEDULE (Расписание и слоты)
           ============================================== */}
        {activeTab === 'schedule' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl">
            <div>
              <h2 className="font-serif-brand text-2xl font-bold text-white">
                Настройки расписания
              </h2>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Определяет доступные интервалы онлайн-записи и защищает от конфликтов времени
              </p>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 sm:p-8 rounded-2xl bg-[#121316] border border-white/[0.08] space-y-6">
              {/* Working Days */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-3">
                  Рабочие дни недели
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {[
                    { day: 1, label: 'Пн' },
                    { day: 2, label: 'Вт' },
                    { day: 3, label: 'Ср' },
                    { day: 4, label: 'Чт' },
                    { day: 5, label: 'Пт' },
                    { day: 6, label: 'Сб' },
                    { day: 0, label: 'Вс' },
                  ].map((d) => {
                    const isActive = scheduleForm.workDays.includes(d.day);
                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => toggleWorkDay(d.day)}
                        className={`py-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-[#c59b67] text-[#0b0c0e] border-[#c59b67] shadow-md shadow-[#c59b67]/15'
                            : 'bg-[#18191e] text-[#71717a] border-white/5 hover:border-white/20'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Working Hours & Interval */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                    Время открытия
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.openTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, openTime: e.target.value })}
                    className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                    Время закрытия
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.closeTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, closeTime: e.target.value })}
                    className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                    Шаг слота записи (минут)
                  </label>
                  <select
                    value={scheduleForm.intervalMinutes}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        intervalMinutes: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                  >
                    <option value={30}>Каждые 30 минут</option>
                    <option value={45}>Каждые 45 минут</option>
                    <option value={60}>Каждые 60 минут (1 час)</option>
                  </select>
                </div>
              </div>

              {/* Technical Break */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-white/[0.04]">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                    Перерыв: Начало
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.breakStart || ''}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, breakStart: e.target.value })}
                    className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                    Перерыв: Окончание
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.breakEnd || ''}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, breakEnd: e.target.value })}
                    className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                  />
                </div>
              </div>

              {/* Blocked Dates (Holidays / Exceptions) */}
              <div className="pt-4 border-t border-white/[0.04]">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                  Исключения и нерабочие даты (праздники, санитарные дни)
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="date"
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                    className="bg-[#18191e] text-white px-4 py-2 rounded-lg border border-white/10 text-xs focus:border-[#c59b67]"
                  />
                  <button
                    type="button"
                    onClick={addBlockedDate}
                    className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/10 text-xs font-semibold text-white border border-white/10 cursor-pointer"
                  >
                    Заблокировать дату
                  </button>
                </div>

                {scheduleForm.blockedDates.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {scheduleForm.blockedDates.map((date) => (
                      <span
                        key={date}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 font-mono"
                      >
                        <span>{date}</span>
                        <button
                          type="button"
                          onClick={() => removeBlockedDate(date)}
                          className="hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#71717a]">Нет заблокированных дат</p>
                )}
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                <button
                  type="submit"
                  className="bg-[#c59b67] hover:bg-[#d8af7b] text-[#0b0c0e] font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Сохранить расписание</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==============================================
            TAB 5: MASTERS (Управление мастерами)
           ============================================== */}
        {activeTab === 'masters' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif-brand text-2xl font-bold text-white">
                  Мастера барбершопа
                </h2>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Управление профилями, фото и доступностью мастеров для записи
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingMaster({
                    id: '',
                    name: '',
                    specialization: '',
                    bio: '',
                    photoUrl: '/images/stock_master_artem.jpg',
                    isVisible: true,
                    order: masters.length + 1,
                  });
                  setIsNewMaster(true);
                }}
                className="bg-[#c59b67] hover:bg-[#d8af7b] text-[#0b0c0e] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить мастера</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {masters.map((master) => (
                <div
                  key={master.id}
                  className={`rounded-2xl border overflow-hidden flex flex-col justify-between ${
                    master.isVisible
                      ? 'bg-[#121316] border-white/[0.08]'
                      : 'bg-[#121316]/60 border-white/[0.04] opacity-60'
                  }`}
                >
                  <div>
                    <div className="aspect-[4/3] bg-[#1a1b20] overflow-hidden relative">
                      <img
                        src={master.photoUrl}
                        alt={master.name}
                        className="w-full h-full object-cover object-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleToggleMasterVisibility(master.id)}
                        className="absolute top-3 right-3 p-2 rounded-lg bg-black/70 backdrop-blur-md text-white border border-white/10"
                        title={master.isVisible ? 'Принимает записи' : 'Запись отключена'}
                      >
                        {master.isVisible ? (
                          <Eye className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-red-400" />
                        )}
                      </button>
                    </div>

                    <div className="p-5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#c59b67] block mb-1">
                        {master.specialization}
                      </span>
                      <h3 className="font-serif-brand text-xl font-bold text-white mb-2">
                        {master.name}
                      </h3>
                      <p className="text-xs text-[#a1a1aa] leading-relaxed line-clamp-3">
                        {master.bio}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-3 border-t border-white/[0.05] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMaster(master);
                        setIsNewMaster(false);
                      }}
                      className="px-3 py-1.5 rounded bg-white/[0.04] hover:bg-white/10 text-xs text-white"
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmMasterId(master.id)}
                      className="p-1.5 rounded bg-red-950/40 hover:bg-red-900/50 text-red-400 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==============================================
            TAB 6: SITE CONTENT & MAP (Контент и карта)
           ============================================== */}
        {activeTab === 'site' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl">
            <div>
              <h2 className="font-serif-brand text-2xl font-bold text-white">
                Контент сайта и геолокация
              </h2>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Настройте адрес, координаты карты, контакты и основные тексты для вашего заведения
              </p>
            </div>

            <form onSubmit={handleSaveSiteInfo} className="p-6 sm:p-8 rounded-2xl bg-[#121316] border border-white/[0.08] space-y-6">
              {/* Brand and City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                    Название барбершопа
                  </label>
                  <input
                    type="text"
                    required
                    value={siteForm.brandName}
                    onChange={(e) => setSiteForm({ ...siteForm, brandName: e.target.value })}
                    className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                    Город
                  </label>
                  <input
                    type="text"
                    required
                    value={siteForm.city}
                    onChange={(e) => setSiteForm({ ...siteForm, city: e.target.value })}
                    className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                  />
                </div>
              </div>

              {/* Address and Metro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                    Улица, дом, строение
                  </label>
                  <input
                    type="text"
                    required
                    value={siteForm.address}
                    onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
                    className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                    Ближайшее метро / ориентир
                  </label>
                  <input
                    type="text"
                    value={siteForm.metro}
                    onChange={(e) => setSiteForm({ ...siteForm, metro: e.target.value })}
                    className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                  />
                </div>
              </div>

              {/* Map Coordinates & Zoom */}
              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-4">
                <span className="text-xs font-bold text-[#c59b67] uppercase tracking-wider block">
                  Координаты для интерактивной карты
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] mb-1">
                      Широта (Latitude)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={siteForm.lat}
                      onChange={(e) => setSiteForm({ ...siteForm, lat: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] mb-1">
                      Долгота (Longitude)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={siteForm.lng}
                      onChange={(e) => setSiteForm({ ...siteForm, lng: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#a1a1aa] mb-1">
                      Масштаб (Zoom)
                    </label>
                    <input
                      type="number"
                      value={siteForm.zoom}
                      onChange={(e) => setSiteForm({ ...siteForm, zoom: parseInt(e.target.value, 10) || 16 })}
                      className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[#a1a1aa] mb-1">
                    Прямая ссылка для маршрута (Яндекс.Карты)
                  </label>
                  <input
                    type="url"
                    value={siteForm.routeUrl}
                    onChange={(e) => setSiteForm({ ...siteForm, routeUrl: e.target.value })}
                    className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Phone & Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                    Телефон для отображения
                  </label>
                  <input
                    type="text"
                    required
                    value={siteForm.phone}
                    onChange={(e) => setSiteForm({ ...siteForm, phone: e.target.value })}
                    className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                    Телефон без пробелов (для звонка)
                  </label>
                  <input
                    type="text"
                    required
                    value={siteForm.phoneRaw}
                    onChange={(e) => setSiteForm({ ...siteForm, phoneRaw: e.target.value })}
                    className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm font-mono focus:border-[#c59b67]"
                  />
                </div>
              </div>

              {/* Working Hours text */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                  Текст режима работы
                </label>
                <input
                  type="text"
                  value={siteForm.workingHours}
                  onChange={(e) => setSiteForm({ ...siteForm, workingHours: e.target.value })}
                  className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                />
              </div>

              {/* Hero Headings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-white/[0.04]">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                    Главный заголовок (Строка 1)
                  </label>
                  <input
                    type="text"
                    value={siteForm.heroTitleLine1}
                    onChange={(e) => setSiteForm({ ...siteForm, heroTitleLine1: e.target.value })}
                    className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                    Главный заголовок (Строка 2)
                  </label>
                  <input
                    type="text"
                    value={siteForm.heroTitleLine2}
                    onChange={(e) => setSiteForm({ ...siteForm, heroTitleLine2: e.target.value })}
                    className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                  Подзаголовок Hero
                </label>
                <textarea
                  rows={2}
                  value={siteForm.heroSubtitle}
                  onChange={(e) => setSiteForm({ ...siteForm, heroSubtitle: e.target.value })}
                  className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                />
              </div>

              {/* About Text */}
              <div className="pt-4 border-t border-white/[0.04]">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                  Текст блока «О клубе»
                </label>
                <textarea
                  rows={3}
                  value={siteForm.aboutText}
                  onChange={(e) => setSiteForm({ ...siteForm, aboutText: e.target.value })}
                  className="w-full bg-[#18191e] text-white px-4 py-2.5 rounded-lg border border-white/10 text-sm focus:border-[#c59b67]"
                />
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                <button
                  type="submit"
                  className="bg-[#c59b67] hover:bg-[#d8af7b] text-[#0b0c0e] font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Сохранить контент</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==============================================
            TAB 7: APPEARANCE (Оформление)
           ============================================== */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl">
            <div>
              <h2 className="font-serif-brand text-2xl font-bold text-white">
                Настройки оформления
              </h2>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Выбор фирменных акцентных оттенков и стилистики шаблона
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#121316] border border-white/[0.08] space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-3">
                  Фирменный акцентный цвет
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { name: 'Благородное золото', hex: '#c59b67' },
                    { name: 'Тёплый янтарь', hex: '#d97706' },
                    { name: 'Медная бронза', hex: '#b45309' },
                    { name: 'Платиновый графит', hex: '#94a3b8' },
                    { name: 'Изумрудный барбер', hex: '#059669' },
                  ].map((color) => {
                    const isSelected = (siteForm.themeColor || '#c59b67') === color.hex;
                    return (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => {
                          const updated = { ...siteForm, themeColor: color.hex };
                          setSiteForm(updated);
                          updateSiteInfo(updated);
                          showToast('success', `Установлен цвет: ${color.name}`);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-white bg-white/[0.08] shadow-lg ring-2 ring-white/20'
                            : 'border-white/10 bg-[#18191e] hover:border-white/20'
                        }`}
                      >
                        <div
                          className="w-full h-8 rounded-lg mb-2 shadow-inner"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-xs font-bold text-white block truncate">
                          {color.name}
                        </span>
                        <span className="text-[10px] text-[#71717a] font-mono">
                          {color.hex}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">
                  Предпросмотр кнопки с текущим цветом
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    style={{ backgroundColor: siteForm.themeColor || '#c59b67' }}
                    className="text-[#0b0c0e] font-bold text-sm px-6 py-3 rounded-lg shadow-lg"
                  >
                    Забронировать визит
                  </button>
                  <button
                    type="button"
                    style={{ borderColor: siteForm.themeColor || '#c59b67', color: siteForm.themeColor || '#c59b67' }}
                    className="border text-sm px-6 py-3 rounded-lg bg-transparent"
                  >
                    Смотреть услуги
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
            TAB 8: SETTINGS & BACKUP (Доступ и бэкап)
           ============================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl">
            <div>
              <h2 className="font-serif-brand text-2xl font-bold text-white">
                Доступ и резервное копирование
              </h2>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Смена пароля, сохранение резервных копий и системный статус
              </p>
            </div>

            {/* Architecture honesty note */}
            <div className="p-5 rounded-2xl bg-[#161820] border border-[#c59b67]/30 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 text-[#c59b67] font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Архитектура шаблона BLACKLINE BARBER CLUB</span>
              </div>
              <p className="text-[#d4d4d8]">
                В текущей редакции шаблон работает в автономном режиме: все внесённые изменения (услуги, мастера, расписание, записи клиентов и настройки карты) надёжно сохраняются в локальном хранилище вашего браузера (LocalStorage).
              </p>
              <p className="text-[#a1a1aa]">
                Для запуска в крупной коммерческой сети с синхронизацией между устройствами администраторов проект готов к подключению серверной базы данных (PostgreSQL / Cloud SQL / Firebase) через стандартный REST API.
              </p>
            </div>

            {/* Change Password */}
            <form onSubmit={handleChangePasswordSubmit} className="p-6 sm:p-8 rounded-2xl bg-[#121316] border border-white/[0.08] space-y-5">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#c59b67]" />
                <h3 className="font-serif-brand text-lg font-bold text-white">
                  Смена пароля администратора
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-[#a1a1aa] uppercase font-semibold mb-1">
                    Текущий пароль
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10 text-xs focus:border-[#c59b67]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#a1a1aa] uppercase font-semibold mb-1">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10 text-xs focus:border-[#c59b67]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#a1a1aa] uppercase font-semibold mb-1">
                    Повторите новый пароль
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10 text-xs focus:border-[#c59b67]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#c59b67] hover:bg-[#d8af7b] text-[#0b0c0e] font-bold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Обновить пароль
              </button>
            </form>

            {/* Backup & Restore */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#121316] border border-white/[0.08] space-y-6">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-[#c59b67]" />
                <h3 className="font-serif-brand text-lg font-bold text-white">
                  Резервное копирование (Экспорт / Импорт)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Export */}
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                  <h4 className="font-bold text-white text-sm">Экспорт настроек</h4>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">
                    Скачайте полный снимок настроек сайта, услуг, мастеров, расписания и журнала записей в один файл.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="bg-white/[0.05] hover:bg-white/10 text-white border border-white/10 font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#c59b67]" />
                    <span>Скачать blackline_backup.json</span>
                  </button>
                </div>

                {/* Reset to base template */}
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                  <h4 className="font-bold text-white text-sm">Сброс к базовому шаблону</h4>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">
                    Верните исходные параметры клуба, первоначальный прайс-лист и расписание по умолчанию.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-500/30 font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Восстановить базовый шаблон</span>
                  </button>
                </div>
              </div>

              {/* Import JSON */}
              <div className="pt-4 border-t border-white/[0.04] space-y-3">
                <h4 className="font-bold text-white text-sm">Импорт данных из JSON</h4>
                <textarea
                  rows={4}
                  placeholder="Вставьте JSON-данные резервной копии..."
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full bg-[#18191e] text-white p-3 rounded-lg border border-white/10 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleImportBackup}
                  className="bg-[#c59b67] hover:bg-[#d8af7b] text-[#0b0c0e] font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Применить импорт
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==============================================
          MODALS
         ============================================== */}

      {/* 1. Modal: Manual New Booking */}
      {showNewBookingModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div className="relative max-w-lg w-full bg-[#121316] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <h3 className="font-serif-brand text-lg font-bold text-white">
                Новая запись клиента
              </h3>
              <button
                type="button"
                onClick={() => setShowNewBookingModal(false)}
                className="p-1 rounded text-[#a1a1aa] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                  Имя клиента *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Иван"
                  value={manualBookingData.customerName}
                  onChange={(e) =>
                    setManualBookingData({ ...manualBookingData, customerName: e.target.value })
                  }
                  className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                  Телефон *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+7 (999) 000-00-00"
                  value={manualBookingData.customerPhone}
                  onChange={(e) =>
                    setManualBookingData({ ...manualBookingData, customerPhone: e.target.value })
                  }
                  className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                    Услуга *
                  </label>
                  <select
                    value={manualBookingData.serviceId}
                    onChange={(e) =>
                      setManualBookingData({ ...manualBookingData, serviceId: e.target.value })
                    }
                    className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({formatPrice(s.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                    Мастер
                  </label>
                  <select
                    value={manualBookingData.masterId}
                    onChange={(e) =>
                      setManualBookingData({ ...manualBookingData, masterId: e.target.value })
                    }
                    className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                  >
                    <option value="any">Любой свободный</option>
                    {masters.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                    Дата *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualBookingData.date}
                    onChange={(e) =>
                      setManualBookingData({ ...manualBookingData, date: e.target.value })
                    }
                    className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                  />
                </div>

                <div>
                  <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                    Время *
                  </label>
                  <input
                    type="time"
                    required
                    value={manualBookingData.time}
                    onChange={(e) =>
                      setManualBookingData({ ...manualBookingData, time: e.target.value })
                    }
                    className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                  Способ оплаты
                </label>
                <select
                  value={manualBookingData.paymentMethod}
                  onChange={(e) =>
                    setManualBookingData({
                      ...manualBookingData,
                      paymentMethod: e.target.value as any,
                    })
                  }
                  className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                >
                  <option value="card_offline">Картой при визите (терминал)</option>
                  <option value="cash_offline">Наличными при визите</option>
                </select>
              </div>

              <div>
                <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                  Заметки администратора
                </label>
                <textarea
                  rows={2}
                  value={manualBookingData.adminNotes}
                  onChange={(e) =>
                    setManualBookingData({ ...manualBookingData, adminNotes: e.target.value })
                  }
                  className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                />
              </div>

              {manualBookingError && (
                <p className="text-red-400 text-xs font-medium">{manualBookingError}</p>
              )}

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewBookingModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/[0.05] text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#c59b67] text-[#0b0c0e] font-bold"
                >
                  Создать запись
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Edit Admin Notes */}
      {selectedBookingForNotes && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div className="relative max-w-md w-full bg-[#121316] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-serif-brand text-lg font-bold text-white mb-2">
              Заметки по брони #{selectedBookingForNotes.id}
            </h3>
            <p className="text-xs text-[#a1a1aa] mb-4">
              Клиент: {selectedBookingForNotes.customerName} ({selectedBookingForNotes.customerPhone})
            </p>

            <textarea
              rows={4}
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Добавьте служебные комментарии..."
              className="w-full bg-[#18191e] text-white p-3 rounded-lg border border-white/10 text-xs mb-4"
            />

            <div className="flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setSelectedBookingForNotes(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] text-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  updateBookingNotes(selectedBookingForNotes.id, tempNotes);
                  setSelectedBookingForNotes(null);
                  showToast('success', 'Заметка сохранена');
                }}
                className="px-5 py-2 rounded-lg bg-[#c59b67] text-[#0b0c0e] font-bold cursor-pointer"
              >
                Сохранить заметку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Delete Booking Confirmation */}
      {deleteConfirmBookingId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div className="relative max-w-sm w-full bg-[#121316] border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-serif-brand text-lg font-bold text-white mb-2">
              Удалить запись?
            </h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed mb-5">
              Вы уверены, что хотите безвозвратно удалить бронь #{deleteConfirmBookingId}? Это действие нельзя отменить.
            </p>
            <div className="flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmBookingId(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] text-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteBooking(deleteConfirmBookingId);
                  setDeleteConfirmBookingId(null);
                  showToast('success', 'Запись удалена');
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
              >
                Удалить запись
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Edit / Add Service */}
      {editingService && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div className="relative max-w-lg w-full bg-[#121316] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <h3 className="font-serif-brand text-lg font-bold text-white">
                {isNewService ? 'Новая услуга' : 'Редактирование услуги'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="p-1 rounded text-[#a1a1aa] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                  Название услуги *
                </label>
                <input
                  type="text"
                  required
                  value={editingService.title}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                    Стоимость (руб) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingService.price}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        price: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                    Длительность (минут) *
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    step={5}
                    value={editingService.durationMinutes}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        durationMinutes: parseInt(e.target.value, 10) || 30,
                      })
                    }
                    className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                  Категория
                </label>
                <select
                  value={editingService.category}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                >
                  <option value="hair">Стрижки</option>
                  <option value="beard">Борода и бритьё</option>
                  <option value="combo">Комплексы</option>
                  <option value="care">Уход и камуфляж</option>
                </select>
              </div>

              <div>
                <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                  Описание услуги
                </label>
                <textarea
                  rows={3}
                  value={editingService.description}
                  onChange={(e) =>
                    setEditingService({ ...editingService, description: e.target.value })
                  }
                  className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="srvVisible"
                  checked={editingService.isVisible}
                  onChange={(e) =>
                    setEditingService({ ...editingService, isVisible: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#c59b67]"
                />
                <label htmlFor="srvVisible" className="text-white cursor-pointer">
                  Отображать в публичном каталоге услуг
                </label>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-lg bg-white/[0.05] text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#c59b67] text-[#0b0c0e] font-bold"
                >
                  Сохранить услугу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Delete Service Confirmation */}
      {deleteConfirmServiceId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div className="relative max-w-sm w-full bg-[#121316] border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-serif-brand text-lg font-bold text-white mb-2">
              Удалить услугу?
            </h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed mb-5">
              Услуга будет удалена из каталога и онлайн-записи.
            </p>
            <div className="flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmServiceId(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] text-white"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => handleDeleteService(deleteConfirmServiceId)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Edit / Add Master */}
      {editingMaster && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div className="relative max-w-lg w-full bg-[#121316] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <h3 className="font-serif-brand text-lg font-bold text-white">
                {isNewMaster ? 'Новый мастер' : 'Редактирование профиля мастера'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMaster(null)}
                className="p-1 rounded text-[#a1a1aa] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaster} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                  Имя мастера *
                </label>
                <input
                  type="text"
                  required
                  value={editingMaster.name}
                  onChange={(e) => setEditingMaster({ ...editingMaster, name: e.target.value })}
                  className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                  Специализация
                </label>
                <input
                  type="text"
                  placeholder="Стрижки и моделирование бороды"
                  value={editingMaster.specialization}
                  onChange={(e) =>
                    setEditingMaster({ ...editingMaster, specialization: e.target.value })
                  }
                  className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                  URL фотографии
                </label>
                <input
                  type="text"
                  value={editingMaster.photoUrl}
                  onChange={(e) =>
                    setEditingMaster({ ...editingMaster, photoUrl: e.target.value })
                  }
                  className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] uppercase font-semibold mb-1">
                  Краткая биография
                </label>
                <textarea
                  rows={3}
                  value={editingMaster.bio}
                  onChange={(e) => setEditingMaster({ ...editingMaster, bio: e.target.value })}
                  className="w-full bg-[#18191e] text-white px-3 py-2 rounded-lg border border-white/10"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="mstVisible"
                  checked={editingMaster.isVisible}
                  onChange={(e) =>
                    setEditingMaster({ ...editingMaster, isVisible: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#c59b67]"
                />
                <label htmlFor="mstVisible" className="text-white cursor-pointer">
                  Доступен для записи и виден на сайте
                </label>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMaster(null)}
                  className="px-4 py-2 rounded-lg bg-white/[0.05] text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#c59b67] text-[#0b0c0e] font-bold"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Delete Master Confirmation */}
      {deleteConfirmMasterId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div className="relative max-w-sm w-full bg-[#121316] border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-serif-brand text-lg font-bold text-white mb-2">
              Удалить мастера?
            </h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed mb-5">
              Мастер будет удалён из списка команды. Все предыдущие записи к этому мастеру сохранятся в журнале.
            </p>
            <div className="flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmMasterId(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] text-white"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMaster(deleteConfirmMasterId)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Reset Template Confirmation */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div className="relative max-w-sm w-full bg-[#121316] border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-serif-brand text-lg font-bold text-white mb-2">
              Сброс к базовому шаблону
            </h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed mb-5">
              Вы уверены? Это действие восстановит исходные услуги, расписание, мастеров и контакты шаблона BLACKLINE BARBER CLUB.
            </p>
            <div className="flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] text-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
              >
                Да, сбросить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
