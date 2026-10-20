import emailjs from '@emailjs/browser';

export interface EmailParams {
  customer_name: string;
  customer_phone: string;
  service_name: string;
  service_price: string;
  master_name: string;
  visit_date: string;
  visit_time: string;
  payment_method: string;
  customer_message: string;
}

export interface EmailSendResult {
  success: boolean;
  isConfigured: boolean;
  message: string;
  errorDetails?: string;
}

/**
 * Checks if EmailJS client-side configuration variables are provided
 */
export function isEmailJSConfigured(): boolean {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  return Boolean(
    serviceId &&
    templateId &&
    publicKey &&
    serviceId.trim() !== '' &&
    templateId.trim() !== '' &&
    publicKey.trim() !== ''
  );
}

/**
 * Sends booking request via EmailJS if configured.
 * Strictly avoids fake success if keys are missing.
 */
export async function sendBookingEmail(params: EmailParams): Promise<EmailSendResult> {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return {
      success: false,
      isConfigured: false,
      message: 'Почтовый сервис не подключён (ключи VITE_EMAILJS_* не заданы в .env). Заявка сохранена в журнале администратора.',
    };
  }

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        customer_name: params.customer_name,
        customer_phone: params.customer_phone,
        service_name: params.service_name,
        service_price: params.service_price,
        master_name: params.master_name,
        visit_date: params.visit_date,
        visit_time: params.visit_time,
        payment_method: params.payment_method,
        customer_message: params.customer_message || 'Без комментария',
      },
      publicKey
    );

    if (response.status === 200 || response.text === 'OK') {
      return {
        success: true,
        isConfigured: true,
        message: 'Ваша заявка успешно отправлена! Мы свяжемся с вами для подтверждения времени.',
      };
    }

    return {
      success: false,
      isConfigured: true,
      message: `Ошибка отправки через EmailJS (статус: ${response.status}). Попробуйте позже или позвоните нам.`,
    };
  } catch (error: any) {
    return {
      success: false,
      isConfigured: true,
      message: 'Не удалось отправить заявку через сервис EmailJS. Проверьте соединение или обратитесь по телефону.',
      errorDetails: error?.message || String(error),
    };
  }
}
