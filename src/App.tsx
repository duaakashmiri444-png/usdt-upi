import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { RatesTicker } from './components/RatesTicker';
import { NoticeBanner } from './components/NoticeBanner';
import { ExchangeCalculator } from './components/ExchangeCalculator';
import { WalletView } from './components/WalletView';
import { OrdersView } from './components/OrdersView';
import { AdminPanel } from './components/AdminPanel';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { UpiGatewayModal } from './components/UpiGatewayModal';
import { AuthModal } from './components/AuthModal';
import { SupportModal } from './components/SupportModal';
import { ToastContainer } from './components/ToastContainer';
import { ShieldCheck, Heart, ExternalLink, Headphones, ArrowLeftRight } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeView, setActiveView, setIsSupportModalOpen } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#090d12] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Bar with 3-Zone Contract */}
      <Navbar />

      {/* Broadcast Notice from Admin */}
      <NoticeBanner />

      {/* Live Market & Rate Ticker */}
      <RatesTicker />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'exchange' && <ExchangeCalculator />}
        {activeView === 'wallet' && <WalletView />}
        {activeView === 'orders' && <OrdersView />}
        {activeView === 'admin' && <AdminPanel />}
        {activeView === 'deposit' && <WalletView />}
      </main>

      {/* Modals & Dialogs */}
      <DepositModal />
      <WithdrawModal />
      <OrderTrackerModal />
      <UpiGatewayModal />
      <AuthModal />
      <SupportModal />
      <ToastContainer />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b0f] text-xs text-slate-500 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-white font-bold tracking-tight">
              <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                UP
              </div>
              <span>UPI-Pay Exchange</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-slate-400 font-medium">
              <button onClick={() => setActiveView('exchange')} className="hover:text-emerald-400 transition-colors">
                Exchange
              </button>
              <button onClick={() => setActiveView('wallet')} className="hover:text-emerald-400 transition-colors">
                Multi-Currency Wallet
              </button>
              <button onClick={() => setActiveView('orders')} className="hover:text-emerald-400 transition-colors">
                Track Order
              </button>
              <button onClick={() => setActiveView('admin')} className="hover:text-amber-400 transition-colors">
                Admin Panel
              </button>
              <button onClick={() => setIsSupportModalOpen(true)} className="hover:text-emerald-400 transition-colors">
                24/7 Support Desk
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <p>© 2026 UPI-Pay Exchange Platform. High-speed settlement engine for UPI, EasyPaisa, JazzCash & USDT.</p>
            <div className="flex items-center gap-4 text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 256-bit TLS Encrypted
              </span>
              <span>·</span>
              <span>All rights reserved</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
