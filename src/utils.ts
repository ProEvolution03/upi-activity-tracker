import { CategoryType, Transaction, Account } from './types';

export interface CategoryInfo {
  name: CategoryType;
  emoji: string;
  bgColor: string;
  textColor: string;
}

export const CATEGORIES: Record<CategoryType, CategoryInfo> = {
  Food: { name: 'Food', emoji: '🍔', bgColor: 'bg-amber-500/15', textColor: 'text-amber-400' },
  Transport: { name: 'Transport', emoji: '🚗', bgColor: 'bg-blue-500/15', textColor: 'text-blue-400' },
  Shopping: { name: 'Shopping', emoji: '🛍️', bgColor: 'bg-pink-500/15', textColor: 'text-pink-400' },
  Bills: { name: 'Bills', emoji: '⚡', bgColor: 'bg-yellow-500/15', textColor: 'text-yellow-400' },
  Salary: { name: 'Salary', emoji: '💰', bgColor: 'bg-emerald-500/15', textColor: 'text-emerald-400' },
  Transfer: { name: 'Transfer', emoji: '💸', bgColor: 'bg-purple-500/15', textColor: 'text-purple-400' },
  Medical: { name: 'Medical', emoji: '🏥', bgColor: 'bg-rose-500/15', textColor: 'text-rose-400' },
  Other: { name: 'Other', emoji: '🏷️', bgColor: 'bg-slate-500/15', textColor: 'text-slate-400' },
};

export const QUICK_SHORTCUTS = [
  { amount: 100, category: 'Food' as CategoryType, note: 'Chai & Snacks ☕', label: '₹100 Chai & Snacks' },
  { amount: 200, category: 'Transport' as CategoryType, note: 'Auto Rickshaw 🛺', label: '₹200 Auto Rickshaw' },
  { amount: 120, category: 'Food' as CategoryType, note: 'Lunch Meal 🍲', label: '₹120 Lunch Meal' },
  { amount: 500, category: 'Shopping' as CategoryType, note: 'Supermarket 🛒', label: '₹500 Supermarket' },
  { amount: 1200, category: 'Bills' as CategoryType, note: 'Electricity/Wifi ⚡', label: '₹1200 Wifi Bill' },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  // Handlers for Today/Yesterday
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Export custom transactions schema as CSV
export function exportToCSV(transactions: Transaction[], accounts: Account[]): void {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const headers = ['Date', 'Account', 'Type', 'Amount (INR)', 'Category', 'Note'];
  
  const rows = transactions.map((t) => [
    t.date,
    accountMap.get(t.accountId) || 'Unknown Account',
    t.type.toUpperCase(),
    t.amount.toString(),
    t.category,
    t.note || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `UPI_Transactions_Report_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
