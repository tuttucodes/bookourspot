'use client';

import { APPOINTMENT_STATUSES } from '@/lib/constants';
import type { AppointmentStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = APPOINTMENT_STATUSES[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
