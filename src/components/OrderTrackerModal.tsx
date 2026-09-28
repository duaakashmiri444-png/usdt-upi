import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QrCodeRenderer } from './QrCodeRenderer';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Send,
  Zap,
  ArrowRight,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { ExchangeOrderStatus } from '../types';

export const OrderTrackerModal: React.FC = () => {
  const {
    activeOrderToTrack,
    setActiveOrderToTrack,
    methods,
    submitOrderProof,
    openUpiGatewayCheckout,
    getActiveUpiLinks,
    addToast,
  } = useApp();

  const [proofRef, setProofRef] = useState<string>('');
  const [isSubmittingProof, setIsSubmittingProof] = useState<boolean>(false);

  if (!activeOrderToTrack) return null;

  const order = activeOrderToTrack;
  const fromMethod = methods.find((m) => m.id === order.fromMethodId);
  const toMethod = methods.find((m) => m.id === order.toMethodId);

  const isPayingWithUpi = fromMethod?.category === 'upi';
  const activeUpiLinks = getActiveUpiLinks();
  const upiLink = activeUpiLinks[0];

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofRef.trim()) return;
    setIsSubmittingProof(true);
    await submitOrderProof(order.id, proofRef.trim());
    setIsSubmittingProof(false);
    setProofRef('');
  };

  const handleLaunchUpi = () => {
    if (upiLink) {
      openUpiGatewayCheckout({
        amount: order.fromAmount,
        vpa: upiLink.vpa || 'merchant@upi',
        title: upiLink.title,
        redirectUrl: upiLink.payRedirectUrl || `upi://pay?pa=${upiLink.vpa || 'merchant@upi'}&pn=UPIPay&am=${order.fromAmount}&cu=INR`,
      });
    } else if (fromMethod) {
      openUpiGatewayCheckout({
        amount: order.fromAmount,
        vpa: fromMethod.accountNumber,
        title: fromMethod.name,
        redirectUrl: `upi://pay?pa=${fromMethod.accountNumber}&pn=UPIPay&am=${order.fromAmount}&cu=INR`,
      });
    }
  };

  const getStepState = (stepIndex: number) => {
    // 0: Created, 1: Paid/Verifying, 2: Processing, 3: Completed
    const map: Record<ExchangeOrderStatus, number> = {
      pending_payment: 0,
      verifying: 1,
      processing: 2,
      completed: 3,
      cancelled: -1,
      rejected: -1,
    };
    const current = map[order.status];
    if (current === -1) return 'error';
    if (current > stepIndex) return 'completed';
    if (current === stepIndex) return 'current';
    return 'upcoming';
  };

  const steps = [
    { label: 'Order Created', desc: 'Awaiting sender transfer' },
    { label: 'Payment Verifying', desc: 'Proof / UTR under check' },
    { label: 'Funds Processing', desc: 'Exchange desk clearing' },
    { label: 'Completed', desc: 'Transferred to receiver' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0d1218] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-md">
              {order.orderNumber}
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Exchange Order Tracking</h2>
              <span className="text-[11px] text-slate-400">Created: {new Date(order.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={() => setActiveOrderToTrack(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* Status Timeline */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="grid grid-cols-4 gap-2 relative">
              {steps.map((st, idx) => {
                const state = getStepState(idx);
                return (
                  <div key={st.label} className="flex flex-col items-center text-center relative">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-colors ${
                        state === 'completed'
                          ? 'bg-emerald-500 text-[#090d12]'
                          : state === 'current'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400 ring-4 ring-emerald-500/10 animate-pulse'
                          : state === 'error'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {state === 'completed' ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-xs font-semibold leading-tight ${
                        state === 'current' ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {st.label}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">
                      {st.desc}
                    </span>
                  </div>
                );
              })}
            </div>

            {order.status === 'rejected' && (
              <div className="mt-3 p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Order Rejected: {order.adminNote || 'Payment was not received within the timeframe.'}</span>
              </div>
            )}
            {order.status === 'completed' && (
              <div className="mt-3 p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Order successfully executed! Funds transferred to receiver account.</span>
              </div>
            )}
          </div>

          {/* Transfer Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">You Send</span>
              <p className="text-xl font-bold font-mono text-white tabular-nums">
                {order.fromAmount.toLocaleString()} <span className="text-xs text-slate-400">{order.fromCurrency}</span>
              </p>
              <div className="text-xs text-slate-400">
                <span>Method: </span>
                <span className="text-slate-200 font-semibold">{fromMethod?.name}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Receiver Gets</span>
              <p className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                {order.toAmount.toLocaleString()} <span className="text-xs text-slate-400">{order.toCurrency}</span>
              </p>
              <div className="text-xs text-slate-400">
                <span>Method: </span>
                <span className="text-slate-200 font-semibold">{toMethod?.name}</span>
              </div>
            </div>
          </div>

          {/* Receiver Details */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2">
            <h4 className="font-semibold text-slate-300">Destination Account Information:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
              <div>
                <span>Account Holder / Title: </span>
                <strong className="text-slate-200">{order.receiverDetails.title}</strong>
              </div>
              <div>
                <span>Account / UPI ID / Address: </span>
                <strong className="text-emerald-400 font-mono">{order.receiverDetails.accountOrVpa}</strong>
              </div>
            </div>
            {order.receiverDetails.notes && (
              <p className="text-[11px] text-slate-500">Note: {order.receiverDetails.notes}</p>
            )}
          </div>

          {/* If Pending Payment: Payment Instructions & UPI Gateway Button */}
          {order.status === 'pending_payment' && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Send {order.fromAmount} {order.fromCurrency} to complete order
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Transfer the exact amount using official credentials below
                  </p>
                </div>
              </div>

              {isPayingWithUpi && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleLaunchUpi}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all text-sm group"
                  >
                    <Zap className="w-4 h-4 fill-white text-white" />
                    <span>Pay ₹{order.fromAmount} via UPI App / Payment Website</span>
                    <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                  </button>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <QrCodeRenderer
                      value={`upi://pay?pa=${upiLink?.vpa || fromMethod?.accountNumber}&pn=UPIPay&am=${order.fromAmount}&cu=INR`}
                      size={130}
                    />
                    <div className="flex-1 space-y-2 text-xs">
                      <span className="text-slate-400">Merchant UPI ID:</span>
                      <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="font-mono text-emerald-400 font-bold truncate">
                          {upiLink?.vpa || fromMethod?.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(upiLink?.vpa || fromMethod?.accountNumber || '');
                            addToast({ type: 'success', title: 'Copied UPI ID' });
                          }}
                          className="text-slate-400 hover:text-white p-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isPayingWithUpi && fromMethod && (
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Name:</span>
                    <span className="text-slate-200 font-semibold">{fromMethod.accountTitle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Account / Wallet:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(fromMethod.accountNumber);
                        addToast({ type: 'success', title: 'Copied Account Details' });
                      }}
                      className="font-mono text-emerald-400 font-bold flex items-center gap-1.5"
                    >
                      <span>{fromMethod.accountNumber}</span>
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{fromMethod.instructions}</p>
                </div>
              )}

              {/* Submit Proof Form */}
              <form onSubmit={handleProofSubmit} className="pt-2 border-t border-emerald-900/60 space-y-3">
                <label className="block text-xs font-semibold text-white">
                  Step 2: Submit 12-digit UTR / Transaction ID after sending payment
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={proofRef}
                    onChange={(e) => setProofRef(e.target.value)}
                    placeholder="Enter UTR, TxID, or SMS confirmation ID"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingProof}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Proof</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Proof reference display if already submitted */}
          {order.proofRef && (
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">Submitted Proof Ref:</span>
                <span className="font-mono text-emerald-400 font-semibold">{order.proofRef}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Status: {order.status.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
