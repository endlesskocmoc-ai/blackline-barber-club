import { Router, Request, Response } from 'express';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
  verifyAdminPassword,
  setAdminPassword,
  generateAdminToken,
  requireAdminAuth,
  AuthenticatedRequest,
} from './auth';
import {
  getServices,
  saveServices,
  getMasters,
  saveMasters,
  getSchedule,
  saveSchedule,
  getSiteInfo,
  saveSiteInfo,
  getBookings,
  createBooking,
  updateBookingStatus,
  updateBookingNotes,
  deleteBooking,
  resetStoreToDefaults,
} from './db';
import { validateRussianPhone, validateBookingDate } from '../utils/validation';

export const apiRouter = Router();

// ==========================================
// 1. AUTH ENDPOINTS
// ==========================================

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return res.status(429).json({
      error: `Превышено количество попыток входа. Доступ заблокирован на ${limit.waitMinutes} мин.`,
    });
  }

  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Укажите пароль' });
  }

  const isValid = await verifyAdminPassword(password);
  if (!isValid) {
    recordFailedAttempt(ip);
    return res.status(401).json({ error: 'Неверный пароль администратора' });
  }

  resetAttempts(ip);
  const token = generateAdminToken();
  return res.json({
    success: true,
    token,
    user: 'admin',
    expiresIn: '8h',
  });
});

apiRouter.post('/auth/verify', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ valid: true, user: req.adminUser });
});

apiRouter.post('/auth/change-password', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Укажите текущий и новый пароль' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
  }

  const isCurrentValid = await verifyAdminPassword(currentPassword);
  if (!isCurrentValid) {
    return res.status(400).json({ error: 'Текущий пароль указан неверно' });
  }

  const success = await setAdminPassword(newPassword);
  if (success) {
    return res.json({ success: true, message: 'Пароль администратора успешно изменён' });
  }
  return res.status(500).json({ error: 'Ошибка сохранения нового пароля' });
});

// ==========================================
// 2. PUBLIC ENDPOINTS (No customer data leakage!)
// ==========================================

