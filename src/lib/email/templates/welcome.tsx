import { ActionLink, Divider, EmailLayout, Heading, Paragraph } from './_layout';

export type WelcomeProps = {
  customerName: string;
  exploreUrl?: string;
  isMerchant?: boolean;
};

export default function Welcome({ customerName, exploreUrl, isMerchant }: WelcomeProps) {
  return (
    <EmailLayout preview={`Welcome to BookOurSpot, ${customerName}`}>
      <Heading>Welcome to BookOurSpot</Heading>
      <Paragraph>
        Hi {customerName}, thanks for joining us.{' '}
        {isMerchant
          ? 'Your merchant account is ready — list your business and start accepting bookings.'
          : 'Discover salons, barbershops, car washes and more near you.'}
      </Paragraph>

      <Paragraph>
        {isMerchant
          ? 'Head to your dashboard to add services and working hours, then share your booking page with customers.'
          : 'Browse, book, and manage your appointments in one place. No more phone tag.'}
      </Paragraph>

      {exploreUrl ? (
        <>
          <Divider />
          <ActionLink
            href={exploreUrl}
            label={isMerchant ? 'Open merchant dashboard' : 'Explore businesses'}
          />
        </>
      ) : null}
    </EmailLayout>
  );
}
