import type {
  Service,
  Master,
  SiteInfo,
  ScheduleConfig,
  BookingRecord,
  BookingStatus,
  BookingFormData,
  ExportDataPayload,
} from '../types/index';

const TOKEN_KEY = 'blackline_admin_jwt';

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || `Ошибка сервера (${response.status})`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// Public API
export async function fetchPublicSiteData(): Promise<{
  siteInfo: SiteInfo;
  services: Service[];
  masters: Master[];
}> {
  return request('/api/public/site');
}

export async function fetchPublicSchedule(
  date?: string,
  masterId?: string
): Promise<{ schedule: ScheduleConfig; busySlots: string[] }> {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (masterId) params.append('masterId', masterId);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request(`/api/public/schedule${q}`);
}

export async function submitBooking(formData: BookingFormData): Promise<{
  success: boolean;
  booking: {
    id: string;
    customerName: string;
    customerPhone: string;
    serviceTitle: string;
    price: number;
    masterName: string;
    date: string;
    time: string;
    paymentMethod: string;
  };
}> {
  return request('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
}

// Auth API
export async function apiLogin(password: string): Promise<{ token: string; user: string }> {
  const res = await request<{ success: boolean; token: string; user: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  setStoredToken(res.token);
  return res;
}

export async function apiVerifyToken(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;
  try {
    const res = await request<{ valid: boolean }>('/api/auth/verify', { method: 'POST' });
    return res.valid === true;
  } catch {
    setStoredToken(null);
    return false;
  }
}

export async function apiChangePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
  return request('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function apiLogout() {
  setStoredToken(null);
}

// Admin Protected API
export async function apiGetAdminBookings(): Promise<BookingRecord[]> {
  const res = await request<{ bookings: BookingRecord[] }>('/api/admin/bookings');
  return res.bookings;
}

export async function apiCreateAdminBooking(data: any): Promise<BookingRecord> {
  const res = await request<{ success: boolean; booking: BookingRecord }>('/api/admin/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.booking;
}

export async function apiUpdateBookingStatus(id: string, status: BookingStatus): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/admin/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.success;
}

export async function apiUpdateBookingNotes(id: string, adminNotes: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/admin/bookings/${id}/notes`, {
    method: 'PATCH',
    body: JSON.stringify({ adminNotes }),
  });
  return res.success;
}

export async function apiDeleteBooking(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(`/api/admin/bookings/${id}`, {
    method: 'DELETE',
  });
  return res.success;
}

export async function apiUpdateServices(services: Service[]): Promise<boolean> {
  const res = await request<{ success: boolean }>('/api/admin/services', {
    method: 'PUT',
    body: JSON.stringify({ services }),
  });
  return res.success;
}

export async function apiUpdateMasters(masters: Master[]): Promise<boolean> {
  const res = await request<{ success: boolean }>('/api/admin/masters', {
    method: 'PUT',
    body: JSON.stringify({ masters }),
  });
  return res.success;
}

export async function apiUpdateSchedule(schedule: ScheduleConfig): Promise<boolean> {
  const res = await request<{ success: boolean }>('/api/admin/schedule', {
    method: 'PUT',
    body: JSON.stringify({ schedule }),
  });
  return res.success;
}

export async function apiUpdateSiteInfo(siteInfo: SiteInfo): Promise<boolean> {
  const res = await request<{ success: boolean }>('/api/admin/site', {
    method: 'PUT',
    body: JSON.stringify({ siteInfo }),
  });
  return res.success;
}

export async function apiGetBackup(): Promise<ExportDataPayload> {
  return request<ExportDataPayload>('/api/admin/backup');
}

export async function apiRestoreBackup(data: any): Promise<{ success: boolean; message: string }> {
  return request('/api/admin/restore', {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function apiResetTemplate(): Promise<{ success: boolean; message: string }> {
  return request('/api/admin/reset', {
    method: 'POST',
  });
}
