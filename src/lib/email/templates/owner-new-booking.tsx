import {
  ActionLink,
  DetailRow,
  Divider,
  EmailLayout,
  Heading,
  Paragraph,
} from './_layout';

export type OwnerNewBookingProps = {
  ownerName?: string;
  businessName: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  serviceName: string;
  servicePrice: number;
  dateHuman: string;
  timeHuman: string;
  durationMinutes?: number;
  bookingToken: string;
  dashboardUrl?: string;
};

export default function OwnerNewBooking({
  ownerName,
  businessName,
  customerName,
  customerPhone,
  customerEmail,
  serviceName,
  servicePrice,
  dateHuman,
  timeHuman,
  durationMinutes,
  bookingToken,
  dashboardUrl,
}: OwnerNewBookingProps) {
  return (
    <EmailLayout
      preview={`New booking at ${businessName} on ${dateHuman} at ${timeHuman}`}
      footerNote="You are receiving this because you own a business listed on BookOurSpot."
    >
      <Heading>New booking received</Heading>
      <Paragraph>
        {ownerName ? `Hi ${ownerName}, ` : ''}a new appointment was just booked at{' '}
        <strong>{businessName}</strong>.
      </Paragraph>

      <DetailRow label="Customer" value={customerName} />
      {customerPhone ? <DetailRow label="Phone" value={customerPhone} /> : null}
      {customerEmail ? <DetailRow label="Email" value={customerEmail} /> : null}
      <DetailRow label="Service" value={serviceName} />
      <DetailRow label="Date" value={dateHuman} />
      <DetailRow label="Time" value={timeHuman} />
      {durationMinutes ? <DetailRow label="Duration" value={`${durationMinutes} min`} /> : null}
      <DetailRow label="Amount" value={`RM ${servicePrice.toFixed(2)}`} />
      <DetailRow label="Booking ID" value={bookingToken} />

      {dashboardUrl ? (
        <>
          <Divider />
          <ActionLink href={dashboardUrl} label="Open merchant dashboard" />
        </>
      ) : null}
    </EmailLayout>
  );
}