apiRouter.get('/public/site', async (_req: Request, res: Response) => {
  try {
    const [allServices, allMasters, siteInfo] = await Promise.all([
      getServices(),
      getMasters(),
      getSiteInfo(),
    ]);

    // Only return visible services and masters to visitors
    const publicServices = allServices.filter((s) => s.isVisible);
    const publicMasters = allMasters.filter((m) => m.isVisible);

    return res.json({
      siteInfo,
      services: publicServices,
      masters: publicMasters,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка загрузки данных сайта', details: err.message });
  }
});

apiRouter.get('/public/schedule', async (req: Request, res: Response) => {
  try {
    const { date, masterId } = req.query;
    const schedule = await getSchedule();

    // If date is requested, calculate busy slots WITHOUT leaking client identities
    let busySlots: string[] = [];
    if (typeof date === 'string' && date.trim()) {
      const allBookings = await getBookings();
      const activeForDate = allBookings.filter(
        (b) => b.date === date && b.status !== 'cancelled'
      );

      if (masterId && masterId !== 'any') {
        busySlots = activeForDate
          .filter((b) => b.masterId === masterId)
          .map((b) => b.time);
      } else {
        const masters = await getMasters();
        const visibleMastersCount = masters.filter((m) => m.isVisible).length || 1;
        // Group by time
        const countsByTime: Record<string, number> = {};
        activeForDate.forEach((b) => {
          countsByTime[b.time] = (countsByTime[b.time] || 0) + 1;
        });
        busySlots = Object.keys(countsByTime).filter(
          (t) => countsByTime[t] >= visibleMastersCount
        );
      }
    }

    return res.json({
      schedule,
      busySlots,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка получения расписания', details: err.message });
  }
});

// Public booking creation
apiRouter.post('/bookings', async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      serviceId,
      masterId,
      date,
      time,
      paymentMethod,
      comment,
    } = req.body;

    // 1. Validation
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return res.status(400).json({ error: 'Имя должно содержать минимум 2 символа' });
    }

    const phoneValidation = validateRussianPhone(customerPhone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ error: phoneValidation.error || 'Некорректный номер телефона' });
    }

    const dateValidation = validateBookingDate(date);
    if (!dateValidation.isValid) {
      return res.status(400).json({ error: dateValidation.error || 'Некорректная дата визита' });
    }

    if (!time || typeof time !== 'string') {
      return res.status(400).json({ error: 'Выберите время визита' });
    }

    if (paymentMethod !== 'card_offline' && paymentMethod !== 'cash_offline') {
      return res.status(400).json({ error: 'Укажите способ оплаты при визите' });
    }

    // 2. Schedule & Conflict verification on Server
    const schedule = await getSchedule();
    if (schedule.blockedDates.includes(date)) {
      return res.status(400).json({ error: 'Выбранная дата недоступна для записи (нерабочий день)' });
    }

    const dayOfWeek = new Date(date).getDay();
    if (!schedule.workDays.includes(dayOfWeek)) {
      return res.status(400).json({ error: 'В этот день недели салон не работает' });
    }

    if (schedule.breakStart && schedule.breakEnd) {
      if (time >= schedule.breakStart && time < schedule.breakEnd) {
        return res.status(400).json({ error: 'Выбранное время приходится на перерыв' });
      }
    }

    const allBookings = await getBookings();
    const existingConflicts = allBookings.filter(
      (b) => b.date === date && b.time === time && b.status !== 'cancelled'
    );

    const allMasters = await getMasters();
    const activeMasters = allMasters.filter((m) => m.isVisible);

    if (masterId && masterId !== 'any') {
      const isMasterBusy = existingConflicts.some((b) => b.masterId === masterId);
      if (isMasterBusy) {
        return res.status(409).json({ error: 'Выбранный мастер уже занят на это время. Пожалуйста, выберите другой слот.' });
      }
    } else {
      if (existingConflicts.length >= activeMasters.length) {
        return res.status(409).json({ error: 'На это время все мастера уже заняты. Пожалуйста, выберите другое время.' });
      }
    }

    // 3. Resolve service & master
    const allServices = await getServices();
    const service = allServices.find((s) => s.id === serviceId);
    if (!service) {
      return res.status(400).json({ error: 'Выбранная услуга не найдена' });
    }

    const chosenMaster = allMasters.find((m) => m.id === masterId);
    const masterName = chosenMaster ? chosenMaster.name : 'Любой свободный мастер';

    // 4. Create booking
    const newBooking = await createBooking({
      customerName: customerName.trim(),
      customerPhone: phoneValidation.normalized || customerPhone,
      serviceId: service.id,
      serviceTitle: service.title,
      price: service.price,
      masterId: chosenMaster ? chosenMaster.id : 'any',
      masterName,
      date,
      time,
      paymentMethod,
      status: 'new',
      comment: typeof comment === 'string' ? comment.trim() : '',
    });

    // Return sanitized booking confirmation
    return res.status(201).json({
      success: true,
      booking: {
        id: newBooking.id,
        customerName: newBooking.customerName,
        customerPhone: newBooking.customerPhone,
        serviceTitle: newBooking.serviceTitle,
        price: newBooking.price,
        masterName: newBooking.masterName,
        date: newBooking.date,
        time: newBooking.time,
        paymentMethod: newBooking.paymentMethod,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка сервера при создании записи', details: err.message });
  }
});

// ==========================================
// 3. ADMIN PROTECTED ENDPOINTS
// ==========================================

apiRouter.use('/admin', requireAdminAuth);

// Get all bookings
apiRouter.get('/admin/bookings', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const bookings = await getBookings();
    return res.json({ bookings });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка получения записей', details: err.message });
  }
});

// Manual booking created by admin
apiRouter.post('/admin/bookings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      serviceId,
      masterId,
      date,
      time,
      paymentMethod,
      comment,
      adminNotes,
    } = req.body;

    const allServices = await getServices();
    const service = allServices.find((s) => s.id === serviceId) || allServices[0];
    const allMasters = await getMasters();
    const master = allMasters.find((m) => m.id === masterId);

    const newBooking = await createBooking({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      serviceId: service?.id || 'manual',
      serviceTitle: service?.title || 'Услуга',
      price: service?.price || 0,
      masterId: master?.id || 'any',
      masterName: master?.name || 'Любой свободный',
      date,
      time,
      paymentMethod: paymentMethod || 'card_offline',
      status: 'confirmed',
      comment: comment || '',
      adminNotes: adminNotes || 'Создано администратором',
    });

    return res.status(201).json({ success: true, booking: newBooking });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка создания записи', details: err.message });
  }
});

