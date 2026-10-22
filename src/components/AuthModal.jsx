import React, { useState } from 'react';
import { X, LockSimple, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { signInUser, signUpUser } from '../utils/authService';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('SIGNIN'); // 'SIGNIN' | 'SIGNUP'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'SIGNIN') {
        const result = await signInUser(email.trim(), password);
        if (result.success) {
          setSuccessMsg('Signed in successfully');
          setTimeout(() => {
            if (onAuthSuccess) onAuthSuccess(result.user);
            onClose();
          }, 600);
        } else {
          setErrorMsg(result.error?.message || 'Invalid email or password');
        }
      } else {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name');
          setIsLoading(false);
          return;
        }
        const result = await signUpUser(name.trim(), email.trim(), password, phone.trim());
        if (result.success) {
          setSuccessMsg('Account created successfully');
          setTimeout(() => {
            if (onAuthSuccess) onAuthSuccess(result.user);
            onClose();
          }, 600);
        } else {
          setErrorMsg(result.error?.message || 'Failed to create account');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="relative w-full max-w-md bg-[#100F17] border border-white/15 rounded-3xl shadow-2xl text-[#F3EFE0] overflow-hidden my-auto">
        
        {/* Top Header */}
        <div className="bg-[#171622] border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#431CB8] flex items-center justify-center font-bold text-white text-xs">
              B
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {mode === 'SIGNIN' ? 'Sign In to BookOurSpot' : 'Create BookOurSpot Account'}
              </h3>
              <p className="text-[10px] text-zinc-400">
                Connected to Supabase Cloud Auth
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close auth dialog"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 border-b border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('SIGNIN'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-3 text-center uppercase tracking-wider transition-colors cursor-pointer ${
              mode === 'SIGNIN'
                ? 'bg-white/10 text-white font-bold border-b-2 border-[#FF521B]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('SIGNUP'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-3 text-center uppercase tracking-wider transition-colors cursor-pointer ${
              mode === 'SIGNUP'
                ? 'bg-white/10 text-white font-bold border-b-2 border-[#FF521B]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-left">
          {mode === 'SIGNUP' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Sharma"
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF521B] outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF521B] outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF521B] outline-none"
            />
          </div>

          {mode === 'SIGNUP' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                WhatsApp Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF521B] outline-none"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-start gap-2">
              <WarningCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-extrabold text-xs uppercase tracking-wider transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isLoading ? 'Processing…' : (mode === 'SIGNIN' ? 'Sign In →' : 'Create Account →')}</span>
          </button>
        </form>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#171622] border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <LockSimple size={13} className="text-emerald-400" />
            Supabase Auth Cloud
          </span>
          <span>BookOurSpot · bookourspot.com</span>
        </div>

      </div>
    </div>
  );
}
