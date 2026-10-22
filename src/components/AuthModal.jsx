import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, 
  X, 
  CaretDown, 
  ForkKnife, 
  Ticket, 
  Moon, 
  ChatDots
} from '@phosphor-icons/react';
import { signInWithGoogle, consumeGoogleRedirect, signInWithEmail, sendOtpToPhone, verifyPhoneOtp } from '../utils/authService';
import { firebaseAuth } from '../utils/firebaseClient';
import { playTap, playSuccessChime } from '../utils/audioTheme';
import useModalAccessibility from '../hooks/useModalAccessibility';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialStep = 'PHONE' }) {
  const [step, setStep] = useState(initialStep); // PHONE | PHONE_REQUIRED | OTP | LINK_METHODS
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(29);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pinIndex, setPinIndex] = useState(0);
  const [authMethod, setAuthMethod] = useState('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [linkingPhone, setLinkingPhone] = useState(false);

  const otpInputsRef = useRef([]);
  const dialogRef = useRef(null);
  const redirectConsumeStarted = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep(initialStep);
    setErrorMsg('');
    if (sessionStorage.getItem('bos_google_redirect_pending') === '1' && !redirectConsumeStarted.current) {
      redirectConsumeStarted.current = true;
      setIsLoading(true);
      consumeGoogleRedirect().then((result) => {
        sessionStorage.removeItem('bos_google_redirect_pending');
        if (!result.success) { setErrorMsg(result.error); return; }
        if (result.user?.phoneVerified) { finishAuth(result.user); return; }
        if (result.user) { setLinkingPhone(true); setAuthMethod('phone'); setStep('PHONE_REQUIRED'); }
      }).finally(() => setIsLoading(false));
    }
  }, [isOpen, initialStep]);

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

  const closeAuth = () => {
    // A provider login is not app access until the account has a verified phone.
    if (linkingPhone) return;
    if (step === 'LINK_METHODS') {
      finishAuth();
      return;
    }
    onClose();
  };

  useModalAccessibility(isOpen, dialogRef, closeAuth, { escape: !isLoading });

  if (!isOpen) return null;

  const currentPin = pinSlides[pinIndex];

  const finishAuth = (user = firebaseAuth?.currentUser) => {
    const mappedUser = user ? {
      id: user.uid,
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || '',
      phone: user.phoneNumber || '',
      phoneVerified: Boolean(user.phoneNumber),
      photoURL: user.photoURL || '',
      emailVerified: user.emailVerified,
    } : null;
    if (!mappedUser?.phoneVerified) {
      setErrorMsg('Verify your mobile number before continuing.');
      return;
    }
    setLinkingPhone(false);
    onAuthSuccess?.(mappedUser);
    onClose();
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    playTap();
    const isExistingUnverifiedSession = Boolean(firebaseAuth?.currentUser && !firebaseAuth.currentUser.phoneNumber);
    setLinkingPhone(isExistingUnverifiedSession);
    setIsLoading(true);
    const result = await sendOtpToPhone(cleanPhone);
    setIsLoading(false);
    if (!result.success) {
      setErrorMsg(result.error || 'We could not send a code. Please try again.');
      return;
    }
    setStep('OTP');
    setOtpTimer(29);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    const result = await signInWithEmail(email, password, createAccount);
    setIsLoading(false);
    if (!result.success) {
      setErrorMsg(result.error);
      return;
    }
    if (!result.user?.phoneVerified) {
      setLinkingPhone(true);
      setStep('PHONE_REQUIRED');
      setAuthMethod('phone');
      setErrorMsg('Verify a mobile number to finish setting up your BookOutSpot account.');
      return;
    }
    playSuccessChime();
    finishAuth(result.user);
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
    setErrorMsg('Use the code sent to your phone.');
  };

  const verifyCode = async (code) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await verifyPhoneOtp(phone, code);
      if (res.success) {
        if (!res.user?.phoneVerified) {
          setErrorMsg('We could not confirm a verified mobile number. Please try again.');
          return;
        }
        playSuccessChime();
        if (linkingPhone) {
          finishAuth(res.user);
        } else {
          setCreateAccount(true);
          setStep('LINK_METHODS');
          setErrorMsg('');
        }
      } else {
        setErrorMsg(res.error || 'Invalid verification code. Please try again.');
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
    if (window.location.hostname !== 'admin.bookourspot.com') sessionStorage.setItem('bos_google_redirect_pending', '1');
    const res = await signInWithGoogle();
    if (res.success && res.redirecting) return;
    sessionStorage.removeItem('bos_google_redirect_pending');
    setIsLoading(false);
    if (res.success && res.user?.phoneVerified) { playSuccessChime(); finishAuth(res.user); return; }
    if (res.success && res.user) {
      setLinkingPhone(true);
      setAuthMethod('phone');
      setStep('PHONE_REQUIRED');
      setErrorMsg('');
      return;
    }
    setErrorMsg(res.error || 'Google sign-in is unavailable right now.');
  };

  return createPortal(
    <div className="bos-overlay bos-auth-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && step !== 'OTP' && step !== 'PHONE_REQUIRED') closeAuth(); }}>
      <div ref={dialogRef} tabIndex={-1} className="bos-sheet bos-auth-sheet" role="dialog" aria-modal="true" aria-labelledby="bos-auth-title">
        <div id="firebase-recaptcha-container" className="absolute bottom-4 right-4 h-0 w-0 overflow-hidden" />
        
        {step !== 'OTP' ? (
          <>
            {/* TOP BAR: Logo & Skip Button (1:1 with IMG_4088.PNG & IMG_4089.PNG) */}
            <div className="px-5 pt-4 pb-1 flex items-center justify-between z-10">
              <div className="text-left">
                <span className="font-black text-sm tracking-widest text-white uppercase font-mono">
                  BookOutSpot
                </span>
              </div>
      {!linkingPhone && <button
                type="button"
                onClick={() => step === 'LINK_METHODS' ? finishAuth() : closeAuth()}
                className="py-1 px-3.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
              >
                {step === 'LINK_METHODS' ? 'Continue' : 'Skip'}
              </button>}
            </div>

            {/* HERO VISUAL: 3D Glowing Location Pin Carousel (1:1 with IMG_4088.PNG & IMG_4089.PNG) */}
            <div className={`relative w-full flex flex-col items-center justify-center overflow-hidden transition-[height] duration-300 ${step === 'PHONE' ? 'h-36 sm:h-40' : 'h-24'}`}>
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

            {step === 'LINK_METHODS' ? (
            <div className="p-6 bg-[#0E0D14] border-t border-white/10 rounded-t-[32px] space-y-4 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-emerald-400/15 text-emerald-300 text-xl">✓</div>
              <h2 id="bos-auth-title" className="text-2xl font-black text-white tracking-tight">Mobile verified</h2>
              <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-400">Your account is ready. Link Google or email for another sign-in, or continue with your phone.</p>
              <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full h-12 rounded-2xl bg-white hover:bg-zinc-100 text-black font-bold text-xs uppercase tracking-wider disabled:opacity-50">{isLoading ? 'Linking Google…' : 'Link Google account'}</button>
              <form onSubmit={handleEmailSubmit} className="space-y-3 text-left">
                <label className="sr-only" htmlFor="bos-auth-email">Email address</label>
                <input id="bos-auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full h-12 bg-[#1A1824] border border-white/15 rounded-2xl px-4 text-sm text-white placeholder-zinc-500 focus:border-white/40 outline-none" />
                <label className="sr-only" htmlFor="bos-auth-password">Password</label>
                <input id="bos-auth-password" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password (6+ characters)" className="w-full h-12 bg-[#1A1824] border border-white/15 rounded-2xl px-4 text-sm text-white placeholder-zinc-500 focus:border-white/40 outline-none" />
                <button type="submit" disabled={isLoading} className="w-full h-12 rounded-2xl bg-[#2D2A3E] hover:bg-[#3D3954] disabled:opacity-40 text-white font-bold text-sm">{isLoading ? 'Linking email…' : 'Link email and password'}</button>
              </form>
              {errorMsg && <p role="alert" className="text-left text-xs text-rose-300">{errorMsg}</p>}
              <button type="button" onClick={() => finishAuth()} className="w-full text-xs text-zinc-300 underline">Continue with phone only</button>
            </div>
            ) : (
            <div className="p-6 bg-[#0E0D14] border-t border-white/10 rounded-t-[32px] space-y-4 text-center">
              
              <h2 id="bos-auth-title" className="text-2xl font-black text-white tracking-tight leading-tight">
                {step === 'PHONE_REQUIRED' ? <>Verify your number<br />to finish signing in</> : <>Find your kind<br />of out.</>}
              </h2>
              {step === 'PHONE_REQUIRED' ? <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-400">One quick code keeps your bookings and guest passes tied to you.</p> : <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-400">Sign in to book. Browse freely anytime.</p>}

              {/* LOG IN OR SIGN UP DIVIDER */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/15" />
                <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                  {step === 'PHONE_REQUIRED' ? 'SECURE YOUR ACCOUNT' : 'A FEW SECONDS TO GET STARTED'}
                </span>
                <div className="flex-1 h-px bg-white/15" />
              </div>

              {authMethod === 'phone' ? <form onSubmit={handlePhoneSubmit} className="space-y-3">
                <div className="flex gap-2">
                  {/* Country Flag & Code Box */}
                  <div className="h-13 px-3.5 rounded-2xl bg-[#1A1824] border border-white/15 flex items-center gap-1.5 text-white text-sm font-semibold shrink-0" aria-label="Country code India, plus 91">
                    <span className="text-base select-none">🇮🇳</span>
                    <span>+91</span>
                  </div>

                  {/* Phone Input Box */}
                  <input
                    type="tel"
                    aria-label="Mobile number with country code +91"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter mobile number"
                    className="flex-1 h-13 bg-[#1A1824] border border-white/15 rounded-2xl px-4 text-sm sm:text-base text-white placeholder-zinc-500 font-mono tracking-wide focus:border-white/40 outline-none transition-colors"
                  />
                </div>

                {/* Continue Button (IMG_4088.PNG) */}
                <button
                  type="submit"
                  disabled={isLoading || phone.length < 10}
                  className="w-full h-12 rounded-2xl bg-[#2D2A3E] hover:bg-[#3D3954] disabled:opacity-40 text-white font-bold text-sm tracking-wide transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-lg"
                >
                  {isLoading ? 'Sending code…' : step === 'PHONE_REQUIRED' ? 'Send verification code' : 'Continue with phone'}
                </button>
              </form> : <form onSubmit={handleEmailSubmit} className="space-y-3 text-left">
                <label className="sr-only" htmlFor="bos-auth-email">Email address</label><input id="bos-auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full h-12 bg-[#1A1824] border border-white/15 rounded-2xl px-4 text-sm text-white placeholder-zinc-500 focus:border-white/40 outline-none" />
                <label className="sr-only" htmlFor="bos-auth-password">Password</label><input id="bos-auth-password" type="password" required minLength={6} autoComplete={createAccount ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ characters)" className="w-full h-12 bg-[#1A1824] border border-white/15 rounded-2xl px-4 text-sm text-white placeholder-zinc-500 focus:border-white/40 outline-none" />
                <button type="submit" disabled={isLoading} className="w-full h-12 rounded-2xl bg-[#2D2A3E] hover:bg-[#3D3954] disabled:opacity-40 text-white font-bold text-sm transition-all">{isLoading ? 'Please wait…' : 'Sign in with email'}</button>
                <button type="button" onClick={() => { setAuthMethod('phone'); setErrorMsg(''); }} className="w-full text-sm text-zinc-300 hover:text-white">Use your mobile number</button>
              </form>}

              {step !== 'PHONE_REQUIRED' && authMethod === 'phone' && <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                  OR
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>}

              {/* SOCIAL BUTTONS */}
              {step !== 'PHONE_REQUIRED' && authMethod === 'phone' && <div className="space-y-2.5">
                
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

                {errorMsg && <p role="alert" className="text-left text-xs text-rose-300">{errorMsg}</p>}
              </div>}

              {step !== 'PHONE_REQUIRED' && authMethod === 'phone' && <button type="button" onClick={() => { setAuthMethod('email'); setCreateAccount(false); setErrorMsg(''); }} className="w-full py-1 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                Already have an account? <span className="text-violet-200 underline underline-offset-4">Sign in with email</span>
              </button>}
              <p className="text-[11px] text-zinc-500 pt-1 leading-relaxed font-sans">
                {step === 'PHONE_REQUIRED' ? 'Phone verification is required before you can use your account or make a booking.' : <>By continuing, you agree to our <a className="text-violet-200 underline underline-offset-2" href="/terms" target="_blank" rel="noreferrer">Terms</a> and <a className="text-violet-200 underline underline-offset-2" href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>. Browsing does not require an account.</>}
              </p>
            </div>
            )}
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
              <h2 id="bos-auth-title" className="text-lg font-bold text-white">
                OTP Verification
              </h2>
            </div>

            {/* Instruction text */}
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-zinc-300">
                {linkingPhone ? 'Verify and link this mobile number to your account' : 'We have sent a verification code to'}
              </p>
              <p className="text-base font-bold text-white font-mono">
                {phone ? `+91 ${phone}` : ''}
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
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  aria-label={`Verification code digit ${index + 1} of 6`}
                  maxLength={1}
                  value={digit}
                  autoFocus={index === 0}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-14 sm:w-12 sm:h-16 rounded-2xl bg-[#171622] border border-white/20 text-center font-mono text-xl sm:text-2xl font-bold text-white focus:border-[#FFA947] focus:bg-[#201E2E] outline-none transition-all shadow-md"
                />
              ))}
            </div>

            {errorMsg && <p role="alert" className="text-xs text-rose-300">{errorMsg}</p>}

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
                  onClick={async () => {
                    setErrorMsg('');
                    const result = await sendOtpToPhone(phone);
                    if (result.success) setOtpTimer(29);
                    else setErrorMsg(result.error);
                  }}
                  className="py-1.5 px-3.5 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-30 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ChatDots size={14} />
                  <span>SMS</span>
                </button>

              </div>
            </div>

            {/* Back to login link (IMG_4090.PNG) */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { if (!linkingPhone) setStep('PHONE'); }}
                disabled={linkingPhone}
                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
              >
                {linkingPhone ? 'Phone verification is required to continue' : 'Back to login'}
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
  , document.body);
}
