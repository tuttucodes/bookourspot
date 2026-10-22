import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { 
  ShieldCheck, 
  WarningCircle, 
  CheckCircle,
  Sparkle,
  Ticket,
  DownloadSimple,
  AppleLogo,
  GoogleCardboardLogo,
  Wallet,
  Martini
} from '@phosphor-icons/react';
import { downloadPassPdf } from '../utils/pdfGenerator';
import { exportToAppleWallet, exportToGoogleWallet } from '../utils/walletExport';
import { playTap, playSuccessChime, triggerHaptic } from '../utils/audioTheme';

export default function TicketStub({ pass, passNumber, totalPasses }) {
  const [qrSrc, setQrSrc] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportNotice, setExportNotice] = useState('');

  useEffect(() => {
    if (!pass) return;
    const checkinPayload = JSON.stringify({
      event: pass.eventTitle || 'A Little Halloween Affair',
      passId: pass.id,
      guest: pass.guestName,
      phone: pass.phone || pass.guestPhone || '',
      tier: pass.tierName,
      utr: pass.utr,
      valid: true
    });

    QRCode.toDataURL(checkinPayload, {
      width: 240,
      margin: 1,
      color: {
        dark: '#08070B',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrSrc(url))
      .catch(err => console.error('Failed to generate ticket QR:', err));
  }, [pass]);

  if (!pass) return null;

  const isAdmitted = pass.status === 'ADMITTED';

  return (
    <div className="relative w-full max-w-sm sm:max-w-md mx-auto my-3 bg-[#11101A] rounded-3xl border border-white/15 shadow-2xl text-[#F3EFE0] overflow-hidden font-sans">
      
      {/* Masthead */}
      <div className="bg-[#181624] border-b border-white/10 px-4 sm:px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF521B] animate-pulse" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-300">
            BookOurSpot Pass · Admit One
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold text-[#FFA947] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
          PASS {passNumber} OF {totalPasses}
        </span>
      </div>

      {/* Main Ticket Body */}
      <div className="p-4 sm:p-5 space-y-3.5">
        
        {/* Event Title & Metadata */}
        <div className="text-left">
          <span className="text-[10px] font-mono tracking-wider text-[#FFA947] uppercase block">
            Official Guest Pass
          </span>
          <h4 className="text-xl sm:text-2xl font-black text-white leading-tight mt-0.5">
            {pass.eventTitle || 'a little halloween affair'}
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Friday, 23 Oct · 7:00 PM Till Late · Secret Location
          </p>
        </div>

        {/* Pass Holder & Tier Allocation */}
        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between text-left">
          <div className="min-w-0 mr-2">
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">Pass Holder</span>
            <span className="text-sm font-bold text-white tracking-wide block truncate">
              {pass.guestName}
            </span>
            {(pass.phone || pass.guestPhone) && (
              <span className="text-[11px] font-mono text-zinc-400 block truncate mt-0.5">
                {pass.phone || pass.guestPhone}
              </span>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">Tier</span>
            <span className="text-xs font-mono font-bold text-[#FFA947] bg-[#FF521B]/15 px-2.5 py-1 rounded-full border border-[#FF521B]/30 inline-block">
              {pass.tierName}
            </span>
          </div>
        </div>

        {/* Add-ons Allocation (e.g. Signature Mixology) */}
        {pass.addons && pass.addons.length > 0 && (
          <div className="p-2.5 rounded-xl bg-[#FF521B]/10 border border-[#FF521B]/25 flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <Martini size={15} className="text-[#FFA947]" weight="fill" />
              <span className="text-xs font-bold text-white font-mono">
                {pass.addons.join(', ')}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/25">
              INCLUDED
            </span>
          </div>
        )}
      </div>

      {/* TICKET PERFORATION & CUTOUT NOTCHES  */}
      <div className="relative py-2 flex items-center justify-between select-none">
        {/* Left circular cutout notch */}
        <div className="w-5 h-5 rounded-full bg-[#08080C] -ml-2.5 border-r border-white/20 shrink-0" />
        {/* Dashed perforation line */}
        <div className="flex-1 border-b-2 border-dashed border-white/20 mx-3" />
        {/* Right circular cutout notch */}
        <div className="w-5 h-5 rounded-full bg-[#08080C] -mr-2.5 border-l border-white/20 shrink-0" />
      </div>

      {/* SCANNABLE GATE CHECK-IN STUB */}
      <div className="p-4 sm:p-5 pt-1 bg-black/60 space-y-3.5">
        
        <div className="flex items-center justify-between gap-3">
          {/* Check-in QR Code */}
          <div className="p-2 bg-white rounded-2xl shadow-xl shrink-0 border border-white/20">
            {qrSrc ? (
              <img 
                src={qrSrc} 
                alt={`Entry QR for Pass ${pass.id}`} 
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-xl" 
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center text-zinc-800 text-[9px] font-mono">
                Generating…
              </div>
            )}
          </div>

          {/* Verification Specs */}
          <div className="flex-1 space-y-1.5 text-left min-w-0">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">Pass ID</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-[#FFA947] tracking-wider select-all block truncate">
                {pass.id}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">Bank Ref (UTR)</span>
              <span className="font-mono text-[11px] text-zinc-300 block truncate">
                {pass.utr}
              </span>
            </div>

            <div className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              isAdmitted 
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
            }`}>
              <CheckCircle size={13} weight="fill" />
              <span>{isAdmitted ? 'Admitted at Gate' : 'Gate UTR Valid'}</span>
            </div>
          </div>
        </div>

        {/* Barcode Strip */}
        <div className="pt-1 text-center">
          <div className="h-6 w-full rounded-md bg-[repeating-linear-gradient(90deg,#fff_0px,#fff_2px,transparent_2px,transparent_4px,#fff_4px,#fff_6px,transparent_6px,transparent_9px,#fff_9px,#fff_12px,transparent_12px,transparent_14px)] opacity-60" />
          <span className="font-mono text-[9px] tracking-[0.25em] text-zinc-500 uppercase mt-1 block">
            *{pass.id}*
          </span>
        </div>

        {/* Non-Transferable Warning Note */}
        <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/25 flex items-start gap-2 text-[10px] text-zinc-300 text-left">
          <WarningCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <span className="leading-snug">
            <strong className="text-white">Non-Transferable:</strong> Govt photo ID matching <em>{pass.guestName}</em> must be presented at the gate.
          </span>
        </div>

        {/* Chennai Geofenced Lockscreen Notification Pill */}
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
            <span className="truncate">Chennai Geofence: 12.9815°N, 80.2520°E</span>
          </div>
          <span className="text-[#FFA947] shrink-0 font-bold">Auto-Alert</span>
        </div>

        {/* DIGITAL WALLET & EXPORT ACTIONS */}
        <div className="pt-2 space-y-2">
          {/* 1. Download PDF Ticket Button */}
          <button
            type="button"
            disabled={isDownloading}
            onClick={async () => {
              playTap();
              setIsDownloading(true);
              setExportNotice('Generating high-res PDF…');
              try {
                await downloadPassPdf(pass);
                playSuccessChime();
                setExportNotice('PDF Ticket downloaded successfully!');
              } catch (err) {
                console.error(err);
                setExportNotice('Download failed. Please retry.');
              }
              setIsDownloading(false);
              setTimeout(() => setExportNotice(''), 3500);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer shadow-lg"
          >
            <DownloadSimple size={16} weight="bold" />
            <span>{isDownloading ? 'Building PDF…' : 'Download PDF Ticket'}</span>
          </button>

          {/* 2. Apple & Google Wallet Dual Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                playTap();
                exportToAppleWallet(pass);
                triggerHaptic('success');
                setExportNotice('Apple Wallet pass saved (Chennai geofenced)');
                setTimeout(() => setExportNotice(''), 3500);
              }}
              className="py-2 px-3 rounded-xl bg-black hover:bg-zinc-900 border border-white/20 text-white font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <AppleLogo size={14} weight="fill" />
              <span>Apple Wallet</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTap();
                exportToGoogleWallet(pass);
                triggerHaptic('success');
                setExportNotice('Google Wallet pass ready (Chennai geofenced)');
                setTimeout(() => setExportNotice(''), 3500);
              }}
              className="py-2 px-3 rounded-xl bg-[#1E1E28] hover:bg-[#282736] border border-white/20 text-white font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wallet size={14} weight="bold" />
              <span>Google Wallet</span>
            </button>
          </div>

          {/* Toast Notice */}
          {exportNotice && (
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] text-center animate-in fade-in">
              {exportNotice}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
