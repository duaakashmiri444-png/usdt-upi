import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Phone, User, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register, switchUser, users } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState<string>('+923123456789');
  const [countryCode, setCountryCode] = useState<string>('+92');
  const [phoneBody, setPhoneBody] = useState<string>('3123456789');
  const [password, setPassword] = useState<string>('password123');
  const [name, setName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const fullPhone = `${countryCode}${phoneBody.replace(/\D/g, '')}`;

    if (mode === 'login') {
      const res = await login(fullPhone, password);
      setIsLoading(false);
      if (res.success) {
        setIsAuthModalOpen(false);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } else {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        setIsLoading(false);
        return;
      }
      const res = await register(name, fullPhone, password);
      setIsLoading(false);
      if (res.success) {
        setIsAuthModalOpen(false);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    }
  };

  const handleDemoLogin = (userId: string) => {
    switchUser(userId);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0e141c] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-sm">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              UP
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {mode === 'login' ? 'Sign In to UPI-Pay' : 'Create New Account'}
            </h2>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Segmented Auth Mode Switch */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg transition-colors ${
                mode === 'login' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg transition-colors ${
                mode === 'register' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Hamza Khan"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            )}

            {/* Phone Number with Country Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number (Used for Login & Verification)
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 font-mono focus:border-emerald-500 focus:outline-none shrink-0"
                >
                  <option value="+92">PK (+92)</option>
                  <option value="+91">IN (+91)</option>
                  <option value="+1">US (+1)</option>
                  <option value="+44">UK (+44)</option>
                  <option value="+971">UAE (+971)</option>
                  <option value="+966">SA (+966)</option>
                </select>

                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phoneBody}
                    onChange={(e) => setPhoneBody(e.target.value)}
                    placeholder="3001234567"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-white absolute right-3 top-2.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-colors"
            >
              {isLoading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In to Exchange'
                : 'Create Account & Start Trading'}
            </button>
          </form>

          {/* Instant Demo Accounts Switch */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Demo One-Click Sign In:
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('user_hamza')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
              >
                <p className="text-[11px] font-bold text-white truncate">Hamza</p>
                <p className="text-[10px] text-slate-500 font-mono">+92 PK User</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('user_rohit')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
              >
                <p className="text-[11px] font-bold text-white truncate">Rohit</p>
                <p className="text-[10px] text-slate-500 font-mono">+91 IN User</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('user_admin')}
                className="p-2 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/30 rounded-lg text-left transition-colors"
              >
                <p className="text-[11px] font-bold text-amber-300 truncate">Admin</p>
                <p className="text-[10px] text-amber-500/80 font-mono">Full Console</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
