import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Account, Transaction, CategoryType } from './types';
import { 
  formatCurrency, 
  formatDate, 
  exportToCSV, 
  CATEGORIES, 
  QUICK_SHORTCUTS,
  sha256
} from './utils';

// Core Sub-components
import Splash from './components/Splash';
import Onboarding from './components/Onboarding';
import AccountCard from './components/AccountCard';
import TransactionItem from './components/TransactionItem';
import TransactionModal from './components/TransactionModal';
import ReportView from './components/ReportView';
import Login from './components/Login';

// Icons
import { 
  Wallet, 
  History, 
  PieChart, 
  Settings, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  PlusCircle, 
  Database,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  BookOpen,
  ArrowRight,
  Info
} from 'lucide-react';

export default function App() {
  // State variables
  const [showSplash, setShowSplash] = useState(true);

  // Active Logged-in User
  const [user, setUser] = useState<{ email: string; name: string; picture: string } | null>(() => {
    try {
      const saved = localStorage.getItem('upitrack_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'reports' | 'settings'>('dashboard');
  
  // Transaction Modal Settings
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shortcutData, setShortcutData] = useState<{
    amount: number;
    category: CategoryType;
    note: string;
    type: 'credit' | 'debit';
  } | null>(null);

  // Search and Filter states inside History
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // New Account Dialog
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAcctName, setNewAcctName] = useState('');
  const [newAcctBalance, setNewAcctBalance] = useState('');
  const [newAcctBudget, setNewAcctBudget] = useState('');
  const [accountError, setAccountError] = useState('');

  // 1st of the month Monthly Wrap triggers
  const [showWrapModal, setShowWrapModal] = useState(false);
  const [lastShownWrap, setLastShownWrap] = useState('');
  const [wrapMonthText, setWrapMonthText] = useState('');

  // Toast / Status popups
  const [toastMessage, setToastMessage] = useState('');

  const [isLoaded, setIsLoaded] = useState(false);
  const isLoadedRef = React.useRef(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  // Sync status state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // Cloud Sync upload function
  const uploadToCloud = async (uEmail: string, currentAccts: Account[], currentTxs: Transaction[]) => {
    try {
      setSyncStatus('syncing');
      const hashedEmail = await sha256(uEmail);
      const res = await fetch(`https://kvdb.io/EXg84EbiWKfrmwVrgpqNQG/${hashedEmail}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts: currentAccts, transactions: currentTxs }),
      });
      if (res.ok) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    } catch (e) {
      console.error('Cloud sync upload failed', e);
      setSyncStatus('error');
    }
  };

  // Cloud Sync fetch function
  const fetchFromCloud = async (uEmail: string, localAccts: Account[], localTxs: Transaction[]) => {
    try {
      setSyncStatus('syncing');
      const hashedEmail = await sha256(uEmail);
      const res = await fetch(`https://kvdb.io/EXg84EbiWKfrmwVrgpqNQG/${hashedEmail}`);
      if (res.ok) {
        const cloudData = await res.json();
        if (cloudData && (cloudData.accounts || cloudData.transactions)) {
          const cloudTxs = cloudData.transactions || [];
          const cloudAccts = cloudData.accounts || [];
          
          // Compare cloud vs local: restore if local is empty or cloud has newer/more data
          if (localAccts.length === 0 || cloudTxs.length >= localTxs.length) {
            setAccounts(cloudAccts);
            setTransactions(cloudTxs);
            
            // Write immediately to local storage to sync up
            localStorage.setItem(`upitrack_accounts_${uEmail}`, JSON.stringify(cloudAccts));
            localStorage.setItem(`upitrack_transactions_${uEmail}`, JSON.stringify(cloudTxs));
            
            setSyncStatus('synced');
            return { accounts: cloudAccts, transactions: cloudTxs };
          }
        }
      }
      setSyncStatus('synced');
    } catch (e) {
      console.error('Cloud sync download failed', e);
      setSyncStatus('error');
    }
    return null;
  };

  // Sync user state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('upitrack_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('upitrack_active_user');
    }
  }, [user]);

  // Load from localStorage on user change
  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setTransactions([]);
      setLastShownWrap('');
      isLoadedRef.current = false;
      setIsLoaded(false);
      setSyncStatus('idle');
      return;
    }

    try {
      let storedAccts = localStorage.getItem(`upitrack_accounts_${user.email}`);
      let storedTxs = localStorage.getItem(`upitrack_transactions_${user.email}`);
      let storedWrapMonth = localStorage.getItem(`upitrack_last_wrap_shown_${user.email}`);

      // Migration fallback from generic keys
      if (!storedAccts) {
        const genericAccts = localStorage.getItem('upitrack_accounts');
        const genericTxs = localStorage.getItem('upitrack_transactions');
        const genericWrapMonth = localStorage.getItem('upitrack_last_wrap_shown');

        if (genericAccts) {
          storedAccts = genericAccts;
          localStorage.setItem(`upitrack_accounts_${user.email}`, genericAccts);
        }
        if (genericTxs) {
          storedTxs = genericTxs;
          localStorage.setItem(`upitrack_transactions_${user.email}`, genericTxs);
        }
        if (genericWrapMonth) {
          storedWrapMonth = genericWrapMonth;
          localStorage.setItem(`upitrack_last_wrap_shown_${user.email}`, genericWrapMonth);
        }
      }

      let activeAccts: Account[] = [];
      let activeTxs: Transaction[] = [];

      if (storedAccts) {
        activeAccts = JSON.parse(storedAccts);
        setAccounts(activeAccts);
      } else {
        setAccounts([]);
      }
      if (storedTxs) {
        activeTxs = JSON.parse(storedTxs);
        setTransactions(activeTxs);
      } else {
        setTransactions([]);
      }
      if (storedWrapMonth) {
        setLastShownWrap(storedWrapMonth);
      } else {
        setLastShownWrap('');
      }
      
      isLoadedRef.current = true;
      setIsLoaded(true);

      // Perform background cloud sync
      fetchFromCloud(user.email, activeAccts, activeTxs);

    } catch (e) {
      console.error('Error parsing user localStorage keys', e);
      isLoadedRef.current = true;
      setIsLoaded(true);
    }
  }, [user]);

  // Save to localStorage and sync to cloud on changes, ONLY if load completed
  useEffect(() => {
    if (isLoadedRef.current && user) {
      localStorage.setItem(`upitrack_accounts_${user.email}`, JSON.stringify(accounts));
      uploadToCloud(user.email, accounts, transactions);
    }
  }, [accounts, user]);

  useEffect(() => {
    if (isLoadedRef.current && user) {
      localStorage.setItem(`upitrack_transactions_${user.email}`, JSON.stringify(transactions));
      uploadToCloud(user.email, accounts, transactions);
    }
  }, [transactions, user]);

  // Check for auto Monthly Wrap on the 1st of every month
  useEffect(() => {
    if (showSplash || accounts.length === 0 || !user) return;

    const today = new Date();
    const dayOfMonth = today.getDate();

    if (dayOfMonth === 1) {
      const prevMonthDate = new Date();
      prevMonthDate.setMonth(today.getMonth() - 1);
      const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);

      if (lastShownWrap !== prevMonthStr) {
        setWrapMonthText(prevMonthStr);
        setShowWrapModal(true);
        setLastShownWrap(prevMonthStr);
        localStorage.setItem(`upitrack_last_wrap_shown_${user.email}`, prevMonthStr);
      }
    }
  }, [showSplash, accounts, lastShownWrap, user]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  // Transaction handlers
  const handleSaveTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: Date.now(),
    };
    
    setTransactions((prev) => [newTx, ...prev]);
    showToast('Transaction recorded successfully! ⚡');
    setShortcutData(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Transaction deleted!');
  };

  // Add Dynamic Account
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');

    if (!newAcctName.trim()) {
      setAccountError('Account name is required.');
      return;
    }
    
    const dupe = accounts.some((a) => a.name.toLowerCase() === newAcctName.trim().toLowerCase());
    if (dupe) {
      setAccountError('An account with this name already exists.');
      return;
    }

    const initBal = parseFloat(newAcctBalance) || 0;
    const limitBal = parseFloat(newAcctBudget) || 0;

    const newAcct: Account = {
      id: `acc-${Date.now()}`,
      name: newAcctName.trim(),
      initialBalance: initBal,
      budgetLimit: limitBal,
    };

    setAccounts((prev) => [...prev, newAcct]);
    setNewAcctName('');
    setNewAcctBalance('');
    setNewAcctBudget('');
    setIsAddingAccount(false);
    showToast(`Account "${newAcct.name}" linked! 🎉`);
  };

  // Onboarding Complete Handler
  const handleOnboardingComplete = (initialAccounts: Account[]) => {
    setAccounts(initialAccounts);
    showToast('Welcome! UPI wallets initialized. 👋');
  };

  const handleDeleteAccount = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return;
    
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    setTransactions((prev) => prev.filter((t) => t.accountId !== accountId));
    
    showToast(`Account "${acc.name}" & history wiped! 🗑️`);
  };

  // Quickshortcut trigger
  const handleTriggerShortcut = (sc: typeof QUICK_SHORTCUTS[0]) => {
    setShortcutData({
      amount: sc.amount,
      category: sc.category,
      note: sc.note,
      type: 'debit',
    });
    setIsModalOpen(true);
  };

  // Injection of sample test records for instant analytics experience
  const injectTestData = () => {
    if (accounts.length === 0) return;
    
    const accAId = accounts[0].id;
    const accBId = accounts[1]?.id || accounts[0].id;

    // Dates matching current month and previous month to simulate reports
    const today = new Date();
    const currMonthStr = today.toISOString().slice(0, 7);
    
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(today.getMonth() - 1);
    const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);

    const testTxs: Transaction[] = [
      {
        id: 'tx-test-1',
        accountId: accAId,
        type: 'credit',
        amount: 35000,
        category: 'Salary',
        note: 'Paycheck Transfer salary 💸',
        date: `${currMonthStr}-01`,
        createdAt: Date.now() - 1000000000,
      },
      {
        id: 'tx-test-2',
        accountId: accAId,
        type: 'debit',
        amount: 850,
        category: 'Food',
        note: 'Weekend Family dinner 🍕',
        date: `${currMonthStr}-03`,
        createdAt: Date.now() - 900000000,
      },
      {
        id: 'tx-test-3',
        accountId: accBId,
        type: 'debit',
        amount: 1500,
        category: 'Bills',
        note: 'Broadband bills recharge ⚡',
        date: `${currMonthStr}-04`,
        createdAt: Date.now() - 800000000,
      },
      {
        id: 'tx-test-4',
        accountId: accBId,
        type: 'debit',
        amount: 450,
        category: 'Transport',
        note: 'Office daily commute cab ride',
        date: `${currMonthStr}-05`,
        createdAt: Date.now() - 700000000,
      },
      {
        id: 'tx-test-5',
        accountId: accAId,
        type: 'debit',
        amount: 4200,
        category: 'Shopping',
        note: 'Durable leather jacket jacket',
        date: `${currMonthStr}-06`,
        createdAt: Date.now() - 600000000,
      },
      {
        id: 'tx-test-6',
        accountId: accAId,
        type: 'credit',
        amount: 2500,
        category: 'Transfer',
        note: 'Settlement from friend 🪙',
        date: `${currMonthStr}-08`,
        createdAt: Date.now() - 500000000,
      },
      // Previous Month entries (for proper Monthly Wrap reports!)
      {
        id: 'tx-test-7',
        accountId: accAId,
        type: 'credit',
        amount: 28000,
        category: 'Salary',
        note: 'Previous Month Salary',
        date: `${prevMonthStr}-01`,
        createdAt: Date.now() - 5000000000,
      },
      {
        id: 'tx-test-8',
        accountId: accAId,
        type: 'debit',
        amount: 12000,
        category: 'Bills',
        note: 'Flat Rent Payment',
        date: `${prevMonthStr}-05`,
        createdAt: Date.now() - 4800000000,
      },
      {
        id: 'tx-test-9',
        accountId: accBId,
        type: 'debit',
        amount: 3200,
        category: 'Medical',
        note: 'Pills and dentist checkout',
        date: `${prevMonthStr}-12`,
        createdAt: Date.now() - 4500000000,
      },
    ];

    setTransactions(testTxs);
    showToast('Injected 9 mock ledger records! 📊');
  };

  const resetAllData = () => {
    if (confirm('Are you absolutely sure you want to hard reset all data? This cannot be undone.')) {
      localStorage.clear();
      setAccounts([]);
      setTransactions([]);
      setUser(null);
      setActiveTab('dashboard');
      showToast('All ledger memory wiped.');
    }
  };

  // Math Calculations (Memoized for peak UI rendering performance)
  const statsByAccount = useMemo(() => {
    const maps: Record<string, { credits: number; debits: number; thisMonthDebits: number }> = {};
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    
    // Initialize
    accounts.forEach((acc) => {
      maps[acc.id] = { credits: 0, debits: 0, thisMonthDebits: 0 };
    });

    // Populate
    transactions.forEach((tx) => {
      if (!maps[tx.accountId]) {
        // Safe guard in case account deleted
        maps[tx.accountId] = { credits: 0, debits: 0, thisMonthDebits: 0 };
      }
      if (tx.type === 'credit') {
        maps[tx.accountId].credits += tx.amount;
      } else {
        maps[tx.accountId].debits += tx.amount;
        if (tx.date && tx.date.startsWith(currentMonthStr)) {
          maps[tx.accountId].thisMonthDebits += tx.amount;
        }
      }
    });

    return maps;
  }, [accounts, transactions]);

  // Combined Totals across accounts
  const summaryTotals = useMemo(() => {
    let combinedBalance = 0;
    let combinedCredits = 0;
    let combinedDebits = 0;
    const currentMonthStr = new Date().toISOString().slice(0, 7);

    accounts.forEach((acc) => {
      const stats = statsByAccount[acc.id] || { credits: 0, debits: 0, thisMonthDebits: 0 };
      combinedBalance += acc.initialBalance + stats.credits - stats.debits;
    });

    // Sum income/expenses for the current calendar month
    transactions.forEach((tx) => {
      if (tx.date && tx.date.startsWith(currentMonthStr)) {
        if (tx.type === 'credit') {
          combinedCredits += tx.amount;
        } else {
          combinedDebits += tx.amount;
        }
      }
    });

    return {
      balance: combinedBalance,
      credits: combinedCredits,
      debits: combinedDebits,
    };
  }, [accounts, transactions, statsByAccount]);

  // Filtered transactions for the History panel
  const filteredTxs = useMemo(() => {
    return transactions.filter((tx) => {
      const matchAccount = filterAccount === 'all' || tx.accountId === filterAccount;
      const matchType = filterType === 'all' || tx.type === filterType;
      const matchCategory = filterCategory === 'all' || tx.category === filterCategory;
      
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = 
        !searchQuery || 
        (tx.note && tx.note.toLowerCase().includes(searchLower)) || 
        tx.category.toLowerCase().includes(searchLower);

      return matchAccount && matchType && matchCategory && matchSearch;
    });
  }, [transactions, filterAccount, filterType, filterCategory, searchQuery]);

  // Format previous month name helper
  const getPrevMonthName = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  // Layout selection
  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  // Google Login check
  if (!user) {
    return (
      <div className="h-[100dvh] w-screen bg-[#030406] text-white flex items-center justify-center font-sans antialiased p-0 sm:p-4 overflow-hidden">
        <div className="w-full max-w-md h-full sm:h-[812px] sm:max-h-[850px] sm:rounded-[40px] sm:border-8 sm:border-slate-900 bg-[#05070A] relative flex flex-col overflow-hidden shadow-2xl">
          <Login onLogin={(u) => setUser(u)} />
        </div>
      </div>
    );
  }

  // If no accounts yet, render full screen onboarding
  if (accounts.length === 0) {
    return (
      <div className="h-[100dvh] w-screen bg-[#030406] text-white flex items-center justify-center font-sans antialiased p-0 sm:p-4 overflow-hidden">
        <div className="w-full max-w-md h-full sm:h-[812px] sm:max-h-[850px] sm:rounded-[40px] sm:border-8 sm:border-slate-900 bg-[#05070A] relative flex flex-col overflow-hidden shadow-2xl">
          <Onboarding onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen bg-[#030406] text-white flex items-center justify-center font-sans antialiased p-0 sm:p-4 overflow-hidden">
      {/* Interactive device viewport simulator for Desktop */}
      <div className="w-full max-w-md h-full sm:h-[812px] sm:max-h-[850px] sm:rounded-[36px] sm:border-8 sm:border-slate-900 bg-[#05070A] relative flex flex-col overflow-hidden shadow-2xl select-none">
        
        {/* Dynamic status toast banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 15 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 inset-x-4 mx-auto max-w-xs bg-slate-900/95 border border-slate-800 text-slate-100 px-4 py-2.5 rounded-xl flex items-center space-x-2 text-xs shadow-lg shadow-black/40 z-50 text-center justify-center font-medium"
            >
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================= */}
        {/* TAB VIEW 1: DASHBOARD                   */}
        {/* ======================================= */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 flex flex-col justify-start overflow-y-auto safe-pb-content no-scrollbar">
            
            {/* Header branding & quick action bar */}
            <div className="px-5 pb-4 safe-pt-header flex items-center justify-between sticky top-0 bg-[#05070A]/90 backdrop-blur-md z-20 border-b border-slate-900/60">
              <div className="flex items-center space-x-2.5">
                {user.picture && (
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    className="w-7 h-7 rounded-full border border-slate-800" 
                  />
                )}
                <div>
                  <h1 className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    PAYTRACK
                  </h1>
                  <span className={`text-[8px] font-mono font-bold uppercase tracking-wider block -mt-0.5 ${
                    syncStatus === 'syncing' ? 'text-yellow-450 animate-pulse' :
                    syncStatus === 'synced' ? 'text-emerald-400' :
                    syncStatus === 'error' ? 'text-red-400' : 'text-slate-500'
                  }`}>
                    {syncStatus === 'syncing' ? 'Syncing 🔄' :
                     syncStatus === 'synced' ? 'Synced ☁️' :
                     syncStatus === 'error' ? 'Offline Mode ⚠️' : 'Disconnected'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShortcutData(null);
                  setIsModalOpen(true);
                }}
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition cursor-pointer"
                title="Add manual transaction"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Dashboard content */}
            <div className="px-5 py-4 space-y-5">
              
              {/* Premium Hero Net Worth Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 rounded-3xl p-5 shadow-lg shadow-black/25">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <span className="text-[8px] uppercase tracking-widest font-mono text-slate-500 font-bold block mb-1">Total Available Net Worth</span>
                <h3 className="text-2xl font-black text-white font-sans tracking-tight">
                  {formatCurrency(summaryTotals.balance)}
                </h3>
                
                <div className="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-4 mt-4 text-[9px] uppercase font-bold tracking-wider text-slate-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450 shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-500">Month Income</span>
                      <b className="text-emerald-450 font-mono text-xs">+{formatCurrency(summaryTotals.credits)}</b>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                      <TrendingDown className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-500">Month Spends</span>
                      <b className="text-red-450 font-mono text-xs">-{formatCurrency(summaryTotals.debits)}</b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Accounts Section Title */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-slate-400">Linked UPI Accounts</span>
                <button
                  onClick={() => setIsAddingAccount(true)}
                  className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center space-x-1 uppercase tracking-wider"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Bank</span>
                </button>
              </div>

              {/* Horizontal Scroll/Stack of accounts cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {accounts.map((acct) => {
                  const stats = statsByAccount[acct.id] || { credits: 0, debits: 0, thisMonthDebits: 0 };
                  return (
                    <AccountCard 
                       key={acct.id} 
                       account={acct} 
                       credits={stats.credits} 
                       debits={stats.debits} 
                       thisMonthDebits={stats.thisMonthDebits || 0}
                     />
                  );
                })}
              </div>



              {/* Recent Activity Mini-List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-blue-400">Recent Ledger Hits</span>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-wider"
                  >
                    See all
                  </button>
                </div>

                {transactions.length === 0 ? (
                  <div className="p-8 text-center bg-[#0D1117] border border-slate-800 rounded-2xl">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No ledger entries yet.</p>
                    <button
                      onClick={() => {
                        setShortcutData(null);
                        setIsModalOpen(true);
                      }}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 mt-2 inline-block underline uppercase tracking-wider"
                    >
                      Make your first entry now!
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {transactions.slice(0, 3).map((tx) => (
                      <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        accounts={accounts}
                        onDelete={handleDeleteTransaction}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB VIEW 2: HISTORY                     */}
        {/* ======================================= */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col justify-start overflow-hidden">
            
            {/* Header with Search and CSV Downloader */}
            <div className="px-5 pb-3 safe-pt-header sticky top-0 bg-[#05070A]/95 z-20 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Ledger History</h2>
                <button
                  onClick={() => exportToCSV(transactions, accounts)}
                  className="px-3 py-2 bg-[#161B22] border border-slate-800 text-blue-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer active:scale-95 transition"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Search box overlay */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search notes or bills categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0D1117] border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white outline-hidden transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Filters pills rows */}
              <div className="space-y-1.5">
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar text-[9px] py-0.5">
                  
                  {/* Account filter list */}
                  <select
                    value={filterAccount}
                    onChange={(e) => setFilterAccount(e.target.value)}
                    className="bg-[#161B22] border border-slate-800 px-2.5 py-1.5 rounded-lg text-blue-400 font-bold uppercase tracking-wider cursor-pointer outline-hidden shrink-0"
                  >
                    <option value="all">All Wallets</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>

                  {/* Flow filter */}
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-[#161B22] border border-slate-800 px-2.5 py-1.5 rounded-lg text-blue-400 font-bold uppercase tracking-wider cursor-pointer outline-hidden shrink-0"
                  >
                    <option value="all">All Flow</option>
                    <option value="debit">Debits (Expenses)</option>
                    <option value="credit">Credits (Income)</option>
                  </select>

                  {/* Category Filter */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-[#161B22] border border-slate-800 px-2.5 py-1.5 rounded-lg text-blue-400 font-bold uppercase tracking-wider cursor-pointer outline-hidden shrink-0"
                  >
                    <option value="all">All Categories</option>
                    {Object.keys(CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* List container */}
            <div className="flex-1 overflow-y-auto px-5 safe-pb-content no-scrollbar">
              {filteredTxs.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No records match the active criteria.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterAccount('all');
                      setFilterCategory('all');
                      setFilterType('all');
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold underline uppercase tracking-wider"
                  >
                    Reset Filter Query
                  </button>
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Inform slide action help first */}
                  <p className="text-[8px] uppercase font-bold text-slate-500 mb-2 tracking-widest text-center">
                    👈 Drag/Swipe an entry left to expose the Delete action
                  </p>
                  {filteredTxs.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      accounts={accounts}
                      onDelete={handleDeleteTransaction}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB VIEW 3: REPORTS                     */}
        {/* ======================================= */}
        {activeTab === 'reports' && (
          <ReportView transactions={transactions} accounts={accounts} />
        )}

        {/* ======================================= */}
        {/* TAB VIEW 4: SETTINGS / MANAGEMENT        */}
        {/* ======================================= */}
        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col justify-start overflow-y-auto safe-pb-content no-scrollbar px-5">
            
            <div className="pb-2 safe-pt-header sticky top-0 bg-[#05070A] z-25 border-b border-slate-900/60">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">System Settings</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Manage accounts database and ledgers memory.</p>
            </div>

            <div className="space-y-6 pt-2">

              {/* User Profile Card & Logout */}
              {user && (
                <div className="p-4 bg-[#0D1117] border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full border border-slate-800" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                        {user.name[0].toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block truncate max-w-[150px]">{user.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono block truncate max-w-[150px]">{user.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Sign out of your account? Your local ledger data will remain saved.')) {
                        localStorage.removeItem('upitrack_active_user');
                        setUser(null);
                        setAccounts([]);
                        setTransactions([]);
                        setIsLoaded(false);
                      }
                    }}
                    className="px-3 py-1.5 bg-red-650/10 border border-red-500/20 text-red-400 hover:bg-red-650 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-wider cursor-pointer transition active:scale-95"
                  >
                    Sign Out
                  </button>
                </div>
              )}

              {/* Account Limits & Budgets list updater */}
              <div className="p-5 bg-[#0D1117] border border-slate-800 rounded-2xl space-y-4">
                <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-blue-400">Monthly Budget Thresholds</span>
                <div className="space-y-3.5">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-200">
                        <span>{acc.name}</span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          Limit: {acc.budgetLimit > 0 ? formatCurrency(acc.budgetLimit) : 'No Limit'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                           type="number"
                           inputMode="decimal"
                           step="0.01"
                           placeholder="Modify budget (e.g. 8000.00)"
                           defaultValue={acc.budgetLimit || ''}
                           onBlur={(e) => {
                             const val = parseFloat(e.target.value) || 0;
                             if (val >= 0) {
                               setAccounts((prev) =>
                                 prev.map((a) => (a.id === acc.id ? { ...a, budgetLimit: val } : a))
                               );
                               showToast(`Budget for ${acc.name} updated!`);
                             }
                           }}
                           className="w-full bg-[#161B22] border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-white font-semibold font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wipe Accounts & History Card */}
              <div className="p-5 bg-[#0D1117] border border-slate-800 rounded-2xl space-y-4">
                <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-red-400 flex items-center space-x-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe Accounts & History</span>
                </span>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Permanently remove a bank account wallet along with its entire transaction database records.
                </p>
                <div className="space-y-2.5">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between p-3 bg-[#161B22] border border-slate-800 rounded-xl">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white">{acc.name}</span>
                        <p className="text-[9px] text-slate-500 uppercase font-mono font-bold">
                          Inbound Base: {formatCurrency(acc.initialBalance)}
                        </p>
                      </div>
                      <button
                        onClick={() => setDeletingAccountId(acc.id)}
                        className="p-2 bg-red-650/10 border border-red-500/20 text-red-500 hover:text-red-400 rounded-lg cursor-pointer transition active:scale-95"
                        title={`Delete ${acc.name} and history`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Helper Tools Box */}
              <div className="p-5 bg-[#0D1117] border border-slate-800 rounded-2xl space-y-4">
                <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-blue-400">Manual Playground Helpers</span>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Test transactions analysis immediately with realistic demo income/credits, groceries list, wifi bills, and commute entries.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={injectTestData}
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1 cursor-pointer transition shadow-lg shadow-blue-550/10"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Load Demo Data</span>
                  </button>
                  <button
                    onClick={resetAllData}
                    className="py-2.5 px-3 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 hover:text-red-350 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Memory Hard Wipe</span>
                  </button>
                </div>
              </div>

              {/* Developer credentials disclosure */}
              <div className="p-3 bg-slate-950/40 rounded-xl text-[10px] text-slate-600 text-center leading-relaxed font-bold border border-slate-900 uppercase tracking-wider">
                <p>Designed strictly for offline client-side storage ledger purposes. No financial linkages required. Privacy absolute.</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* BOTTOM FLOATING NAV BAR                 */}
        {/* ======================================= */}
        <div className="absolute bottom-0 left-0 right-0 safe-pb-nav bg-[#0D1117]/95 border-t border-slate-800/80 flex items-center justify-between px-6 z-30 backdrop-blur-md no-print">
          
          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center space-y-1 py-1 px-2.5 transition rounded-xl cursor-pointer ${
              activeTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-500'
            }`}
          >
            <Wallet className="w-5 h-5 shrink-0" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Home</span>
          </button>

          {/* History Tab */}
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center space-y-1 py-1 px-2.5 transition rounded-xl cursor-pointer ${
              activeTab === 'history' ? 'text-blue-400 font-bold' : 'text-slate-500'
            }`}
          >
            <History className="w-5 h-5 shrink-0" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Ledger</span>
          </button>

          {/* Central Modal FAB Center Button */}
          <div className="relative -top-5">
            <button
              onClick={() => {
                setShortcutData(null);
                setIsModalOpen(true);
              }}
              className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 border-4 border-[#05070A] hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Add Transaction"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>

          {/* Reports Tab */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center space-y-1 py-1 px-2.5 transition rounded-xl cursor-pointer ${
              activeTab === 'reports' ? 'text-blue-400 font-bold' : 'text-slate-500'
            }`}
          >
            <PieChart className="w-5 h-5 shrink-0" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Reports</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center space-y-1 py-1 px-2.5 transition rounded-xl cursor-pointer ${
              activeTab === 'settings' ? 'text-blue-400 font-bold' : 'text-slate-500'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Setup</span>
          </button>

        </div>

        {/* ======================================= */}
        {/* DYNAMIC DRAWERS AND OVERLAY WINDOWS    */}
        {/* ======================================= */}

        {/* TRANSACTION RECORD MODAL SCREEN */}
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setShortcutData(null);
          }}
          accounts={accounts}
          onSave={handleSaveTransaction}
          initialData={shortcutData}
        />

        {/* ADD DYNAMIC ACCOUNT MODAL SHEET */}
        <AnimatePresence>
          {isAddingAccount && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex items-end justify-center select-none">
              
              <div className="absolute inset-0 cursor-pointer" onClick={() => setIsAddingAccount(false)} />
              
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="relative w-full bg-[#0D1117] border-t border-slate-800 rounded-t-[30px] p-6 shadow-2xl space-y-4 pb-8 z-10"
              >
                <div className="mx-auto w-12 h-1 bg-slate-700 rounded-full mb-2 cursor-pointer" onClick={() => setIsAddingAccount(false)} />
                
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Link New Bank Account</h3>
                
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  {accountError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-450 text-xs rounded-xl flex items-center space-x-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{accountError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1">Bank Name / Wallet Label</label>
                    <input
                      type="text"
                      placeholder="e.g. ICICI UPI"
                      value={newAcctName}
                      onChange={(e) => setNewAcctName(e.target.value)}
                      maxLength={20}
                      className="w-full bg-[#161B22] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1">Starting Balance (₹)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="0.00"
                        value={newAcctBalance}
                        onChange={(e) => setNewAcctBalance(e.target.value)}
                        className="w-full bg-[#161B22] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1">Monthly Budget (₹)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="0.00 (Unset)"
                        value={newAcctBudget}
                        onChange={(e) => setNewAcctBudget(e.target.value)}
                        className="w-full bg-[#161B22] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg shadow-blue-550/10"
                  >
                    <span>Activate Bank Account</span>
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DELETE ACCOUNT CONFIRMATION MODAL SHEET */}
        <AnimatePresence>
          {deletingAccountId && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex items-end justify-center select-none">
              <div className="absolute inset-0 cursor-pointer" onClick={() => setDeletingAccountId(null)} />
              
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="relative w-full bg-[#0D1117] border-t border-slate-800 rounded-t-[30px] p-6 shadow-2xl space-y-4 pb-8 z-10"
              >
                <div className="mx-auto w-12 h-1 bg-slate-700 rounded-full mb-2 cursor-pointer" onClick={() => setDeletingAccountId(null)} />
                
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Wipe Bank Account?</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Are you sure you want to delete <b className="text-white">"{accounts.find((a) => a.id === deletingAccountId)?.name}"</b>? This will permanently wipe its entire ledger history. This action is irreversible.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingAccountId(null)}
                    className="py-3 px-4 bg-[#161B22] hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (deletingAccountId) {
                        handleDeleteAccount(deletingAccountId);
                        setDeletingAccountId(null);
                      }
                    }}
                    className="py-3 px-4 bg-red-650 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-red-550/10"
                  >
                    Wipe Account
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MONTHLY WRAP-UP REPORT MODAL SCREEN */}
        <AnimatePresence>
          {showWrapModal && (
            <div className="absolute inset-0 z-45 bg-[#05070A] overflow-y-auto px-6 py-8 flex flex-col justify-between text-white no-scrollbar">
              <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

              {/* Header inside wrap modal */}
              <div className="text-center mt-6">
                <span className="text-[9px] uppercase tracking-widest font-mono text-blue-400 font-extrabold flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> MONTHLY REPORT WRAP-UP
                </span>
                <h2 className="text-xl font-bold uppercase tracking-wider text-white mt-1.5">Ready for {getPrevMonthName()}?</h2>
                <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  The ledger system calculated your cashflow statements for the previous billing cycle. Take a look at your accomplishments!
                </p>
              </div>

              {/* Highlight statistics metrics */}
              <div className="my-6 space-y-4">
                
                {/* Visual score card of Wrap */}
                <div className="p-5 bg-[#0D1117] border border-slate-800 rounded-2xl space-y-3.5 text-center">
                  <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500 font-bold">Calculated Savings Balance</span>
                  <p className="text-2xl font-black text-emerald-400 font-sans tracking-tight">
                    {formatCurrency(
                      transactions
                        .filter((t) => t.date && t.date.slice(0, 7) === wrapMonthText)
                        .reduce((sum, t) => sum + (t.type === 'credit' ? t.amount : -t.amount), 0)
                    )}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 border-t border-[#161B22] pt-3 text-[10px] text-slate-500 font-bold font-mono uppercase">
                    <div>
                      <span>Total Income</span>
                      <p className="text-emerald-400 font-black text-xs mt-0.5">
                        +{formatCurrency(
                          transactions
                            .filter((t) => t.date && t.date.slice(0, 7) === wrapMonthText && t.type === 'credit')
                            .reduce((sum, t) => sum + t.amount, 0)
                        )}
                      </p>
                    </div>
                    <div>
                      <span>Total Expenses</span>
                      <p className="text-red-400 font-black text-xs mt-0.5">
                        -{formatCurrency(
                          transactions
                            .filter((t) => t.date && t.date.slice(0, 7) === wrapMonthText && t.type === 'debit')
                            .reduce((sum, t) => sum + t.amount, 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Categories wrap summary item */}
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start space-x-3 text-xs leading-relaxed font-bold text-blue-300">
                  <Info className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" />
                  <span>
                    Your monthly wrap can be retrieved or printed anytime by going over to the <b>Reports tab</b> and selecting `{formatMonthName(wrapMonthText)}` from the selector!
                  </span>
                </div>

              </div>

              {/* Complete Wrap Action buttons */}
              <div className="space-y-3 pb-6">
                <button
                  onClick={() => {
                    setActiveTab('reports');
                    setShowWrapModal(false);
                  }}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-550/10 cursor-pointer uppercase text-xs tracking-wider"
                >
                  <span>Open Full PDF Report</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowWrapModal(false)}
                  className="w-full text-center text-xs text-slate-500 hover:text-white font-bold py-2 cursor-pointer uppercase tracking-wider"
                >
                  Dismiss Wrap
                </button>
              </div>

            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// Simple text helper to print nicely in print templates
const formatMonthName = (yearMonth: string) => {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};
