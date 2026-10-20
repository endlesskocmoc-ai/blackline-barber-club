import type { BookingFormData, ExportDataPayload } from '../types/index';

/**
 * Validates Russian mobile or landline phone number
 */
export function validateRussianPhone(phone: string): { isValid: boolean; normalized?: string; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Укажите номер телефона' };
  }

  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) {
    return { isValid: false, error: 'Укажите номер телефона' };
  }

  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    const normalized = '+7' + digits.slice(1);
    return { isValid: true, normalized };
  }

  if (digits.length === 10 && digits.startsWith('9')) {
    const normalized = '+7' + digits;
    return { isValid: true, normalized };
  }

  return {
    isValid: false,
    error: 'Номер должен содержать 11 цифр (например: +7 (999) 123-45-67)',
  };
}

/**
 * Formats user input as Russian phone mask: +7 (XXX) XXX-XX-XX
 */
export function formatPhoneInput(value: string): string {
  if (!value) return '';

  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  let cleaned = digits;
  if (cleaned.startsWith('8') || cleaned.startsWith('7')) {
    cleaned = cleaned.slice(1);
  }

  cleaned = cleaned.slice(0, 10);

  let formatted = '+7';
  if (cleaned.length > 0) {
    formatted += ' (' + cleaned.slice(0, 3);
  }
  if (cleaned.length >= 4) {
    formatted += ') ' + cleaned.slice(3, 6);
  }
  if (cleaned.length >= 7) {
    formatted += '-' + cleaned.slice(6, 8);
  }
  if (cleaned.length >= 9) {
    formatted += '-' + cleaned.slice(8, 10);
  }

  return formatted;
}

/**
 * Validates booking date: must be in YYYY-MM-DD format and cannot be in the past
 */
export function validateBookingDate(dateStr: string, referenceDate: Date = new Date()): { isValid: boolean; error?: string } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isValid: false, error: 'Выберите дату визита' };
  }

  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return { isValid: false, error: 'Неверный формат даты' };
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const selectedDate = new Date(year, month, day);
  if (isNaN(selectedDate.getTime())) {
    return { isValid: false, error: 'Некорректная дата' };
  }

  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  if (selectedDate < today) {
    return { isValid: false, error: 'Нельзя выбрать дату в прошлом' };
  }

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 90);
  if (selectedDate > maxDate) {
    return { isValid: false, error: 'Запись доступна не более чем на 90 дней вперёд' };
  }

  return { isValid: true };
}

/**
 * Formats price in Russian rubles
 */
export function formatPrice(price: number): string {
  if (typeof price !== 'number' || isNaN(price)) {
    return '0 ₽';
  }
  return price.toLocaleString('ru-RU') + ' ₽';
}

/**
 * Formats duration in minutes to Russian text
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '30 минут';
  const lastDigit = minutes % 10;
  const lastTwo = minutes % 100;
  if (lastTwo >= 11 && lastTwo <= 19) {
    return `${minutes} минут`;
  }
  if (lastDigit === 1) {
    return `${minutes} минута`;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${minutes} минуты`;
  }
  return `${minutes} минут`;
}

/**
 * Validates the entire booking form
 */
export function validateBookingForm(data: BookingFormData, referenceDate?: Date): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.customerName || data.customerName.trim().length < 2) {
    errors.customerName = 'Введите ваше имя (минимум 2 символа)';
  }

  const phoneRes = validateRussianPhone(data.customerPhone);
  if (!phoneRes.isValid) {
    errors.customerPhone = phoneRes.error || 'Укажите корректный номер телефона';
  }

  if (!data.serviceId || data.serviceId.trim() === '') {
    errors.serviceId = 'Выберите услугу из списка';
  }

  const dateRes = validateBookingDate(data.date, referenceDate);
  if (!dateRes.isValid) {
    errors.date = dateRes.error || 'Выберите корректную дату визита';
  }

  if (!data.time || data.time.trim() === '') {
    errors.time = 'Выберите удобное время визита';
  }

  if (data.paymentMethod !== 'card_offline' && data.paymentMethod !== 'cash_offline') {
    errors.paymentMethod = 'Выберите способ оплаты при визите';
  }

  if (!data.consent) {
    errors.consent = 'Необходимо подтвердить согласие с политикой обработки персональных данных';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates JSON structure for backup import
 */
export function validateImportJson(jsonStr: string): { isValid: boolean; data?: ExportDataPayload; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Файл не содержит корректный JSON-объект' };
    }

    if (!Array.isArray(parsed.services)) {
      return { isValid: false, error: 'Отсутствует или повреждён список услуг (services)' };
    }

    for (let i = 0; i < parsed.services.length; i++) {
      const s = parsed.services[i];
      if (!s.id || typeof s.title !== 'string' || typeof s.price !== 'number') {
        return { isValid: false, error: `Услуга #${i + 1} имеет неверную структуру (требуются id, title, price)` };
      }
    }

    if (!Array.isArray(parsed.masters)) {
      return { isValid: false, error: 'Отсутствует или повреждён список мастеров (masters)' };
    }

    for (let i = 0; i < parsed.masters.length; i++) {
      const m = parsed.masters[i];
      if (!m.id || typeof m.name !== 'string') {
        return { isValid: false, error: `Мастер #${i + 1} имеет неверную структуру (требуются id, name)` };
      }
    }

    if (!parsed.siteInfo || typeof parsed.siteInfo !== 'object' || typeof parsed.siteInfo.brandName !== 'string') {
      return { isValid: false, error: 'Отсутствует или повреждена информация о сайте (siteInfo)' };
    }

    return {
      isValid: true,
      data: parsed as ExportDataPayload,
    };
  } catch (err) {
    return {
      isValid: false,
      error: 'Ошибка разбора JSON: проверьте формат файла',
    };
  }
}
