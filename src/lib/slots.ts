import { format } from 'date-fns';
import type { WorkingHours, TimeSlot, Appointment } from './types';
import { DAYS_OF_WEEK } from './constants';

/**
 * Generate available time slots for a given business, date, and service duration.
 *
 * Algorithm:
 * 1. Get working hours for the day of week
 * 2. Generate all possible slots from open to close, stepping by service duration
 * 3. Mark slots as unavailable if they overlap with existing booked appointments
 */
export function generateTimeSlots(
  date: Date,
  workingHours: WorkingHours,
  durationMinutes: number,
  existingAppointments: Pick<Appointment, 'start_time' | 'end_time' | 'status'>[]
): TimeSlot[] {
  const dayName = DAYS_OF_WEEK[((date.getDay() + 6) % 7)]; // Convert JS Sunday=0 to Monday=0
  const dayHours = workingHours[dayName];

  if (!dayHours || dayHours.closed) return [];

  const slots: TimeSlot[] = [];
  const [openHour, openMin] = dayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = dayHours.close.split(':').map(Number);

  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  // Generate slots stepping by service duration
  for (let start = openMinutes; start + durationMinutes <= closeMinutes; start += durationMinutes) {
    const end = start + durationMinutes;
    const startStr = minutesToTime(start);
    const endStr = minutesToTime(end);

    // Check if this slot overlaps with any booked appointment
    const isBooked = existingAppointments.some(apt => {
      if (apt.status === 'cancelled') return false;
      const aptStart = timeToMinutes(apt.start_time);
      const aptEnd = timeToMinutes(apt.end_time);
      return start < aptEnd && end > aptStart;
    });

    slots.push({ start: startStr, end: endStr, available: !isBooked });
  }

  // Filter out past slots if the date is today
  const today = new Date();
  const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  if (isToday) {
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    return slots.map(slot => ({
      ...slot,
      available: slot.available && timeToMinutes(slot.start) > nowMinutes,
    }));
  }

  return slots;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}
