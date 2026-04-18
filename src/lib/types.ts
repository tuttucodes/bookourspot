export type UserRole = 'customer' | 'merchant' | 'pending_merchant' | 'admin' | 'superadmin';

export type AppointmentStatus = 'booked' | 'cancelled' | 'completed';

export type BusinessCategory = 'salon' | 'barbershop' | 'car_wash' | 'spa' | 'other';

export type TransactionStatus = 'pending' | 'completed';
export type StaffStatus = 'available' | 'busy' | 'off_duty';

export interface WorkingHours {
  [day: string]: {
    open: string;  // "09:00"
    close: string; // "18:00"
    closed: boolean;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description: string | null;
  category: BusinessCategory;
  location: string | null;
  address: string | null;
  phone: string | null;
  owner_whatsapp: string | null;
  image_url: string | null;
  working_hours: WorkingHours;
  is_active: boolean;
  country?: string;
  legal_name?: string | null;
  trading_name?: string | null;
  primary_reg_number?: string | null;
  business_type?: 'sole_prop' | 'sdn_bhd' | 'llp' | 'other' | null;
  verification_status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  business_id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  status: StaffStatus;
  rating: number;
  monthly_bookings: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  business_id: string;
  service_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  service?: Service;
  business?: Business;
  user?: User;
}

export interface Transaction {
  id: string;
  appointment_id: string;
  amount: number;
  payment_method: 'cash';
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "09:30"
  available: boolean;
}
