import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, ArrowUpRight, ShieldAlert, CheckCircle2, Wallet } from 'lucide-react';
import { Currency } from '../types';

export const WithdrawModal: React.FC = () => {
  const {
    isWithdrawModalOpen,
    setIsWithdrawModalOpen,
    methods,
    currentUser,
    submitWithdrawal,
    setIsAuthModalOpen,
  } = useApp();

  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [receiverTitle, setReceiverTitle] = useState<string>('');
  const [receiverAccount, setReceiverAccount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const activeMethods = methods.filter((m) => m.isActive && m.isWithdrawalEnabled);

  // Initialize selected method if empty
  const currentMethod =
    activeMethods.find((m) => m.id === selectedMethodId) || activeMethods[0];

  if (!isWithdrawModalOpen) return null;

  if (!currentUser) {
    setIsWithdrawModalOpen(false);
    setIsAuthModalOpen(true);
    return null;
  }

  const curKey = (currentMethod?.currency.toLowerCase() || 'pkr') as keyof typeof currentUser.balances;
  const availableBalance = currentUser.balances[curKey] || 0;
  const numericAmount = parseFloat(amount) || 0;

  const handleMaxClick = () => {
    if (availableBalance > 0) {
      setAmount(availableBalance.toString());
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentMethod) {
      setErrorMsg('Please select a withdrawal method.');
      return;
    }

    if (numericAmount <= 0) {
      setErrorMsg('Please enter a valid withdrawal amount.');
      return;
    }

    if (numericAmount > availableBalance) {
      setErrorMsg(`Insufficient ${currentMethod.currency} balance. Available: ${availableBalance}`);
      return;
    }

    if (numericAmount < currentMethod.minWithdrawal || numericAmount > currentMethod.maxWithdrawal) {
      setErrorMsg(
        `Amount must be between ${currentMethod.minWithdrawal.toLocaleString()} and ${currentMethod.maxWithdrawal.toLocaleString()} ${currentMethod.currency}.`
      );
      return;
    }

    if (!receiverTitle.trim()) {
      setErrorMsg('Account holder title is required.');
      return;
    }

    if (!receiverAccount.trim()) {
      setErrorMsg(`Receiver ${currentMethod.name} account or address is required.`);
      return;
    }

    setIsSubmitting(true);
    const res = await submitWithdrawal({
      methodId: currentMethod.id,
      currency: currentMethod.currency,
      amount: numericAmount,
      receiverTitle: receiverTitle.trim(),
      receiverAccount: receiverAccount.trim(),
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsWithdrawModalOpen(false);
      setAmount('');
      setReceiverAccount('');
      setReceiverTitle('');
    } else if (res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0d1218] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              ↑
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Withdraw Funds</h2>
              <p className="text-xs text-slate-400">Cash out to EasyPaisa, JazzCash, UPI, USDT or Bank</p>
            </div>
          </div>
          <button
            onClick={() => setIsWithdrawModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-4 text-sm">
          {/* Method Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Withdrawal Channel</label>
            <div className="grid grid-cols-2 gap-2">
              {activeMethods.map((m) => {
                const isSelected = (selectedMethodId || currentMethod?.id) === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethodId(m.id);
                      setErrorMsg('');
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold truncate">{m.name}</span>
                    <span className="text-xs font-mono text-emerald-400">{m.currency}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Balance card */}
          {currentMethod && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400">Available to withdraw:</span>
              </div>
              <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                {availableBalance.toLocaleString()} {currentMethod.currency}
              </span>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Amount ({currentMethod?.currency})
              </label>
              <button
                type="button"
                onClick={handleMaxClick}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider"
              >
                Max Balance
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={currentMethod?.minWithdrawal || 1}
                max={currentMethod?.maxWithdrawal || 1000000}
                step="any"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                placeholder="Enter amount"
                required
              />
              <div className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                {currentMethod?.currency}
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
              <span>Min: {currentMethod?.minWithdrawal.toLocaleString()}</span>
              <span>Max: {currentMethod?.maxWithdrawal.toLocaleString()}</span>
            </div>
          </div>

          {/* Receiver Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Account Holder Name / Title
            </label>
            <input
              type="text"
              value={receiverTitle}
              onChange={(e) => setReceiverTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. Hamza Khan"
              required
            />
          </div>

          {/* Receiver Account or UPI VPA */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {currentMethod?.category === 'upi'
                ? 'UPI ID / VPA Address'
                : currentMethod?.category === 'crypto'
                ? 'USDT Receiving Address'
                : 'Mobile Account / Account Number'}
            </label>
            <input
              type="text"
              value={receiverAccount}
              onChange={(e) => setReceiverAccount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
              placeholder={
                currentMethod?.category === 'upi'
                  ? 'username@okaxis'
                  : currentMethod?.category === 'crypto'
                  ? 'TRC20 / BEP20 Address'
                  : '03001234567'
              }
              required
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-colors text-sm mt-2"
          >
            {isSubmitting ? (
              <span>Processing Request...</span>
            ) : (
              <>
                <span>Request Withdrawal</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
