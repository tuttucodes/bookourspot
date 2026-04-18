import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';

const brandColor = '#111827';
const accentColor = '#2563eb';
const mutedColor = '#6b7280';
const borderColor = '#e5e7eb';

export function EmailLayout({
  preview,
  children,
  footerNote,
}: {
  preview: string;
  children: ReactNode;
  footerNote?: string;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: '#f9fafb',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            padding: '40px 16px',
          }}
        >
          <Section style={{ paddingBottom: '24px' }}>
            <Text
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: brandColor,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              BookOurSpot
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: '#ffffff',
              border: `1px solid ${borderColor}`,
              borderRadius: '12px',
              padding: '32px',
            }}
          >
            {children}
          </Section>

          <Section style={{ paddingTop: '24px' }}>
            <Text style={{ fontSize: '12px', color: mutedColor, margin: 0 }}>
              {footerNote ??
                'You are receiving this email because you booked a service via BookOurSpot.'}
            </Text>
            <Text style={{ fontSize: '12px', color: mutedColor, margin: '8px 0 0' }}>
              Questions? Reply to this email or visit{' '}
              <Link href="https://www.bookourspot.com" style={{ color: accentColor }}>
                bookourspot.com
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        fontSize: '22px',
        fontWeight: 700,
        color: brandColor,
        margin: '0 0 12px',
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </Text>
  );
}

export function Paragraph({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        fontSize: '15px',
        lineHeight: '24px',
        color: '#374151',
        margin: '0 0 16px',
      }}
    >
      {children}
    </Text>
  );
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <table
      role="presentation"
      cellPadding="0"
      cellSpacing="0"
      style={{ width: '100%', borderCollapse: 'collapse' }}
    >
      <tbody>
        <tr>
          <td
            style={{
              padding: '10px 0',
              borderTop: `1px solid ${borderColor}`,
              fontSize: '13px',
              color: mutedColor,
              width: '40%',
              verticalAlign: 'top',
            }}
          >
            {label}
          </td>
          <td
            style={{
              padding: '10px 0',
              borderTop: `1px solid ${borderColor}`,
              fontSize: '14px',
              color: brandColor,
              fontWeight: 500,
              textAlign: 'right',
              verticalAlign: 'top',
            }}
          >
            {value}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function CalloutBox({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'warn';
}) {
  const toneStyle =
    tone === 'warn'
      ? { backgroundColor: '#fef3c7', borderColor: '#fcd34d', color: '#92400e' }
      : { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' };
  return (
    <Section
      style={{
        backgroundColor: toneStyle.backgroundColor,
        border: `1px solid ${toneStyle.borderColor}`,
        borderRadius: '8px',
        padding: '14px 16px',
        margin: '16px 0',
      }}
    >
      <Text style={{ fontSize: '14px', color: toneStyle.color, margin: 0, lineHeight: '20px' }}>
        {children}
      </Text>
    </Section>
  );
}

export function Divider() {
  return <Hr style={{ borderColor, margin: '24px 0' }} />;
}

export function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-block',
        backgroundColor: accentColor,
        color: '#ffffff',
        padding: '10px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        textDecoration: 'none',
        marginTop: '8px',
      }}
    >
      {label}
    </Link>
  );
}
