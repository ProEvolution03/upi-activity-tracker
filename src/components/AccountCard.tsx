import React from 'react';
import { Account } from '../types';
import { formatCurrency } from '../utils';
import { CreditCard, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface AccountCardProps {
  account: Account;
  credits: number;
  debits: number;
}

export default function AccountCard({ account, credits, debits }: AccountCardProps) {
  const netBalance = account.initialBalance + credits - debits;
  const isPositive = netBalance >= 0;

  // Budget calculations (based on outgoing debit items)
  const hasBudget = account.budgetLimit > 0;
  const budgetUsage = hasBudget ? (debits / account.budgetLimit) * 100 : 0;
  const isOverBudget = hasBudget && debits > account.budgetLimit;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D1117] to-[#0A0D14] border border-slate-800 p-5 flex flex-col justify-between h-48 select-none transition-shadow duration-300 ${
      isPositive ? 'hover:shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'hover:shadow-[0_0_20px_rgba(239,68,68,0.05)]'
    }`}>
      {/* Radiant glow at corner */}
      <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-25 ${
        isPositive ? 'bg-emerald-500/20' : 'bg-red-500/20'
      }`} />

      {/* Account Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              account.id === 'acc-a' 
                ? 'bg-blue-600/10 border-blue-500/25 text-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.2)]' 
                : 'bg-purple-600/10 border-purple-500/25 text-purple-400 shadow-[0_0_8px_rgba(147,51,234,0.2)]'
            }`}>
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 truncate max-w-[120px]">
              {account.name}
            </h4>
          </div>
          {isOverBudget && (
            <div className="flex items-center space-x-1 py-0.5 px-2 rounded-md bg-red-500/10 border border-red-500/20 text-[9px] text-red-400 font-bold uppercase tracking-wider">
              <AlertCircle className="w-3 h-3 text-red-450 shrink-0" />
              <span>Limit Over</span>
            </div>
          )}
        </div>

        {/* Balance Display */}
        <div className="pt-2">
          <p className="text-[9px] uppercase font-bold font-mono tracking-widest text-slate-500">Net Balance</p>
          <p className={`text-xl font-black font-mono tracking-tight ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(netBalance)}
          </p>
        </div>
      </div>

      {/* Stats and Overviews */}
      <div className="space-y-3.5 pt-1">
        {/* Credits vs Debits Grid */}
        <div className="grid grid-cols-2 gap-2 border-t border-slate-900 pt-2.5">
          <div>
            <div className="flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>Credits</span>
            </div>
            <p className="text-xs font-black text-emerald-400 font-mono mt-0.5">
              +{formatCurrency(credits)}
            </p>
          </div>
          <div>
            <div className="flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              <TrendingDown className="w-3 h-3 text-red-400" />
              <span>Spends</span>
            </div>
            <p className="text-xs font-black text-red-450 font-mono mt-0.5">
              -{formatCurrency(debits)}
            </p>
          </div>
        </div>

        {/* Budget Progress Bar */}
        {hasBudget && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
              <span className="text-slate-500">Monthly Budget</span>
              <span className={isOverBudget ? 'text-red-400 font-black font-mono' : 'text-blue-400 font-black font-mono'}>
                {Math.round(budgetUsage)}% ({formatCurrency(account.budgetLimit)})
              </span>
            </div>
            <div className="w-full h-1 bg-[#161B22] border border-slate-900 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                }`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
