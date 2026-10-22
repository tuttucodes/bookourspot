import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  X, 
  CaretDown, 
  ForkKnife, 
  Ticket, 
  Moon, 
  ChatDots, 
  WhatsappLogo,
  CheckCircle,
  WarningCircle
} from '@phosphor-icons/react';
import { signInWithGoogle, sendOtpToPhone, verifyPhoneOtp, quickLoginDemo } from '../utils/authService';
import { playTap, playSuccessChime } from '../utils/audioTheme';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [step, setStep] = useState('PHONE'); // 'PHONE' | 'OTP'
  const [phone, setPhone] = useState('9074417293');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(29);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pinIndex, setPinIndex] = useState(0);

  const otpInputsRef = useRef([]);

  // Rotating pin graphic slides (matching IMG_4088.PNG & IMG_4089.PNG)
  const pinSlides = [
    {
      id: 'dining',
      label: 'Dining',
      color: 'from-fuchsia-600 to-purple-800',
      glow: 'rgba(217, 70, 239, 0.45)',
      icon: <ForkKnife size={28} weight="fill" className="text-white drop-shadow" />
    },
    {
      id: 'events',
      label: 'Events',
      color: 'from-violet-600 to-indigo-900',
      glow: 'rgba(139, 92, 246, 0.45)',
      icon: <Ticket size={28} weight="fill" className="text-white drop-shadow" />
    },
    {
      id: 'nightlife',
      label: 'Nightlife',
      color: 'from-amber-500 to-rose-700',
      glow: 'rgba(245, 158, 11, 0.45)',
      icon: <Moon size={28} weight="fill" className="text-white drop-shadow" />
    }
  ];

  // Rotate pin illustration every 3.5s
  useEffect(() => {
    if (!isOpen || step !== 'PHONE') return;
    const interval = setInterval(() => {
      setPinIndex(prev => (prev + 1) % pinSlides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isOpen, step, pinSlides.length]);

  // OTP Countdown timer (matches "Request again in 0:29s" in IMG_4090.PNG)
  useEffect(() => {
    if (step !== 'OTP' || otpTimer <= 0) return;
    const timer = setInterval(() => {
      setOtpTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, otpTimer]);

  if (!isOpen) return null;

  const currentPin = pinSlides[pinIndex];

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    playTap();
    setIsLoading(true);
    await sendOtpToPhone(cleanPhone);
    setIsLoading(false);
    setStep('OTP');
    setOtpTimer(29);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      if (pasted.length === 6) {
        verifyCode(newDigits.join(''));
      }
      return;
    }

    const clean = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    // Auto advance to next input
    if (clean && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleAutofillChip = () => {
    playTap();
    const demoCode = ['4', '0', '4', '6', '8', '0'];
    setOtpDigits(demoCode);
    verifyCode('404680');
  };

  const verifyCode = async (code) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await verifyPhoneOtp(phone, code);
      if (res.success) {
        playSuccessChime();
        if (onAuthSuccess) onAuthSuccess(res.user);
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setErrorMsg('Invalid verification code. Please try again.');
      }
    } catch {
      setErrorMsg('Verification failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    playTap();
    setIsLoading(true);
    const res = await signInWithGoogle();
    setIsLoading(false);
    if (res.success) {
      playSuccessChime();
      if (onAuthSuccess) onAuthSuccess(res.user);
      onClose();
    }
  };

  const handleQuickDemoUser = () => {
    playTap();
    const user = quickLoginDemo('Rahul Babu K', 'rahulbabuk05@gmail.com', '+91 9074417293');
    playSuccessChime();
    if (onAuthSuccess) onAuthSuccess(user);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="relative w-full max-w-md bg-[#0D0C13] border-t sm:border border-white/15 rounded-t-[36px] sm:rounded-3xl shadow-2xl text-[#F3EFE0] overflow-hidden flex flex-col font-sans">
        
        {step === 'PHONE' ? (
          <>
            {/* TOP BAR: Logo & Skip Button (1:1 with IMG_4088.PNG & IMG_4089.PNG) */}
            <div className="px-5 pt-4 pb-1 flex items-center justify-between z-10">
              <div className="text-left">
                <span className="font-black text-sm tracking-widest text-white uppercase font-mono">
                  BookOurSpot
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="py-1 px-3.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
              >
                Skip
              </button>
            </div>

            {/* HERO VISUAL: 3D Glowing Location Pin Carousel (1:1 with IMG_4088.PNG & IMG_4089.PNG) */}
            <div className="relative h-48 w-full flex flex-col items-center justify-center overflow-hidden">
              {/* Radial backdrop glow */}
              <div 
                className="absolute w-44 h-44 rounded-full blur-3xl transition-all duration-700 opacity-60"
                style={{ backgroundColor: currentPin.glow }}
              />

              {/* Glowing pins cluster */}
              <div className="relative flex items-center justify-center gap-6">
                {/* Left Mini Pin */}
                <div className="w-9 h-12 rounded-full bg-blue-600/60 blur-[1px] -rotate-12 scale-75 opacity-70 flex items-center justify-center" />

                {/* Center Main Pin */}
                <div className="relative group cursor-pointer transition-transform duration-500 scale-105">
                  <div className={`w-20 h-28 rounded-t-full rounded-b-[40px] bg-gradient-to-b ${currentPin.color} shadow-2xl flex flex-col items-center justify-center p-2 border border-white/20`}>
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                      {currentPin.icon}
                    </div>
                  </div>
                  {/* Pin shadow base */}
                  <div className="w-14 h-3 bg-black/60 rounded-full blur-sm mx-auto -mt-1" />
                </div>

                {/* Right Mini Pin */}
                <div className="w-9 h-12 rounded-full bg-amber-600/60 blur-[1px] rotate-12 scale-75 opacity-70 flex items-center justify-center" />
              </div>

              {/* Pin Category Label Pill */}
              <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-white tracking-wider">
                <span className="text-[#FFA947]">✦</span>
                <span>{currentPin.label}</span>
                <span className="text-[#FFA947]">✦</span>
              </div>
            </div>

            {/* BOTTOM SECTION: Phone input and Social sign-in (1:1 with IMG_4088.PNG) */}
            <div className="p-6 bg-[#0E0D14] border-t border-white/10 rounded-t-[32px] space-y-4 text-center">
              
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                For all your going<br />out plans
              </h2>

              {/* LOG IN OR SIGN UP DIVIDER */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/15" />
                <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                  LOG IN OR SIGN UP
                </span>
                <div className="flex-1 h-px bg-white/15" />
              </div>

              {/* Mobile Phone Input Form (IMG_4088.PNG) */}
              <form onSubmit={handlePhoneSubmit} className="space-y-3">
                <div className="flex gap-2">
                  {/* Country Flag & Code Box */}
                  <div className="h-13 px-3.5 rounded-2xl bg-[#1A1824] border border-white/15 flex items-center gap-1.5 text-white text-sm font-semibold shrink-0 cursor-pointer">
                    <span className="text-base select-none">🇮🇳</span>
                    <span>+91</span>
                    <CaretDown size={14} weight="bold" className="text-zinc-400" />
                  </div>

                  {/* Phone Input Box */}
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter mobile number"
                    className="flex-1 h-13 bg-[#1A1824] border border-white/15 rounded-2xl px-4 text-sm sm:text-base text-white placeholder-zinc-500 font-mono tracking-wide focus:border-white/40 outline-none transition-colors"
                  />
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center justify-center gap-1.5">
                    <WarningCircle size={15} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Continue Button (IMG_4088.PNG) */}
                <button
                  type="submit"
                  disabled={isLoading || phone.length < 10}
                  className="w-full h-12 rounded-2xl bg-[#2D2A3E] hover:bg-[#3D3954] disabled:opacity-40 text-white font-bold text-sm tracking-wide transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-lg"
                >
                  {isLoading ? 'Sending Code…' : 'Continue'}
                </button>
              </form>

              {/* OR DIVIDER */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                  OR
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* SOCIAL BUTTONS */}
              <div className="space-y-2.5">
                
                {/* 1. Continue with Google */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl bg-white hover:bg-zinc-100 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  {/* Google Multicolor SVG Logo */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* 2. Quick Demo Profile Card (1:1 with IMG_4088.PNG user banner) */}
                <button
                  type="button"
                  onClick={handleQuickDemoUser}
                  className="w-full p-3 rounded-2xl bg-[#1C1A28] hover:bg-[#252236] border border-white/10 flex items-center gap-3 text-left transition-all active:scale-95 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF521B] to-[#E23744] flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
                    R
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-zinc-400 block font-mono">
                      Quick Demo Profile
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white truncate block">
                      Rahul Babu K
                    </span>
                  </div>
                  <span className="text-[10px] text-[#FFA947] font-mono font-semibold uppercase tracking-wider group-hover:underline">
                    Login →
                  </span>
                </button>
              </div>

              {/* Legal Footer (IMG_4088.PNG) */}
              <p className="text-[11px] text-zinc-500 pt-2 leading-relaxed font-sans">
                By continuing, you agree to our{' '}
                <span className="underline cursor-pointer text-zinc-400">Terms of Service</span>
                {' · '}
                <span className="underline cursor-pointer text-zinc-400">Privacy Policy</span>
              </p>
            </div>
          </>
        ) : (
          /* STEP 2: OTP VERIFICATION (1:1 with IMG_4090.PNG) */
          <div className="p-5 sm:p-6 space-y-6 text-left">
            
            {/* Top Bar with Back Arrow */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              >
                <ArrowLeft size={18} weight="bold" />
              </button>
              <h2 className="text-lg font-bold text-white">
                OTP Verification
              </h2>
            </div>

            {/* Instruction text (IMG_4090.PNG) */}
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-zinc-300">
                We have sent a verification code to
              </p>
              <p className="text-base font-bold text-white font-mono">
                +91 {phone}
              </p>
            </div>

            {/* 6 Digit Input Boxes (IMG_4090.PNG) */}
            <div className="flex gap-2 sm:gap-2.5 justify-between">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={el => otpInputsRef.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  autoFocus={index === 0}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-14 sm:w-12 sm:h-16 rounded-2xl bg-[#171622] border border-white/20 text-center font-mono text-xl sm:text-2xl font-bold text-white focus:border-[#FFA947] focus:bg-[#201E2E] outline-none transition-all shadow-md"
                />
              ))}
            </div>

            {/* Simulated iOS Message Bar Autofill Chip (IMG_4090.PNG) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleAutofillChip}
                className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-between text-xs text-zinc-300 cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-mono">From Messages:</span>
                  <span className="font-mono font-bold text-emerald-400 tracking-wider">404680</span>
                </div>
                <span className="text-[10px] text-[#FFA947] font-semibold uppercase tracking-wider">
                  Tap to Auto-fill
                </span>
              </button>
            </div>

            {/* Resend & Timer Row (IMG_4090.PNG) */}
            <div className="space-y-3 pt-1">
              <p className="text-xs text-zinc-400">
                Didn't get the OTP?{' '}
                <span className="text-zinc-500 font-mono">
                  (Request again in 0:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}s)
                </span>
              </p>

              {/* Resend channel pills */}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={otpTimer > 0}
                  onClick={() => {
                    setOtpTimer(29);
                    sendOtpToPhone(phone);
                  }}
                  className="py-1.5 px-3.5 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-30 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ChatDots size={14} />
                  <span>SMS</span>
                </button>

                <button
                  type="button"
                  disabled={otpTimer > 0}
                  onClick={() => {
                    setOtpTimer(29);
                    sendOtpToPhone(phone);
                  }}
                  className="py-1.5 px-3.5 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-30 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <WhatsappLogo size={14} className="text-emerald-400" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Back to login link (IMG_4090.PNG) */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Back to login
              </button>
            </div>

            {/* Continue Button (IMG_4090.PNG) */}
            <button
              type="button"
              disabled={isLoading || otpDigits.join('').length !== 6}
              onClick={() => verifyCode(otpDigits.join(''))}
              className="w-full h-12 rounded-2xl bg-[#2D2A3E] hover:bg-[#3D3954] disabled:opacity-40 text-white font-bold text-sm tracking-wide transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-lg"
            >
              {isLoading ? 'Verifying…' : 'Continue'}
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
