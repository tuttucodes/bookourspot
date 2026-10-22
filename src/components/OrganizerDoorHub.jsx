import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  ShieldCheck, 
  DownloadSimple, 
  MagnifyingGlass, 
  CheckCircle, 
  ArrowClockwise,
  Check,
  CurrencyInr,
  Ticket,
  QrCode,
  ListDashes
} from '@phosphor-icons/react';
import { getStoredPasses, markPassAdmitted, exportGuestListCsv, refreshFromSupabase } from '../utils/passRegistry';
import OpticalGateScanner from './OpticalGateScanner';
import { playTap, playSuccessChime, playErrorBuzz } from '../utils/audioTheme';

export default function OrganizerDoorHub({ isOpen, onClose }) {
  const [passes, setPasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('SCANNER'); // 'SCANNER' | 'MANIFEST'
  const [lastScanResult, setLastScanResult] = useState(null);

  const refreshPasses = async () => {
    setIsRefreshing(true);
    setPasses(getStoredPasses());
    try {
      const cloudMerged = await refreshFromSupabase();
      if (cloudMerged) setPasses(cloudMerged);
    } catch {}
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (isOpen) {
      refreshPasses();
    }
    const handler = () => {
      setPasses(getStoredPasses());
    };
    window.addEventListener('pass_registry_updated', handler);
    return () => window.removeEventListener('pass_registry_updated', handler);
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredPasses = passes.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      (p.guestName && p.guestName.toLowerCase().includes(q)) ||
      (p.bookerName && p.bookerName.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q)) ||
      (p.guestPhone && p.guestPhone.includes(q)) ||
      (p.utr && p.utr.includes(q))
    );
  });

  const totalRevenue = passes.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  const admittedCount = passes.filter(p => p.status === 'ADMITTED').length;

  const handleToggleAdmit = (passId) => {
    playTap();
    const updated = markPassAdmitted(passId);
    setPasses(updated);
    playSuccessChime();
  };

  const handlePassDetected = (rawText) => {
    let targetId = (rawText || '').trim();
    try {
      const parsed = JSON.parse(rawText);
      if (parsed.passId) targetId = parsed.passId.trim();
      else if (parsed.id) targetId = parsed.id.trim();
    } catch {}

    const pass = passes.find(p => 
      p.id === targetId || 
      (p.utr && p.utr === targetId) || 
      (p.phone && p.phone === targetId) ||
      (p.guestPhone && p.guestPhone === targetId)
    );

    if (!pass) {
      playErrorBuzz();
      setLastScanResult({
        success: false,
        alreadyAdmitted: false,
        message: `Unrecognized QR: "${targetId.slice(0, 24)}". Pass not found in gate registry.`
      });
      return;
    }

    if (pass.status === 'ADMITTED') {
      playErrorBuzz();
      setLastScanResult({
        success: false,
        alreadyAdmitted: true,
        pass,
        message: `Pass ${pass.id} was ALREADY ADMITTED at the door.`
      });
      return;
    }

    // Admit guest!
    const updated = markPassAdmitted(pass.id);
    setPasses(updated);
    playSuccessChime();
    setLastScanResult({
      success: true,
      alreadyAdmitted: false,
      pass: { ...pass, status: 'ADMITTED' },
      message: `Admission Verified: ${pass.guestName} (${pass.tierName})`
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div 
        className="relative w-full max-w-4xl my-auto bg-[#100F18] border border-white/15 rounded-3xl shadow-2xl p-5 sm:p-7 text-[#F3EFE0] flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF521B] animate-pulse" />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  BookOurSpot Door Host Hub
                </h3>
                <span className="text-[10px] font-mono font-bold bg-[#FF521B]/15 text-[#FFA947] px-2.5 py-0.5 rounded-full border border-[#FF521B]/30 uppercase">
                  Gate Hosts Security
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time gate check-in, guest list manifest, and Supabase cloud audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshPasses}
              disabled={isRefreshing}
              aria-label="Refresh passes"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/10 flex items-center gap-1.5 text-xs"
            >
              <ArrowClockwise size={16} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close door host portal"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 shrink-0 font-mono text-xs">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-left">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-0.5">Total Passes Issued</span>
              <span className="text-xl sm:text-2xl font-bold text-white">{passes.length}</span>
            </div>
            <Ticket size={26} className="text-[#FFA947]" weight="bold" />
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-left">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-0.5">Admitted at Gate</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-400">{admittedCount} / {passes.length}</span>
            </div>
            <CheckCircle size={26} className="text-emerald-400" weight="bold" />
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-left">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-0.5">Direct Settlement</span>
              <span className="text-xl sm:text-2xl font-bold text-[#FFA947]">₹{totalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <CurrencyInr size={26} className="text-[#FFA947]" weight="bold" />
          </div>
        </div>

        {/* Gate Host View Selector: Optical Scanner vs Manifest List */}
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => {
              playTap();
              setActiveTab('SCANNER');
            }}
            className={`flex-1 py-2.5 px-4 rounded-2xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'SCANNER'
                ? 'bg-[#FF521B] text-black shadow-lg shadow-[#FF521B]/20 font-black'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
            }`}
          >
            <QrCode size={16} weight="bold" />
            <span>Optical Camera Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTap();
              setActiveTab('MANIFEST');
            }}
            className={`flex-1 py-2.5 px-4 rounded-2xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'MANIFEST'
                ? 'bg-white text-black shadow-lg font-black'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
            }`}
          >
            <ListDashes size={16} weight="bold" />
            <span>Guest Manifest ({passes.length})</span>
          </button>
        </div>

        {activeTab === 'SCANNER' ? (
          /* OPTICAL CAMERA QR SCANNER VIEW */
          <div className="flex-1 overflow-y-auto">
            <OpticalGateScanner 
              onPassDetected={handlePassDetected}
              lastScanResult={lastScanResult}
              passes={passes}
            />
          </div>
        ) : (
          /* GUEST MANIFEST TABLE VIEW */
          <>
            {/* Search & Export Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 shrink-0">
              <div className="relative flex-1">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  name="search_query"
                  id="search_query"
                  autoComplete="off"
                  spellCheck={false}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Guest Name, Phone, Pass ID or UTR…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-black/60 border border-white/15 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FF521B] font-mono transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={() => exportGuestListCsv(passes)}
                className="py-2.5 px-5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <DownloadSimple size={16} weight="bold" />
                <span>Export Gate Manifest (CSV)</span>
              </button>
            </div>

            {/* Scrollable Guest List Table */}
            <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/50 text-xs">
              {filteredPasses.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 font-mono space-y-2">
                  <Users size={32} className="mx-auto text-zinc-600" />
                  <p className="text-sm text-zinc-300 font-bold">No passes match your query.</p>
                  <p className="text-[11px] text-zinc-500">
                    {passes.length === 0 
                      ? 'No passes booked yet. Bookings via BookOurSpot will populate here instantly for the hosts.' 
                      : 'Try searching with another name or pass ID.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="sticky top-0 bg-[#161422] text-zinc-400 font-mono text-[10px] uppercase tracking-wider border-b border-white/10">
                      <tr>
                        <th className="p-3.5">Pass ID</th>
                        <th className="p-3.5">Guest & Phone</th>
                        <th className="p-3.5">Booker</th>
                        <th className="p-3.5">Tier</th>
                        <th className="p-3.5">Add-ons</th>
                        <th className="p-3.5">Bank UTR</th>
                        <th className="p-3.5 text-right">Gate Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                      {filteredPasses.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5 font-mono font-bold text-[#FFA947] whitespace-nowrap">
                            {p.id}
                          </td>
                          <td className="p-3.5 font-medium text-white">
                            <div>{p.guestName}</div>
                            {(p.guestPhone || p.phone) && (
                              <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{p.guestPhone || p.phone}</div>
                            )}
                            {p.instagram && (
                              <span className="block text-[10px] font-mono text-zinc-500">{p.instagram}</span>
                            )}
                          </td>
                          <td className="p-3.5 text-zinc-300">
                            <span className="block text-zinc-200">{p.bookerName}</span>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-zinc-300 whitespace-nowrap">
                            {p.tierName}
                          </td>
                          <td className="p-3.5 font-mono text-[10px] text-emerald-400 whitespace-nowrap">
                            {p.addons && p.addons.length > 0 ? p.addons.join(', ') : '—'}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                            {p.utr}
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleAdmit(p.id)}
                              className={`py-1.5 px-3.5 rounded-full font-mono text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                p.status === 'ADMITTED'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-white/10 text-zinc-200 border border-white/20 hover:bg-white hover:text-black'
                              }`}
                            >
                              {p.status === 'ADMITTED' ? (
                                <>
                                  <Check size={14} weight="bold" />
                                  <span>Admitted</span>
                                </>
                              ) : (
                                <span>Admit Guest</span>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
