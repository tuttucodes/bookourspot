/**
 * Malaysia-specific format validators for merchant applications.
 * Lightweight client-side checks; final validation happens server-side.
 */

/** SSM new 12-digit format (any entity type since Oct 2019). */
export const SSM_NEW_FORMAT = /^\d{12}$/;

/** SSM Sdn Bhd legacy: 6-7 digits + trailing letter. */
export const SSM_SDN_BHD_LEGACY = /^\d{6,7}-[A-Z]$/;

/** SSM Enterprise/sole-prop legacy: 2 letters + 7 digits + letter. */
export const SSM_ENTERPRISE_LEGACY = /^[A-Z]{2}\d{7}-[A-Z]$/;

/** LLP legacy: LLP + 7 digits + 3 letters. */
export const LLP_LEGACY = /^LLP\d{7}-[A-Z]{3}$/;

/** MY NRIC (MyKad): YYMMDD-PB-XXXX with dashes. */
export const MY_NRIC = /^\d{6}-\d{2}-\d{4}$/;

/** MY mobile E.164: +60 1X XXXXXXX(X). */
export const MY_MOBILE_E164 = /^\+60(1[0-9])\d{7,8}$/;

/** Passport: alphanumeric 6-12 chars, uppercase. */
export const PASSPORT = /^[A-Z0-9]{6,12}$/;

export function validateSSM(raw: string): { ok: boolean; normalized: string; reason?: string } {
  const value = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (SSM_NEW_FORMAT.test(value)) return { ok: true, normalized: value };
  if (SSM_SDN_BHD_LEGACY.test(value)) return { ok: true, normalized: value };
  if (SSM_ENTERPRISE_LEGACY.test(value)) return { ok: true, normalized: value };
  if (LLP_LEGACY.test(value)) return { ok: true, normalized: value };
  return {
    ok: false,
    normalized: value,
    reason: 'Not a recognized SSM format (new 12-digit or legacy).',
  };
}

export function validateIdNumber(
  type: 'nric' | 'passport',
  raw: string
): { ok: boolean; normalized: string; last4: string; reason?: string } {
  const value = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (type === 'nric') {
    if (!MY_NRIC.test(value)) {
      return { ok: false, normalized: value, last4: '', reason: 'NRIC must be YYMMDD-PB-XXXX.' };
    }
    return { ok: true, normalized: value, last4: value.slice(-4) };
  }
  // passport
  if (!PASSPORT.test(value)) {
    return {
      ok: false,
      normalized: value,
      last4: '',
      reason: 'Passport must be 6-12 alphanumeric characters.',
    };
  }
  return { ok: true, normalized: value, last4: value.slice(-4) };
}

export function validateMyPhone(raw: string): { ok: boolean; normalized: string; reason?: string } {
  const digits = raw.replace(/\D/g, '');
  const normalized = digits.startsWith('60')
    ? `+${digits}`
    : digits.startsWith('0')
      ? `+60${digits.slice(1)}`
      : `+${digits}`;
  if (!MY_MOBILE_E164.test(normalized)) {
    return {
      ok: false,
      normalized,
      reason: 'Expected a Malaysian mobile (e.g. 012 345 6789).',
    };
  }
  return { ok: true, normalized };
}

export const MY_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Penang',
  'Perak',
  'Perlis',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'Kuala Lumpur',
  'Labuan',
  'Putrajaya',
] as const;

export type MyState = (typeof MY_STATES)[number];
