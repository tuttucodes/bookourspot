/**
 * Apple Wallet & Google Wallet Pass Exporter for BookOurSpot
 * Configured with Chennai geofencing coordinates (lat: 12.9815, lng: 80.2520).
 */

export const CHENNAI_COORDINATES = {
  latitude: 12.9815,
  longitude: 80.2520,
  relevantText: 'You are near South Sanctuary · Chennai. Tap to open BookOurSpot pass for gate security.'
};

/**
 * Generate Apple Wallet pass JSON payload compliant with Apple PKPass specifications
 */
export function generateApplePassJson(pass) {
  return {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.bookourspot.eventticket',
    serialNumber: pass.id,
    teamIdentifier: 'BOSCHENNAI',
    organizationName: 'BookOurSpot',
    description: `${pass.eventTitle || 'Event'} Admission Pass`,
    logoText: 'BOOKOURSPOT',
    foregroundColor: 'rgb(243, 239, 224)',
    backgroundColor: 'rgb(12, 11, 18)',
    labelColor: 'rgb(255, 169, 71)',
    locations: [
      {
        latitude: CHENNAI_COORDINATES.latitude,
        longitude: CHENNAI_COORDINATES.longitude,
        relevantText: CHENNAI_COORDINATES.relevantText
      }
    ],
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: JSON.stringify({
          app: 'BookOurSpot',
          passId: pass.id,
          guest: pass.guestName,
          tier: pass.tierName,
          utr: pass.utr
        }),
        messageEncoding: 'iso-8859-1',
        altText: pass.id
      }
    ],
    eventTicket: {
      primaryFields: [
        {
          key: 'event',
          label: 'EVENT',
          value: pass.eventTitle || 'A Little Halloween Affair'
        }
      ],
      secondaryFields: [
        {
          key: 'guest',
          label: 'PASS HOLDER',
          value: pass.guestName || 'Guest'
        },
        {
          key: 'tier',
          label: 'ADMISSION TIER',
          value: pass.tierName || 'Solo Pass'
        }
      ],
      auxiliaryFields: [
        {
          key: 'date',
          label: 'DATE & TIME',
          value: `${pass.selectedDate || 'Fri, 23 Oct'} · ${pass.selectedTiming || '7 PM'}`
        },
        {
          key: 'venue',
          label: 'CITY / VENUE',
          value: 'Chennai · Secret Sanctuary'
        }
      ],
      backFields: [
        {
          key: 'passId',
          label: 'PASS REFERENCE',
          value: pass.id
        },
        {
          key: 'utr',
          label: 'BANK UTR REF',
          value: pass.utr || 'Direct UPI Verified'
        },
        {
          key: 'rules',
          label: 'SECURITY GUIDELINES',
          value: 'Strictly non-transferable. Valid government photo ID mandatory at the gate. Geofenced to Chennai sanctuary.'
        },
        {
          key: 'website',
          label: 'ISSUER',
          value: 'BookOurSpot (bookourspot.com)'
        }
      ]
    }
  };
}

/**
 * Trigger Apple Wallet pass export
 */
export function exportToAppleWallet(pass) {
  const passData = generateApplePassJson(pass);
  const blob = new Blob([JSON.stringify(passData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BookOurSpot_ApplePass_${pass.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Generate Google Wallet Save Pass link / payload
 */
export function exportToGoogleWallet(pass) {
  const googleWalletObject = {
    iss: 'bookourspot-wallet@bookourspot.iam.gserviceaccount.com',
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: {
      eventTicketObjects: [
        {
          id: `bookourspot.${pass.id}`,
          classId: 'bookourspot.chennai_events_v1',
          state: 'ACTIVE',
          ticketHolderName: pass.guestName,
          ticketNumber: pass.id,
          barcode: {
            type: 'QR_CODE',
            value: pass.id,
            alternateText: pass.id
          },
          locations: [
            {
              latitude: CHENNAI_COORDINATES.latitude,
              longitude: CHENNAI_COORDINATES.longitude
            }
          ]
        }
      ]
    }
  };

  const blob = new Blob([JSON.stringify(googleWalletObject, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BookOurSpot_GoogleWallet_${pass.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
