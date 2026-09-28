import {
  User,
  PaymentMethod,
  ExchangeRate,
  UpiChannelOption,
  UpiChannelType,
  ChannelAvailability,
  ExchangeOrder,
  Deposit,
  Withdrawal,
  SupportConfig,
  AuditLog,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'upipay_users',
  CURRENT_USER_ID: 'upipay_current_user_id',
  METHODS: 'upipay_methods',
  RATES: 'upipay_rates',
  UPI_CHANNELS: 'upipay_upi_channels_v2',
  ORDERS: 'upipay_orders',
  DEPOSITS: 'upipay_deposits',
  WITHDRAWALS: 'upipay_withdrawals',
  SUPPORT: 'upipay_support',
  AUDIT_LOGS: 'upipay_audit_logs',
};

// Password hashing utility using standard Web Crypto API
export async function hashPassword(plainText: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText + '_upipay_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple hash if subtle crypto fails
    let hash = 0;
    for (let i = 0; i < plainText.length; i++) {
      hash = (hash << 5) - hash + plainText.charCodeAt(i);
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }
}

// Initial default seed users
const INITIAL_USERS: User[] = [
  {
    id: 'user_admin',
    name: 'Platform Administrator',
    phone: '+923000000000',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // 'admin123'
    role: 'admin',
    status: 'active',
    balances: {
      pkr: 1250000,
      inr: 450000,
      usdt: 5800,
    },
    createdAt: '2026-01-15T10:00:00.000Z',
    lastLoginAt: '2026-09-28T12:00:00.000Z',
  },
  {
    id: 'user_hamza',
    name: 'Hamza Khan',
    phone: '+923123456789',
    passwordHash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', // 'password123'
    role: 'user',
    status: 'active',
    balances: {
      pkr: 48500,
      inr: 14200,
      usdt: 240,
    },
    createdAt: '2026-02-10T14:30:00.000Z',
    lastLoginAt: '2026-09-28T09:15:00.000Z',
  },
  {
    id: 'user_rohit',
    name: 'Rohit Sharma',
    phone: '+919876543210',
    passwordHash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', // 'password123'
    role: 'user',
    status: 'active',
    balances: {
      pkr: 12000,
      inr: 32500,
      usdt: 185,
    },
    createdAt: '2026-03-01T11:20:00.000Z',
    lastLoginAt: '2026-09-28T11:00:00.000Z',
  },
];

