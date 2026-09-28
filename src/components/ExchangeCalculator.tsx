import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowDownUp,
  Zap,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Info,
  CheckCircle,
} from 'lucide-react';
import heroBannerImg from '../assets/images/exchange_hero_banner_1790628601069.jpg';

export const ExchangeCalculator: React.FC = () => {
  const {
    methods,
    createExchangeOrder,
    getExchangeCalculation,
    currentUser,
    setIsAuthModalOpen,
    setActiveView,
    setIsDepositModalOpen,
  } = useApp();

  const exchangeMethods = methods.filter((m) => m.isActive && m.isExchangeEnabled);

  // Default: You Pay with EasyPaisa (PKR), You Receive UPI (INR)
  const defaultFrom =
    exchangeMethods.find((m) => m.code === 'easypaisa') || exchangeMethods[0];
  const defaultTo =
    exchangeMethods.find((m) => m.code === 'upi') || exchangeMethods[1] || exchangeMethods[0];

  const [fromMethodId, setFromMethodId] = useState<string>(defaultFrom?.id || '');
  const [toMethodId, setToMethodId] = useState<string>(defaultTo?.id || '');
  const [fromAmount, setFromAmount] = useState<string>('15000');
  const [receiverTitle, setReceiverTitle] = useState<string>('');
  const [receiverAccount, setReceiverAccount] = useState<string>('');
  const [receiverNotes, setReceiverNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Set default account title if user logged in
  useEffect(() => {
    if (currentUser && !receiverTitle) {
      setReceiverTitle(currentUser.name);
    }
  }, [currentUser]);

  const fromMethod = exchangeMethods.find((m) => m.id === fromMethodId) || defaultFrom;
  const toMethod = exchangeMethods.find((m) => m.id === toMethodId) || defaultTo;

  const numericFromAmount = parseFloat(fromAmount) || 0;

  // Calculation
  const calculation = getExchangeCalculation(
    fromMethod?.currency || 'PKR',
    toMethod?.currency || 'INR',
    numericFromAmount
  );

  const handleSwap = () => {
    setFromMethodId(toMethod?.id || '');
    setToMethodId(fromMethod?.id || '');
    setErrorMsg('');
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!fromMethod || !toMethod) {
      setErrorMsg('Please select both sending and receiving methods.');
      return;
    }

    if (fromMethod.id === toMethod.id) {
      setErrorMsg('Source and destination methods must be different.');
      return;
    }

    if (numericFromAmount <= 0) {
      setErrorMsg('Please enter a valid exchange amount.');
      return;
    }

    if (numericFromAmount < fromMethod.minDeposit || numericFromAmount > fromMethod.maxDeposit) {
      setErrorMsg(
        `Amount must be between ${fromMethod.minDeposit.toLocaleString()} and ${fromMethod.maxDeposit.toLocaleString()} ${fromMethod.currency}.`
      );
      return;
    }

    if (!receiverAccount.trim()) {
      setErrorMsg(`Please specify receiver's ${toMethod.name} account or UPI ID.`);
      return;
    }

    setIsSubmitting(true);
    const res = await createExchangeOrder({
      fromMethodId: fromMethod.id,
      toMethodId: toMethod.id,
      fromAmount: numericFromAmount,
      receiverTitle: receiverTitle.trim() || currentUser.name,
      receiverAccount: receiverAccount.trim(),
      receiverNotes: receiverNotes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="space-y-12 py-4">
      {/* Hero Visual Banner with Scrim & Headline */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-2xl">
        <div className="absolute inset-0">
          <img
            src={heroBannerImg}
            alt="UPI-Pay Digital Exchange Infrastructure"
            className="w-full h-full object-cover object-center opacity-30 mix-blend-screen"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090d12] via-[#090d12]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d12] via-transparent to-transparent" />
        </div>

        <div className="relative px-6 py-10 sm:px-12 sm:py-16 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>24/7 Automated Settlement Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight text-balance">
            Instant Multi-Currency Exchange: <span className="text-emerald-400">UPI, EasyPaisa & Crypto</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-2xl">
            Convert seamlessly between PKR, INR, and USDT with guaranteed live exchange rates,
            direct UPI intent redirection, EasyPaisa mobile clearance, and instant order tracking.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> 0% Hidden Markup
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> 2-15 Min Execution
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Real-time UTR Proof Tracking
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Exchange Calculator Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#0e141c] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Create Exchange</h2>
              <p className="text-xs text-slate-400">Live rate lock-in for 15 minutes upon creation</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                1 {fromMethod?.currency} ≈ {calculation.rate.toFixed(4)} {toMethod?.currency}
              </span>
              <p className="text-[10px] text-slate-500 font-mono">Fee: {calculation.feePercent}% included</p>
            </div>
          </div>

          <form onSubmit={handleCreateOrder} className="space-y-5">
            {/* Box 1: You Pay */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>You Pay / Send</span>
                <span>
                  Limits: {fromMethod?.minDeposit.toLocaleString()} - {fromMethod?.maxDeposit.toLocaleString()} {fromMethod?.currency}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  step="any"
                  min={fromMethod?.minDeposit || 1}
                  className="flex-1 bg-transparent text-2xl sm:text-3xl font-bold font-mono text-white focus:outline-none tabular-nums"
                  placeholder="0.00"
                  required
                />

                <select
                  value={fromMethodId}
                  onChange={(e) => setFromMethodId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-100 font-semibold text-sm rounded-xl px-3 py-2.5 focus:border-emerald-500 focus:outline-none"
                >
                  {exchangeMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.currency})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-slate-500 truncate">
                Payment Channel: <span className="text-slate-300">{fromMethod?.name}</span>
              </p>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                type="button"
                onClick={handleSwap}
                className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 flex items-center justify-center transition-all shadow-md active:scale-95"
                title="Swap Direction"
              >
                <ArrowDownUp className="w-4 h-4" />
              </button>
            </div>

            {/* Box 2: You Receive */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Receiver Receives (Estimated)</span>
                <span className="text-emerald-400 font-mono">Net Settlement</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tabular-nums">
                  {calculation.toAmount.toLocaleString() || '0.00'}
                </div>

                <select
                  value={toMethodId}
                  onChange={(e) => setToMethodId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-100 font-semibold text-sm rounded-xl px-3 py-2.5 focus:border-emerald-500 focus:outline-none"
                >
                  {exchangeMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.currency})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-slate-500 truncate">
                Receiving Channel: <span className="text-slate-300">{toMethod?.name}</span>
              </p>
            </div>

            {/* Receiver Credentials */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Receiver Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={receiverTitle}
                    onChange={(e) => setReceiverTitle(e.target.value)}
                    placeholder="e.g. Tariq Mehmood / Aarav Patel"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {toMethod?.category === 'upi'
                      ? 'Receiver UPI ID / VPA'
                      : toMethod?.category === 'crypto'
                      ? 'Receiver USDT Wallet Address'
                      : 'Receiver Mobile / Account Number'}
                  </label>
                  <input
                    type="text"
                    value={receiverAccount}
                    onChange={(e) => setReceiverAccount(e.target.value)}
                    placeholder={
                      toMethod?.category === 'upi'
                        ? 'e.g. receiver@okaxis or receiver@paytm'
                        : toMethod?.category === 'crypto'
                        ? 'TRC20 / BEP20 Address'
                        : 'e.g. 03451234567'
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Optional Note / Reference for Transfer
                </label>
                <input
                  type="text"
                  value={receiverNotes}
                  onChange={(e) => setReceiverNotes(e.target.value)}
                  placeholder="Optional memo (e.g. Freelance settlement / urgent transfer)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition-all text-sm group"
            >
              {isSubmitting ? (
                <span>Generating Order...</span>
              ) : (
                <>
                  <span>Create Exchange Order</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Escrow Protected
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Avg. Time: 4 mins
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Featured Methods & Network Overview */}
      <div className="max-w-5xl mx-auto pt-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider text-center mb-6">
          Supported Gateways & Channels
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 font-black flex items-center justify-center text-xs">
              UPI
            </div>
            <h4 className="text-sm font-bold text-white">UPI Gateway (INR)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Google Pay, PhonePe, Paytm, BHIM with direct URL gateway redirection and instant UTR reconciliation.
            </p>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 font-black flex items-center justify-center text-xs">
              EP
            </div>
            <h4 className="text-sm font-bold text-white">EasyPaisa (PKR)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct mobile wallet transfers with 3737 SMS verification and rapid clearance within minutes.
            </p>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 font-black flex items-center justify-center text-xs">
              JC
            </div>
            <h4 className="text-sm font-bold text-white">JazzCash (PKR)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Supported 24/7 for instant debit and credit through 8558 TID matching mechanism.
            </p>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 font-black flex items-center justify-center text-xs">
              ₮
            </div>
            <h4 className="text-sm font-bold text-white">USDT (TRC20 / BEP20)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Crypto liquidity rails for instant cross-border settlement with minimal blockchain fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
