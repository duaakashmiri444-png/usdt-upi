import React from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  MessageCircle,
  Send,
  Mail,
  Clock,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const SupportModal: React.FC = () => {
  const { isSupportModalOpen, setIsSupportModalOpen, supportConfig } = useApp();

  if (!isSupportModalOpen) return null;

  const whatsappClean = supportConfig.whatsappNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${whatsappClean}?text=Hello%20UPI-Pay%20Exchange%20Support,%20I%20need%20assistance%20with%20an%20order/deposit.`;
  const telegramUrl = `https://t.me/${supportConfig.telegramUsername.replace('@', '')}`;

  const faqs = [
    {
      q: 'How long does a UPI to EasyPaisa exchange take?',
      a: 'Average execution time is 2 to 10 minutes after your 12-digit UTR is verified by our automated bank reconciliation engine.',
    },
    {
      q: 'How do UPI payment links and redirection buttons work?',
      a: 'When you click "Pay via UPI App / Payment Website", our platform connects you with active UPI payment links. If you are on a phone, it directly opens PhonePe/GPay/Paytm. On desktop, it shows a real-time QR code and portal redirect.',
    },
    {
      q: 'What if a UPI payment link is marked expired or rotated?',
      a: 'Our smart link rotation engine switches to pre-configured backup UPI routes automatically. If all links are undergoing daily banking reconciliation, our 24/7 WhatsApp desk provides an instant direct VPA.',
    },
    {
      q: 'What is required as proof of payment?',
      a: 'For UPI, provide the 12-digit UTR (Unique Transaction Reference). For EasyPaisa, enter the 3737 confirmation SMS ID. For JazzCash, provide the 8558 TID. For USDT, submit the TRC20/BEP20 TxHash.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0e141c] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-sm max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              💬
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Customer Support & Live Desk</h2>
              <p className="text-[11px] text-slate-400">{supportConfig.workingHours}</p>
            </div>
          </div>
          <button
            onClick={() => setIsSupportModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Direct Contact Channels */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Direct Contact Desks
            </h3>

            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 bg-emerald-950/30 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    WhatsApp Live Support (Fastest)
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">{supportConfig.whatsappNumber}</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Telegram */}
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 bg-sky-950/30 border border-sky-500/30 hover:border-sky-500/60 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                    Telegram Exchange Channel & Desk
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">@{supportConfig.telegramUsername}</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Email */}
            <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Official Support Email</p>
                  <p className="text-[11px] text-slate-400 font-mono">{supportConfig.supportEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Frequently Asked Questions</span>
            </h3>

            <div className="space-y-2.5">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs space-y-1">
                  <p className="font-bold text-slate-200">{faq.q}</p>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
