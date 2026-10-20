import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CreditCard,
  Banknote,
  CheckCircle2,
  Loader2,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  validateBookingForm,
  formatPhoneInput,
  formatPrice,
  formatDuration,
} from '../utils/validation';
import { sendBookingEmail, isEmailJSConfigured } from '../services/emailService';
import type { BookingFormData, BookingRecord } from '../types/index';

export const BookingSection: React.FC = () => {
  const {
    services,
    masters,
    siteInfo,
    selectedServiceId,
    selectedMasterId,
    setSelectedServiceId,
    setSelectedMasterId,
    addBookingPublic,
    getAvailableTimeSlots,
    setIsPrivacyOpen,
  } = useApp();

  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    customerPhone: '',
    serviceId: selectedServiceId || '',
    masterId: selectedMasterId || 'any',
    date: getTomorrowString(),
    time: '12:00',
    paymentMethod: 'card_offline',
    comment: '',
    consent: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<BookingRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ time: string; isAvailable: boolean; reason?: string }[]>([]);

  // Sync selected service if clicked in Services section
  useEffect(() => {
    if (selectedServiceId) {
      setFormData((prev) => ({ ...prev, serviceId: selectedServiceId }));
    }
  }, [selectedServiceId]);

  // Sync selected master if clicked in Masters section
  useEffect(() => {
    if (selectedMasterId) {
      setFormData((prev) => ({ ...prev, masterId: selectedMasterId }));
    }
  }, [selectedMasterId]);

  const activeServices = services.filter((s) => s.isVisible);
  const activeMasters = masters.filter((m) => m.isVisible);

  const selectedService = activeServices.find((s) => s.id === formData.serviceId);

  // Compute available time slots from server based on schedule & bookings
  useEffect(() => {
    let isMounted = true;
    getAvailableTimeSlots(formData.date, formData.masterId).then((slots) => {
      if (isMounted) {
        setAvailableSlots(slots);
        // If current chosen time is unavailable, pick first available slot
        if (slots.length > 0) {
          const currentSlot = slots.find((s) => s.time === formData.time);
          if (!currentSlot || !currentSlot.isAvailable) {
            const firstFree = slots.find((s) => s.isAvailable);
            if (firstFree) {
              setFormData((prev) => ({ ...prev, time: firstFree.time }));
            }
          }
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [formData.date, formData.masterId, getAvailableTimeSlots]);

  const handleInputChange = (field: keyof BookingFormData, value: any) => {
    if (field === 'customerPhone') {
      value = formatPhoneInput(value);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = validateBookingForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      const firstErrorField = Object.keys(validation.errors)[0];
      const element = document.getElementById(firstErrorField);
      element?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Submit to secure backend API
      const response = await addBookingPublic(formData);

      if (response && response.booking) {
        setCreatedBooking(response.booking as any);

        // 2. Client-side notification via EmailJS if configured
        if (isEmailJSConfigured()) {
          try {
            await sendBookingEmail({
              customer_name: formData.customerName.trim(),
              customer_phone: formData.customerPhone.trim(),
              service_name: response.booking.serviceTitle || selectedService?.title || 'Услуга',
              service_price: formatPrice(response.booking.price || selectedService?.price || 0),
              master_name: response.booking.masterName || 'Любой свободный мастер',
              visit_date: formData.date,
              visit_time: formData.time,
              payment_method:
                formData.paymentMethod === 'card_offline'
                  ? 'Картой при посещении'
                  : 'Наличными при посещении',
              customer_message: formData.comment.trim(),
            });
          } catch (err) {
            console.warn('[BLACKLINE] Email notification error:', err);
          }
        }

        // Reset inputs
        setFormData((prev) => ({
          ...prev,
          customerName: '',
          customerPhone: '',
          comment: '',
        }));
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Ошибка сервера при создании записи');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="booking" className="py-24 bg-[#0e0f12] relative border-t border-white/[0.04]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12 text-center mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#c59b67] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Онлайн-запись</span>
          </div>
          <h2 className="font-serif-brand text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Забронировать визит
          </h2>
          <p className="mt-3 text-[#a1a1aa] text-base sm:text-lg">
            Выберите желаемую услугу, удобную дату и время. Администратор свяжется с вами для подтверждения.
          </p>
        </div>

        {/* Selected Service Banner */}
        {selectedService && (
          <div className="mb-8 p-5 rounded-2xl bg-[#161820] border border-[#c59b67]/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#c59b67] bg-[#c59b67]/10 px-2 py-0.5 rounded border border-[#c59b67]/20">
                Выбранная услуга
              </span>
              <h3 className="font-serif-brand text-xl font-bold text-white mt-1">
                {selectedService.title}
              </h3>
              <p className="text-xs text-[#a1a1aa] mt-0.5 max-w-xl">
                {selectedService.description}
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-white/10 sm:pl-6 shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
              <span className="font-serif-brand text-2xl font-bold text-[#c59b67]">
                {formatPrice(selectedService.price)}
              </span>
              <span className="text-xs text-[#a1a1aa]">
                {formatDuration(selectedService.durationMinutes)}
              </span>
            </div>
          </div>
        )}

        {/* Booking Form Card */}
        <div className="bg-[#121316] border border-white/[0.08] rounded-2xl p-6 sm:p-10 shadow-2xl">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Row 1: Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="customerName"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2"
                >
                  Ваше имя <span className="text-[#c59b67]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71717a]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="customerName"
                    type="text"
                    required
                    placeholder="Александр"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className={`w-full bg-[#18191e] text-white pl-10 pr-4 py-3 rounded-lg border text-sm transition-colors placeholder-[#52525b] ${
                      errors.customerName
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-white/10 focus:border-[#c59b67]'
                    }`}
                  />
                </div>
                {errors.customerName && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="customerPhone"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2"
                >
                  Телефон для связи <span className="text-[#c59b67]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71717a]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="customerPhone"
                    type="tel"
                    required
                    placeholder="+7 (___) ___-__-__"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    className={`w-full bg-[#18191e] text-white pl-10 pr-4 py-3 rounded-lg border text-sm transition-colors placeholder-[#52525b] ${
                      errors.customerPhone
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-white/10 focus:border-[#c59b67]'
                    }`}
                  />
                </div>
                {errors.customerPhone && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.customerPhone}</p>
                )}
              </div>
            </div>

            {/* Row 2: Service & Master */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="serviceId"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2"
                >
                  Услуга <span className="text-[#c59b67]">*</span>
                </label>
                <select
                  id="serviceId"
                  required
                  value={formData.serviceId}
                  onChange={(e) => {
                    handleInputChange('serviceId', e.target.value);
                    setSelectedServiceId(e.target.value);
                  }}
                  className={`w-full bg-[#18191e] text-white px-4 py-3 rounded-lg border text-sm transition-colors ${
                    errors.serviceId
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-white/10 focus:border-[#c59b67]'
                  }`}
                >
                  <option value="" disabled className="bg-[#18191e] text-[#71717a]">
                    Выберите услугу
                  </option>
                  {activeServices.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#18191e] text-white">
                      {s.title} — {formatPrice(s.price)} ({formatDuration(s.durationMinutes)})
                    </option>
                  ))}
                </select>
                {errors.serviceId && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.serviceId}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="masterId"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2"
                >
                  Мастер
                </label>
                <select
                  id="masterId"
                  value={formData.masterId}
                  onChange={(e) => {
                    handleInputChange('masterId', e.target.value);
                    setSelectedMasterId(e.target.value === 'any' ? null : e.target.value);
                  }}
                  className="w-full bg-[#18191e] text-white px-4 py-3 rounded-lg border border-white/10 focus:border-[#c59b67] text-sm transition-colors"
                >
                  <option value="any" className="bg-[#18191e] text-white">
                    Любой свободный мастер
                  </option>
                  {activeMasters.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#18191e] text-white">
                      {m.name} ({m.specialization})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="bookingDate"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2"
                >
                  Дата визита <span className="text-[#c59b67]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71717a]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id="bookingDate"
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className={`w-full bg-[#18191e] text-white pl-10 pr-4 py-3 rounded-lg border text-sm transition-colors ${
                      errors.date
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-white/10 focus:border-[#c59b67]'
                    }`}
                  />
                </div>
                {errors.date && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                  Время визита <span className="text-[#c59b67]">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => {
                      const isChosen = formData.time === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => handleInputChange('time', slot.time)}
                          className={`py-2.5 px-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer relative ${
                            isChosen && slot.isAvailable
                              ? 'bg-[#c59b67] text-[#0b0c0e] font-bold shadow-md shadow-[#c59b67]/20 ring-1 ring-[#c59b67]'
                              : slot.isAvailable
                              ? 'bg-[#18191e] text-white hover:border-[#c59b67] border border-white/10 hover:bg-[#20222a]'
                              : 'bg-white/[0.02] text-[#52525b] border border-white/[0.04] cursor-not-allowed opacity-50 line-through'
                          }`}
                          title={slot.reason || 'Доступно для записи'}
                        >
                          {slot.time}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-4 p-3 rounded bg-white/[0.02] text-xs text-[#a1a1aa] text-center border border-white/5">
                      Нет доступных слотов на эту дату
                    </div>
                  )}
                </div>
                {errors.time && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.time}</p>
                )}
              </div>
            </div>

            {/* Payment Method Preferences */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2">
                Способ оплаты при посещении
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('paymentMethod', 'card_offline')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    formData.paymentMethod === 'card_offline'
                      ? 'bg-[#1a1d24] border-[#c59b67] shadow-md shadow-[#c59b67]/10 ring-1 ring-[#c59b67]/50'
                      : 'bg-[#18191e] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#c59b67]">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Банковской картой
                      </span>
                      <span className="text-[11px] text-[#a1a1aa]">
                        Оплата через терминал при визите
                      </span>
                    </div>
                  </div>
                  {formData.paymentMethod === 'card_offline' && (
                    <span className="w-2 h-2 rounded-full bg-[#c59b67]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleInputChange('paymentMethod', 'cash_offline')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    formData.paymentMethod === 'cash_offline'
                      ? 'bg-[#1a1d24] border-[#c59b67] shadow-md shadow-[#c59b67]/10 ring-1 ring-[#c59b67]/50'
                      : 'bg-[#18191e] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#c59b67]">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Наличными
                      </span>
                      <span className="text-[11px] text-[#a1a1aa]">
                        Оплата администратору клуба
                      </span>
                    </div>
                  </div>
                  {formData.paymentMethod === 'cash_offline' && (
                    <span className="w-2 h-2 rounded-full bg-[#c59b67]" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[#71717a]">
                * Оплата производится на месте строго после оказания услуги. Предоплата онлайн не требуется.
              </p>
            </div>

            {/* Comment */}
            <div>
              <label
                htmlFor="customerComment"
                className="block text-xs font-semibold uppercase tracking-wider text-[#d4d4d8] mb-2"
              >
                Комментарий или пожелания к визиту (необязательно)
              </label>
              <textarea
                id="customerComment"
                rows={2}
                placeholder="Например: первый визит, хочу подровнять контуры бороды..."
                value={formData.comment}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                className="w-full bg-[#18191e] text-white px-4 py-3 rounded-lg border border-white/10 focus:border-[#c59b67] text-sm transition-colors placeholder-[#52525b]"
              />
            </div>

            {/* Consent Checkbox */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  required
                  checked={formData.consent}
                  onChange={(e) => handleInputChange('consent', e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 text-[#c59b67] focus:ring-[#c59b67] focus:ring-offset-0 bg-[#18191e]"
                />
                <span className="text-xs text-[#a1a1aa] leading-relaxed">
                  Я согласен на обработку персональных данных в соответствии с{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsPrivacyOpen(true);
                    }}
                    className="text-[#c59b67] hover:underline underline-offset-2 cursor-pointer"
                  >
                    политикой конфиденциальности
                  </button>
                  . Заявка на визит требует телефонного подтверждения администратором клуба.
                </span>
              </label>
              {errors.consent && (
                <p className="mt-1.5 text-xs text-red-400">{errors.consent}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#c59b67] hover:bg-[#d8af7b] disabled:opacity-50 disabled:cursor-not-allowed text-[#0b0c0e] font-bold text-base py-4 rounded-xl transition-all shadow-xl shadow-[#c59b67]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Проверка и сохранение записи на сервере...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    <span>Забронировать визит</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Booking Confirmation Box */}
          {createdBooking && (
            <div className="mt-8 p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 animate-fadeIn">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <h3 className="font-serif-brand text-lg font-bold text-white">
                      Заявка на запись принята!
                    </h3>
                    <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 w-fit">
                      Бронь #{createdBooking.id}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed mb-4">
                    Мы зарезервировали для вас время: <strong>{createdBooking.date} в {createdBooking.time}</strong>. Услуга: «{createdBooking.serviceTitle}» ({formatPrice(createdBooking.price)}), мастер: {createdBooking.masterName}.
                  </p>
                  <div className="p-3.5 rounded-xl bg-[#0e0f12]/60 border border-emerald-500/20 text-xs text-[#a1a1aa] space-y-1">
                    <p>• Наш администратор свяжется с вами по номеру <strong className="text-white">{createdBooking.customerPhone}</strong> для подтверждения деталей.</p>
                    <p>• Оплата производится строго на месте после оказания услуги: картой через терминал или наличными.</p>
                    <p>• Адрес клуба: <strong className="text-white">г. {siteInfo.city}, {siteInfo.address}</strong>.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-3 animate-fadeIn">
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-200 leading-relaxed">
                <span className="font-bold block text-white mb-0.5">Ошибка при записи</span>
                {submitError}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
