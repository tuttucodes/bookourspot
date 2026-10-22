import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedBookingAmount, normalizeBookingOrder } from './booking-order.js';

const soloAttendees = [{ name: 'Asha', phone: '9876543210' }];
const duoAttendees = [
  { name: 'Bala', phone: '+919876543210' },
  { name: 'Chitra', phone: '+919876543211' }
];

test('normalizes mixed solo and duo lines with authoritative amounts and ticket counts', () => {
  const order = normalizeBookingOrder({
    totalAmount: 4300,
    items: [
      { tierType: 'SOLO', quantity: 1, attendees: soloAttendees },
      { tierType: 'DUO', quantity: 1, attendees: duoAttendees }
    ]
  });
  assert.equal(order.tierType, 'MIXED');
  assert.equal(order.quantity, 2);
  assert.equal(order.totalGuests, 3);
  assert.equal(order.totalAmount, 430000);
  assert.deepEqual(order.items.map(({ tierType, totalAmount }) => [tierType, totalAmount]), [
    ['SOLO', 150000], ['DUO', 280000]
  ]);
  assert.equal(order.items[0].attendees[0].phone, '+919876543210');
});

test('rejects tampered totals, duplicate lines, invalid counts, and missing attendee details', () => {
  const mixed = [
    { tierType: 'SOLO', quantity: 1, attendees: soloAttendees },
    { tierType: 'DUO', quantity: 1, attendees: duoAttendees }
  ];
  assert.equal(normalizeBookingOrder({ totalAmount: 4200, items: mixed }), null);
  assert.equal(normalizeBookingOrder({ totalAmount: 4300, items: [...mixed, mixed[0]] }), null);
  assert.equal(normalizeBookingOrder({ totalAmount: 4300, items: [{ ...mixed[0], attendees: [] }, mixed[1]] }), null);
  assert.equal(normalizeBookingOrder({ totalAmount: 4300, items: [{ ...mixed[0], attendees: [{ name: 'A', phone: '123' }] }, mixed[1]] }), null);
  assert.equal(normalizeBookingOrder({ totalAmount: 10300, items: [
    { tierType: 'SOLO', quantity: 5, attendees: Array.from({ length: 5 }, () => soloAttendees[0]) },
    { tierType: 'DUO', quantity: 1, attendees: duoAttendees }
  ] }), null);
});

test('reconciles webhook amounts against persisted mixed order lines', () => {
  const booking = {
    tier_type: 'MIXED',
    quantity: 2,
    total_amount: 430000,
    booking_items: [
      { tier_type: 'SOLO', quantity: 1, total_amount: 150000 },
      { tier_type: 'DUO', quantity: 1, total_amount: 280000 }
    ]
  };
  assert.equal(expectedBookingAmount(booking), 430000);
  assert.equal(expectedBookingAmount({ ...booking, total_amount: 430001 }), null);
  assert.equal(expectedBookingAmount({ ...booking, tier_type: 'SOLO' }), null);
  assert.equal(expectedBookingAmount({ ...booking, booking_items: [{ tier_type: 'DUO', quantity: 2, total_amount: 150000 }] }), null);
});
