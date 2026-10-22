import React, { useState, useEffect } from 'react';
import { 
  X, 
  Ticket, 
  Printer, 
  WhatsappLogo, 
  CheckCircle, 
  WarningCircle, 
  ArrowRight, 
  ArrowCounterClockwise,
  DownloadSimple
} from '@phosphor-icons/react';
import TicketStub from './TicketStub';
import { getStoredPasses, refreshFromSupabase, clearStoredPasses } from '../utils/passRegistry';
import { downloadPassPdf } from '../utils/pdfGenerator';
import { playTap, playSuccessChime } from '../utils/audioTheme';

export default function MyTicketsModal({ isOpen, onClose, onBookNewPass }) {
  const [passes, setPasses] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const loadPasses = () => {
    const list = getStoredPasses();
    setPasses(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadPasses();
    }
  }, [isOpen]);

  const handleSyncCloud = async () => {
    setIsRefreshing(true);
    await refreshFromSupabase();
    loadPasses();
    setIsRefreshing(false);
  };

  const handlePrintAll = () => {
    playTap();
    window.print();
  };

  const handleDownloadAllPdf = async () => {
    playTap();
    setIsDownloadingAll(true);
    try {
      for (const p of passes) {
        await downloadPassPdf(p);
      }
      playSuccessChime();
    } catch (err) {
      console.error(err);
    }
    setIsDownloadingAll(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="relative w-full max-w-2xl bg-[#0F0E17] border border-white/15 rounded-3xl shadow-2xl text-[#F3EFE0] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Masthead */}
        <div className="bg-[#171624] border-b border-white/10 p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#431CB8] flex items-center justify-center text-white">
              <Ticket size={22} weight="fill" />
            </div>
            <div className="text-left">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                BookOurSpot Wallet
              </h3>
              <p className="text-xs text-zinc-400">
                {passes.length} {passes.length === 1 ? 'Pass' : 'Passes'} Registered · Gate Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {passes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset local wallet passes for fresh demo booking?')) {
                    clearStoredPasses();
                    setPasses([]);
                  }
                }}
                title="Reset local passes"
                className="p-2 rounded-full bg-white/5 hover:bg-red-950/40 border border-white/10 hover:border-red-500/40 text-zinc-400 hover:text-red-300 transition-colors cursor-pointer text-xs"
              >
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={handleSyncCloud}
              disabled={isRefreshing}
              title="Refresh from Supabase Cloud"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
            >
              <ArrowCounterClockwise size={15} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Sync Cloud</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close my passes"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {passes.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <Ticket size={48} className="mx-auto text-zinc-600 stroke-[1]" />
              <div className="space-y-1">
                <p className="text-xl font-bold text-white">No passes allocated yet</p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Reserve your admission for A Little Halloween Affair to generate your scannable entry QR pass.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onBookNewPass) onBookNewPass();
                }}
                className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider transition-transform active:scale-95 cursor-pointer shadow-xl"
              >
                <span>Book A Little Halloween Affair (₹1,500)</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Quick Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-left">
                <span className="text-zinc-300">
                  Present your scannable QR ticket at the gate for admission.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isDownloadingAll}
                    onClick={handleDownloadAllPdf}
                    className="py-1.5 px-3.5 rounded-full bg-white text-black font-semibold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                  >
                    <DownloadSimple size={14} weight="bold" />
                    <span>{isDownloadingAll ? 'Downloading…' : 'Save PDF All'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintAll}
                    className="py-1.5 px-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer size={15} />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Render Stubs */}
              <div className="space-y-4">
                {passes.map((pass, idx) => (
                  <TicketStub 
                    key={pass.id || idx}
                    pass={pass}
                    passNumber={idx + 1}
                    totalPasses={passes.length}
                  />
                ))}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#171624] border-t border-white/10 px-5 py-3 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
          <span>BookOurSpot Verified Credentials · bookourspot.com</span>
          <span className="text-zinc-400">Strictly Non-Transferable · 21+</span>
        </div>

      </div>
    </div>
  );
}
