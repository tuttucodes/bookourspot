import {
  ActionLink,
  CalloutBox,
  DetailRow,
  Divider,
  EmailLayout,
  Heading,
  Paragraph,
} from './_layout';

export type ReminderWindow = '60m' | '30m' | '15m';

export type AppointmentReminderProps = {
  customerName: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  serviceName: string;
  dateHuman: string;
  timeHuman: string;
  bookingToken: string;
  window: ReminderWindow;
  manageUrl?: string;
};

const WINDOW_LABELS: Record<ReminderWindow, { headline: string; body: string; preview: string; tone: 'info' | 'warn' }> = {
  '60m': {
    headline: 'Appointment in 1 hour',
    body: 'This is a reminder — your appointment starts in about an hour.',
    preview: 'Your appointment is in 1 hour',
    tone: 'info',
  },
  '30m': {
    headline: 'Appointment in 30 minutes',
    body: 'Heads up — your appointment is in 30 minutes. Plan your travel.',
    preview: 'Your appointment is in 30 minutes',
    tone: 'info',
  },
  '15m': {
    headline: 'Starting soon — 15 minutes',
    body: 'Your appointment starts in 15 minutes. Please arrive shortly.',
    preview: 'Your appointment starts in 15 minutes',
    tone: 'warn',
  },
};

export default function AppointmentReminder({
  customerName,
  businessName,
  businessAddress,
  businessPhone,
  serviceName,
  dateHuman,
  timeHuman,
  bookingToken,
  window,
  manageUrl,
}: AppointmentReminderProps) {
  const labels = WINDOW_LABELS[window];
  return (
    <EmailLayout preview={labels.preview}>
      <Heading>{labels.headline}</Heading>
      <Paragraph>
        Hi {customerName}, {labels.body}
      </Paragraph>

      <DetailRow label="Business" value={businessName} />
      {businessAddress ? <DetailRow label="Address" value={businessAddress} /> : null}
      {businessPhone ? <DetailRow label="Phone" value={businessPhone} /> : null}
      <DetailRow label="Service" value={serviceName} />
      <DetailRow label="Date" value={dateHuman} />
      <DetailRow label="Time" value={timeHuman} />
      <DetailRow label="Booking ID" value={bookingToken} />

      {manageUrl ? (
        <>
          <Divider />
          <ActionLink href={manageUrl} label="View booking" />
        </>
      ) : null}

      {window === '15m' ? (
        <>
          <Divider />
          <CalloutBox tone="warn">
            Running late? Call the business so they can hold your slot.
          </CalloutBox>
        </>
      ) : null}
    </EmailLayout>
  );
}
