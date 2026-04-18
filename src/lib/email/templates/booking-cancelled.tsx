import {
  ActionLink,
  CalloutBox,
  DetailRow,
  Divider,
  EmailLayout,
  Heading,
  Paragraph,
} from './_layout';

export type BookingCancelledProps = {
  customerName: string;
  businessName: string;
  serviceName: string;
  dateHuman: string;
  timeHuman: string;
  appointmentId: string;
  cancelledBy: 'customer' | 'merchant';
  reason?: string;
  rebookUrl?: string;
};

export default function BookingCancelled({
  customerName,
  businessName,
  serviceName,
  dateHuman,
  timeHuman,
  appointmentId,
  cancelledBy,
  reason,
  rebookUrl,
}: BookingCancelledProps) {
  const subjectWho = cancelledBy === 'merchant' ? `${businessName} has cancelled` : 'You cancelled';
  return (
    <EmailLayout preview={`${subjectWho} your booking on ${dateHuman}`}>
      <Heading>Your booking has been cancelled</Heading>
      <Paragraph>
        Hi {customerName},{' '}
        {cancelledBy === 'merchant'
          ? `${businessName} has cancelled your upcoming appointment.`
          : 'we have cancelled your upcoming appointment as requested.'}
      </Paragraph>

      <DetailRow label="Business" value={businessName} />
      <DetailRow label="Service" value={serviceName} />
      <DetailRow label="Date" value={dateHuman} />
      <DetailRow label="Time" value={timeHuman} />
      <DetailRow label="Booking ID" value={appointmentId.slice(0, 8)} />

      {reason ? (
        <>
          <Divider />
          <CalloutBox tone="warn">
            <strong>Reason:</strong> {reason}
          </CalloutBox>
        </>
      ) : null}

      {rebookUrl ? (
        <>
          <Divider />
          <Paragraph>Need to reschedule? Pick a new time below.</Paragraph>
          <ActionLink href={rebookUrl} label="Book a new slot" />
        </>
      ) : null}
    </EmailLayout>
  );
}
