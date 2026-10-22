import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import {
  isYoupiDeliveryId,
  toYoupiAmountPaise,
  validateYoupiSuccessEvent,
  verifyYoupiWebhookSignature
} from './youpi-webhook.js';

const secret = 'test-only-webhook-secret';
const payload = () => ({
  event: 'SUCCESS',
  paymentId: randomUUID(),
  orderId: randomUUID(),
  amount: '1,500.00'.replace(',', ''),
  amountPaise: 150000,
  currency: 'INR',
  method: 'UPI',
  utr: '123456789012',
  verificationTag: 'L1_SMS_MATCH',
  verificationLevel: 1,
  completedAt: new Date().toISOString(),
  metadata: {}
});

test('verifies the exact raw body with YouPI X-Gateway-Signature HMAC', () => {
  const raw = Buffer.from(JSON.stringify(payload()));
  const signature = `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`;

  assert.equal(verifyYoupiWebhookSignature(secret, raw, signature), true);
  assert.equal(verifyYoupiWebhookSignature('wrong-secret', raw, signature), false);
  assert.equal(verifyYoupiWebhookSignature(secret, Buffer.concat([raw, Buffer.from(' ')]), signature), false);
  assert.equal(verifyYoupiWebhookSignature(secret, raw, signature.slice(7)), false);
});

test('accepts verified UPI success payloads from the current YouPI webhook sender', () => {
  const event = payload();

  assert.deepEqual(validateYoupiSuccessEvent(event), {
    orderId: event.orderId,
    paymentId: event.paymentId,
    amountPaise: 150000,
    utr: '123456789012',
    verificationLevel: 1,
    verificationTag: 'L1_SMS_MATCH'
  });
});

test('rejects mismatched amount, non-UPI, unverified, and malformed transaction data', () => {
  const mismatchedAmount = payload();
  mismatchedAmount.amount = '1,499.00'.replace(',', '');
  assert.equal(validateYoupiSuccessEvent(mismatchedAmount), null);

  const wrongMethod = payload();
  wrongMethod.method = 'COD';
  assert.equal(validateYoupiSuccessEvent(wrongMethod), null);

  const unverified = payload();
  unverified.verificationLevel = 0;
  unverified.verificationTag = 'UNVERIFIED';
  assert.equal(validateYoupiSuccessEvent(unverified), null);

  const malformedUtr = payload();
  malformedUtr.utr = '1234';
  assert.equal(validateYoupiSuccessEvent(malformedUtr), null);
});

test('parses exact rupee values and delivery UUIDs', () => {
  assert.equal(toYoupiAmountPaise('2800.00'), 280000);
  assert.equal(toYoupiAmountPaise('1500.00'), 150000);
  assert.equal(toYoupiAmountPaise('1,500.00'), null);
  assert.equal(toYoupiAmountPaise('1.999'), null);
  assert.equal(isYoupiDeliveryId(randomUUID()), true);
  assert.equal(isYoupiDeliveryId('not-a-uuid'), false);
});

