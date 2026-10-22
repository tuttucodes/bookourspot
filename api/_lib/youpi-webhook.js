import { createHmac, timingSafeEqual } from 'node:crypto';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Verify YouPI's current merchant webhook contract: HMAC-SHA256 over the exact
 * raw JSON bytes, sent as `X-Gateway-Signature: sha256=<hex>`.
 */
export function verifyYoupiWebhookSignature(secret, rawBody, supplied) {
  const signature = String(supplied || '');
  const match = signature.match(/^sha256=([a-f0-9]{64})$/i);
  if (!secret || !match || !Buffer.isBuffer(rawBody)) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const actual = Buffer.from(match[1], 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function isYoupiDeliveryId(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function isYoupiPaymentId(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function toYoupiAmountPaise(value) {
  if (typeof value !== 'string' || !/^\d{1,9}\.\d{2}$/.test(value)) return null;
  const [rupees, paise] = value.split('.');
  const amount = Number(rupees) * 100 + Number(paise);
  return Number.isSafeInteger(amount) ? amount : null;
}

export function validateYoupiSuccessEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event) || event.event !== 'SUCCESS') return null;
  const orderId = typeof event.orderId === 'string' ? event.orderId : '';
  const paymentId = typeof event.paymentId === 'string' ? event.paymentId : '';
  const amountPaise = Number(event.amountPaise);
  const utr = typeof event.utr === 'string' ? event.utr.trim() : '';
  const verificationLevel = Number(event.verificationLevel);
  const verificationTag = typeof event.verificationTag === 'string' ? event.verificationTag.trim() : '';

  if (!isYoupiPaymentId(orderId) || !isYoupiPaymentId(paymentId)
    || event.currency !== 'INR' || event.method !== 'UPI'
    || !Number.isSafeInteger(amountPaise) || amountPaise < 150000
    || toYoupiAmountPaise(event.amount) !== amountPaise || !/^\d{12}$/.test(utr)
    || ![1, 2].includes(verificationLevel) || !verificationTag
    || verificationTag.toUpperCase() === 'UNVERIFIED') return null;

  return { orderId, paymentId, amountPaise, utr, verificationLevel, verificationTag };
}

