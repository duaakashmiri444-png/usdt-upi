export type Currency = 'PKR' | 'INR' | 'USDT' | 'USD';

export type PaymentCategory = 'upi' | 'mobile_wallet' | 'crypto' | 'bank';

export type UpiChannelType = 'manual' | 'wallet_link' | 'auto';

export type ChannelAvailability = 'active' | 'hidden' | 'not_available';

export interface UserBalances {
  pkr: number;
  inr: number;
  usdt: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  balances: UserBalances;
  createdAt: string;
  lastLoginAt: string;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  currency: Currency;
  category: PaymentCategory;
  accountTitle: string;
  accountNumber: string;
  instructions: string;
  isActive: boolean;
  minDeposit: number;
  maxDeposit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  isDepositEnabled: boolean;
  isWithdrawalEnabled: boolean;
  isExchangeEnabled: boolean;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  feePercent: number;
  minAmount: number;
  maxAmount: number;
  updatedAt: string;
}

export interface UpiChannelOption {
  id: string;
  type: UpiChannelType; // 'manual' | 'wallet_link' | 'auto'
  title: string;
  subtitle: string;
  badge: string; // e.g. 'MANUAL', 'WALLET LINK', '⚡ FAST AUTO'
  vpa?: string; // For manual UPI
  payRedirectUrl?: string; // For wallet link or auto gateway redirect
  gatewayName?: string;
  startTime: string; // ISO string
  expiryTime: string; // ISO string
  availability: ChannelAvailability; // 'active' | 'hidden' | 'not_available'
  unavailableReason?: string; // e.g. 'Under Maintenance - Back at 6 PM'
  isAutoApproved: boolean; // true for auto gateway
  minDeposit: number;
  maxDeposit: number;
  priority: number;
  isActive?: boolean;
  isBackup?: boolean;
}

export type UpiPaymentLink = UpiChannelOption;

export type ExchangeOrderStatus =
  | 'pending_payment'
  | 'verifying'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface ReceiverDetails {
  title: string;
  accountOrVpa: string;
  notes?: string;
}

export interface ExchangeOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userPhone: string;
  fromMethodId: string;
  fromCurrency: Currency;
  fromAmount: number;
  toMethodId: string;
  toCurrency: Currency;
  toAmount: number;
  exchangeRate: number;
  feeAmount: number;
  receiverDetails: ReceiverDetails;
  status: ExchangeOrderStatus;
  proofRef?: string;
  proofImage?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type DepositStatus = 'pending' | 'approved' | 'rejected';

export interface Deposit {
  id: string;
  depositNumber: string;
  userId: string;
  userPhone: string;
  methodId: string;
  currency: Currency;
  amount: number;
  upiChannelType?: UpiChannelType;
  upiChannelId?: string;
  upiLinkId?: string;
  paymentRef: string; // UTR or TxHash
  proofImage?: string;
  status: DepositStatus;
  isAutoApproved?: boolean;
  adminRemark?: string;
  createdAt: string;
  updatedAt: string;
}

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface Withdrawal {
  id: string;
  withdrawalNumber: string;
  userId: string;
  userPhone: string;
  methodId: string;
  currency: Currency;
  amount: number;
  receiverTitle: string;
  receiverAccount: string;
  status: WithdrawalStatus;
  adminRemark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportConfig {
  whatsappNumber: string;
  telegramUsername: string;
  supportEmail: string;
  workingHours: string;
  noticeBanner: string;
  isNoticeActive: boolean;
}

export interface AuditLog {
  id: string;
  adminPhone: string;
  action: string;
  details: string;
  timestamp: string;
}
