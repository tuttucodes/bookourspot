import jsPDF from 'jspdf';
import QRCode from 'qrcode';

/**
 * Generate and download a BookOutSpot ticket PDF
 */
export async function downloadPassPdf(pass, options = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 200] // Custom sleek vertical mobile pass format (105mm x 200mm)
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background deep noir #0B0A10
  doc.setFillColor(11, 10, 16);
  doc.rect(0, 0, width, height, 'F');

  // Top Accent Bar #FF521B
  doc.setFillColor(255, 82, 27);
  doc.rect(0, 0, width, 3, 'F');

  // Header Masthead
  doc.setTextColor(243, 239, 224); // #F3EFE0
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BOOKOUTSPOT', 12, 14);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 169, 71); // #FFA947
  doc.text('OFFICIAL PASS · ADMIT ONE', width - 12, 14, { align: 'right' });

  // Thin separator
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.15);
  doc.line(12, 18, width - 12, 18);

  // Event Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  const titleLines = doc.splitTextToSize((pass.eventTitle || 'A Little Halloween Affair').toUpperCase(), width - 24);
  doc.text(titleLines, 12, 26);

  let currentY = 26 + (titleLines.length * 6);

  // Date, Time & Venue
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(170, 170, 180);
  doc.text(`${pass.selectedDate || 'Upcoming Session'} · ${pass.selectedTiming || 'Doors Open Early'}`, 12, currentY);
  currentY += 4.5;
  doc.text('Venue details will be shared by the event organiser.', 12, currentY);
  currentY += 8;

  // Pass Holder Card Box
  doc.setFillColor(20, 19, 28);
  doc.roundedRect(12, currentY, width - 24, 28, 3, 3, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.1);
  doc.roundedRect(12, currentY, width - 24, 28, 3, 3, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 155);
  doc.text('PASS HOLDER', 16, currentY + 6);
  doc.text('TIER ALLOCATION', width - 16, currentY + 6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(pass.guestName || 'Registered Guest', 16, currentY + 13);

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 169, 71);
  doc.text(pass.tierName || 'Solo Pass', width - 16, currentY + 13, { align: 'right' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 190);
  doc.text(pass.phone || pass.guestPhone || '', 16, currentY + 20);

  if (pass.addons && pass.addons.length > 0) {
    doc.setTextColor(100, 220, 120);
    doc.text(`+ ${pass.addons.join(', ')}`, width - 16, currentY + 20, { align: 'right' });
  }

  currentY += 34;

  // Ticket Perforation Cutout effect
  doc.setFillColor(11, 10, 16);
  doc.circle(0, currentY, 4, 'F');
  doc.circle(width, currentY, 4, 'F');
  doc.setDrawColor(80, 80, 95);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(7, currentY, width - 7, currentY);
  doc.setLineDashPattern([], 0); // Reset dash

  currentY += 6;

  // QR Code Generation
  const checkinPayload = JSON.stringify({
    app: 'BookOutSpot',
    event: pass.eventTitle,
    passId: pass.id,
    guest: pass.guestName,
    phone: pass.phone || pass.guestPhone || '',
    tier: pass.tierName,
    addons: pass.addons || [],
    ticketId: pass.id
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(checkinPayload, {
      width: 320,
      margin: 0,
      color: {
        dark: '#0B0A10',
        light: '#FFFFFF'
      }
    });

    const qrSize = 46;
    const qrX = (width - qrSize) / 2;
    // White background card for optical contrast at the gate
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX - 3, currentY, qrSize + 6, qrSize + 6, 3, 3, 'F');
    doc.addImage(qrDataUrl, 'PNG', qrX, currentY + 3, qrSize, qrSize);
    currentY += qrSize + 13;
  } catch (err) {
    console.error('Failed to render PDF QR:', err);
    currentY += 50;
  }

  // Ticket reference
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`PASS ID: ${pass.id}`, width / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 165);
  doc.text('Payment verified · Show this ticket at the event', width / 2, currentY, { align: 'center' });
  currentY += 7;

  // Security Notice & Guidelines
  doc.setFillColor(20, 19, 28);
  doc.roundedRect(12, currentY, width - 24, 25, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 82, 27);
  doc.text('ADMISSION RULES & SECURITY', 16, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(170, 170, 185);
  const rules = [
    '• Present this ticket QR at the event entrance.',
    '• Keep your ticket reference available for check-in.',
    '• Follow the event organiser’s entry instructions.',
    '• Contact BookOutSpot support if you need help with your booking.'
  ];
  rules.forEach((rule, idx) => {
    doc.text(rule, 16, currentY + 9.5 + (idx * 3.8));
  });

  // Footer
  doc.setFont('courier', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 100, 115);
  doc.text(`BOOKOURSPOT.COM · ${new Date().toLocaleDateString('en-IN')}`, width / 2, height - 5, { align: 'center' });

  // Save PDF
  const filename = `BookOutSpot_${(pass.guestName || 'Pass').replace(/[^a-zA-Z0-9]/g, '_')}_${pass.id}.pdf`;
  doc.save(filename);
}
