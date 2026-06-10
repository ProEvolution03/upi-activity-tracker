import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Account, CategoryType, Transaction } from '../types';
import { CATEGORIES } from '../utils';
import { X, Calendar, Plus, Sparkles, Check, AlertCircle } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  initialData?: {
    amount: number;
    category: CategoryType;
    note: string;
    type: 'credit' | 'debit';
  } | null;
}

const NOTE_CHIPS: Record<CategoryType, string[]> = {
  Food: ['Chai & Snacks', 'Lunch Special', 'Dinner Party', 'Groceries'],
  Transport: ['Auto Ride', 'Metro Ticket', 'Cab Booking', 'Petrol Fuel'],
  Shopping: ['Supermarket', 'Apparel Store', 'Online Delivery', 'Electronics'],
  Bills: ['Rent Bill', 'Wifi Internet', 'Electricity bill', 'Mobile Topup'],
  Salary: ['Monthly Salary', 'Freelance gig', 'Bonus Cash', 'Investment Return'],
  Transfer: ['Sent to Friend', 'Bank Outflow', 'UPI Transfer', 'Gift Pay'],
  Medical: ['Pharmacy Store', 'Doctor Consultation', 'Lab Tests', 'Health Premium'],
  Other: ['Coffee blend', 'Pocket Cash', 'Movie Ticket', 'Small tip'],
};

export default function TransactionModal({ isOpen, onClose, accounts, onSave, initialData }: TransactionModalProps) {
  const [accountId, setAccountId] = useState('');
  const [type, setType] = useState<'credit' | 'debit'>('debit');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('Food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  
  const [error, setError] = useState('');

  // Fallback if no accounts exist (shouldn't happen)
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Handle pre-populations (shortcuts)
  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setCategory(initialData.category);
      setNote(initialData.note);
      setType(initialData.type);
    } else {
      // resets
      setAmount('');
      setCategory('Food');
      setNote('');
      setType('debit');
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    if (!accountId) {
      setError('Please select a valid bank account.');
      return;
    }

    onSave({
      accountId,
      type,
      amount: parsedAmount,
      category,
      note: note.trim(),
      date,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex items-end justify-center select-none">
        
        {/* Click outer to close */}
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

        {/* Modal body sliding from bottom overlay */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          className="relative w-full max-h-[90%] bg-[#0D1117] border-t border-slate-800 rounded-t-[30px] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 no-scrollbar pb-8"
        >
          {/* Top handle draggable-bar */}
          <div className="mx-auto w-12 h-1 bg-slate-800 rounded-full mb-5 cursor-pointer" onClick={onClose} />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-bold uppercase tracking-wider text-white flex items-center space-x-1.5 font-sans">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span>{initialData ? 'Quick Payment' : 'New Transaction'}</span>
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#161B22] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-white">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Credit / Debit Tab Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-[#05070A] p-1 rounded-2xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => setType('debit')}
                className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  type === 'debit'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Debit (Expense)
              </button>
              <button
                type="button"
                onClick={() => setType('credit')}
                className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  type === 'credit'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Credit (Income)
              </button>
            </div>

            {/* Select Account */}
            <div className="space-y-1">
              <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-500">Pay From / Receive In</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {accounts.map((acct) => (
                  <button
                    type="button"
                    key={acct.id}
                    onClick={() => setAccountId(acct.id)}
                    className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider text-center truncate transition ${
                      accountId === acct.id
                        ? acct.id === 'acc-a'
                          ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-sm shadow-blue-500/10'
                          : 'bg-purple-600/10 border-purple-500 text-purple-400 shadow-sm shadow-purple-500/10'
                        : 'bg-[#161B22] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {acct.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount (₹) */}
            <div className="space-y-1">
              <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-500">Amount in INR</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-blue-400">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500 rounded-2xl pl-10 pr-4 py-3 text-lg font-bold font-mono tracking-wide text-white outline-hidden transition"
                />
              </div>
            </div>

            {/* Category visual grid selection */}
            <div className="space-y-1.5">
              <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-500">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(CATEGORIES).map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      type="button"
                      key={cat.name}
                      onClick={() => setCategory(cat.name)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                        isSelected
                          ? `bg-[#161B22] border-2 border-blue-500 scale-102 shadow-[0_0_12px_rgba(59,130,246,0.2)]`
                          : 'bg-[#161B22] border-slate-850 hover:bg-[#1f2631]'
                      }`}
                    >
                      <span className="text-xl leading-none mb-1.5">{cat.emoji}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wide tracking-tight ${isSelected ? 'text-blue-400' : 'text-slate-400'} truncate w-full text-center`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suggestion Chips */}
            <div className="space-y-1.5">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {(NOTE_CHIPS[category] || []).map((chip) => (
                  <button
                    type="button"
                    key={chip}
                    onClick={() => setNote(chip)}
                    className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border shrink-0 transition ${
                      note === chip
                        ? 'bg-blue-600 text-white border-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                        : 'bg-[#161B22] text-slate-450 border-slate-800'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Note (optional) */}
              <input
                type="text"
                placeholder="Add private note (e.g., Chai and snacks)"
                maxLength={40}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden transition"
              />
            </div>

            {/* Date Selector */}
            <div className="space-y-1">
              <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-500 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-blue-400" />
                <span>Transaction Date</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden transition font-semibold"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 active:scale-98 transition mt-6 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
