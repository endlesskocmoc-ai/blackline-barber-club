import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRussianPhone,
  formatPhoneInput,
  validateBookingDate,
  validateBookingForm,
  formatPrice,
  formatDuration,
  validateImportJson,
} from './validation.ts';
import type { BookingFormData } from '../types/index.ts';

test('validateRussianPhone accepts valid formats', () => {
  const res1 = validateRussianPhone('+7 (999) 123-45-67');
  assert.equal(res1.isValid, true);
  assert.equal(res1.normalized, '+79991234567');

  const res2 = validateRussianPhone('89161234567');
  assert.equal(res2.isValid, true);
  assert.equal(res2.normalized, '+79161234567');

  const res3 = validateRussianPhone('9251234567');
  assert.equal(res3.isValid, true);
  assert.equal(res3.normalized, '+79251234567');
});

test('validateRussianPhone rejects invalid numbers', () => {
  assert.equal(validateRussianPhone('').isValid, false);
  assert.equal(validateRussianPhone('123').isValid, false);
  assert.equal(validateRussianPhone('abc').isValid, false);
  assert.equal(validateRussianPhone('+1 555 123 4567').isValid, false);
});

test('formatPhoneInput formats mask correctly', () => {
  assert.equal(formatPhoneInput('999'), '+7 (999');
  assert.equal(formatPhoneInput('999123'), '+7 (999) 123');
  assert.equal(formatPhoneInput('99912345'), '+7 (999) 123-45');
  assert.equal(formatPhoneInput('89991234567'), '+7 (999) 123-45-67');
});

test('validateBookingDate rejects past dates and accepts future dates', () => {
  const fixedToday = new Date('2026-10-16T12:00:00Z');

  // Past date
  const pastRes = validateBookingDate('2026-10-15', fixedToday);
  assert.equal(pastRes.isValid, false);
  assert.match(pastRes.error || '', /в прошлом/);

  // Today
  const todayRes = validateBookingDate('2026-10-16', fixedToday);
  assert.equal(todayRes.isValid, true);

  // Future date
  const futureRes = validateBookingDate('2026-10-25', fixedToday);
  assert.equal(futureRes.isValid, true);

  // Date too far in future
  const tooFarRes = validateBookingDate('2027-05-01', fixedToday);
  assert.equal(tooFarRes.isValid, false);
});

test('validateBookingForm verifies all required fields', () => {
  const fixedToday = new Date('2026-10-16T12:00:00Z');
  const invalidData: BookingFormData = {
    customerName: '',
    customerPhone: '',
    serviceId: '',
    masterId: '',
    date: '2026-10-10', // past
    time: '',
    paymentMethod: '' as any,
    comment: '',
    consent: false,
  };

  const res = validateBookingForm(invalidData, fixedToday);
  assert.equal(res.isValid, false);
  assert.ok(res.errors.customerName);
  assert.ok(res.errors.customerPhone);
  assert.ok(res.errors.serviceId);
  assert.ok(res.errors.date);
  assert.ok(res.errors.time);
  assert.ok(res.errors.paymentMethod);
  assert.ok(res.errors.consent);

  const validData: BookingFormData = {
    customerName: 'Алексей',
    customerPhone: '+7 (999) 123-45-67',
    serviceId: 'srv-1',
    masterId: 'mst-1',
    date: '2026-10-20',
    time: '14:00',
    paymentMethod: 'card_offline',
    comment: 'Первый визит',
    consent: true,
  };

  const validRes = validateBookingForm(validData, fixedToday);
  assert.equal(validRes.isValid, true);
  assert.equal(Object.keys(validRes.errors).length, 0);
});

test('formatPrice and formatDuration return clean Russian strings', () => {
  assert.equal(formatPrice(1800), '1\u00A0800 ₽');
  assert.equal(formatDuration(45), '45 минут');
  assert.equal(formatDuration(1), '1 минута');
  assert.equal(formatDuration(23), '23 минуты');
});

test('validateImportJson checks schema validity', () => {
  const badJson = '{"notAValidConfig": 123}';
  const badRes = validateImportJson(badJson);
  assert.equal(badRes.isValid, false);

  const goodJson = JSON.stringify({
    version: 1,
    exportedAt: '2026-10-16T12:00:00Z',
    services: [{ id: '1', title: 'Стрижка', price: 1800, durationMinutes: 45, category: 'hair', isVisible: true, order: 1 }],
    masters: [{ id: '1', name: 'Артём', specialization: 'fade', bio: '', photoUrl: '', isVisible: true, order: 1 }],
    siteInfo: { brandName: 'BLACKLINE BARBER CLUB' },
  });

  const goodRes = validateImportJson(goodJson);
  assert.equal(goodRes.isValid, true);
  assert.equal(goodRes.data?.services.length, 1);
});
