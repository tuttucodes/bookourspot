import React from 'react';
import { X, Lock, MapPin, ShieldCheck, WhatsappLogo, ArrowRight } from '@phosphor-icons/react';

export default function LocationModal({ isOpen, onClose }) {
  const whatsappUrl = "https://chat.whatsapp.com/GnMqQbcq6KA3nCDRzAzKp0?s=cl&p=i&mlu=4&ilr=4";

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div 
        className="relative w-full max-w-lg my-auto bg-[#0D0B10] border border-white/15 shadow-2xl p-5 sm:p-7 text-[#F3EFE0] overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-[#FF521B]" />
            <div>
              <h3 className="font-editorial-italic text-2xl text-white font-normal">
                Secret Location Protocol
              </h3>
              <p className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                Private House Party · Confidential
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close secret venue modal"
            className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/10 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 text-center space-y-4 relative z-10">
          <div className="w-14 h-14 bg-white/[0.03] border border-white/15 flex items-center justify-center mx-auto text-[#FFA947]">
            <Lock size={26} weight="duotone" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#FFA947] block">
              Encrypted Destination
            </span>
            <h4 className="font-editorial-italic text-2xl text-white">
              Revealed Exclusively To The Invited
            </h4>
            <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed font-sans">
              To keep the night intimate, secure, and wild, the exact address, landmark, and gate password are 
              broadcasted exclusively inside the private WhatsApp guest list exactly <span className="text-[#FFA947] font-semibold">3 hours before 7:00 PM</span> on Friday.
            </p>
          </div>

          <div className="p-3.5 bg-black/60 border border-white/10 text-left space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span>Sanctuary: Private Villa / Penthouse Residence</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span>Access: Google Maps pin & entry password sent via WhatsApp</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span>Door Hosts: Photo ID check against registered guest list</span>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 px-5 bg-[#25D366] hover:bg-[#20ba5a] text-[#070608] font-mono text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <WhatsappLogo size={18} weight="fill" />
            <span>Join WhatsApp for Secret Coordinates</span>
            <ArrowRight size={16} weight="bold" />
          </a>
        </div>
      </div>
    </div>
  );
}