// Initial Payment Methods
const INITIAL_METHODS: PaymentMethod[] = [
  {
    id: 'method_upi',
    code: 'upi',
    name: 'UPI (Unified Payments Interface)',
    currency: 'INR',
    category: 'upi',
    accountTitle: 'UPI-Pay Official Gateway',
    accountNumber: 'fastpay.exchange@axl',
    instructions:
      'Click the "Pay via UPI" button to launch your UPI app (Google Pay, PhonePe, Paytm, BHIM) or scan the generated QR code. Submit your 12-digit UTR after payment.',
    isActive: true,
    minDeposit: 300,
    maxDeposit: 100000,
    minWithdrawal: 500,
    maxWithdrawal: 100000,
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isExchangeEnabled: true,
  },
  {
    id: 'method_easypaisa',
    code: 'easypaisa',
    name: 'EasyPaisa Pakistan',
    currency: 'PKR',
    category: 'mobile_wallet',
    accountTitle: 'Muhammad Ali (Admin Finance)',
    accountNumber: '03451234567',
    instructions:
      'Transfer funds to EasyPaisa Mobile Account 03451234567. Use your phone number as transaction reference, then provide the 3737 confirmation SMS ID / TxID.',
    isActive: true,
    minDeposit: 500,
    maxDeposit: 250000,
    minWithdrawal: 1000,
    maxWithdrawal: 250000,
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isExchangeEnabled: true,
  },
  {
    id: 'method_jazzcash',
    code: 'jazzcash',
    name: 'JazzCash Pakistan',
    currency: 'PKR',
    category: 'mobile_wallet',
    accountTitle: 'Muhammad Ali (Exchange Desk)',
    accountNumber: '03009876543',
    instructions:
      'Transfer funds to JazzCash Account 03009876543. Enter TID received in SMS from 8558 as proof.',
    isActive: true,
    minDeposit: 500,
    maxDeposit: 250000,
    minWithdrawal: 1000,
    maxWithdrawal: 250000,
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isExchangeEnabled: true,
  },
  {
    id: 'method_usdt_trc20',
    code: 'usdt_trc20',
    name: 'USDT (Tether TRC20)',
    currency: 'USDT',
    category: 'crypto',
    accountTitle: 'UPI-Pay Hot Wallet (TRON)',
    accountNumber: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
    instructions:
      'Send only USDT over TRC-20 network to the address above. Provide TxHash (Blockchain Transaction Hash) after broadcast.',
    isActive: true,
    minDeposit: 10,
    maxDeposit: 50000,
    minWithdrawal: 15,
    maxWithdrawal: 50000,
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isExchangeEnabled: true,
  },
  {
    id: 'method_usdt_bep20',
    code: 'usdt_bep20',
    name: 'USDT (BNB Smart Chain BEP20)',
    currency: 'USDT',
    category: 'crypto',
    accountTitle: 'UPI-Pay BSC Vault',
    accountNumber: '0x71C...84e1',
    instructions:
      'Send USDT on BEP-20 (BSC) network. Instant confirmation after 15 block confirmations.',
    isActive: true,
    minDeposit: 10,
    maxDeposit: 50000,
    minWithdrawal: 15,
    maxWithdrawal: 50000,
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isExchangeEnabled: true,
  },
  {
    id: 'method_bank_pkr',
    code: 'bank_transfer',
    name: 'Meezan / HBL Bank Pakistan',
    currency: 'PKR',
    category: 'bank',
    accountTitle: 'UPI-Pay Tech Solutions',
    accountNumber: '0201010892837192',
    instructions:
      'Transfer via Raast / 1Link IBFT. Raast ID: 03000000000. Attach transaction slip or Raast ref ID.',
    isActive: true,
    minDeposit: 2000,
    maxDeposit: 500000,
    minWithdrawal: 2000,
    maxWithdrawal: 500000,
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isExchangeEnabled: true,
  },
];

// Initial Exchange Rates
const INITIAL_RATES: ExchangeRate[] = [
  {
    id: 'rate_pkr_inr',
    fromCurrency: 'PKR',
    toCurrency: 'INR',
    rate: 0.302, // 1000 PKR = 302 INR
    feePercent: 0.5,
    minAmount: 1000,
    maxAmount: 250000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rate_inr_pkr',
    fromCurrency: 'INR',
    toCurrency: 'PKR',
    rate: 3.31, // 100 INR = 331 PKR
    feePercent: 0.5,
    minAmount: 300,
    maxAmount: 75000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rate_pkr_usdt',
    fromCurrency: 'PKR',
    toCurrency: 'USDT',
    rate: 0.00358, // 1 USDT = ~279.3 PKR
    feePercent: 0.25,
    minAmount: 2800,
    maxAmount: 500000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rate_usdt_pkr',
    fromCurrency: 'USDT',
    toCurrency: 'PKR',
    rate: 278.2,
    feePercent: 0.25,
    minAmount: 10,
    maxAmount: 2000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rate_inr_usdt',
    fromCurrency: 'INR',
    toCurrency: 'USDT',
    rate: 0.0116, // 1 USDT = ~86.2 INR
    feePercent: 0.3,
    minAmount: 500,
    maxAmount: 150000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rate_usdt_inr',
    fromCurrency: 'USDT',
    toCurrency: 'INR',
    rate: 85.8,
    feePercent: 0.3,
    minAmount: 10,
    maxAmount: 2000,
    updatedAt: new Date().toISOString(),
  },
];

// Initial 3-Tier UPI Deposit Channels as requested:
// 1. Manual UPI (UPI ID / QR + UTR, manual admin approval)
// 2. 3rd-Party Wallet Link (Wallet redirect, manual admin approval)
// 3. Auto UPI Gateway (⚡ FAST AUTO - official provider gaming/casino style gateway, instant auto-approval!)
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

