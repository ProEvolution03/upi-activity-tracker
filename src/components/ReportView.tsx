import React, { useState } from 'react';
import { Transaction, Account } from '../types';
import { CATEGORIES, formatCurrency } from '../utils';
import { FileDown, Calendar, Sparkles, TrendingUp, TrendingDown, Landmark, PieChart, Shield, Award } from 'lucide-react';

interface ReportViewProps {
  transactions: Transaction[];
  accounts: Account[];
}

export default function ReportView({ transactions, accounts }: ReportViewProps) {
  // Aggregate available months from transactions list
  const getMonthsList = () => {
    const list = new Set<string>();
    
    // Add current month in case there are no transactions yet
    const currStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    list.add(currStr);

    transactions.forEach((t) => {
      if (t.date) {
        list.add(t.date.slice(0, 7)); // e.g. "2026-06"
      }
    });

    return Array.from(list).sort().reverse(); // Show latest months first
  };

  const months = getMonthsList();
  // Set default month to the latest month that has transactions, fallback to current month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const monthWithTx = months.find((m) =>
      transactions.some((t) => t.date && t.date.startsWith(m))
    );
    return monthWithTx || months[0] || new Date().toISOString().slice(0, 7);
  });

  // Filter transactions for the selected month
  const monthTransactions = transactions.filter(
    (t) => t.date && t.date.startsWith(selectedMonth)
  );

  // Math aggregates
  const totalIncome = monthTransactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Category aggregates (only debits since budget is expenses)
  const categoryBudgets: Record<string, number> = {};
  monthTransactions
    .filter((t) => t.type === 'debit')
    .forEach((t) => {
      categoryBudgets[t.category] = (categoryBudgets[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryBudgets)
    .sort((a, b) => b[1] - a[1]);

  // Find biggest debit transaction of the month
  const biggestExpense = monthTransactions
    .filter((t) => t.type === 'debit')
    .reduce((max: Transaction | null, t) => {
      if (!max || t.amount > max.amount) return t;
      return max;
    }, null);

  // Per-Account breakdown of selected month
  const accountBreakdowns = accounts.map((acct) => {
    const acctTxs = monthTransactions.filter((t) => t.accountId === acct.id);
    const credits = acctTxs.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const debits = acctTxs.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate running balance by carrying over the starting balance and transactions up to the selected month
    const historicalTxs = transactions.filter(
      (t) => t.accountId === acct.id && t.date && t.date.slice(0, 7) <= selectedMonth
    );
    const histCredits = historicalTxs.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const histDebits = historicalTxs.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    const runningBalance = acct.initialBalance + histCredits - histDebits;

    return {
      name: acct.name,
      credits,
      debits,
      net: credits - debits,
      runningBalance,
    };
  });

  const handlePrint = () => {
    window.print();
  };

  const formatMonthName = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col justify-start overflow-y-auto safe-pb-content text-white select-none">
      <div className="px-5 pb-4 safe-pt-header flex items-center justify-between no-print sticky top-0 bg-[#05070A]/90 backdrop-blur-md border-b border-slate-900/60 z-20">
        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center space-x-1.5 text-white">
          <PieChart className="w-5 h-5 text-blue-400" />
          <span>Ledger Reports</span>
        </h2>
        
        {/* Month selector UI */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="appearance-none bg-[#161B22] border border-slate-800 focus:border-blue-500 rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold font-sans text-blue-400 cursor-pointer text-center outline-hidden"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonthName(m)}
              </option>
            ))}
          </select>
          <Calendar className="w-3.5 h-3.5 text-blue-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Main Report Print Area */}
      <div className="px-5 py-4 space-y-6" id="printable-report">
        
        {/* Top Banner indicating printable state */}
        <div className="print-card bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/15 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-widest font-mono text-blue-400 font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" /> {formatMonthName(selectedMonth)} Summary
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mt-0.5">UPI Account Health Overview</h3>
          </div>
          <button
            onClick={handlePrint}
            className="no-print h-9 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer active:scale-95 transition shadow-lg shadow-blue-500/10"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Generate PDF</span>
          </button>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Credits Summary Card */}
          <div className="print-card bg-[#0D1117] border border-slate-800 p-4 rounded-xl relative overflow-hidden">
            <div className="flex items-center space-x-1.5 text-slate-500">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Total Credits</span>
            </div>
            <p className="text-base font-black text-emerald-400 font-mono mt-2">
              +{formatCurrency(totalIncome)}
            </p>
          </div>

          {/* Spend Summary Card */}
          <div className="print-card bg-[#0D1117] border border-slate-800 p-4 rounded-xl relative overflow-hidden">
            <div className="flex items-center space-x-1.5 text-slate-500">
              <TrendingDown className="w-3.5 h-3.5 text-red-450" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Total Expenses</span>
            </div>
            <p className="text-base font-black text-red-400 font-mono mt-2">
              -{formatCurrency(totalExpense)}
            </p>
          </div>
        </div>

        {/* Savings Gauge */}
        <div className="print-card bg-[#0D1117] border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Savings & Rate</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${netSavings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {Math.max(0, Math.round(savingRate))}% Rate
            </span>
          </div>

          <div>
            <p className={`text-xl font-black font-mono tracking-tight ${netSavings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)}
            </p>
          </div>

          {/* Bar gauge */}
          <div className="w-full h-1 bg-[#161B22] border border-slate-900 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.max(0, Math.min(savingRate, 100))}%` }}
              className={`h-full rounded-full bg-gradient-to-r ${
                netSavings >= 0 ? 'from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'from-red-500 to-amber-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
              }`}
            />
          </div>
        </div>

        {/* Category Expense list */}
        <div className="print-card bg-[#0D1117] border border-slate-800 p-5 rounded-2xl space-y-4">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Category-wise Expenditure</h4>
          {sortedCategories.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4 font-bold uppercase tracking-wider">No expenses recorded for this month.</p>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(([catName, amount]) => {
                const catInfo = CATEGORIES[catName as keyof typeof CATEGORIES] || CATEGORIES.Other;
                const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                
                return (
                  <div key={catName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{catInfo.emoji}</span>
                        <span className="text-slate-200">{catName}</span>
                      </div>
                      <span className="text-slate-400 font-mono">
                        {formatCurrency(amount)} ({Math.round(percentage)}%)
                      </span>
                    </div>
                    {/* Gauge bar */}
                    <div className="w-full h-1 bg-[#161B22] border border-slate-900 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Biggest Transaction Highlight */}
        {biggestExpense && (
          <div className="print-card bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl flex items-start space-x-3.5 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
              <Award className="w-20 h-20 text-amber-500" />
            </div>
            
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg shrink-0 text-amber-400">
              🔥
            </div>
            <div className="space-y-1 flex-1">
              <span className="text-[9px] uppercase tracking-wider font-mono text-amber-500 font-bold">Biggest Expense Ticket</span>
              <h5 className="text-xs font-bold text-slate-100">{biggestExpense.note || biggestExpense.category}</h5>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Recorded on: {biggestExpense.date}</p>
              <p className="text-base font-black text-amber-500 font-mono pt-1">
                -{formatCurrency(biggestExpense.amount)}
              </p>
            </div>
          </div>
        )}

        {/* Per-Account Breakdown list */}
        <div className="print-card bg-[#0D1117] border border-slate-800 p-5 rounded-2xl space-y-4">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1">
            <Landmark className="w-3.5 h-3.5 text-blue-400" /> Account breakdown stats
          </h4>
          <div className="space-y-4 divide-y divide-[#161B22]">
            {accountBreakdowns.map((ab) => (
              <div key={ab.name} className="pt-3.5 first:pt-0 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>{ab.name}</span>
                  <span className="text-slate-100 font-mono text-xs">
                    {formatCurrency(ab.runningBalance)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[9px] uppercase font-bold tracking-wider font-mono text-slate-500">
                  <div className="flex justify-between">
                    <span>Month Net:</span>
                    <span className={ab.net >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {ab.net >= 0 ? '+' : ''}{formatCurrency(ab.net)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credits:</span>
                    <span className="text-emerald-500 font-bold">+{formatCurrency(ab.credits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Debits:</span>
                    <span className="text-red-450 font-bold">-{formatCurrency(ab.debits)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security / Verification disclaimer */}
        <div className="flex items-center justify-center space-x-1.5 text-[9px] text-slate-600 text-center font-bold uppercase tracking-wider pt-4">
          <Shield className="w-3 h-3 text-slate-600" />
          <span>Ledger strictly personal. Generated via local client storage records.</span>
        </div>
      </div>
    </div>
  );
}
