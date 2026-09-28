import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QrCodeRenderer } from './QrCodeRenderer';
import {
  ExternalLink,
  Smartphone,
  ShieldCheck,
  CheckCircle,
  Copy,
  Clock,
  X,
  CreditCard,
  Zap,
} from 'lucide-react';

export const UpiGatewayModal: React.FC = () => {
  const {
    isUpiGatewayModalOpen,
    setIsUpiGatewayModalOpen,
    upiGatewayDetails,
    addToast,
    submitDeposit,
    methods,
  } = useApp();

  const [paymentState, setPaymentState] = useState<'checkout' | 'processing' | 'success'>('checkout');
  const [simulatedUtr, setSimulatedUtr] = useState<string>('');

  if (!isUpiGatewayModalOpen || !upiGatewayDetails) return null;

  const { amount, vpa, title, redirectUrl } = upiGatewayDetails;

  const upiIntentString = `upi://pay?pa=${vpa}&pn=UPIPayExchange&am=${amount}&cu=INR&tn=UPIPayExchange_${Date.now().toString().slice(-6)}`;

  // Handle external redirect to UPI app or payment system website
  const handleDirectRedirect = () => {
    // If it's a web URL, open in a new window / tab
    if (redirectUrl.startsWith('http')) {
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
      addToast({
        type: 'info',
        title: 'Redirecting to Payment Gateway',
        message: 'Opening external secure checkout portal...',
      });
    } else {
      // Intent URL (upi://pay)
      window.location.href = upiIntentString;
      addToast({
        type: 'info',
        title: 'Opening UPI App',
        message: 'Attempting to launch default UPI app...',
      });
    }
  };

  const handleSimulatePayment = async () => {
    setPaymentState('processing');
    const generatedUtr = 'UTR' + Math.floor(100000000000 + Math.random() * 900000000000);
    setSimulatedUtr(generatedUtr);

    setTimeout(async () => {
      setPaymentState('success');
      // If there is an active UPI method, submit deposit or update active order
      const upiMethod = methods.find((m) => m.category === 'upi') || methods[0];
      if (upiMethod) {
        await submitDeposit({
          methodId: upiMethod.id,
          currency: 'INR',
          amount: amount || 1000,
          paymentRef: generatedUtr,
          isAutoApproved: true,
          upiChannelType: 'auto',
          upiChannelId: upiGatewayDetails.channelId || 'upi_opt_auto_gateway',
        });
      }
    }, 1800);
  };

  const handleClose = () => {
    setPaymentState('checkout');
    setIsUpiGatewayModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0e141c] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              ₹
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">UPI Secure Payment Gateway</h2>
              <p className="text-[11px] text-slate-400 font-mono">Gateway Service: {title}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
          {paymentState === 'checkout' && (
            <>
              {/* Amount Display */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Total Payable Amount</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                    ₹{amount.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">INR</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Encrypted
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Instant Auto-Credit</span>
                </div>
              </div>

              {/* Main Action: Button UPI - Redirects to payment system website */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleDirectRedirect}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2.5 transition-all text-sm group"
                >
                  <Zap className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" />
                  <span>Pay via UPI App / Payment Website</span>
                  <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  Clicking redirects you directly to the secure payment system with pre-filled amount.
                </p>
              </div>

              {/* QR Code and VPA Section */}
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col items-center gap-4">
                <span className="text-xs font-medium text-slate-300">Or Scan UPI QR with any App</span>
                <QrCodeRenderer value={upiIntentString} size={160} label="Scan using PhonePe, Google Pay, Paytm, BHIM" />

                <div className="w-full pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Merchant UPI VPA:</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(vpa);
                      addToast({ type: 'success', title: 'Copied VPA', message: vpa });
                    }}
                    className="flex items-center gap-1.5 font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/50"
                  >
                    <span>{vpa}</span>
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Instant Simulation option */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Simulate Instant Completed Payment (Demo Sandbox)</span>
                </button>
              </div>
            </>
          )}

          {paymentState === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin flex items-center justify-center" />
              <div>
                <h3 className="text-base font-bold text-white">Communicating with Banking Gateway...</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Confirming 12-digit UTR and verifying settlement with payment system.
                </p>
              </div>
            </div>
          )}

          {paymentState === 'success' && (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center animate-in zoom-in duration-200">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Payment Successful!</h3>
                <p className="text-xs text-emerald-400 font-medium mt-0.5">
                  ₹{amount.toLocaleString('en-IN')} received via UPI Gateway
                </p>
              </div>

              <div className="w-full p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-left font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Ref / UTR:</span>
                  <span className="text-emerald-400 font-semibold">{simulatedUtr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gateway Provider:</span>
                  <span className="text-slate-300">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400">SUCCESS</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close & View Updated Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
