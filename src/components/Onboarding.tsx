import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Account } from '../types';
import { Wallet, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: (accounts: Account[]) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [acctAName, setAcctAName] = useState('');
  const [acctBName, setAcctBName] = useState('');
  const [acctABalance, setAcctABalance] = useState('5000');
  const [acctBBalance, setAcctBBalance] = useState('10000');
  const [acctABudget, setAcctABudget] = useState('0'); // 0 = no budget limit
  const [acctBBudget, setAcctBBudget] = useState('0');

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acctAName.trim() || !acctBName.trim()) {
      setError('Please provide names for both UPI accounts.');
      return;
    }
    if (acctAName.trim() === acctBName.trim()) {
      setError('Account names should be distinct.');
      return;
    }

    const initialA = parseFloat(acctABalance) || 0;
    const initialB = parseFloat(acctBBalance) || 0;
    const budgetA = parseFloat(acctABudget) || 0;
    const budgetB = parseFloat(acctBBudget) || 0;

    if (initialA < 0 || initialB < 0 || budgetA < 0 || budgetB < 0) {
      setError('Values cannot be negative.');
      return;
    }

    const accounts: Account[] = [
      {
        id: 'acc-a',
        name: acctAName.trim(),
        initialBalance: initialA,
        budgetLimit: budgetA,
      },
      {
        id: 'acc-b',
        name: acctBName.trim(),
        initialBalance: initialB,
        budgetLimit: budgetB,
      },
    ];

    onComplete(accounts);
  };

  return (
    <div className="absolute inset-0 bg-[#05070A] overflow-y-auto px-6 py-8 flex flex-col justify-start text-white no-scrollbar">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="text-center mt-6 mb-8 relative z-10">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center mb-3 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.15)]">
          <Wallet className="w-6 h-6 text-blue-400" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-white font-sans">UPI Account Setup</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-mono uppercase tracking-wider">
          Establish manual ledger configurations
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10 pb-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-2 text-red-400 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* ACCOUNT A */}
        <div className="p-5 bg-[#0D1117] border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Primary Bank (Account A)</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Account Label/Name</label>
              <input
                type="text"
                value={acctAName}
                onChange={(e) => setAcctAName(e.target.value)}
                placeholder="e.g. SBI UPI"
                maxLength={20}
                className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-white outline-hidden font-semibold transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Initial Balance (₹)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={acctABalance}
                  onChange={(e) => setAcctABalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-white outline-hidden font-semibold font-mono transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Monthly Budget (₹)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={acctABudget}
                  onChange={(e) => setAcctABudget(e.target.value)}
                  placeholder="0.00 (No limit)"
                  className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-white outline-hidden font-semibold font-mono transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ACCOUNT B */}
        <div className="p-5 bg-[#0D1117] border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Secondary Bank (Account B)</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Account Label/Name</label>
              <input
                type="text"
                value={acctBName}
                onChange={(e) => setAcctBName(e.target.value)}
                placeholder="e.g. HDFC UPI"
                maxLength={20}
                className="w-full bg-[#161B22] border border-slate-800 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500 rounded-xl px-3 py-2 text-sm text-white outline-hidden font-semibold transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Initial Balance (₹)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={acctBBalance}
                  onChange={(e) => setAcctBBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#161B22] border border-slate-800 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500 rounded-xl px-3 py-2 text-sm text-white outline-hidden font-semibold font-mono transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Monthly Budget (₹)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={acctBBudget}
                  onChange={(e) => setAcctBBudget(e.target.value)}
                  placeholder="0.00 (No limit)"
                  className="w-full bg-[#161B22] border border-slate-800 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500 rounded-xl px-3 py-2 text-sm text-white outline-hidden font-semibold font-mono transition"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-2 h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 active:scale-98 transition cursor-pointer"
        >
          <span>Complete Activation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
