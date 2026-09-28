import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeftRight,
  Wallet,
  ArrowDownToLine,
  FileText,
  ShieldCheck,
  Headphones,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    users,
    switchUser,
    logout,
    activeView,
    setActiveView,
    setIsAuthModalOpen,
    setIsSupportModalOpen,
    setIsDepositModalOpen,
    isAdmin,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090d12]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => setActiveView('exchange')}
          className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors flex items-center gap-2 shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm">
            UP
          </div>
          <span className="whitespace-nowrap font-extrabold tracking-tight">
            UPI-Pay <span className="text-emerald-400 font-semibold">Exchange</span>
          </span>
        </button>

        {/* Zone 2: 4-6 Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveView('exchange')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeView === 'exchange'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Exchange
          </button>

          <button
            onClick={() => setActiveView('wallet')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeView === 'wallet'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Wallet
          </button>

          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors whitespace-nowrap rounded-md flex items-center gap-1.5"
          >
            Deposit
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveView('orders')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeView === 'orders'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Orders
          </button>

          <button
            onClick={() => setActiveView('admin')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded-md flex items-center gap-1 ${
              activeView === 'admin'
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>

          <button
            onClick={() => setIsSupportModalOpen(true)}
            className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors whitespace-nowrap rounded-md"
          >
            Support
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors text-left"
              >
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[110px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 tabular-nums">
                    {currentUser.balances.pkr.toLocaleString()} PKR
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
                  {currentUser.role === 'admin' ? 'A' : currentUser.name.charAt(0)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-[#0d131a] border border-slate-800 rounded-xl shadow-2xl z-40 py-2 divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5">
                      <p className="text-xs font-semibold text-white">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{currentUser.phone}</p>
                      <div className="mt-2 grid grid-cols-3 gap-1.5 p-2 bg-slate-950/60 rounded-lg text-center font-mono">
                        <div>
                          <p className="text-[10px] text-slate-500">PKR</p>
                          <p className="text-xs font-bold text-slate-200 tabular-nums">
                            {currentUser.balances.pkr.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">INR</p>
                          <p className="text-xs font-bold text-slate-200 tabular-nums">
                            {currentUser.balances.inr.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">USDT</p>
                          <p className="text-xs font-bold text-emerald-400 tabular-nums">
                            {currentUser.balances.usdt.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Demo Switcher */}
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
                        <span>Quick Persona Switch</span>
                        <Sparkles className="w-3 h-3 text-amber-400" />
                      </div>
                      <div className="space-y-1">
                        {users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchUser(u.id);
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
                              currentUser.id === u.id
                                ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span className="truncate">{u.name}</span>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">
                              {u.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-emerald-950"
            >
              Sign In / Register
            </button>
          )}

          {/* Quick Mobile Support CTA */}
          <button
            onClick={() => setIsSupportModalOpen(true)}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
            aria-label="Live Support"
          >
            <Headphones className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-[#090d12] px-2 py-1 text-xs">
        <button
          onClick={() => setActiveView('exchange')}
          className={`flex flex-col items-center py-1.5 px-2 rounded font-medium ${
            activeView === 'exchange' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 mb-0.5" />
          <span>Exchange</span>
        </button>
        <button
          onClick={() => setActiveView('wallet')}
          className={`flex flex-col items-center py-1.5 px-2 rounded font-medium ${
            activeView === 'wallet' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Wallet className="w-4 h-4 mb-0.5" />
          <span>Wallet</span>
        </button>
        <button
          onClick={() => setIsDepositModalOpen(true)}
          className="flex flex-col items-center py-1.5 px-2 rounded font-medium text-emerald-400"
        >
          <ArrowDownToLine className="w-4 h-4 mb-0.5" />
          <span>Deposit</span>
        </button>
        <button
          onClick={() => setActiveView('orders')}
          className={`flex flex-col items-center py-1.5 px-2 rounded font-medium ${
            activeView === 'orders' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span>Orders</span>
        </button>
        <button
          onClick={() => setActiveView('admin')}
          className={`flex flex-col items-center py-1.5 px-2 rounded font-medium ${
            activeView === 'admin' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4 mb-0.5" />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
};