export const INITIAL_UPI_CHANNELS: UpiChannelOption[] = [
  {
    id: 'upi_opt_manual',
    type: 'manual',
    title: 'Manual UPI (Official UPI ID)',
    subtitle: 'Send payment via Google Pay, PhonePe, Paytm, or BHIM directly to our UPI ID or QR. Enter 12-digit UTR for review.',
    badge: 'MANUAL UPI',
    vpa: 'fastpay.exchange@axl',
    gatewayName: 'Direct UPI Clearing',
    startTime: yesterday.toISOString(),
    expiryTime: nextMonth.toISOString(),
    availability: 'active',
    isAutoApproved: false,
    minDeposit: 300,
    maxDeposit: 100000,
    priority: 1,
  },
  {
    id: 'upi_opt_wallet_link',
    type: 'wallet_link',
    title: '3rd-Party Wallet Link',
    subtitle: 'Click link to pay through our third-party wallet gateway. Once paid, submit transaction reference for manual approval.',
    badge: 'WALLET LINK',
    payRedirectUrl: 'https://p.paytm.me/xCTH/upipay_wallet',
    gatewayName: 'Paytm / 3P Wallet Merchant',
    startTime: yesterday.toISOString(),
    expiryTime: nextMonth.toISOString(),
    availability: 'active',
    isAutoApproved: false,
    minDeposit: 500,
    maxDeposit: 50000,
    priority: 2,
  },
  {
    id: 'upi_opt_auto_gateway',
    type: 'auto',
    title: '⚡ Auto UPI Payment Gateway',
    subtitle: 'High-speed automated provider gateway (91jeeto / gaming site deposit rail). Verified & auto-credited immediately!',
    badge: '⚡ FAST AUTO',
    gatewayName: '91Pay Auto-Settlement Engine',
    payRedirectUrl: 'https://gateway.91pay-fast.net/checkout?merchant=upipay_official',
    startTime: yesterday.toISOString(),
    expiryTime: nextMonth.toISOString(),
    availability: 'active', // can be toggled to 'not_available' or 'hidden'
    unavailableReason: 'Auto Gateway API in maintenance. Please use Manual UPI or 3P Wallet link.',
    isAutoApproved: true,
    minDeposit: 500,
    maxDeposit: 200000,
    priority: 3,
  },
];

// Initial Seed Orders
const INITIAL_ORDERS: ExchangeOrder[] = [
  {
    id: 'order_1',
    orderNumber: 'EX-8831',
    userId: 'user_hamza',
    userPhone: '+923123456789',
    fromMethodId: 'method_easypaisa',
    fromCurrency: 'PKR',
    fromAmount: 15000,
    toMethodId: 'method_upi',
    toCurrency: 'INR',
    toAmount: 4507.5,
    exchangeRate: 0.302,
    feeAmount: 22.5,
    receiverDetails: {
      title: 'Aarav Patel',
      accountOrVpa: 'aarav.patel@okaxis',
      notes: 'Transfer urgent please',
    },
    status: 'completed',
    proofRef: 'EP-902819284',
    createdAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
    updatedAt: new Date(now.getTime() - 2.5 * 3600000).toISOString(),
    completedAt: new Date(now.getTime() - 2.5 * 3600000).toISOString(),
    adminNote: 'Verified on EasyPaisa statement and transferred via Axis UPI.',
  },
  {
    id: 'order_2',
    orderNumber: 'EX-8832',
    userId: 'user_rohit',
    userPhone: '+919876543210',
    fromMethodId: 'method_upi',
    fromCurrency: 'INR',
    fromAmount: 5000,
    toMethodId: 'method_easypaisa',
    toCurrency: 'PKR',
    toAmount: 16467.25,
    exchangeRate: 3.31,
    feeAmount: 82.75,
    receiverDetails: {
      title: 'Tariq Mehmood',
      accountOrVpa: '03459812734',
      notes: 'EasyPaisa account',
    },
    status: 'processing',
    proofRef: 'UTR-629810398210',
    createdAt: new Date(now.getTime() - 45 * 60000).toISOString(),
    updatedAt: new Date(now.getTime() - 20 * 60000).toISOString(),
    adminNote: 'UTR confirmed. Dispatching to EasyPaisa wallet queue.',
  },
  {
    id: 'order_3',
    orderNumber: 'EX-8833',
    userId: 'user_hamza',
    userPhone: '+923123456789',
    fromMethodId: 'method_jazzcash',
    fromCurrency: 'PKR',
    fromAmount: 28000,
    toMethodId: 'method_usdt_trc20',
    toCurrency: 'USDT',
    toAmount: 99.98,
    exchangeRate: 0.00358,
    feeAmount: 0.25,
    receiverDetails: {
      title: 'Hamza Binance TRC20',
      accountOrVpa: 'TLP9WJb6oQyC9yZ8Qz8N41c3LKn117sP9b',
    },
    status: 'verifying',
    proofRef: 'JC-8192038102',
    createdAt: new Date(now.getTime() - 15 * 60000).toISOString(),
    updatedAt: new Date(now.getTime() - 15 * 60000).toISOString(),
  },
];

