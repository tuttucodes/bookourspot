export const TIMEZONE = 'Asia/Kuala_Lumpur';

export const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
] as const;

export const DEFAULT_WORKING_HOURS = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '10:00', close: '16:00', closed: false },
  sunday: { open: '10:00', close: '16:00', closed: true },
};

export const BUSINESS_CATEGORIES = [
  { value: 'salon', label: 'Salon' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'car_wash', label: 'Car Wash' },
  { value: 'spa', label: 'Spa' },
  { value: 'other', label: 'Other' },
] as const;

export const APPOINTMENT_STATUSES = {
  booked: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  completed: { label: 'Done', color: 'bg-green-100 text-green-800' },
} as const;
