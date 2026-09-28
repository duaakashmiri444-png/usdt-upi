import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Search,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { ExchangeOrderStatus } from '../types';

export const OrdersView: React.FC = () => {
  const { orders, methods, setActiveOrderToTrack, currentUser, setActiveView } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Show user's orders, or all if admin
  const visibleOrders = currentUser?.role === 'admin'
    ? orders
    : orders.filter((o) => o.userId === currentUser?.id);

  const filteredOrders = visibleOrders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.userPhone.toLowerCase().includes(q) ||
        order.receiverDetails.accountOrVpa.toLowerCase().includes(q) ||
        order.receiverDetails.title.toLowerCase().includes(q) ||
        (order.proofRef && order.proofRef.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Exchange Orders</h1>
          <p className="text-xs text-slate-400">
            {currentUser?.role === 'admin'
              ? 'Showing all network exchange orders (Admin View)'
              : 'Track your live and completed cross-border currency conversions'}
          </p>
        </div>

        <button
          onClick={() => setActiveView('exchange')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-colors self-start sm:self-auto"
        >
          <span>New Exchange Order</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID (e.g. EX-8831), Phone, UTR, or Account..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
          {['all', 'pending_payment', 'verifying', 'processing', 'completed', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all' ? 'All Orders' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-[#0e141c] border border-slate-800 rounded-2xl space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Orders Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No exchange orders match your current filter criteria. Create your first conversion now!
          </p>
          <button
            onClick={() => setActiveView('exchange')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <span>Exchange Now</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#0e141c] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">From (Sent)</th>
                  <th className="py-3.5 px-4">To (Received)</th>
                  <th className="py-3.5 px-4">Destination Account</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Created</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((order) => {
                  const fromMethod = methods.find((m) => m.id === order.fromMethodId);
                  const toMethod = methods.find((m) => m.id === order.toMethodId);

                  const isComplete = order.status === 'completed';
                  const isRejected = order.status === 'rejected' || order.status === 'cancelled';
                  const isPending = !isComplete && !isRejected;

                  return (
                    <tr key={order.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-white tabular-nums">
                          {order.fromAmount.toLocaleString()} {order.fromCurrency}
                        </div>
                        <span className="text-[11px] text-slate-400">{fromMethod?.name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-emerald-400 tabular-nums">
                          {order.toAmount.toLocaleString()} {order.toCurrency}
                        </div>
                        <span className="text-[11px] text-slate-400">{toMethod?.name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{order.receiverDetails.title}</div>
                        <div className="font-mono text-[11px] text-slate-400 truncate max-w-[160px]">
                          {order.receiverDetails.accountOrVpa}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            isComplete
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveOrderToTrack(order)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-emerald-400 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