// Initial Seed Deposits
const INITIAL_DEPOSITS: Deposit[] = [
  {
    id: 'dep_1',
    depositNumber: 'DEP-1042',
    userId: 'user_rohit',
    userPhone: '+919876543210',
    methodId: 'method_upi',
    currency: 'INR',
    amount: 10000,
    upiLinkId: 'upi_link_primary_axis',
    paymentRef: 'UPI-UTR-901827461902',
    status: 'approved',
    adminRemark: 'Auto-verified with Axis bank gateway feed.',
    createdAt: new Date(now.getTime() - 12 * 3600000).toISOString(),
    updatedAt: new Date(now.getTime() - 11.8 * 3600000).toISOString(),
  },
  {
    id: 'dep_2',
    depositNumber: 'DEP-1043',
    userId: 'user_hamza',
    userPhone: '+923123456789',
    methodId: 'method_easypaisa',
    currency: 'PKR',
    amount: 25000,
    paymentRef: 'EP-471928374',
    status: 'approved',
    adminRemark: 'EasyPaisa 3737 SMS verified.',
    createdAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
    updatedAt: new Date(now.getTime() - 7.5 * 3600000).toISOString(),
  },
  {
    id: 'dep_3',
    depositNumber: 'DEP-1044',
    userId: 'user_rohit',
    userPhone: '+919876543210',
    methodId: 'method_upi',
    currency: 'INR',
    amount: 7500,
    upiLinkId: 'upi_link_primary_axis',
    paymentRef: 'UTR-381920491823',
    status: 'pending',
    createdAt: new Date(now.getTime() - 25 * 60000).toISOString(),
    updatedAt: new Date(now.getTime() - 25 * 60000).toISOString(),
  },
];

// Initial Seed Withdrawals
const INITIAL_WITHDRAWALS: Withdrawal[] = [
  {
    id: 'wd_1',
    withdrawalNumber: 'WD-201',
    userId: 'user_hamza',
    userPhone: '+923123456789',
    methodId: 'method_easypaisa',
    currency: 'PKR',
    amount: 10000,
    receiverTitle: 'Hamza Khan',
    receiverAccount: '03123456789',
    status: 'completed',
    adminRemark: 'Sent via EasyPaisa TxID 991820491',
    createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
    updatedAt: new Date(now.getTime() - 23 * 3600000).toISOString(),
  },
  {
    id: 'wd_2',
    withdrawalNumber: 'WD-202',
    userId: 'user_rohit',
    userPhone: '+919876543210',
    methodId: 'method_upi',
    currency: 'INR',
    amount: 5000,
    receiverTitle: 'Rohit Sharma',
    receiverAccount: 'rohit@okaxis',
    status: 'pending',
    createdAt: new Date(now.getTime() - 50 * 60000).toISOString(),
    updatedAt: new Date(now.getTime() - 50 * 60000).toISOString(),
  },
];

// Initial Support Config
const INITIAL_SUPPORT: SupportConfig = {
  whatsappNumber: '+923001234567',
  telegramUsername: 'UPIPayExchangeSupport',
  supportEmail: 'support@upipayexchange.com',
  workingHours: '24/7 Live Processing (Instant Orders within 2-15 mins)',
  noticeBanner: '🚀 Instant UPI, EasyPaisa, JazzCash & USDT Deposits & Transfers are Active 24/7. Auto-credit enabled for verified UTRs.',
  isNoticeActive: true,
};