// Update booking status
apiRouter.patch('/admin/bookings/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['new', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }
    const ok = await updateBookingStatus(id, status);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка обновления статуса', details: err.message });
  }
});

// Update booking notes
apiRouter.patch('/admin/bookings/:id/notes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const ok = await updateBookingNotes(id, typeof adminNotes === 'string' ? adminNotes : '');
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка сохранения заметок', details: err.message });
  }
});

// Delete booking
apiRouter.delete('/admin/bookings/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ok = await deleteBooking(id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка удаления записи', details: err.message });
  }
});

// Services CRUD
apiRouter.get('/admin/services', async (_req: AuthenticatedRequest, res: Response) => {
  const services = await getServices();
  return res.json({ services });
});

apiRouter.put('/admin/services', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { services } = req.body;
    if (!Array.isArray(services)) {
      return res.status(400).json({ error: 'Неверный формат списка услуг' });
    }
    await saveServices(services);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка сохранения услуг', details: err.message });
  }
});

// Masters CRUD
apiRouter.get('/admin/masters', async (_req: AuthenticatedRequest, res: Response) => {
  const masters = await getMasters();
  return res.json({ masters });
});

apiRouter.put('/admin/masters', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { masters } = req.body;
    if (!Array.isArray(masters)) {
      return res.status(400).json({ error: 'Неверный формат списка мастеров' });
    }
    await saveMasters(masters);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка сохранения мастеров', details: err.message });
  }
});

// Schedule CRUD
apiRouter.get('/admin/schedule', async (_req: AuthenticatedRequest, res: Response) => {
  const schedule = await getSchedule();
  return res.json({ schedule });
});

apiRouter.put('/admin/schedule', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { schedule } = req.body;
    if (!schedule || !Array.isArray(schedule.workDays)) {
      return res.status(400).json({ error: 'Неверный формат расписания' });
    }
    await saveSchedule(schedule);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка сохранения расписания', details: err.message });
  }
});

// Site info CRUD
apiRouter.get('/admin/site', async (_req: AuthenticatedRequest, res: Response) => {
  const siteInfo = await getSiteInfo();
  return res.json({ siteInfo });
});

apiRouter.put('/admin/site', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteInfo } = req.body;
    if (!siteInfo || typeof siteInfo.brandName !== 'string') {
      return res.status(400).json({ error: 'Неверный формат данных сайта' });
    }
    await saveSiteInfo(siteInfo);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка сохранения настроек сайта', details: err.message });
  }
});

// Full Backup & Restore
apiRouter.get('/admin/backup', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [services, masters, siteInfo, schedule, bookings] = await Promise.all([
      getServices(),
      getMasters(),
      getSiteInfo(),
      getSchedule(),
      getBookings(),
    ]);
    return res.json({
      version: 3,
      exportedAt: new Date().toISOString(),
      services,
      masters,
      siteInfo,
      schedule,
      bookings,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка выгрузки бэкапа', details: err.message });
  }
});

apiRouter.post('/admin/restore', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data.services) || !Array.isArray(data.masters)) {
      return res.status(400).json({ error: 'Неверная структура данных резервной копии' });
    }
    await Promise.all([
      saveServices(data.services),
      saveMasters(data.masters),
      data.siteInfo ? saveSiteInfo(data.siteInfo) : Promise.resolve(),
      data.schedule ? saveSchedule(data.schedule) : Promise.resolve(),
    ]);
    return res.json({ success: true, message: 'Данные успешно восстановлены' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка восстановления данных', details: err.message });
  }
});

apiRouter.post('/admin/reset', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    await resetStoreToDefaults();
    return res.json({ success: true, message: 'Данные сброшены к базовому шаблону' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка сброса', details: err.message });
  }
});
