import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  CameraRotate, 
  WarningCircle, 
  CheckCircle, 
  XCircle,
  Lightning,
  ShieldCheck,
  Martini
} from '@phosphor-icons/react';
import { playTap, triggerHaptic } from '../utils/audioTheme';

export default function OpticalGateScanner({ onPassDetected, lastScanResult, passes = [] }) {
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) | 'user' (front)
  const [cameraError, setCameraError] = useState(null);
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const [simulatedPassId, setSimulatedPassId] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    const scannerId = 'gate-camera-viewport';
    let html5QrCode = null;

    async function startScanner() {
      try {
        setCameraError(null);
        html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode },
          config,
          (decodedText) => {
            // Success handler
            if (onPassDetected) {
              onPassDetected(decodedText);
            }
          },
          () => {
            // Per-frame non-detection - silent
          }
        );

        setIsScannerRunning(true);
      } catch (err) {
        console.warn('Camera initialization notice:', err);
        setCameraError(err.message || 'Unable to access camera. Please allow camera permissions or use Manual Test Scan below.');
        setIsScannerRunning(false);
      }
    }

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(() => {});
      }
    };
  }, [facingMode]);

  const handleToggleFacingMode = () => {
    playTap();
    triggerHaptic('tap');
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
      }).catch(() => {
        setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
      });
    } else {
      setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
    }
  };

  const handleRunSimulation = (e) => {
    e.preventDefault();
    if (!simulatedPassId) return;
    playTap();
    onPassDetected(simulatedPassId);
  };

  return (
    <div className="space-y-4">
      {/* Viewfinder Card */}
      <div className="relative w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden bg-black border-2 border-white/20 shadow-2xl flex flex-col items-center justify-center">
        
        {/* Camera Element */}
        <div id="gate-camera-viewport" className="w-full h-full object-cover"></div>

        {/* Optical Reticle & Laser overlay (only when running) */}
        {isScannerRunning && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
            {/* Target Reticle Corners */}
            <div className="relative w-64 h-64 border-2 border-white/20 rounded-2xl flex items-center justify-center overflow-hidden">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#FF521B]" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#FF521B]" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#FF521B]" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#FF521B]" />

              {/* Laser Sweep Line */}
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF521B] to-transparent shadow-[0_0_12px_#FF521B] animate-[bounce_2s_infinite]" />
            </div>

            <span className="mt-4 font-mono text-[10px] uppercase tracking-widest text-[#FFA947] bg-black/80 px-3 py-1 rounded-full border border-white/10">
              Align Pass QR Code
            </span>
          </div>
        )}

        {/* Camera Permission / Error Fallback */}
        {cameraError && (
          <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <Camera size={36} className="text-zinc-500" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Camera Standby / Permission Needed
              </h4>
              <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                Allow browser camera permissions to enable optical hardware scanning, or test below using instant simulation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                playTap();
                setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
              }}
              className="py-1.5 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CameraRotate size={14} />
              <span>Retry / Flip Camera</span>
            </button>
          </div>
        )}

        {/* Top Floating Controls */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          <button
            type="button"
            onClick={handleToggleFacingMode}
            title="Switch Rear/Front Camera"
            className="p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 shadow-lg cursor-pointer transition-transform active:scale-95"
          >
            <CameraRotate size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* SCAN RESULT BANNER (Instant Gate Verification Card) */}
      {lastScanResult && (
        <div 
          className={`w-full max-w-md mx-auto p-4 rounded-2xl border text-left shadow-2xl animate-in zoom-in-95 duration-200 ${
            lastScanResult.success
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : lastScanResult.alreadyAdmitted
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : 'bg-red-950/40 border-red-500/50 text-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {lastScanResult.success && <CheckCircle size={22} weight="fill" className="text-emerald-400" />}
              {lastScanResult.alreadyAdmitted && <WarningCircle size={22} weight="fill" className="text-amber-400" />}
              {!lastScanResult.success && !lastScanResult.alreadyAdmitted && <XCircle size={22} weight="fill" className="text-red-400" />}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                  {lastScanResult.success 
                    ? 'ADMISSION VERIFIED · ACCESS GRANTED' 
                    : lastScanResult.alreadyAdmitted 
                    ? 'ALREADY ADMITTED' 
                    : 'SCAN REJECTED'}
                </span>
                {lastScanResult.pass && (
                  <span className="font-mono text-[10px] bg-white/10 px-2 py-0.5 rounded-full">
                    {lastScanResult.pass.id}
                  </span>
                )}
              </div>

              {lastScanResult.pass ? (
                <div className="space-y-0.5 pt-1">
                  <div className="text-sm sm:text-base font-bold text-white tracking-wide">
                    {lastScanResult.pass.guestName}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                    <span>{lastScanResult.pass.tierName}</span>
                    <span>·</span>
                    <span className="text-zinc-400">{lastScanResult.pass.phone || lastScanResult.pass.guestPhone}</span>
                  </div>
                  {lastScanResult.pass.addons && lastScanResult.pass.addons.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300 pt-1">
                      <Martini size={13} weight="fill" />
                      <span>{lastScanResult.pass.addons.join(', ')}</span>
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-zinc-400 pt-1">
                    Bank UTR: {lastScanResult.pass.utr} · Chennai Geofence Confirmed
                  </div>
                </div>
              ) : (
                <p className="text-xs">{lastScanResult.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK SIMULATION TOOLBAR (For Host testing on laptops/desktops without back cameras) */}
      <div className="w-full max-w-md mx-auto p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightning size={14} className="text-[#FFA947]" weight="fill" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Host Manual Optical Test
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            {passes.length} passes available
          </span>
        </div>

        <form onSubmit={handleRunSimulation} className="flex items-center gap-2">
          <select
            value={simulatedPassId}
            onChange={(e) => setSimulatedPassId(e.target.value)}
            className="flex-1 bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#FF521B]"
          >
            <option value="">Select a booked pass to simulate gate scan…</option>
            {passes.map(p => (
              <option key={p.id} value={p.id}>
                {p.guestName} · {p.id} ({p.status === 'ADMITTED' ? 'Already Admitted' : 'Ready'})
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!simulatedPassId}
            className="py-2 px-4 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-mono text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            Scan Pass
          </button>
        </form>
      </div>
    </div>
  );
}
