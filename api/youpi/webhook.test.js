import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import handler from './webhook.js';

const secret = 'test-only-youpi-webhook-secret';

function createRequest(event, options = {}) {
  const rawBody = Buffer.from(JSON.stringify(event));
  const signature = options.signature ?? `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const request = Readable.from([rawBody]);
  request.method = 'POST';
  request.headers = {
    'x-gateway-signature': signature,
    'x-gateway-delivery-id': options.deliveryId ?? randomUUID(),
    'x-gateway-timestamp': String(Date.now()),
    'x-gateway-event': event.event
  };
  return request;
}

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function createEvent(overrides = {}) {
  return {
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
    metadata: {},
    ...overrides
  };
}

test('fulfills an authenticated YouPI success webhook using the documented raw-body HMAC', async () => {
  const originalFetch = globalThis.fetch;
  const previousEnv = {
    YOUPI_WEBHOOK_SECRET: process.env.YOUPI_WEBHOOK_SECRET,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
  const event = createEvent();
  const expectedBooking = {
    id: randomUUID(),
    user_id: 'firebase-user-1',
    event_id: 'halloween-affair',
    tier_type: 'SOLO',
    quantity: 1,
    total_amount: 150000,
    status: 'PENDING',
    gateway_order_id: event.orderId
  };
  let fulfillArgs;
  process.env.YOUPI_WEBHOOK_SECRET = secret;
  process.env.SUPABASE_URL = 'https://supabase-test.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  globalThis.fetch = async (url, init = {}) => {
    if (String(url).includes('/rest/v1/bookings?')) {
      return new Response(JSON.stringify([expectedBooking]), { status: 200 });
    }
    if (String(url).endsWith('/rest/v1/rpc/bos_fulfill_booking')) {
      fulfillArgs = JSON.parse(init.body);
      return new Response(JSON.stringify({ status: 'PAID' }), { status: 200 });
    }
    throw new Error(`Unexpected backend request: ${url}`);
  };

  try {
    const response = createResponse();
    await handler(createRequest(event), response);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { received: true });
    assert.equal(fulfillArgs.p_booking_id, expectedBooking.id);
    assert.equal(fulfillArgs.p_order_id, event.orderId);
    assert.equal(fulfillArgs.p_payment_id, event.paymentId);
    assert.equal(fulfillArgs.p_amount, 150000);
    assert.equal(fulfillArgs.p_utr, '123456789012');
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('rejects a forged signature before querying or fulfilling a booking', async () => {
  const originalFetch = globalThis.fetch;
  process.env.YOUPI_WEBHOOK_SECRET = secret;
  process.env.SUPABASE_URL = 'https://supabase-test.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  globalThis.fetch = async () => { throw new Error('Must not reach Supabase'); };

  try {
    const response = createResponse();
    await handler(createRequest(createEvent(), { signature: `sha256=${'0'.repeat(64)}` }), response);
    assert.equal(response.statusCode, 401);
    assert.equal(response.body.error, 'Payment notification signature is invalid.');
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.YOUPI_WEBHOOK_SECRET;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

