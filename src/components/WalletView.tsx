import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
} from 'lucide-react';

export const WalletView: React.FC = () => {
  const {
    currentUser,
    deposits,
    withdrawals,
    orders,
    methods,
    setIsDepositModalOpen,
    setIsWithdrawModalOpen,
    setActiveView,
    setActiveOrderToTrack,
    setIsAuthModalOpen,
  } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'deposits' | 'withdrawals' | 'exchanges'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
          <Wallet className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Sign In to Access Your Wallet</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Manage your multi-currency balances in PKR, INR, and USDT. Track live transactions and deposit/withdraw funds.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  // Filter user's records
  const userDeposits = deposits.filter((d) => d.userId === currentUser.id);
  const userWithdrawals = withdrawals.filter((w) => w.userId === currentUser.id);
  const userOrders = orders.filter((o) => o.userId === currentUser.id);

  // Combine unified activity items
  interface ActivityItem {
    id: string;
    type: 'deposit' | 'withdrawal' | 'exchange';
    number: string;
    title: string;
    amountStr: string;
    status: string;
    date: string;
    originalObj: any;
  }

  const activities: ActivityItem[] = [
    ...userDeposits.map((d) => ({
      id: d.id,
      type: 'deposit' as const,
      number: d.depositNumber,
      title: `Deposit via ${methods.find((m) => m.id === d.methodId)?.name || 'Direct'}`,
      amountStr: `+${d.amount.toLocaleString()} ${d.currency}`,
      status: d.status,
      date: d.createdAt,
      originalObj: d,
    })),
    ...userWithdrawals.map((w) => ({
      id: w.id,
      type: 'withdrawal' as const,
      number: w.withdrawalNumber,
      title: `Withdrawal to ${w.receiverTitle}`,
      amountStr: `-${w.amount.toLocaleString()} ${w.currency}`,
      status: w.status,
      date: w.createdAt,
      originalObj: w,
    })),
    ...userOrders.map((o) => ({
      id: o.id,
      type: 'exchange' as const,
      number: o.orderNumber,
      title: `Exchange ${o.fromCurrency} → ${o.toCurrency}`,
      amountStr: `${o.fromAmount.toLocaleString()} ${o.fromCurrency} → ${o.toAmount.toLocaleString()} ${o.toCurrency}`,
      status: o.status,
      date: o.createdAt,
      originalObj: o,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredActivities = activities.filter((item) => {
    if (filterType === 'deposits' && item.type !== 'deposit') return false;
    if (filterType === 'withdrawals' && item.type !== 'withdrawal') return false;
    if (filterType === 'exchanges' && item.type !== 'exchange') return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        item.number.toLowerCase().includes(term) ||
        item.title.toLowerCase().includes(term) ||
        item.status.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8">
      {/* Wallet Balance Header Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Multi-Currency Wallet</h1>
            <p className="text-xs text-slate-400">Account: {currentUser.name} ({currentUser.phone})</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-colors"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Deposit (UPI/PKR)</span>
            </button>

            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw</span>
            </button>

            <button
              onClick={() => setActiveView('exchange')}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Exchange</span>
            </button>
          </div>
        </div>

        {/* 3 Major Currency Balances */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PKR Card */}
          <div className="p-5 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Pakistani Rupee (PKR)</span>
              <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/60">
                Active
              </span>
            </div>
            <p className="text-3xl font-bold font-mono text-white tabular-nums">
              ₨ {currentUser.balances.pkr.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500">Available for EasyPaisa, JazzCash, Meezan Bank</p>
          </div>

          {/* INR Card */}
          <div className="p-5 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Indian Rupee (INR)</span>
              <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/60">
                UPI Ready
              </span>
            </div>
            <p className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
              ₹ {currentUser.balances.inr.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500">Instant UPI VPA Settlement & Direct Pay</p>
          </div>

          {/* USDT Card */}
          <div className="p-5 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Tether (USDT)</span>
              <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/60">
                TRC-20 / BEP-20
              </span>
            </div>
            <p className="text-3xl font-bold font-mono text-white tabular-nums">
              $ {currentUser.balances.usdt.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-500">Global Crypto Liquidity Layer</p>
          </div>
        </div>
      </div>

      {/* Transaction History & Activity */}
      <div className="bg-[#0e141c] border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Recent Wallet Activity</h2>
            <p className="text-xs text-slate-400">All deposits, withdrawals, and exchange conversions</p>
          </div>

          {/* Interactive filter tabs (Constitution compliant) */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Activity
            </button>
            <button
              onClick={() => setFilterType('deposits')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterType === 'deposits'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Deposits
            </button>
            <button
              onClick={() => setFilterType('withdrawals')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterType === 'withdrawals'
                  ? 'bg-slate-800 text-rose-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Withdrawals
            </button>
            <button
              onClick={() => setFilterType('exchanges')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterType === 'exchanges'
                  ? 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Exchanges
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, UTR, or method..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Activity Table */}
        {filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <p className="text-sm">No activity recorded for this filter.</p>
            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="text-xs text-emerald-400 hover:underline"
            >
              Make your first deposit
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Reference / ID</th>
                  <th className="py-3 px-3">Type & Description</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Date & Time</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredActivities.map((item) => {
                  const isApproved =
                    item.status === 'approved' || item.status === 'completed';
                  const isPending =
                    item.status === 'pending' ||
                    item.status === 'pending_payment' ||
                    item.status === 'verifying' ||
                    item.status === 'processing';
                  const isRejected =
                    item.status === 'rejected' || item.status === 'cancelled';

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-200">
                        {item.number}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white block">{item.title}</span>
                        <span className="text-[11px] text-slate-500 uppercase">{item.type}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                        <span
                          className={
                            item.amountStr.startsWith('+')
                              ? 'text-emerald-400'
                              : item.amountStr.startsWith('-')
                              ? 'text-rose-400'
                              : 'text-slate-200'
                          }
                        >
                          {item.amountStr}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            isApproved
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(item.date).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {item.type === 'exchange' ? (
                          <button
                            onClick={() => setActiveOrderToTrack(item.originalObj)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors inline-flex items-center gap-1"
                            title="Track Exchange Progress"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Track</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">Auto Logged</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
