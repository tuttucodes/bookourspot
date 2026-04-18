import {
  ActionLink,
  CalloutBox,
  DetailRow,
  Divider,
  EmailLayout,
  Heading,
  Paragraph,
} from './_layout';

export type BookingConfirmedProps = {
  customerName: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  serviceName: string;
  servicePrice: number;
  dateHuman: string; // "Tue, Apr 22, 2026"
  timeHuman: string; // "10:30 AM"
  durationMinutes?: number;
  bookingToken: string;
  manageUrl?: string;
};

export default function BookingConfirmed({
  customerName,
  businessName,
  businessAddress,
  businessPhone,
  serviceName,
  servicePrice,
  dateHuman,
  timeHuman,
  durationMinutes,
  bookingToken,
  manageUrl,
}: BookingConfirmedProps) {
  return (
    <EmailLayout preview={`Booking confirmed at ${businessName} on ${dateHuman} at ${timeHuman}`}>
      <Heading>Your booking is confirmed</Heading>
      <Paragraph>
        Hi {customerName}, we&apos;ve confirmed your appointment at <strong>{businessName}</strong>.
        Details below.
      </Paragraph>

      <DetailRow label="Business" value={businessName} />
      {businessAddress ? <DetailRow label="Address" value={businessAddress} /> : null}
      <DetailRow label="Service" value={serviceName} />
      <DetailRow label="Date" value={dateHuman} />
      <DetailRow label="Time" value={timeHuman} />
      {durationMinutes ? (
        <DetailRow label="Duration" value={`${durationMinutes} min`} />
      ) : null}
      <DetailRow label="Amount" value={`RM ${servicePrice.toFixed(2)} (pay at store)`} />
      <DetailRow label="Booking token" value={<span style={{ fontFamily: 'monospace', fontSize: '15px' }}>{bookingToken}</span>} />
      {businessPhone ? <DetailRow label="Business phone" value={businessPhone} /> : null}

      {manageUrl ? (
        <>
          <Divider />
          <ActionLink href={manageUrl} label="View in my bookings" />
        </>
      ) : null}

      <Divider />
      <CalloutBox>
        Please arrive 5 minutes early. If you need to cancel, please do so at least 1 hour
        before your appointment so the slot can be released for other customers.
      </CalloutBox>
    </EmailLayout>
  );
}
