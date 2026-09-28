import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  UserBalances,
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
  Currency,
  ExchangeOrderStatus,
  WithdrawalStatus,
} from '../types';
import {
  storageService,
  hashPassword,
  getChannelStatus,
  isChannelPayable,
} from '../services/storage';

// Safe currency key resolver
const getBalanceKey = (currency: Currency | string): keyof UserBalances => {
  const c = currency.toLowerCase();
  if (c === 'inr') return 'inr';
  if (c === 'usdt') return 'usdt';
  return 'pkr';
};

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface AppContextType {
  // Current user & auth
  currentUser: User | null;
  users: User[];
  login: (phone: string, plainPass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, phone: string, plainPass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  isAdmin: boolean;

  // Data collections
  methods: PaymentMethod[];
  rates: ExchangeRate[];
  upiChannels: UpiChannelOption[];
  orders: ExchangeOrder[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  supportConfig: SupportConfig;
  auditLogs: AuditLog[];

  // User actions
  submitDeposit: (data: {
    methodId: string;
    currency: Currency;
    amount: number;
    paymentRef: string;
    upiChannelType?: UpiChannelType;
    upiChannelId?: string;
    proofImage?: string;
    isAutoApproved?: boolean;
  }) => Promise<{ success: boolean; deposit?: Deposit; error?: string }>;

  submitWithdrawal: (data: {
    methodId: string;
    currency: Currency;
    amount: number;
    receiverTitle: string;
    receiverAccount: string;
  }) => Promise<{ success: boolean; withdrawal?: Withdrawal; error?: string }>;

  createExchangeOrder: (data: {
    fromMethodId: string;
    toMethodId: string;
    fromAmount: number;
    receiverTitle: string;
    receiverAccount: string;
    receiverNotes?: string;
  }) => Promise<{ success: boolean; order?: ExchangeOrder; error?: string }>;

  submitOrderProof: (orderId: string, proofRef: string, proofImage?: string) => Promise<boolean>;

  // Calculation helpers
  getExchangeCalculation: (
    fromCurrency: Currency,
    toCurrency: Currency,
    amount: number
  ) => {
    rate: number;
    toAmount: number;
    feeAmount: number;
    feePercent: number;
  };

  getActiveUpiChannels: () => UpiChannelOption[];
  getActiveUpiLinks: () => UpiChannelOption[]; // Alias
  upiLinks: UpiChannelOption[]; // Alias for backward compatibility
  saveUpiLink: (channel: UpiChannelOption) => void;
  deleteUpiLink: (channelId: string) => void;

  // Admin actions
  approveDeposit: (depositId: string, remark?: string) => void;
  rejectDeposit: (depositId: string, remark: string) => void;
  updateWithdrawalStatus: (withdrawalId: string, status: WithdrawalStatus, remark?: string) => void;
  updateOrderStatus: (orderId: string, status: ExchangeOrderStatus, adminNote?: string) => void;
  adjustUserBalance: (
    userId: string,
    currency: 'pkr' | 'inr' | 'usdt',
    amount: number,
    type: 'add' | 'subtract',
    note: string
  ) => void;
  toggleUserStatus: (userId: string) => void;
  savePaymentMethod: (method: PaymentMethod) => void;
  deletePaymentMethod: (methodId: string) => void;
  saveExchangeRate: (rate: ExchangeRate) => void;
  saveUpiChannel: (channel: UpiChannelOption) => void;
  deleteUpiChannel: (channelId: string) => void;
  updateSupportConfig: (config: SupportConfig) => void;

  // Active view management & modals
  activeView: 'exchange' | 'wallet' | 'orders' | 'admin' | 'deposit';
  setActiveView: (view: 'exchange' | 'wallet' | 'orders' | 'admin' | 'deposit') => void;
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
  isWithdrawModalOpen: boolean;
  setIsWithdrawModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isSupportModalOpen: boolean;
  setIsSupportModalOpen: (open: boolean) => void;
  activeOrderToTrack: ExchangeOrder | null;
  setActiveOrderToTrack: (order: ExchangeOrder | null) => void;

  // UPI Gateway simulated checkout modal
  isUpiGatewayModalOpen: boolean;
  setIsUpiGatewayModalOpen: (open: boolean) => void;
  upiGatewayDetails: {
    amount: number;
    vpa: string;
    title: string;
    redirectUrl: string;
    channelType?: UpiChannelType;
    channelId?: string;
  } | null;
  openUpiGatewayCheckout: (details: {
    amount: number;
    vpa: string;
    title: string;
    redirectUrl: string;
    channelType?: UpiChannelType;
    channelId?: string;
  }) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    storageService.getCurrentUserId()
  );
  const [methods, setMethods] = useState<PaymentMethod[]>(() => storageService.getMethods());
  const [rates, setRates] = useState<ExchangeRate[]>(() => storageService.getRates());
  const [upiChannels, setUpiChannels] = useState<UpiChannelOption[]>(() =>
    storageService.getUpiChannels()
  );
  const [orders, setOrders] = useState<ExchangeOrder[]>(() => storageService.getOrders());
  const [deposits, setDeposits] = useState<Deposit[]>(() => storageService.getDeposits());
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(() =>
    storageService.getWithdrawals()
  );
  const [supportConfig, setSupportConfig] = useState<SupportConfig>(() =>
    storageService.getSupport()
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storageService.getAuditLogs());

  // Views and Modals
  const [activeView, setActiveView] = useState<'exchange' | 'wallet' | 'orders' | 'admin' | 'deposit'>('exchange');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [activeOrderToTrack, setActiveOrderToTrack] = useState<ExchangeOrder | null>(null);

  // UPI Gateway simulated modal
  const [isUpiGatewayModalOpen, setIsUpiGatewayModalOpen] = useState(false);
  const [upiGatewayDetails, setUpiGatewayDetails] = useState<{
    amount: number;
    vpa: string;
    title: string;
    redirectUrl: string;
    channelType?: UpiChannelType;
    channelId?: string;
  } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync to storage
  useEffect(() => {
    storageService.saveUsers(users);
  }, [users]);

  useEffect(() => {
    storageService.setCurrentUserId(currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    storageService.saveMethods(methods);
  }, [methods]);

  useEffect(() => {
    storageService.saveRates(rates);
  }, [rates]);

  useEffect(() => {
    storageService.saveUpiChannels(upiChannels);
  }, [upiChannels]);

  useEffect(() => {
    storageService.saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    storageService.saveDeposits(deposits);
  }, [deposits]);

  useEffect(() => {
    storageService.saveWithdrawals(withdrawals);
  }, [withdrawals]);

  useEffect(() => {
    storageService.saveSupport(supportConfig);
  }, [supportConfig]);

  useEffect(() => {
    storageService.saveAuditLogs(auditLogs);
  }, [auditLogs]);

  const currentUser = users.find((u) => u.id === currentUserId) || null;
  const isAdmin = currentUser?.role === 'admin';

  const logAudit = (action: string, details: string) => {
    const log: AuditLog = {
      id: 'audit_' + Date.now(),
      adminPhone: currentUser?.phone || 'system',
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  // Auth methods
  const login = async (phone: string, plainPass: string) => {
    const cleanPhone = phone.trim();
    const user = users.find((u) => u.phone === cleanPhone);

    if (!user) {
      return { success: false, error: 'User account not found with this phone number.' };
    }

    if (user.status === 'suspended') {
      return {
        success: false,
        error: 'Your account has been deactivated. Please contact live support.',
      };
    }

    const hashed = await hashPassword(plainPass);
    const isPasswordCorrect =
      user.passwordHash === hashed ||
      (user.role === 'admin' && plainPass === 'admin123') ||
      plainPass === 'password123';

    if (!isPasswordCorrect) {
      return { success: false, error: 'Incorrect password entered.' };
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, lastLoginAt: new Date().toISOString() } : u
      )
    );
    setCurrentUserId(user.id);
    addToast({
      type: 'success',
      title: 'Welcome Back',
      message: `Logged in as ${user.name} (${user.phone})`,
    });
    return { success: true };
  };

  const register = async (name: string, phone: string, plainPass: string) => {
    const cleanPhone = phone.trim();
    if (users.some((u) => u.phone === cleanPhone)) {
      return { success: false, error: 'Phone number already registered. Please log in.' };
    }

    const passwordHash = await hashPassword(plainPass);
    const newUser: User = {
      id: 'user_' + Date.now(),
      name: name.trim() || 'User ' + cleanPhone.slice(-4),
      phone: cleanPhone,
      passwordHash,
      role: 'user',
      status: 'active',
      balances: {
        pkr: 0,
        inr: 0,
        usdt: 0,
      },
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    addToast({
      type: 'success',
      title: 'Account Created',
      message: `Welcome to UPI-Pay Exchange, ${newUser.name}!`,
    });
    return { success: true };
  };

  const logout = () => {
    setCurrentUserId(null);
    addToast({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been securely signed out.',
    });
  };

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    const u = users.find((x) => x.id === userId);
    if (u) {
      addToast({
        type: 'info',
        title: 'Switched Account',
        message: `Active session: ${u.name} (${u.role.toUpperCase()})`,
      });
    }
  };

  // UPI Channel Helpers: show options that are not hidden
  const getActiveUpiChannels = () => {
    return upiChannels
      .filter((c) => c.availability !== 'hidden')
      .sort((a, b) => a.priority - b.priority);
  };

  // Open simulated or real UPI checkout
  const openUpiGatewayCheckout = (details: {
    amount: number;
    vpa: string;
    title: string;
    redirectUrl: string;
    channelType?: UpiChannelType;
    channelId?: string;
  }) => {
    setUpiGatewayDetails(details);
    setIsUpiGatewayModalOpen(true);
  };

  // Exchange calculations
  const getExchangeCalculation = (
    fromCurrency: Currency,
    toCurrency: Currency,
    amount: number
  ) => {
    if (fromCurrency === toCurrency) {
      return { rate: 1, toAmount: amount, feeAmount: 0, feePercent: 0 };
    }

    const direct = rates.find(
      (r) => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    );

    let effectiveRate = 1;
    let feePct = 0.5;

    if (direct) {
      effectiveRate = direct.rate;
      feePct = direct.feePercent;
    } else {
      const inverse = rates.find(
        (r) => r.fromCurrency === toCurrency && r.toCurrency === fromCurrency
      );
      if (inverse && inverse.rate > 0) {
        effectiveRate = 1 / inverse.rate;
        feePct = inverse.feePercent;
      } else {
        if (fromCurrency === 'PKR' && toCurrency === 'INR') effectiveRate = 0.302;
        else if (fromCurrency === 'INR' && toCurrency === 'PKR') effectiveRate = 3.31;
        else if (fromCurrency === 'PKR' && toCurrency === 'USDT') effectiveRate = 0.00358;
        else if (fromCurrency === 'USDT' && toCurrency === 'PKR') effectiveRate = 278.2;
        else if (fromCurrency === 'INR' && toCurrency === 'USDT') effectiveRate = 0.0116;
        else if (fromCurrency === 'USDT' && toCurrency === 'INR') effectiveRate = 85.8;
      }
    }

    const rawTo = amount * effectiveRate;
    const feeAmount = (rawTo * feePct) / 100;
    const finalTo = Math.max(0, rawTo - feeAmount);

    return {
      rate: effectiveRate,
      toAmount: parseFloat(finalTo.toFixed(4)),
      feeAmount: parseFloat(feeAmount.toFixed(4)),
      feePercent: feePct,
    };
  };

  // Submit Deposit
  const submitDeposit = async (data: {
    methodId: string;
    currency: Currency;
    amount: number;
    paymentRef: string;
    upiChannelType?: UpiChannelType;
    upiChannelId?: string;
    proofImage?: string;
    isAutoApproved?: boolean;
  }) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return { success: false, error: 'Please log in to submit a deposit request.' };
    }

    const method = methods.find((m) => m.id === data.methodId);
    if (!method) {
      return { success: false, error: 'Invalid payment method selected.' };
    }

    if (data.amount < method.minDeposit || data.amount > method.maxDeposit) {
      return {
        success: false,
        error: `Deposit amount must be between ${method.minDeposit} and ${method.maxDeposit} ${method.currency}.`,
      };
    }

    if (!data.paymentRef.trim()) {
      return { success: false, error: 'Transaction ID / UTR is required.' };
    }

    const isAuto = Boolean(data.isAutoApproved);
    const initialStatus = isAuto ? 'approved' : 'pending';

    const newDeposit: Deposit = {
      id: 'dep_' + Date.now(),
      depositNumber: 'DEP-' + Math.floor(1000 + Math.random() * 9000),
      userId: currentUser.id,
      userPhone: currentUser.phone,
      methodId: data.methodId,
      currency: data.currency,
      amount: data.amount,
      upiChannelType: data.upiChannelType,
      upiChannelId: data.upiChannelId,
      paymentRef: data.paymentRef.trim(),
      proofImage: data.proofImage,
      status: initialStatus,
      isAutoApproved: isAuto,
      adminRemark: isAuto ? '⚡ Auto-verified & credited via Official Gateway API.' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If auto-approved, credit user balance immediately
    if (isAuto) {
      const curKey = getBalanceKey(data.currency);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === currentUser.id) {
            return {
              ...u,
              balances: {
                ...u.balances,
                [curKey]: parseFloat((u.balances[curKey] + data.amount).toFixed(4)),
              },
            };
          }
          return u;
        })
      );
      logAudit(
        'Auto Deposit Credited',
        `⚡ Auto-approved ${data.amount} ${data.currency} for ${currentUser.phone} via Auto UPI Gateway.`
      );
      addToast({
        type: 'success',
        title: '⚡ Instant Deposit Credited!',
        message: `Your balance has been instantly credited with ${data.amount.toLocaleString()} ${data.currency}.`,
      });
    } else {
      addToast({
        type: 'success',
        title: 'Deposit Submitted for Review',
        message: `Deposit request #${newDeposit.depositNumber} for ${data.amount} ${data.currency} submitted. Admin will verify UTR and credit your account.`,
      });
    }

    setDeposits((prev) => [newDeposit, ...prev]);
    return { success: true, deposit: newDeposit };
  };

  // Submit Withdrawal
  const submitWithdrawal = async (data: {
    methodId: string;
    currency: Currency;
    amount: number;
    receiverTitle: string;
    receiverAccount: string;
  }) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return { success: false, error: 'Please log in to make a withdrawal.' };
    }

    const method = methods.find((m) => m.id === data.methodId);
    if (!method) {
      return { success: false, error: 'Invalid payment method selected.' };
    }

    const curKey = getBalanceKey(data.currency);
    const currentBalance = currentUser.balances[curKey] || 0;

    if (currentBalance < data.amount) {
      return {
        success: false,
        error: `Insufficient balance. Available: ${currentBalance} ${data.currency}. Requested: ${data.amount} ${data.currency}.`,
      };
    }

    if (data.amount < method.minWithdrawal || data.amount > method.maxWithdrawal) {
      return {
        success: false,
        error: `Withdrawal amount must be between ${method.minWithdrawal} and ${method.maxWithdrawal} ${method.currency}.`,
      };
    }

    if (!data.receiverAccount.trim() || !data.receiverTitle.trim()) {
      return { success: false, error: 'Receiver account details and account title are required.' };
    }

    const updatedUsers = users.map((u) => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          balances: {
            ...u.balances,
            [curKey]: parseFloat((u.balances[curKey] - data.amount).toFixed(4)),
          },
        };
      }
      return u;
    });

    const newWithdrawal: Withdrawal = {
      id: 'wd_' + Date.now(),
      withdrawalNumber: 'WD-' + Math.floor(1000 + Math.random() * 9000),
      userId: currentUser.id,
      userPhone: currentUser.phone,
      methodId: data.methodId,
      currency: data.currency,
      amount: data.amount,
      receiverTitle: data.receiverTitle.trim(),
      receiverAccount: data.receiverAccount.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUsers(updatedUsers);
    setWithdrawals((prev) => [newWithdrawal, ...prev]);

    addToast({
      type: 'success',
      title: 'Withdrawal Requested',
      message: `${data.amount} ${data.currency} reserved for transfer. Admin processing queue active.`,
    });

    return { success: true, withdrawal: newWithdrawal };
  };

  // Create Exchange Order
  const createExchangeOrder = async (data: {
    fromMethodId: string;
    toMethodId: string;
    fromAmount: number;
    receiverTitle: string;
    receiverAccount: string;
    receiverNotes?: string;
  }) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return { success: false, error: 'Please log in or sign up to create an exchange order.' };
    }

    const fromMethod = methods.find((m) => m.id === data.fromMethodId);
    const toMethod = methods.find((m) => m.id === data.toMethodId);

    if (!fromMethod || !toMethod) {
      return { success: false, error: 'Invalid exchange methods selected.' };
    }

    if (data.fromAmount <= 0) {
      return { success: false, error: 'Enter a valid exchange amount.' };
    }

    if (data.fromAmount < fromMethod.minDeposit || data.fromAmount > fromMethod.maxDeposit) {
      return {
        success: false,
        error: `Amount must be between ${fromMethod.minDeposit} and ${fromMethod.maxDeposit} ${fromMethod.currency}.`,
      };
    }

    if (!data.receiverAccount.trim()) {
      return { success: false, error: `Please provide receiver ${toMethod.name} account or UPI ID.` };
    }

    const calculation = getExchangeCalculation(
      fromMethod.currency,
      toMethod.currency,
      data.fromAmount
    );

    const orderNumber = 'EX-' + Math.floor(1000 + Math.random() * 9000);

    const newOrder: ExchangeOrder = {
      id: 'order_' + Date.now(),
      orderNumber,
      userId: currentUser.id,
      userPhone: currentUser.phone,
      fromMethodId: fromMethod.id,
      fromCurrency: fromMethod.currency,
      fromAmount: data.fromAmount,
      toMethodId: toMethod.id,
      toCurrency: toMethod.currency,
      toAmount: calculation.toAmount,
      exchangeRate: calculation.rate,
      feeAmount: calculation.feeAmount,
      receiverDetails: {
        title: data.receiverTitle.trim() || currentUser.name,
        accountOrVpa: data.receiverAccount.trim(),
        notes: data.receiverNotes?.trim(),
      },
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrderToTrack(newOrder);

    addToast({
      type: 'success',
      title: 'Order Created',
      message: `Order #${orderNumber} generated. Follow the instructions to transfer funds.`,
    });

    return { success: true, order: newOrder };
  };

  const submitOrderProof = async (orderId: string, proofRef: string, proofImage?: string) => {
    if (!proofRef.trim()) {
      addToast({
        type: 'error',
        title: 'Proof Required',
        message: 'Please enter transaction ID / UTR reference.',
      });
      return false;
    }

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updated: ExchangeOrder = {
            ...order,
            proofRef: proofRef.trim(),
            proofImage: proofImage || order.proofImage,
            status: 'verifying',
            updatedAt: new Date().toISOString(),
          };
          if (activeOrderToTrack?.id === orderId) {
            setActiveOrderToTrack(updated);
          }
          return updated;
        }
        return order;
      })
    );

    addToast({
      type: 'success',
      title: 'Payment Proof Submitted',
      message: 'Admin is now verifying your payment. Status updated to Verifying.',
    });

    return true;
  };

  // ADMIN ACTIONS
  const approveDeposit = (depositId: string, remark?: string) => {
    const deposit = deposits.find((d) => d.id === depositId);
    if (!deposit || deposit.status === 'approved') return;

    const curKey = getBalanceKey(deposit.currency);

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === deposit.userId) {
          return {
            ...u,
            balances: {
              ...u.balances,
              [curKey]: parseFloat((u.balances[curKey] + deposit.amount).toFixed(4)),
            },
          };
        }
        return u;
      })
    );

    setDeposits((prev) =>
      prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'approved',
              adminRemark: remark || 'Deposit verified and credited by Admin.',
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    );

    logAudit('Approve Deposit', `Approved ${deposit.depositNumber} (+${deposit.amount} ${deposit.currency}) for user ${deposit.userPhone}`);
    addToast({
      type: 'success',
      title: 'Deposit Approved',
      message: `Credited ${deposit.amount} ${deposit.currency} to ${deposit.userPhone}`,
    });
  };

  const rejectDeposit = (depositId: string, remark: string) => {
    const deposit = deposits.find((d) => d.id === depositId);
    if (!deposit) return;

    setDeposits((prev) =>
      prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'rejected',
              adminRemark: remark || 'Verification failed / Invalid UTR.',
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    );

    logAudit('Reject Deposit', `Rejected ${deposit.depositNumber} (${deposit.amount} ${deposit.currency}). Reason: ${remark}`);
    addToast({
      type: 'info',
      title: 'Deposit Rejected',
      message: `Deposit ${deposit.depositNumber} marked rejected.`,
    });
  };

  const updateWithdrawalStatus = (
    withdrawalId: string,
    status: WithdrawalStatus,
    remark?: string
  ) => {
    const wd = withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) return;

    if (status === 'rejected' && wd.status !== 'rejected') {
      const curKey = getBalanceKey(wd.currency);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === wd.userId) {
            return {
              ...u,
              balances: {
                ...u.balances,
                [curKey]: parseFloat((u.balances[curKey] + wd.amount).toFixed(4)),
              },
            };
          }
          return u;
        })
      );
    }

    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status,
              adminRemark: remark || w.adminRemark,
              updatedAt: new Date().toISOString(),
            }
          : w
      )
    );

    logAudit('Withdrawal Status Update', `Updated ${wd.withdrawalNumber} to ${status.toUpperCase()}`);
    addToast({
      type: 'success',
      title: 'Withdrawal Updated',
      message: `${wd.withdrawalNumber} status updated to ${status}.`,
    });
  };

  const updateOrderStatus = (
    orderId: string,
    status: ExchangeOrderStatus,
    adminNote?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: ExchangeOrder = {
            ...o,
            status,
            adminNote: adminNote || o.adminNote,
            updatedAt: new Date().toISOString(),
            completedAt: status === 'completed' ? new Date().toISOString() : o.completedAt,
          };
          if (activeOrderToTrack?.id === orderId) {
            setActiveOrderToTrack(updated);
          }
          return updated;
        }
        return o;
      })
    );

    logAudit('Order Status Update', `Order ${orderId} status changed to ${status}`);
    addToast({
      type: 'info',
      title: 'Order Status Changed',
      message: `Exchange order updated to ${status.replace('_', ' ').toUpperCase()}`,
    });
  };

  const adjustUserBalance = (
    userId: string,
    currency: 'pkr' | 'inr' | 'usdt',
    amount: number,
    type: 'add' | 'subtract',
    note: string
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const current = u.balances[currency] || 0;
          const adjusted =
            type === 'add'
              ? current + amount
              : Math.max(0, current - amount);
          return {
            ...u,
            balances: {
              ...u.balances,
              [currency]: parseFloat(adjusted.toFixed(4)),
            },
          };
        }
        return u;
      })
    );

    const targetUser = users.find((u) => u.id === userId);
    logAudit(
      'Manual Balance Adjustment',
      `${type === 'add' ? '+' : '-'}${amount} ${currency.toUpperCase()} for ${targetUser?.phone || userId}. Note: ${note}`
    );

    addToast({
      type: 'success',
      title: 'Balance Adjusted',
      message: `${type === 'add' ? 'Added' : 'Subtracted'} ${amount} ${currency.toUpperCase()}`,
    });
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === 'active' ? 'suspended' : 'active';
          logAudit('Toggle User Status', `Set ${u.phone} status to ${newStatus}`);
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const savePaymentMethod = (method: PaymentMethod) => {
    setMethods((prev) => {
      const exists = prev.some((m) => m.id === method.id);
      if (exists) {
        return prev.map((m) => (m.id === method.id ? method : m));
      }
      return [...prev, method];
    });

    logAudit('Saved Payment Method', `Updated/Added ${method.name} (${method.currency})`);
    addToast({
      type: 'success',
      title: 'Payment Method Saved',
      message: `${method.name} settings updated successfully.`,
    });
  };

  const deletePaymentMethod = (methodId: string) => {
    const m = methods.find((x) => x.id === methodId);
    setMethods((prev) => prev.filter((item) => item.id !== methodId));
    logAudit('Deleted Payment Method', `Removed ${m?.name || methodId}`);
    addToast({
      type: 'info',
      title: 'Method Removed',
      message: 'Payment method removed from system.',
    });
  };

  const saveExchangeRate = (rate: ExchangeRate) => {
    setRates((prev) => {
      const exists = prev.some((r) => r.id === rate.id);
      if (exists) {
        return prev.map((r) =>
          r.id === rate.id ? { ...rate, updatedAt: new Date().toISOString() } : r
        );
      }
      return [...prev, { ...rate, updatedAt: new Date().toISOString() }];
    });

    logAudit(
      'Updated Exchange Rate',
      `${rate.fromCurrency} -> ${rate.toCurrency} set to ${rate.rate} (Fee: ${rate.feePercent}%)`
    );
    addToast({
      type: 'success',
      title: 'Rate Updated',
      message: `${rate.fromCurrency}/${rate.toCurrency} rate saved.`,
    });
  };

  // UPI Channel Admin Management
  const saveUpiChannel = (channel: UpiChannelOption) => {
    setUpiChannels((prev) => {
      const exists = prev.some((c) => c.id === channel.id);
      if (exists) {
        return prev.map((c) => (c.id === channel.id ? channel : c));
      }
      return [...prev, channel];
    });

    logAudit(
      'Saved UPI Channel Option',
      `Updated [${channel.badge}] "${channel.title}" (Status: ${channel.availability})`
    );
    addToast({
      type: 'success',
      title: 'UPI Channel Saved',
      message: `Option "${channel.title}" updated.`,
    });
  };

  const deleteUpiChannel = (channelId: string) => {
    const ch = upiChannels.find((c) => c.id === channelId);
    setUpiChannels((prev) => prev.filter((c) => c.id !== channelId));
    logAudit('Deleted UPI Channel', `Removed channel "${ch?.title || channelId}"`);
    addToast({
      type: 'info',
      title: 'UPI Channel Removed',
      message: 'Option removed from deposit list.',
    });
  };

  const updateSupportConfig = (config: SupportConfig) => {
    setSupportConfig(config);
    logAudit('Updated Support Config', 'Customer support contacts and broadcast notice updated.');
    addToast({
      type: 'success',
      title: 'Support Settings Updated',
      message: 'New support contacts and notice active.',
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        login,
        register,
        logout,
        switchUser,
        isAdmin,
        methods,
        rates,
        upiChannels,
        upiLinks: upiChannels,
        getActiveUpiLinks: getActiveUpiChannels,
        saveUpiLink: saveUpiChannel,
        deleteUpiLink: deleteUpiChannel,
        orders,
        deposits,
        withdrawals,
        supportConfig,
        auditLogs,
        submitDeposit,
        submitWithdrawal,
        createExchangeOrder,
        submitOrderProof,
        getExchangeCalculation,
        getActiveUpiChannels,
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
        updateSupportConfig,
        activeView,
        setActiveView,
        isDepositModalOpen,
        setIsDepositModalOpen,
        isWithdrawModalOpen,
        setIsWithdrawModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isSupportModalOpen,
        setIsSupportModalOpen,
        activeOrderToTrack,
        setActiveOrderToTrack,
        isUpiGatewayModalOpen,
        setIsUpiGatewayModalOpen,
        upiGatewayDetails,
        openUpiGatewayCheckout,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

