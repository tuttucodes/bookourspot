export const TICKET_PRICE_PAISE = Object.freeze({ SOLO: 150000, DUO: 280000 });
export const GUESTS_PER_UNIT = Object.freeze({ SOLO: 1, DUO: 2 });
export const TIER_NAMES = Object.freeze({
  SOLO: 'Entry · 1 person',
  DUO: 'Couple / Duo · 2 people'
});

function normalizePhone(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  return raw.startsWith('+') ? raw : (/^\d{10}$/.test(raw) ? `+91${raw}` : '');
}

/** Validate an order from untrusted browser input and return its canonical lines. */
export function normalizeBookingOrder({ items, totalAmount }) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 2) return null;
  const seen = new Set();
  const normalizedItems = [];
  let units = 0;
  let amountPaise = 0;
  let guestCount = 0;

  for (const item of items) {
    const tierType = item?.tierType;
    const quantity = item?.quantity;
    if (!Object.hasOwn(TICKET_PRICE_PAISE, tierType) || seen.has(tierType)
      || !Number.isInteger(quantity) || quantity < 1 || quantity > 5
      || !Array.isArray(item.attendees)) return null;
    seen.add(tierType);
    units += quantity;
    const lineAmount = quantity * TICKET_PRICE_PAISE[tierType];
    const lineGuests = quantity * GUESTS_PER_UNIT[tierType];
    amountPaise += lineAmount;
    guestCount += lineGuests;
    if (item.attendees.length !== lineGuests) return null;

    const attendees = [];
    for (const attendee of item.attendees) {
      const name = typeof attendee?.name === 'string' ? attendee.name.trim() : '';
      const phone = normalizePhone(attendee?.phone);
      if (name.length < 1 || name.length > 80 || !/^\+[1-9]\d{7,14}$/.test(phone)) return null;
      attendees.push({ name, phone });
    }
    normalizedItems.push({
      tierType,
      tierName: TIER_NAMES[tierType],
      quantity,
      unitAmount: TICKET_PRICE_PAISE[tierType],
      totalAmount: lineAmount,
      attendees
    });
  }

  const rupees = Number(totalAmount);
  if (units > 5 || !Number.isSafeInteger(rupees) || rupees * 100 !== amountPaise) return null;
  return {
    items: normalizedItems,
    quantity: units,
    totalGuests: guestCount,
    totalAmount: amountPaise,
    tierType: normalizedItems.length === 1 ? normalizedItems[0].tierType : 'MIXED'
  };
}

export function expectedBookingAmount(booking) {
  if (!Array.isArray(booking?.booking_items) || booking.booking_items.length === 0) return null;
  let total = 0;
  let units = 0;
  const tiers = new Set();
  for (const item of booking.booking_items) {
    if (!Object.hasOwn(TICKET_PRICE_PAISE, item.tier_type)
      || tiers.has(item.tier_type)
      || !Number.isInteger(item.quantity) || item.quantity < 1
      || item.total_amount !== TICKET_PRICE_PAISE[item.tier_type] * item.quantity) return null;
    tiers.add(item.tier_type);
    total += item.total_amount;
    units += item.quantity;
  }
  const expectedType = tiers.size > 1 ? 'MIXED' : [...tiers][0];
  return units <= 5 && booking.quantity === units && booking.tier_type === expectedType
    && total === booking.total_amount ? total : null;
}
