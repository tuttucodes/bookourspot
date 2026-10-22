import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle, DownloadSimple, Ticket } from '@phosphor-icons/react';
import { playTap, playSuccessChime } from '../utils/audioTheme';

export default function TicketStub({ pass, passNumber, totalPasses }) {
  const [qrSrc, setQrSrc] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportNotice, setExportNotice] = useState('');

  useEffect(() => {
    if (!pass?.id) return;
    QRCode.toDataURL(JSON.stringify({ ticketId: pass.id }), {
      width: 240,
      margin: 1,
      color: { dark: '#08070B', light: '#FFFFFF' }
    }).then(setQrSrc).catch(() => setQrSrc(''));
  }, [pass?.id]);

  if (!pass) return null;

  const handleDownload = async () => {
    playTap();
    setIsDownloading(true);
    try {
      const { downloadPassPdf } = await import('../utils/pdfGenerator');
      await downloadPassPdf(pass);
      playSuccessChime();
      setExportNotice('Ticket PDF downloaded.');
    } catch {
      setExportNotice('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setExportNotice(''), 3500);
    }
  };

  return (
    <article className="relative w-full max-w-sm sm:max-w-md mx-auto my-3 overflow-hidden rounded-3xl border border-white/15 bg-[#11101A] text-[#F3EFE0] shadow-2xl">
      <header className="flex items-center justify-between border-b border-white/10 bg-[#181624] px-4 py-3">
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-300"><Ticket size={16} /> BookOutSpot ticket</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] font-bold text-[#d7e99a]">{passNumber} / {totalPasses}</span>
      </header>

      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <span className="block text-[10px] uppercase tracking-wider text-[#d7e99a]">A little Halloween affair</span>
          <h3 className="mt-1 text-xl font-semibold leading-tight text-white">{pass.eventTitle || 'A little Halloween affair'}</h3>
          <p className="mt-1 text-xs text-zinc-400">{pass.selectedDate || 'Fri, 23 Oct'} · {pass.selectedTiming || '7 PM till late'} · Chennai</p>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 p-3.5">
          <div className="min-w-0">
            <span className="block text-[9px] uppercase tracking-wider text-zinc-500">Attendee</span>
            <span className="block truncate text-sm font-semibold text-white">{pass.guestName}</span>
            <span className="mt-0.5 block truncate text-[11px] text-zinc-400">{pass.guestPhone || pass.phone}</span>
          </div>
          <div className="shrink-0 text-right">
            <span className="block text-[9px] uppercase tracking-wider text-zinc-500">Ticket</span>
            <span className="mt-1 inline-block rounded-full border border-[#d7e99a]/20 bg-[#d7e99a]/10 px-2.5 py-1 text-xs font-medium text-[#d7e99a]">{pass.tierName}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/50 p-3">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-white p-1.5">
            {qrSrc ? <img src={qrSrc} alt={`Ticket reference QR for ${pass.id}`} className="h-full w-full rounded-lg" /> : <span className="text-[9px] text-zinc-500">Loading QR…</span>}
          </div>
          <div className="min-w-0 space-y-2">
            <div><span className="block text-[9px] uppercase tracking-wider text-zinc-500">Ticket reference</span><span className="block truncate font-mono text-sm font-bold tracking-wide text-white">{pass.id}</span></div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-200"><CheckCircle size={13} weight="fill" /> Payment verified</span>
          </div>
        </div>

        <button type="button" disabled={isDownloading} onClick={handleDownload} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-60">
          <DownloadSimple size={16} weight="bold" /> {isDownloading ? 'Preparing PDF…' : 'Download ticket PDF'}
        </button>
        {exportNotice && <p role="status" className="text-center text-[10px] text-zinc-300">{exportNotice}</p>}
      </div>
    </article>
  );
}
