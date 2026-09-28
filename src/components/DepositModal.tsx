import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { QrCodeRenderer } from './QrCodeRenderer';
import {
  X,
  Zap,
  ExternalLink,
  Copy,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Upload,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Headphones,
  Wallet,
  Sparkles,
  Info,
} from 'lucide-react';
import { UpiChannelOption, UpiChannelType } from '../types';
import { getChannelStatus } from '../services/storage';

export const DepositModal: React.FC = () => {
  const {
    isDepositModalOpen,
    setIsDepositModalOpen,
    methods,
    upiChannels,
    submitDeposit,
    openUpiGatewayCheckout,
    setIsSupportModalOpen,
    currentUser,
    setIsAuthModalOpen,
    addToast,
  } = useApp();

  // Wizard Step: 1 = Choose Amount & Channel, 2 = Pay & Enter Proof
  const [step, setStep] = useState<1 | 2>(1);

  // Currency category: 'upi' | 'easypaisa' | 'jazzcash' | 'crypto' | 'bank'
  const [selectedCategory, setSelectedCategory] = useState<'upi' | 'pk_wallet' | 'crypto'>('upi');

  // Selected payment method & channel
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('upi_opt_manual');

  // Amount & inputs
  const [amount, setAmount] = useState<string>('2500');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [proofImageName, setProofImageName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Active methods
  const activeMethods = methods.filter((m) => m.isActive && m.isDepositEnabled);
  const upiMethod = activeMethods.find((m) => m.category === 'upi') || activeMethods[0];
  const pkMethods = activeMethods.filter(
    (m) => m.currency === 'PKR' && (m.category === 'mobile_wallet' || m.code.includes('paisa') || m.code.includes('jazz'))
  );
  const cryptoMethods = activeMethods.filter((m) => m.category === 'crypto');

  // Filter visible UPI channels (exclude 'hidden')
  const visibleChannels = upiChannels.filter((c) => c.availability !== 'hidden');

  // Default selection on open
  useEffect(() => {
    if (isDepositModalOpen) {
      setStep(1);
      setErrorMsg('');
      setPaymentRef('');
      setProofImageName('');
      setCopiedUpi(false);

      if (upiMethod) {
        setSelectedMethodId(upiMethod.id);
      }

      // Pick first active channel if available
      const firstActive = visibleChannels.find((c) => getChannelStatus(c) === 'active') || visibleChannels[0];
      if (firstActive) {
        setSelectedChannelId(firstActive.id);
      }
    }
  }, [isDepositModalOpen]);

  if (!isDepositModalOpen) return null;

  const currentMethod = methods.find((m) => m.id === selectedMethodId) || upiMethod || activeMethods[0];
  const selectedChannel: UpiChannelOption | undefined = upiChannels.find((c) => c.id === selectedChannelId);
  const selectedChannelStatus = selectedChannel ? getChannelStatus(selectedChannel) : 'not_available';

  const numericAmount = parseFloat(amount) || 0;

  // Preset chips depending on currency
  const getPresetAmounts = () => {
    if (selectedCategory === 'upi') {
      return [500, 1000, 2500, 5000, 10000, 25000];
    } else if (selectedCategory === 'pk_wallet') {
      return [1000, 3000, 5000, 15000, 25000, 50000];
    } else {
      return [20, 50, 100, 250, 500, 1000];
    }
  };

  const handleProceedToStep2 = () => {
    setErrorMsg('');

    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Please enter a valid deposit amount.');
      return;
    }

    if (currentMethod && (numericAmount < currentMethod.minDeposit || numericAmount > currentMethod.maxDeposit)) {
      setErrorMsg(
        `Amount must be between ${currentMethod.minDeposit.toLocaleString()} and ${currentMethod.maxDeposit.toLocaleString()} ${currentMethod.currency}.`
      );
      return;
    }

    if (selectedCategory === 'upi') {
      if (!selectedChannel) {
        setErrorMsg('Please select a payment option.');
        return;
      }
      if (selectedChannelStatus === 'not_available') {
        setErrorMsg('This option is not available right now. Please choose an active option like Manual UPI.');
        return;
      }
      if (selectedChannelStatus === 'expired') {
        setErrorMsg('This payment link/option has expired. Please select another active channel.');
        return;
      }
    }

    setStep(2);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!paymentRef.trim()) {
      setErrorMsg(
        selectedChannel?.type === 'manual'
          ? 'Please enter the 12-digit UPI UTR number from your payment receipt.'
          : 'Please enter the Transaction ID / Reference number.'
      );
      return;
    }

    setIsSubmitting(true);
    const res = await submitDeposit({
      methodId: currentMethod.id,
      currency: currentMethod.currency,
      amount: numericAmount,
      paymentRef: paymentRef.trim(),
      upiChannelType: selectedCategory === 'upi' ? selectedChannel?.type : undefined,
      upiChannelId: selectedCategory === 'upi' ? selectedChannel?.id : undefined,
      isAutoApproved: selectedCategory === 'upi' && selectedChannel?.type === 'auto' && selectedChannel?.isAutoApproved,
      proofImage: proofImageName || undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsDepositModalOpen(false);
    } else if (res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleCopyUpi = (vpa: string) => {
    navigator.clipboard.writeText(vpa);
    setCopiedUpi(true);
    addToast({
      type: 'success',
      title: 'UPI ID Copied',
      message: `${vpa} copied to clipboard.`,
    });
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleLaunchAutoGateway = () => {
    if (!selectedChannel) return;
    openUpiGatewayCheckout({
      amount: numericAmount || 1000,
      vpa: selectedChannel.vpa || 'merchant.91pay@icici',
      title: selectedChannel.title,
      redirectUrl: selectedChannel.payRedirectUrl || 'https://gateway.91pay-fast.net',
      channelType: 'auto',
      channelId: selectedChannel.id,
    });
  };

  const handleLaunchWalletLink = () => {
    if (!selectedChannel?.payRedirectUrl) return;
    window.open(selectedChannel.payRedirectUrl, '_blank', 'noopener,noreferrer');
    addToast({
      type: 'info',
      title: 'Opening Wallet Link',
      message: 'Opening 3rd-party wallet gateway in a new tab...',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0c1117] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Deposit Funds</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  Step {step} of 2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {step === 1 ? 'Choose amount and preferred deposit option' : 'Complete payment and confirm reference'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDepositModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm flex-1">
          {/* STEP 1: SELECT AMOUNT & PAYMENT OPTION */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Category Selector (UPI vs PKR Wallet vs Crypto) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Deposit Currency / Rails
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('upi');
                      if (upiMethod) setSelectedMethodId(upiMethod.id);
                      setErrorMsg('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      selectedCategory === 'upi'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-base mr-1.5">🇮🇳</span>
                    <span className="text-xs font-bold block mt-1">UPI & INR</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Manual & Auto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('pk_wallet');
                      if (pkMethods.length > 0) setSelectedMethodId(pkMethods[0].id);
                      setErrorMsg('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedCategory === 'pk_wallet'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-base mr-1.5">🇵🇰</span>
                    <span className="text-xs font-bold block mt-1">PKR Wallets</span>
                    <span className="text-[10px] text-emerald-400 font-mono">EasyPaisa / JazzCash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('crypto');
                      if (cryptoMethods.length > 0) setSelectedMethodId(cryptoMethods[0].id);
                      setErrorMsg('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedCategory === 'crypto'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-base mr-1.5">💎</span>
                    <span className="text-xs font-bold block mt-1">USDT Crypto</span>
                    <span className="text-[10px] text-emerald-400 font-mono">TRC20 / BEP20</span>
                  </button>
                </div>
              </div>

              {/* Deposit Amount Box with Quick Amount Chips */}
              <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Enter Deposit Amount</span>
                  <span className="font-mono text-slate-400">
                    Limits: {currentMethod?.minDeposit.toLocaleString()} - {currentMethod?.maxDeposit.toLocaleString()}{' '}
                    {currentMethod?.currency}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-lg font-bold font-mono text-emerald-400">
                    {currentMethod?.currency === 'INR' ? '₹' : currentMethod?.currency === 'PKR' ? 'Rs' : '$'}
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={currentMethod?.minDeposit || 1}
                    max={currentMethod?.maxDeposit || 500000}
                    step="any"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-16 py-3 text-xl font-bold font-mono text-white focus:border-emerald-500 focus:outline-none tabular-nums"
                    placeholder="0.00"
                    required
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs font-mono font-bold text-slate-400">
                    {currentMethod?.currency}
                  </span>
                </div>

                {/* Quick Select Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 mr-1">Quick Select:</span>
                  {getPresetAmounts().map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                        amount === preset.toString()
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      +{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* IF UPI: SHOW THE 3 DISTINCT OPTIONS (MANUAL, WALLET LINK, AUTO) */}
              {selectedCategory === 'upi' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-white">
                      Choose UPI Channel / Gateway
                    </label>
                    <span className="text-[11px] text-slate-400">
                      3 Separate Payment Options
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {visibleChannels.map((channel) => {
                      const status = getChannelStatus(channel);
                      const isSelected = selectedChannelId === channel.id;
                      const isAvailable = status === 'active';
                      const isNotAvailable = status === 'not_available';
                      const isExpired = status === 'expired' || status === 'future';

                      return (
                        <div
                          key={channel.id}
                          onClick={() => {
                            if (isAvailable) {
                              setSelectedChannelId(channel.id);
                              setErrorMsg('');
                            }
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                            !isAvailable
                              ? 'opacity-60 bg-slate-950/40 border-slate-800/60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-slate-900/90 border-emerald-500 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                                    channel.type === 'auto'
                                      ? 'bg-emerald-500 text-slate-950'
                                      : channel.type === 'wallet_link'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  }`}
                                >
                                  {channel.badge}
                                </span>
                                <h3 className="text-sm font-bold text-white">{channel.title}</h3>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">{channel.subtitle}</p>
                            </div>

                            {/* Status badge */}
                            <div className="shrink-0 text-right">
                              {isAvailable ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Available
                                </span>
                              ) : isNotAvailable ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                                  Not Available Right Now
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                  {status === 'expired' ? 'Link Expired' : 'Scheduled'}
                                </span>
                              )}

                              <div className="mt-1 text-[10px] font-mono text-slate-400">
                                {channel.isAutoApproved ? (
                                  <span className="text-emerald-400 font-semibold">⚡ Instant Auto-Credit</span>
                                ) : (
                                  <span>Manual Admin Review</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Reason or timing note if not available */}
                          {channel.unavailableReason && !isAvailable && (
                            <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-950/30 p-2 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 shrink-0" />
                              <span>{channel.unavailableReason}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* IF NON-UPI METHOD SELECTED: EasyPaisa / JazzCash / Crypto */}
              {selectedCategory === 'pk_wallet' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">Select PKR Wallet</label>
                  <div className="grid grid-cols-2 gap-3">
                    {pkMethods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethodId(m.id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedMethodId === m.id
                            ? 'bg-slate-900 border-emerald-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">{m.name}</span>
                        <span className="text-[11px] text-emerald-400 font-mono">{m.currency}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory === 'crypto' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">Select Crypto Rail</label>
                  <div className="grid grid-cols-2 gap-3">
                    {cryptoMethods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethodId(m.id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedMethodId === m.id
                            ? 'bg-slate-900 border-emerald-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold block">{m.name}</span>
                        <span className="text-[11px] text-emerald-400 font-mono">{m.currency}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Continue to Payment Button */}
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 text-sm transition-all"
              >
                <span>
                  Proceed to Payment (
                  {currentMethod?.currency === 'INR' ? '₹' : currentMethod?.currency === 'PKR' ? 'Rs' : '$'}
                  {numericAmount.toLocaleString()})
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: PAYMENT COMPLETION & UTR SUBMISSION */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Back button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Amount or Payment Channel</span>
              </button>

              {/* Order Summary Pill */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400">Deposit Amount</span>
                  <p className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                    {currentMethod?.currency === 'INR' ? '₹' : currentMethod?.currency === 'PKR' ? 'Rs' : '$'}
                    {numericAmount.toLocaleString()} {currentMethod?.currency}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400">Selected Channel</span>
                  <p className="text-xs font-bold text-white">
                    {selectedCategory === 'upi' ? selectedChannel?.title : currentMethod?.name}
                  </p>
                </div>
              </div>

              {/* --- CHANNEL 1: MANUAL UPI (UPI ID + QR + ENTER UTR) --- */}
              {selectedCategory === 'upi' && selectedChannel?.type === 'manual' && (
                <div className="space-y-5">
                  <div className="p-4 bg-sky-950/20 border border-sky-500/30 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          Option 1: Manual UPI
                        </span>
                        <span className="text-xs font-bold text-white">Transfer to Admin UPI ID</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Manual Verification</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                      <div className="flex flex-col items-center justify-center p-2 bg-slate-950 rounded-xl border border-slate-800">
                        <QrCodeRenderer
                          value={`upi://pay?pa=${selectedChannel.vpa || 'fastpay.exchange@axl'}&pn=UPIPay&am=${numericAmount}&cu=INR`}
                          size={140}
                          label="Scan to Pay via any UPI App"
                        />
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-slate-400 font-medium">Official UPI ID:</span>
                          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 mt-1">
                            <span className="font-mono text-emerald-400 font-bold truncate text-xs">
                              {selectedChannel.vpa || 'fastpay.exchange@axl'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyUpi(selectedChannel.vpa || 'fastpay.exchange@axl')}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400 space-y-1">
                          <p>1. Open GPay, PhonePe, Paytm, or BHIM.</p>
                          <p>2. Send exact amount of ₹{numericAmount.toLocaleString()}.</p>
                          <p>3. Note down the 12-digit UTR from your bank receipt.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* UTR Submission Form */}
                  <form onSubmit={handleDepositSubmit} className="space-y-4">
                    <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-white mb-1">
                          Enter 12-Digit UTR Number (From Bank / UPI App)
                        </label>
                        <input
                          type="text"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          placeholder="e.g. 428192049182"
                          maxLength={24}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                          required
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          The 12-digit UPI reference number is in your GPay / PhonePe / Paytm payment details.
                        </span>
                      </div>

                      {/* Optional Screenshot */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          Optional Payment Screenshot
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl cursor-pointer text-xs text-slate-300 transition-colors">
                            <Upload className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{proofImageName ? 'Change Image' : 'Attach Screenshot'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setProofImageName(e.target.files[0].name);
                                }
                              }}
                            />
                          </label>
                          {proofImageName && (
                            <span className="text-xs text-emerald-400 font-mono truncate max-w-xs">
                              ✓ {proofImageName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      {isSubmitting ? (
                        <span>Submitting for Admin Approval...</span>
                      ) : (
                        <>
                          <span>Submit UTR for Verification</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* --- CHANNEL 2: 3RD-PARTY WALLET LINK (OPEN WALLET LINK + MANUAL APPROVE) --- */}
              {selectedCategory === 'upi' && selectedChannel?.type === 'wallet_link' && (
                <div className="space-y-5">
                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Option 2: 3rd-Party Wallet
                        </span>
                        <span className="text-xs font-bold text-white">External Merchant Wallet Link</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Manual Verification</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Click the button below to open our 3rd-party merchant wallet payment gateway. Once you complete the payment,
                      enter your order reference / transaction ID below.
                    </p>

                    <button
                      type="button"
                      onClick={handleLaunchWalletLink}
                      className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-amber-950 flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Open 3rd-Party Wallet Payment Link (₹{numericAmount.toLocaleString()})</span>
                      <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                    </button>
                  </div>

                  {/* Submission Form for 3P Wallet */}
                  <form onSubmit={handleDepositSubmit} className="space-y-4">
                    <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-white mb-1">
                          Wallet Order ID / Transaction Reference
                        </label>
                        <input
                          type="text"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          placeholder="e.g. WLT-9928109 or Paytm TxID"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                          required
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Shown on your 3rd-party wallet confirmation screen.
                        </span>
                      </div>

                      {/* Optional Screenshot */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          Optional Receipt / Screenshot
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl cursor-pointer text-xs text-slate-300 transition-colors">
                            <Upload className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{proofImageName ? 'Change Image' : 'Attach Receipt'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setProofImageName(e.target.files[0].name);
                                }
                              }}
                            />
                          </label>
                          {proofImageName && (
                            <span className="text-xs text-emerald-400 font-mono truncate max-w-xs">
                              ✓ {proofImageName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      {isSubmitting ? (
                        <span>Submitting for Verification...</span>
                      ) : (
                        <>
                          <span>Submit Wallet Reference for Review</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* --- CHANNEL 3: AUTO GATEWAY (⚡ FAST AUTO - INSTANT AUTO-APPROVAL) --- */}
              {selectedCategory === 'upi' && selectedChannel?.type === 'auto' && (
                <div className="space-y-5">
                  <div className="p-5 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950">
                          ⚡ FAST AUTO
                        </span>
                        <span className="text-xs font-bold text-white">Official Provider Gateway</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Instant Auto-Credit
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Powered by high-speed official gaming & merchant settlement rails (91Jeeto style). When you complete checkout on the
                      gateway, our callback API automatically validates your payment and credits your account balance within seconds!
                    </p>

                    <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Gateway Provider:</span>
                        <span className="font-mono text-emerald-400 font-bold">{selectedChannel.gatewayName || '91Pay Auto Engine'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Approval Speed:</span>
                        <span className="text-emerald-300 font-semibold">⚡ Under 5 Seconds</span>
                      </div>
                    </div>

                    {/* Launch Gateway Button */}
                    <button
                      type="button"
                      onClick={handleLaunchAutoGateway}
                      className="w-full py-4 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>⚡ Pay ₹{numericAmount.toLocaleString()} via Auto Gateway (Instant)</span>
                      <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    No manual UTR typing required. The auto gateway reconciles your deposit automatically via API webhook.
                  </p>
                </div>
              )}

              {/* --- NON-UPI METHODS: EasyPaisa / JazzCash / USDT --- */}
              {selectedCategory !== 'upi' && currentMethod && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white">{currentMethod.name} Transfer Details</h3>
                      <span className="text-xs font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {currentMethod.currency}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-slate-400">Account Title:</span>
                          <p className="text-xs font-bold text-white mt-0.5">{currentMethod.accountTitle}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">
                            {currentMethod.category === 'crypto' ? 'Deposit Address:' : 'Account / Phone Number:'}
                          </span>
                          <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800 mt-1">
                            <span className="font-mono text-emerald-300 font-bold truncate mr-2">
                              {currentMethod.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(currentMethod.accountNumber);
                                addToast({ type: 'success', title: 'Details Copied' });
                              }}
                              className="text-slate-400 hover:text-white p-1"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{currentMethod.instructions}</p>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <QrCodeRenderer value={currentMethod.accountNumber} size={130} label="Scan details" />
                      </div>
                    </div>
                  </div>

                  {/* Submission Form */}
                  <form onSubmit={handleDepositSubmit} className="space-y-4">
                    <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-white mb-1">
                          {currentMethod.category === 'crypto'
                            ? 'Blockchain TxHash / Transaction Hash'
                            : 'SMS Transaction ID / TID (e.g. 3737 / 8558 ID)'}
                        </label>
                        <input
                          type="text"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          placeholder={currentMethod.category === 'crypto' ? 'TxHash (e.g. 0x... or 7e...)' : '10-digit TID'}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                          required
                        />
                      </div>

                      {/* Optional Screenshot */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          Optional Receipt / Screenshot
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl cursor-pointer text-xs text-slate-300 transition-colors">
                            <Upload className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{proofImageName ? 'Change Image' : 'Attach Receipt'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setProofImageName(e.target.files[0].name);
                                }
                              }}
                            />
                          </label>
                          {proofImageName && (
                            <span className="text-xs text-emerald-400 font-mono truncate max-w-xs">
                              ✓ {proofImageName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      {isSubmitting ? (
                        <span>Submitting for Review...</span>
                      ) : (
                        <>
                          <span>Submit Payment Proof for Verification</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