// Initial Audit Logs
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit_1',
    adminPhone: '+923000000000',
    action: 'System Initialized',
    details: 'Initial payment gateways (UPI, EasyPaisa, JazzCash, USDT) registered.',
    timestamp: '2026-09-28T08:00:00.000Z',
  },
  {
    id: 'audit_2',
    adminPhone: '+923000000000',
    action: 'Approve Deposit',
    details: 'Approved DEP-1042 for 10,000 INR from user +919876543210.',
    timestamp: '2026-09-28T10:15:00.000Z',
  },
];

// Helper to safely load or initialize storage
function loadItem<T>(key: string, defaultVal: T): T {
  try {
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(val);
  } catch {
    return defaultVal;
  }
}

function saveItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage save error:', err);
  }
}

// Public API for Storage
export const storageService = {
  getUsers(): User[] {
    return loadItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },
  saveUsers(users: User[]): void {
    saveItem(STORAGE_KEYS.USERS, users);
  },

  getCurrentUserId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user_hamza'; // default to user_hamza for easy immediate preview
  },
  setCurrentUserId(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  },

  getMethods(): PaymentMethod[] {
    return loadItem<PaymentMethod[]>(STORAGE_KEYS.METHODS, INITIAL_METHODS);
  },
  saveMethods(methods: PaymentMethod[]): void {
    saveItem(STORAGE_KEYS.METHODS, methods);
  },

  getRates(): ExchangeRate[] {
    return loadItem<ExchangeRate[]>(STORAGE_KEYS.RATES, INITIAL_RATES);
  },
  saveRates(rates: ExchangeRate[]): void {
    saveItem(STORAGE_KEYS.RATES, rates);
  },

  getUpiChannels(): UpiChannelOption[] {
    return loadItem<UpiChannelOption[]>(STORAGE_KEYS.UPI_CHANNELS, INITIAL_UPI_CHANNELS);
  },
  saveUpiChannels(channels: UpiChannelOption[]): void {
    saveItem(STORAGE_KEYS.UPI_CHANNELS, channels);
  },

  getOrders(): ExchangeOrder[] {
    return loadItem<ExchangeOrder[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },
  saveOrders(orders: ExchangeOrder[]): void {
    saveItem(STORAGE_KEYS.ORDERS, orders);
  },

  getDeposits(): Deposit[] {
    return loadItem<Deposit[]>(STORAGE_KEYS.DEPOSITS, INITIAL_DEPOSITS);
  },
  saveDeposits(deposits: Deposit[]): void {
    saveItem(STORAGE_KEYS.DEPOSITS, deposits);
  },

  getWithdrawals(): Withdrawal[] {
    return loadItem<Withdrawal[]>(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
  },
  saveWithdrawals(withdrawals: Withdrawal[]): void {
    saveItem(STORAGE_KEYS.WITHDRAWALS, withdrawals);
  },

  getSupport(): SupportConfig {
    return loadItem<SupportConfig>(STORAGE_KEYS.SUPPORT, INITIAL_SUPPORT);
  },
  saveSupport(support: SupportConfig): void {
    saveItem(STORAGE_KEYS.SUPPORT, support);
  },

  getAuditLogs(): AuditLog[] {
    return loadItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },
  saveAuditLogs(logs: AuditLog[]): void {
    saveItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  resetAll(): void {
    localStorage.clear();
    location.reload();
  },
};

// Check availability and time validity for a UPI Channel Option
export function getChannelStatus(
  channel: UpiChannelOption
): 'active' | 'not_available' | 'hidden' | 'expired' | 'future' {
  if (channel.availability === 'hidden') return 'hidden';
  if (channel.availability === 'not_available') return 'not_available';

  const nowTime = Date.now();
  const startTime = new Date(channel.startTime).getTime();
  const expiryTime = new Date(channel.expiryTime).getTime();

  if (nowTime < startTime) return 'future';
  if (nowTime > expiryTime) return 'expired';
  return 'active';
}

export function isChannelPayable(channel: UpiChannelOption): boolean {
  return getChannelStatus(channel) === 'active';
}

export function getUpiLinkStatus(
  channel: UpiChannelOption
): 'active' | 'not_available' | 'hidden' | 'expired' | 'future' {
  return getChannelStatus(channel);
}
