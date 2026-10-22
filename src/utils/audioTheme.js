/**
 * Web Audio API & Haptics Theme for BookOurSpot
 * Generates ultra-crisp, luxury tactile feedback without external asset dependencies.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Trigger mobile device vibration haptics
 */
export function triggerHaptic(type = 'tap') {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  try {
    switch (type) {
      case 'tap':
        navigator.vibrate(12);
        break;
      case 'success':
        navigator.vibrate([25, 40, 45]);
        break;
      case 'admit':
        navigator.vibrate([40, 60, 60, 40, 70]);
        break;
      case 'error':
        navigator.vibrate([80, 50, 80]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {}
}

/**
 * Subtle tactile tap (button clicks, step changes)
 */
export function playTap() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {}
}

/**
 * Sleek ascending tone (ticket added, upsell added)
 */
export function playPassAdded() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.06); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
    triggerHaptic('tap');
  } catch {}
}

/**
 * Resonant luxury chord (Gate Admission / Ticket Issued)
 */
export function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    // Harmonic frequencies for rich ambient chime: F#4, A#4, C#5, F#5
    const freqs = [369.99, 466.16, 554.37, 739.99];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.05, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6 + idx * 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.03);
      osc.stop(now + 0.65 + idx * 0.05);
    });

    triggerHaptic('admit');
  } catch {}
}

/**
 * Rejection / Warning buzzer (Duplicate or invalid pass)
 */
export function playErrorBuzz() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(110, now + 0.09);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
    triggerHaptic('error');
  } catch {}
}
