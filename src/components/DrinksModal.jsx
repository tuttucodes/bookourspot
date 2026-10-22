import React from 'react';
import { X, Martini } from '@phosphor-icons/react';

export default function DrinksModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const drinks = [
    {
      name: "The Midnight Velvet",
      tag: "Signature Pour",
      notes: "Dark spiced rum, blackberry reduction, smoked rosemary smoke, velvet lime & black cherry bitters.",
      vibe: "Dangerous & deep"
    },
    {
      name: "Blood Amber Sour",
      tag: "House Standard",
      notes: "Oak-aged bourbon, blood orange cordial, spiced falernum, silky foam & edible embers.",
      vibe: "Smoldering elegance"
    },
    {
      name: "Phantom Mist Spritz",
      tag: "Luminescence",
      notes: "Dry botanical gin, butterfly pea flower extract, elderflower tonic, citrus atomiser & sparkling prosecco.",
      vibe: "Hypnotic & botanical"
    },
    {
      name: "Sanctuary Punch & Late Shots",
      tag: "Midnight Ritual",
      notes: "Continuous house punch bowl and midnight layered shots for parlour games.",
      vibe: "Next-morning memories"
    }
  ];

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
                Wicked Libations
              </h3>
              <p className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                Craft Cocktail Bar Dossier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drinks menu modal"
            className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/10 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 p-3 bg-white/[0.02] border border-white/10 text-xs text-zinc-300 font-mono">
          All cocktails, infusions, and house pours are fully covered under your admission pass throughout the night.
        </div>

        <div className="mt-4 space-y-2.5 relative z-10">
          {drinks.map((drink) => (
            <div 
              key={drink.name}
              className="p-3.5 bg-black/50 border border-white/10 hover:border-[#FF521B]/40 transition-all text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-editorial-italic text-lg text-white font-normal">{drink.name}</span>
                <span className="text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 bg-white/5 text-[#FFA947] border border-white/10">
                  {drink.tag}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-1">{drink.notes}</p>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Aesthetic: {drink.vibe}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
