import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpRight,
  ArrowLeftRight,
  Users,
  Link as LinkIcon,
  Settings,
  Headphones,
  FileSpreadsheet,
  Check,
  X,
  Plus,
  Trash2,
  Edit2,
  Clock,
  AlertTriangle,
  Search,
  ExternalLink,
  DollarSign,
  Activity,
} from 'lucide-react';
import {
  PaymentMethod,
  ExchangeRate,
  UpiPaymentLink,
  UpiChannelOption,
  UpiChannelType,
  ChannelAvailability,
  Currency,
  ExchangeOrderStatus,
  WithdrawalStatus,
} from '../types';
import { getUpiLinkStatus, getChannelStatus } from '../services/storage';

export const AdminPanel: React.FC = () => {
  const {
    currentUser,
    users,
    orders,
    deposits,
    withdrawals,
    methods,
    rates,
    upiChannels,
    upiLinks,
    supportConfig,
    auditLogs,
    approveDeposit,
    rejectDeposit,
    updateWithdrawalStatus,
    updateOrderStatus,
    adjustUserBalance,
    toggleUserStatus,
    savePaymentMethod,
    deletePaymentMethod,
    saveExchangeRate,
    saveUpiChannel,
    deleteUpiChannel,
    saveUpiLink,
    deleteUpiLink,
    updateSupportConfig,
    switchUser,
    setActiveOrderToTrack,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'deposits'
    | 'withdrawals'
    | 'orders'
    | 'upi_links'
    | 'methods'
    | 'rates'
    | 'users'
    | 'support'
    | 'audit'
  >('overview');

  // Edit states for modals/inline editing
  const [editingChannel, setEditingChannel] = useState<Partial<UpiChannelOption> | null>(null);
  const [editingUpiLink, setEditingUpiLink] = useState<Partial<UpiPaymentLink> | null>(null);
  const [editingMethod, setEditingMethod] = useState<Partial<PaymentMethod> | null>(null);
  const [editingRate, setEditingRate] = useState<Partial<ExchangeRate> | null>(null);
  const [adjustingUser, setAdjustingUser] = useState<{
    userId: string;
    currency: 'pkr' | 'inr' | 'usdt';
    amount: string;
    type: 'add' | 'subtract';
    note: string;
  } | null>(null);

  // Search queries
  const [userSearch, setUserSearch] = useState<string>('');

  // Support config local state
  const [localSupport, setLocalSupport] = useState(supportConfig);

  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const pendingOrders = orders.filter(
    (o) => o.status === 'pending_payment' || o.status === 'verifying'
  );

  // Compute total volume
  const totalVolumePkr = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => (o.fromCurrency === 'PKR' ? sum + o.fromAmount : sum), 0);

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* Top Banner & Quick Admin Switch */}
      <div className="p-4 sm:p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">System Admin Console</h1>
              <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded uppercase">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage live exchange rates, UPI payment links, users, deposits & withdrawals
            </p>
          </div>
        </div>

        {/* Quick Persona check */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs text-slate-400">Current Login:</span>
          <span className="text-xs font-semibold text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            {currentUser?.name} ({currentUser?.role})
          </span>
          {currentUser?.role !== 'admin' && (
            <button
              onClick={() => {
                const adminUser = users.find((u) => u.role === 'admin');
                if (adminUser) switchUser(adminUser.id);
              }}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
            >
              Switch to Admin Account
            </button>
          )}
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'deposits', label: `Deposits (${pendingDeposits.length})`, icon: ArrowDownToLine },
          { id: 'withdrawals', label: `Withdrawals (${pendingWithdrawals.length})`, icon: ArrowUpRight },
          { id: 'orders', label: `Orders (${pendingOrders.length})`, icon: ArrowLeftRight },
          { id: 'upi_links', label: 'UPI Channels (3 Options)', icon: LinkIcon },
          { id: 'methods', label: 'Payment Methods', icon: DollarSign },
          { id: 'rates', label: 'Exchange Rates', icon: Activity },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'support', label: 'Support & Notice', icon: Headphones },
          { id: 'audit', label: 'Audit Log', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-semibold rounded-xl whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-medium">Pending Deposits</span>
              <p className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                {pendingDeposits.length}
              </p>
              <button
                onClick={() => setActiveTab('deposits')}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 pt-1"
              >
                Review all →
              </button>
            </div>

            <div className="p-4 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-medium">Pending Withdrawals</span>
              <p className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                {pendingWithdrawals.length}
              </p>
              <button
                onClick={() => setActiveTab('withdrawals')}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 pt-1"
              >
                Process queue →
              </button>
            </div>

            <div className="p-4 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-medium">Active Orders</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length}
              </p>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 pt-1"
              >
                Track exchange →
              </button>
            </div>

            <div className="p-4 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-medium">Registered Users</span>
              <p className="text-2xl font-bold font-mono text-white tabular-nums">{users.length}</p>
              <button
                onClick={() => setActiveTab('users')}
                className="text-[11px] text-slate-400 hover:underline flex items-center gap-1 pt-1"
              >
                Manage users →
              </button>
            </div>
          </div>

          {/* Quick Pending Deposits Action Table */}
          <div className="p-6 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                <span>Urgent Deposits Awaiting Approval</span>
              </h2>
              <span className="text-xs font-mono text-amber-400">{pendingDeposits.length} pending</span>
            </div>

            {pendingDeposits.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">All deposits are fully cleared.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-3">Deposit ID</th>
                      <th className="py-2 px-3">User Phone</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">UTR / Ref</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {pendingDeposits.map((dep) => (
                      <tr key={dep.id}>
                        <td className="py-3 px-3 font-mono font-bold text-white">{dep.depositNumber}</td>
                        <td className="py-3 px-3 text-slate-300 font-mono">{dep.userPhone}</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                          {dep.amount.toLocaleString()} {dep.currency}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">{dep.paymentRef}</td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => approveDeposit(dep.id, 'Verified via Admin Quick Action')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:') || 'Invalid UTR';
                              rejectDeposit(dep.id, reason);
                            }}
                            className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DEPOSITS MANAGEMENT */}
      {activeTab === 'deposits' && (
        <div className="p-6 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">Deposit Records Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Deposit #</th>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">UTR / Payment Ref</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Date</th>
                  <th className="py-3 px-3 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {deposits.map((dep) => {
                  const method = methods.find((m) => m.id === dep.methodId);
                  const isApproved = dep.status === 'approved';
                  const isRejected = dep.status === 'rejected';

                  return (
                    <tr key={dep.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-3 font-mono font-bold text-white">{dep.depositNumber}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{dep.userPhone}</td>
                      <td className="py-3 px-3 text-slate-300">
                        <div className="font-semibold text-white">{method?.name || 'UPI / Direct'}</div>
                        {dep.upiChannelType && (
                          <span
                            className={`inline-block text-[10px] font-mono px-1.5 py-0.2 rounded mt-0.5 ${
                              dep.upiChannelType === 'auto'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : dep.upiChannelType === 'wallet_link'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {dep.upiChannelType === 'auto'
                              ? '⚡ Auto Gateway'
                              : dep.upiChannelType === 'wallet_link'
                              ? '3P Wallet'
                              : 'Manual UPI'}
                          </span>
                        )}
                        {dep.isAutoApproved && (
                          <span className="block text-[10px] text-emerald-400 font-bold">⚡ Instant API Credited</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        {dep.amount.toLocaleString()} {dep.currency}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        <span>{dep.paymentRef}</span>
                        {dep.proofImage && (
                          <span className="block text-[10px] text-emerald-400">📎 {dep.proofImage}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isApproved
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isRejected
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {dep.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400 text-[11px]">
                        {new Date(dep.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {dep.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => approveDeposit(dep.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const remark = prompt('Enter rejection reason:') || 'Invalid payment proof';
                                rejectDeposit(dep.id, remark);
                              }}
                              className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-[11px] rounded transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            {dep.adminRemark || 'Processed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WITHDRAWALS MANAGEMENT */}
      {activeTab === 'withdrawals' && (
        <div className="p-6 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">Withdrawal Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="py-3 px-3">WD #</th>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Destination Details</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {withdrawals.map((wd) => {
                  const method = methods.find((m) => m.id === wd.methodId);
                  return (
                    <tr key={wd.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-3 font-mono font-bold text-white">{wd.withdrawalNumber}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{wd.userPhone}</td>
                      <td className="py-3 px-3 text-slate-300">{method?.name}</td>
                      <td className="py-3 px-3 font-mono font-bold text-rose-400">
                        {wd.amount.toLocaleString()} {wd.currency}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{wd.receiverTitle}</div>
                        <div className="font-mono text-emerald-400 text-[11px]">{wd.receiverAccount}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            wd.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : wd.status === 'rejected'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {wd.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {wd.status === 'pending' || wd.status === 'processing' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => updateWithdrawalStatus(wd.id, 'completed', 'Sent successfully')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded transition-colors"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => {
                                const remark = prompt('Enter rejection reason (will refund user):') || 'Details mismatch';
                                updateWithdrawalStatus(wd.id, 'rejected', remark);
                              }}
                              className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-[11px] rounded transition-colors"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            {wd.adminRemark || 'Closed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="p-6 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">Exchange Orders Flow</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Sent Amount</th>
                  <th className="py-3 px-3">Receiving</th>
                  <th className="py-3 px-3">Proof / UTR</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Change Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">{order.orderNumber}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{order.userPhone}</td>
                    <td className="py-3 px-3 font-mono text-white">
                      {order.fromAmount} {order.fromCurrency}
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-400">
                      {order.toAmount} {order.toCurrency}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {order.proofRef || 'Not submitted yet'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-200">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as ExchangeOrderStatus)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1"
                      >
                        <option value="pending_payment">Pending Payment</option>
                        <option value="verifying">Verifying</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <button
                        onClick={() => setActiveOrderToTrack(order)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs rounded"
                      >
                        Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: UPI PAYMENT CHANNELS (3 Distinct Options: Manual UPI, 3P Wallet Link, Auto Gateway) */}
      {activeTab === 'upi_links' && (
        <div className="p-6 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">UPI & Payment Channels Configuration</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  3 OPTIONS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage Option 1 (Manual UPI), Option 2 (3rd-Party Wallet Link), and Option 3 (Auto Gateway with ⚡ FAST tag).
                You can Show, Hide, or set any option to "Not Available Right Now".
              </p>
            </div>
            <button
              onClick={() => {
                const now = new Date();
                const nextMonth = new Date(now.getTime() + 30 * 24 * 3600000);
                setEditingChannel({
                  id: 'upi_opt_' + Date.now(),
                  type: 'manual',
                  title: 'Manual UPI Transfer',
                  subtitle: 'Pay via any UPI app directly to our UPI ID or QR code.',
                  badge: 'MANUAL UPI',
                  vpa: 'official.exchange@upi',
                  gatewayName: 'Direct UPI Clearing',
                  startTime: now.toISOString().slice(0, 16),
                  expiryTime: nextMonth.toISOString().slice(0, 16),
                  availability: 'active',
                  isAutoApproved: false,
                  minDeposit: 500,
                  maxDeposit: 100000,
                  priority: upiChannels.length + 1,
                });
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-md shadow-emerald-950"
            >
              <Plus className="w-4 h-4" />
              <span>Add Payment Channel</span>
            </button>
          </div>

          {/* Quick Info Callout */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-300">
            <div className="space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                How the 3 Deposit Options Work for Clients:
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                <strong className="text-sky-300">1. Manual:</strong> Shows your UPI ID/QR. User pays, enters UTR. You manually approve in Admin Panel.
                <br />
                <strong className="text-amber-300">2. Wallet Link:</strong> Redirects to your 3P merchant wallet. User submits ref. You check 3P wallet and manually approve.
                <br />
                <strong className="text-emerald-300">3. Auto Gateway (⚡ FAST):</strong> Connects to official gaming/provider API (91Jeeto style). Auto-approves & credits user balance instantly!
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[11px] text-slate-400">Total Configured:</span>
              <p className="text-sm font-bold font-mono text-emerald-400">{upiChannels.length} Channels</p>
            </div>
          </div>

          {/* Channels List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upiChannels.map((channel) => {
              const status = getChannelStatus(channel);
              const isActive = status === 'active';
              const isNotAvailable = channel.availability === 'not_available' || status === 'not_available';
              const isHidden = channel.availability === 'hidden';

              return (
                <div
                  key={channel.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
                    isHidden
                      ? 'bg-slate-950/40 border-slate-800 opacity-60'
                      : isNotAvailable
                      ? 'bg-amber-950/15 border-amber-500/30'
                      : 'bg-slate-900/70 border-slate-700/80 shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Type Badge + Availability Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
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
                        <h3 className="text-sm font-bold text-white leading-tight">{channel.title}</h3>
                      </div>

                      {/* Status indicator */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          channel.availability === 'hidden'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : channel.availability === 'not_available'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : status === 'expired'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {channel.availability === 'hidden'
                          ? 'HIDDEN'
                          : channel.availability === 'not_available'
                          ? 'NOT AVAILABLE'
                          : status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {channel.subtitle}
                    </p>

                    {/* Channel Specific Credentials */}
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
                      {channel.type === 'manual' && (
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-sans">UPI ID (VPA):</span>
                          <span className="text-emerald-400 font-bold truncate block">{channel.vpa || 'Not configured'}</span>
                        </div>
                      )}

                      {channel.type === 'wallet_link' && (
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-sans">3P Wallet Link:</span>
                          <span className="text-amber-400 truncate block text-[11px]">{channel.payRedirectUrl || 'Not set'}</span>
                        </div>
                      )}

                      {channel.type === 'auto' && (
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-sans">Gateway Provider URL:</span>
                          <span className="text-emerald-400 truncate block text-[11px]">{channel.payRedirectUrl || 'Not set'}</span>
                          <span className="text-slate-400 text-[10px] block mt-0.5">Engine: {channel.gatewayName}</span>
                        </div>
                      )}

                      <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-sans text-slate-400">
                        <span>Approval:</span>
                        <span className={channel.isAutoApproved ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {channel.isAutoApproved ? '⚡ Instant Auto' : 'Manual Review'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-sans text-slate-400">
                        <span>Limits:</span>
                        <span className="text-slate-200">
                          ₹{channel.minDeposit.toLocaleString()} - ₹{channel.maxDeposit.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Timer Details */}
                    <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Expires:</span>
                        <span className={new Date(channel.expiryTime).getTime() < Date.now() ? 'text-rose-400' : 'text-slate-300'}>
                          {new Date(channel.expiryTime).toLocaleDateString()} {new Date(channel.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {channel.unavailableReason && channel.availability === 'not_available' && (
                        <p className="text-amber-300 text-[10px] italic pt-1 truncate">
                          Note: {channel.unavailableReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Quick State Switchers */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    {/* Quick 1-Click State Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          saveUpiChannel({
                            ...channel,
                            availability: 'active',
                          })
                        }
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                          channel.availability === 'active'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                        title="Show & make available"
                      >
                        Active
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          saveUpiChannel({
                            ...channel,
                            availability: 'not_available',
                            unavailableReason: channel.unavailableReason || 'Option currently offline for maintenance.',
                          })
                        }
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                          channel.availability === 'not_available'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                        title="Mark as Not Available Right Now"
                      >
                        Unavailable
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          saveUpiChannel({
                            ...channel,
                            availability: 'hidden',
                          })
                        }
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                          channel.availability === 'hidden'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                        title="Hide completely from deposit view"
                      >
                        Hide
                      </button>
                    </div>

                    {/* Quick Timer Extender & Edit/Delete */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-slate-500">Timer:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newExpiry = new Date(Date.now() + 7 * 24 * 3600000).toISOString();
                            saveUpiChannel({ ...channel, expiryTime: newExpiry });
                          }}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono"
                          title="Extend timer by 7 days"
                        >
                          +7d
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newExpiry = new Date(Date.now() + 30 * 24 * 3600000).toISOString();
                            saveUpiChannel({ ...channel, expiryTime: newExpiry });
                          }}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono"
                          title="Extend timer by 30 days"
                        >
                          +30d
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingChannel(channel)}
                          className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                          title="Edit full channel configuration"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete channel "${channel.title}"?`)) {
                              deleteUpiChannel(channel.id);
                            }
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 rounded transition-colors"
                          title="Delete channel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EDIT / CONFIGURE UPI CHANNEL MODAL */}
          {editingChannel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="w-full max-w-xl bg-[#0e141c] border border-slate-700 rounded-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Configure Payment Channel Option</h3>
                    <p className="text-[11px] text-slate-400">Edit credentials, timer, availability status, and auto-approval</p>
                  </div>
                  <button onClick={() => setEditingChannel(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Option Type Selector */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Select Option Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingChannel({
                            ...editingChannel,
                            type: 'manual',
                            badge: 'MANUAL UPI',
                            isAutoApproved: false,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left font-bold ${
                          editingChannel.type === 'manual'
                            ? 'bg-sky-950/40 border-sky-500 text-sky-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        1. Manual UPI
                        <span className="block text-[10px] font-normal text-slate-400 mt-0.5">UPI ID + QR + UTR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingChannel({
                            ...editingChannel,
                            type: 'wallet_link',
                            badge: 'WALLET LINK',
                            isAutoApproved: false,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left font-bold ${
                          editingChannel.type === 'wallet_link'
                            ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        2. 3P Wallet Link
                        <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Admin 3P Wallet</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingChannel({
                            ...editingChannel,
                            type: 'auto',
                            badge: '⚡ FAST AUTO',
                            isAutoApproved: true,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left font-bold ${
                          editingChannel.type === 'auto'
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        3. Auto Gateway
                        <span className="block text-[10px] font-normal text-emerald-400 mt-0.5">⚡ FAST Instant</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Display Title</label>
                      <input
                        type="text"
                        value={editingChannel.title || ''}
                        onChange={(e) => setEditingChannel({ ...editingChannel, title: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        placeholder="e.g. Manual UPI Transfer"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Badge Tag</label>
                      <input
                        type="text"
                        value={editingChannel.badge || ''}
                        onChange={(e) => setEditingChannel({ ...editingChannel, badge: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                        placeholder="e.g. MANUAL or ⚡ FAST AUTO"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Subtitle / Explanatory Description</label>
                    <input
                      type="text"
                      value={editingChannel.subtitle || ''}
                      onChange={(e) => setEditingChannel({ ...editingChannel, subtitle: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      placeholder="e.g. Pay via Google Pay, PhonePe, Paytm, or BHIM directly to our UPI ID or QR."
                    />
                  </div>

                  {/* Conditional inputs depending on channel type */}
                  {editingChannel.type === 'manual' && (
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Admin UPI ID / VPA Address</label>
                      <input
                        type="text"
                        value={editingChannel.vpa || ''}
                        onChange={(e) => setEditingChannel({ ...editingChannel, vpa: e.target.value })}
                        placeholder="e.g. yourname@axl or business@okaxis"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                        required
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Users scan this UPI QR or copy this UPI ID to pay you manually.
                      </span>
                    </div>
                  )}

                  {(editingChannel.type === 'wallet_link' || editingChannel.type === 'auto') && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">
                          {editingChannel.type === 'wallet_link'
                            ? '3rd-Party Merchant Wallet Checkout URL'
                            : 'Official Payment Gateway Redirect URL / API'}
                        </label>
                        <input
                          type="text"
                          value={editingChannel.payRedirectUrl || ''}
                          onChange={(e) => setEditingChannel({ ...editingChannel, payRedirectUrl: e.target.value })}
                          placeholder={
                            editingChannel.type === 'wallet_link'
                              ? 'https://p.paytm.me/xCTH/your_wallet'
                              : 'https://gateway.91pay-fast.net/checkout?merchant=upipay'
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">Gateway / Engine Provider Name</label>
                        <input
                          type="text"
                          value={editingChannel.gatewayName || ''}
                          onChange={(e) => setEditingChannel({ ...editingChannel, gatewayName: e.target.value })}
                          placeholder="e.g. 91Jeeto Gateway / Paytm Merchant"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Availability Status: Active | Not Available Right Now | Hidden */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <label className="block text-slate-300 font-semibold">
                      Client Availability Status (Show, Hide, or Mark Unavailable)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingChannel({ ...editingChannel, availability: 'active' })}
                        className={`p-2 rounded-lg border text-center font-bold ${
                          editingChannel.availability === 'active'
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Active (Live)
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingChannel({ ...editingChannel, availability: 'not_available' })}
                        className={`p-2 rounded-lg border text-center font-bold ${
                          editingChannel.availability === 'not_available'
                            ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Not Available
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingChannel({ ...editingChannel, availability: 'hidden' })}
                        className={`p-2 rounded-lg border text-center font-bold ${
                          editingChannel.availability === 'hidden'
                            ? 'bg-slate-800 border-slate-600 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Hidden (Remove)
                      </button>
                    </div>

                    {editingChannel.availability === 'not_available' && (
                      <div className="pt-2">
                        <label className="block text-slate-400 mb-1">Reason Shown to Clients (Optional):</label>
                        <input
                          type="text"
                          value={editingChannel.unavailableReason || ''}
                          onChange={(e) => setEditingChannel({ ...editingChannel, unavailableReason: e.target.value })}
                          placeholder="e.g. Under maintenance / banking limits reached. Please use Manual UPI."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Timers & Limits */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Activation Start Time</label>
                      <input
                        type="datetime-local"
                        value={editingChannel.startTime ? editingChannel.startTime.slice(0, 16) : ''}
                        onChange={(e) =>
                          setEditingChannel({
                            ...editingChannel,
                            startTime: new Date(e.target.value).toISOString(),
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Expiry Timer</label>
                      <input
                        type="datetime-local"
                        value={editingChannel.expiryTime ? editingChannel.expiryTime.slice(0, 16) : ''}
                        onChange={(e) =>
                          setEditingChannel({
                            ...editingChannel,
                            expiryTime: new Date(e.target.value).toISOString(),
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Min Deposit (₹ INR)</label>
                      <input
                        type="number"
                        value={editingChannel.minDeposit || 300}
                        onChange={(e) => setEditingChannel({ ...editingChannel, minDeposit: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Max Deposit (₹ INR)</label>
                      <input
                        type="number"
                        value={editingChannel.maxDeposit || 100000}
                        onChange={(e) => setEditingChannel({ ...editingChannel, maxDeposit: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Auto Approval Toggle */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Instant Gateway Auto-Approval</span>
                      <p className="text-[11px] text-slate-400">
                        Automatically credit user balance upon checkout without requiring manual admin approval
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingChannel.isAutoApproved || false}
                        onChange={(e) => setEditingChannel({ ...editingChannel, isAutoApproved: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setEditingChannel(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editingChannel.title) {
                        saveUpiChannel(editingChannel as UpiChannelOption);
                        setEditingChannel(null);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-950"
                  >
                    Save Channel Configuration
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PAYMENT METHODS */}
      {activeTab === 'methods' && (
        <div className="p-6 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Payment Gateways & Methods</h2>
              <p className="text-xs text-slate-400">
                Configure EasyPaisa, JazzCash, UPI, USDT, and custom mobile banking channels
              </p>
            </div>

            <button
              onClick={() => {
                setEditingMethod({
                  id: 'method_' + Date.now(),
                  code: 'custom',
                  name: 'New Custom Gateway',
                  currency: 'PKR',
                  category: 'mobile_wallet',
                  accountTitle: 'Finance Ops',
                  accountNumber: '03001234567',
                  instructions: 'Send payment and submit transaction ID.',
                  isActive: true,
                  minDeposit: 500,
                  maxDeposit: 100000,
                  minWithdrawal: 1000,
                  maxWithdrawal: 100000,
                  isDepositEnabled: true,
                  isWithdrawalEnabled: true,
                  isExchangeEnabled: true,
                });
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Payment Method</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {methods.map((method) => (
              <div key={method.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{method.name}</h3>
                    <p className="text-xs text-slate-400">
                      Title: <strong className="text-slate-200">{method.accountTitle}</strong>
                    </p>
                    <p className="text-xs font-mono text-emerald-400">{method.accountNumber}</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-emerald-400">
                    {method.currency}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 font-mono">
                  <span>Deposit: {method.isDepositEnabled ? '✓' : '✗'}</span>
                  <span>Withdrawal: {method.isWithdrawalEnabled ? '✓' : '✗'}</span>
                  <span>Exchange: {method.isExchangeEnabled ? '✓' : '✗'}</span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingMethod(method)}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded"
                    title="Edit method"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove method ${method.name}?`)) {
                        deletePaymentMethod(method.id);
                      }
                    }}
                    className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 rounded"
                    title="Delete method"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Edit Method Modal */}
          {editingMethod && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="w-full max-w-lg bg-[#0e141c] border border-slate-700 rounded-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Edit Payment Method</h3>
                  <button onClick={() => setEditingMethod(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Method Name</label>
                    <input
                      type="text"
                      value={editingMethod.name || ''}
                      onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Currency</label>
                      <select
                        value={editingMethod.currency || 'PKR'}
                        onChange={(e) => setEditingMethod({ ...editingMethod, currency: e.target.value as Currency })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        <option value="PKR">PKR</option>
                        <option value="INR">INR</option>
                        <option value="USDT">USDT</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Category</label>
                      <select
                        value={editingMethod.category || 'mobile_wallet'}
                        onChange={(e) => setEditingMethod({ ...editingMethod, category: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        <option value="upi">UPI</option>
                        <option value="mobile_wallet">Mobile Wallet</option>
                        <option value="crypto">Crypto</option>
                        <option value="bank">Bank</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Account Title</label>
                    <input
                      type="text"
                      value={editingMethod.accountTitle || ''}
                      onChange={(e) => setEditingMethod({ ...editingMethod, accountTitle: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Account Number / UPI / Address</label>
                    <input
                      type="text"
                      value={editingMethod.accountNumber || ''}
                      onChange={(e) => setEditingMethod({ ...editingMethod, accountNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Instructions for Sender</label>
                    <textarea
                      value={editingMethod.instructions || ''}
                      onChange={(e) => setEditingMethod({ ...editingMethod, instructions: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Min Deposit</label>
                      <input
                        type="number"
                        value={editingMethod.minDeposit || 0}
                        onChange={(e) => setEditingMethod({ ...editingMethod, minDeposit: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Max Deposit</label>
                      <input
                        type="number"
                        value={editingMethod.maxDeposit || 0}
                        onChange={(e) => setEditingMethod({ ...editingMethod, maxDeposit: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingMethod.isDepositEnabled ?? true}
                        onChange={(e) => setEditingMethod({ ...editingMethod, isDepositEnabled: e.target.checked })}
                      />
                      <span>Deposit Enabled</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingMethod.isWithdrawalEnabled ?? true}
                        onChange={(e) => setEditingMethod({ ...editingMethod, isWithdrawalEnabled: e.target.checked })}
                      />
                      <span>Withdrawal Enabled</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingMethod.isExchangeEnabled ?? true}
                        onChange={(e) => setEditingMethod({ ...editingMethod, isExchangeEnabled: e.target.checked })}
                      />
                      <span>Exchange Enabled</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setEditingMethod(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editingMethod.name && editingMethod.accountNumber) {
                        savePaymentMethod(editingMethod as PaymentMethod);
                        setEditingMethod(null);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500"
                  >
                    Save Method
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: EXCHANGE RATES */}
      {activeTab === 'rates' && (
        <div className="p-6 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Exchange Rates Management</h2>
              <p className="text-xs text-slate-400">
                Configure live conversion rates, fee percentages, and transaction limits
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRate({
                  id: 'rate_' + Date.now(),
                  fromCurrency: 'PKR',
                  toCurrency: 'INR',
                  rate: 0.302,
                  feePercent: 0.5,
                  minAmount: 1000,
                  maxAmount: 250000,
                });
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rate Pair</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rates.map((rate) => (
              <div key={rate.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {rate.fromCurrency} → {rate.toCurrency}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingRate(rate)}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded"
                    title="Edit Rate"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400">Rate:</span>
                  <span className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
                    1 {rate.fromCurrency} = {rate.rate} {rate.toCurrency}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 font-mono">
                  <div>
                    <span className="text-slate-500 block">Fee %:</span>
                    <strong className="text-slate-300">{rate.feePercent}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Min:</span>
                    <strong className="text-slate-300">{rate.minAmount.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Max:</span>
                    <strong className="text-slate-300">{rate.maxAmount.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Edit Rate Modal */}
          {editingRate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="w-full max-w-md bg-[#0e141c] border border-slate-700 rounded-2xl p-6 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Configure Exchange Pair</h3>
                  <button onClick={() => setEditingRate(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">From Currency</label>
                      <select
                        value={editingRate.fromCurrency || 'PKR'}
                        onChange={(e) => setEditingRate({ ...editingRate, fromCurrency: e.target.value as Currency })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        <option value="PKR">PKR</option>
                        <option value="INR">INR</option>
                        <option value="USDT">USDT</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">To Currency</label>
                      <select
                        value={editingRate.toCurrency || 'INR'}
                        onChange={(e) => setEditingRate({ ...editingRate, toCurrency: e.target.value as Currency })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        <option value="PKR">PKR</option>
                        <option value="INR">INR</option>
                        <option value="USDT">USDT</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Exchange Rate (1 From = ? To)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRate.rate || 0}
                      onChange={(e) => setEditingRate({ ...editingRate, rate: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Fee Percentage (%)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingRate.feePercent || 0}
                      onChange={(e) => setEditingRate({ ...editingRate, feePercent: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Min Amount</label>
                      <input
                        type="number"
                        value={editingRate.minAmount || 0}
                        onChange={(e) => setEditingRate({ ...editingRate, minAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Max Amount</label>
                      <input
                        type="number"
                        value={editingRate.maxAmount || 0}
                        onChange={(e) => setEditingRate({ ...editingRate, maxAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setEditingRate(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editingRate.rate) {
                        saveExchangeRate(editingRate as ExchangeRate);
                        setEditingRate(null);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500"
                  >
                    Save Rate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="p-6 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Registered Users Management</h2>
              <p className="text-xs text-slate-400">View demo balances, adjust balances, and toggle activation</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search phone or name..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">PKR Balance</th>
                  <th className="py-3 px-3">INR Balance</th>
                  <th className="py-3 px-3">USDT Balance</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users
                  .filter((u) => {
                    const q = userSearch.toLowerCase();
                    return u.name.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q);
                  })
                  .map((u) => {
                    const isActive = u.status === 'active';
                    return (
                      <tr key={u.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-3 font-semibold text-white">{u.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{u.phone}</td>
                        <td className="py-3 px-3 font-mono uppercase text-slate-400">{u.role}</td>
                        <td className="py-3 px-3 font-mono font-bold text-white">
                          ₨ {u.balances.pkr.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                          ₹ {u.balances.inr.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                          $ {u.balances.usdt.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-400'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-400'
                            }`}
                            title="Click to toggle status"
                          >
                            {u.status}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5">
                          <button
                            onClick={() =>
                              setAdjustingUser({
                                userId: u.id,
                                currency: 'pkr',
                                amount: '5000',
                                type: 'add',
                                note: 'Admin test credit',
                              })
                            }
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded"
                          >
                            Adjust Balance
                          </button>
                          <button
                            onClick={() => switchUser(u.id)}
                            className="px-2 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-[11px] rounded"
                            title="Login as this user"
                          >
                            Impersonate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Adjust User Balance Modal */}
          {adjustingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="w-full max-w-sm bg-[#0e141c] border border-slate-700 rounded-2xl p-6 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Manual Balance Adjustment</h3>
                  <button onClick={() => setAdjustingUser(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Currency</label>
                    <select
                      value={adjustingUser.currency}
                      onChange={(e) => setAdjustingUser({ ...adjustingUser, currency: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="pkr">PKR</option>
                      <option value="inr">INR</option>
                      <option value="usdt">USDT</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustingUser({ ...adjustingUser, type: 'add' })}
                      className={`py-2 rounded-lg font-bold ${
                        adjustingUser.type === 'add'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      + Credit (Add)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustingUser({ ...adjustingUser, type: 'subtract' })}
                      className={`py-2 rounded-lg font-bold ${
                        adjustingUser.type === 'subtract'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      - Debit (Deduct)
                    </button>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Amount</label>
                    <input
                      type="number"
                      value={adjustingUser.amount}
                      onChange={(e) => setAdjustingUser({ ...adjustingUser, amount: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Audit Reason / Note</label>
                    <input
                      type="text"
                      value={adjustingUser.note}
                      onChange={(e) => setAdjustingUser({ ...adjustingUser, note: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setAdjustingUser(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const num = parseFloat(adjustingUser.amount) || 0;
                      if (num > 0) {
                        adjustUserBalance(
                          adjustingUser.userId,
                          adjustingUser.currency,
                          num,
                          adjustingUser.type,
                          adjustingUser.note
                        );
                        setAdjustingUser(null);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500"
                  >
                    Confirm Adjustment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 9: SUPPORT & NOTICE SETTINGS */}
      {activeTab === 'support' && (
        <div className="p-6 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-6">
          <h2 className="text-base font-bold text-white tracking-tight">Support Channels & Notice Banner</h2>

          <div className="space-y-4 max-w-xl text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">WhatsApp Support Number</label>
              <input
                type="text"
                value={localSupport.whatsappNumber}
                onChange={(e) => setLocalSupport({ ...localSupport, whatsappNumber: e.target.value })}
                placeholder="+923001234567"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Telegram Channel / Username</label>
              <input
                type="text"
                value={localSupport.telegramUsername}
                onChange={(e) => setLocalSupport({ ...localSupport, telegramUsername: e.target.value })}
                placeholder="UPIPayExchangeSupport"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Support Email</label>
              <input
                type="email"
                value={localSupport.supportEmail}
                onChange={(e) => setLocalSupport({ ...localSupport, supportEmail: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Operating / Helpline Hours</label>
              <input
                type="text"
                value={localSupport.workingHours}
                onChange={(e) => setLocalSupport({ ...localSupport, workingHours: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-400 mb-1 font-semibold">Top Broadcast Notice Text</label>
              <textarea
                value={localSupport.noticeBanner}
                onChange={(e) => setLocalSupport({ ...localSupport, noticeBanner: e.target.value })}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSupport.isNoticeActive}
                  onChange={(e) => setLocalSupport({ ...localSupport, isNoticeActive: e.target.checked })}
                />
                <span className="text-slate-300 font-semibold">Show Broadcast Notice in Header</span>
              </label>
            </div>

            <button
              onClick={() => updateSupportConfig(localSupport)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors"
            >
              Save Support Configuration
            </button>
          </div>
        </div>
      )}

      {/* TAB 10: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="p-6 bg-[#0e141c] border border-slate-800 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">System Audit Trail</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Admin</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-amber-400">{log.adminPhone}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
