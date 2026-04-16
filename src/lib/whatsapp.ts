import { formatTime } from './slots';
import type { Business, Service } from './types';

/**
 * WhatsApp message hooks for booking notifications.
 * Phase 1: Generate WhatsApp URLs that open pre-filled messages.
 * Phase 2: Can be replaced with WhatsApp Business API integration.
 */

function formatWhatsAppUrl(phone: string, message: string): string {
  // Ensure phone starts with country code (Malaysia: 60)
  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = cleanPhone.startsWith('60') ? cleanPhone : `60${cleanPhone}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

/** Customer confirmation message after booking */
export function getCustomerConfirmationMessage(
  customerName: string,
  business: Business,
  service: Service,
  date: string,
  startTime: string
): string {
  return `Hi ${customerName}! ✅ Your booking is confirmed.

📍 *${business.name}*
💇 ${service.name}
📅 ${date}
🕐 ${formatTime(startTime)}
💰 RM ${service.price} (Pay at store)

See you there! 😊`;
}

/** Generate WhatsApp URL for customer confirmation */
export function getCustomerWhatsAppUrl(
  customerPhone: string,
  customerName: string,
  business: Business,
  service: Service,
  date: string,
  startTime: string
): string {
  const message = getCustomerConfirmationMessage(customerName, business, service, date, startTime);
  return formatWhatsAppUrl(customerPhone, message);
}

/** Business alert message for new booking */
export function getBusinessAlertMessage(
  customerName: string,
  customerPhone: string | null,
  service: Service,
  date: string,
  startTime: string
): string {
  return `🔔 New Booking Alert!

👤 ${customerName}${customerPhone ? `\n📱 ${customerPhone}` : ''}
💇 ${service.name}
📅 ${date}
🕐 ${formatTime(startTime)}
💰 RM ${service.price}`;
}

/** Generate WhatsApp URL for business alert */
export function getBusinessWhatsAppUrl(
  businessPhone: string,
  customerName: string,
  customerPhone: string | null,
  service: Service,
  date: string,
  startTime: string
): string {
  const message = getBusinessAlertMessage(customerName, customerPhone, service, date, startTime);
  return formatWhatsAppUrl(businessPhone, message);
}
