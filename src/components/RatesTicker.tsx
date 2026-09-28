import React from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp, Activity, Zap, CheckCircle2 } from 'lucide-react';

export const RatesTicker: React.FC = () => {
  const { rates, getActiveUpiChannels } = useApp();
  const activeChannels = getActiveUpiChannels();

  const pkrInr = rates.find((r) => r.fromCurrency === 'PKR' && r.toCurrency === 'INR');
  const inrPkr = rates.find((r) => r.fromCurrency === 'INR' && r.toCurrency === 'PKR');
  const pkrUsdt = rates.find((r) => r.fromCurrency === 'USDT' && r.toCurrency === 'PKR');
  const inrUsdt = rates.find((r) => r.fromCurrency === 'USDT' && r.toCurrency === 'INR');

  return (
    <div className="w-full bg-[#070b0f] border-b border-slate-800/60 overflow-hidden py-2 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-300">Live Rates:</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">1000 PKR =</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {pkrInr ? (1000 * pkrInr.rate).toFixed(1) : '302.0'} INR
            </span>
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">100 INR =</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {inrPkr ? (100 * inrPkr.rate).toFixed(1) : '331.0'} PKR
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">1 USDT =</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {pkrUsdt ? pkrUsdt.rate.toFixed(1) : '278.2'} PKR
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">1 USDT =</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {inrUsdt ? inrUsdt.rate.toFixed(1) : '85.8'} INR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>UPI Channels:</span>
            <span className={activeChannels.length > 0 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {activeChannels.length > 0 ? `${activeChannels.length} Live Options (Manual/Auto)` : 'Support Desk'}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-300">Fast Settlement</span>
          </div>
        </div>
      </div>
    </div>
  );
};
