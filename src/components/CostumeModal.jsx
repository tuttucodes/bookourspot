import React from 'react';
import { X, Sparkle } from '@phosphor-icons/react';

export default function CostumeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const styles = [
    {
      title: "Dangerous & Hot",
      desc: "Leather corsets, sheer overlays, blood-red velvet accents, sleek silhouettes, and sharp tailoring. Unapologetically bold.",
      tag: "High Seduction"
    },
    {
      title: "Dramatic Velvet",
      desc: "Deep plum, raven black capes, Victorian decadence, dripping baroque jewelry, lace chokers, and smoldering dark eyes.",
      tag: "Vampiric Royalty"
    },
    {
      title: "Classic Slasher Chic",
      desc: "Distressed silk, faux-leather trench coats, ghost-white masks, edgy distressed streetwear with an ominous cinematic twist.",
      tag: "Cinematic Thrill"
    },
    {
      title: "Dark Glamour",
      desc: "Glittering black sequins, metallic accents, theatrical feather boas, masquerade lace masks, and high-fashion midnight drama.",
      tag: "Midnight Euphoria"
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
                Costume Inspo Dossier
              </h3>
              <p className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                Dress Code: Spooky, Stylish & Slightly Scandalous
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close costume dossier modal"
            className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/10 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 p-3 bg-white/[0.02] border border-white/10 text-xs text-zinc-300 font-editorial-italic text-center">
          “come cute, creepy, dramatic or dangerously hot, just don’t be boring.”
        </div>

        <div className="mt-4 space-y-2.5 relative z-10">
          {styles.map((style) => (
            <div 
              key={style.title}
              className="p-3.5 bg-black/50 border border-white/10 hover:border-[#FF521B]/40 transition-all text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-editorial-italic text-lg text-white font-normal">{style.title}</span>
                <span className="text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 bg-white/5 text-[#FFA947] border border-white/10">
                  {style.tag}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">{style.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-white/10 text-center font-mono text-[11px] text-zinc-400">
          A midnight award will be presented to the evening's most daring costume.
        </div>
      </div>
    </div>
  );
}
