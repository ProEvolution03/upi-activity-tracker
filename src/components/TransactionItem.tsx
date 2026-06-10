import React, { useState } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Transaction, Account } from '../types';
import { CATEGORIES, formatCurrency } from '../utils';
import { Trash, Calendar } from 'lucide-react';
import { getBankLogoDomain } from './AccountCard';

interface TransactionItemProps {
  transaction: Transaction;
  accounts: Account[];
  onDelete: (id: string) => void;
}

export default function TransactionItem({ transaction, accounts, onDelete }: TransactionItemProps) {
  const account = accounts.find((a) => a.id === transaction.accountId);
  const catInfo = CATEGORIES[transaction.category] || CATEGORIES.Other;
  const isCredit = transaction.type === 'credit';
  
  const controls = useAnimation();
  const [isSwiped, setIsSwiped] = useState(false);

  // Handle Drag / Swipe physics
  const handleDragEnd = async (event: any, info: any) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // If dragged hard/far to the left, lock in delete menu or auto-trigger
    if (offset < -60 || velocity < -200) {
      await controls.start({ x: -70 });
      setIsSwiped(true);
    } else {
      await controls.start({ x: 0 });
      setIsSwiped(false);
    }
  };

  const handleResetDrag = async () => {
    await controls.start({ x: 0 });
    setIsSwiped(false);
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#05070A] border border-slate-800/60 h-16 select-none my-1.5 shrink-0">
      {/* Background Action Space (Revealed when card is swiped) */}
      <div className="absolute inset-y-0 right-0 w-[70px] bg-red-600/20 flex items-center justify-center border-l border-red-500/30">
        <button
          onClick={() => {
            onDelete(transaction.id);
            handleResetDrag();
          }}
          className="w-full h-full bg-red-600 flex flex-col items-center justify-center text-white active:scale-95 transition cursor-pointer"
        >
          <Trash className="w-4 h-4" />
          <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Delete</span>
        </button>
      </div>

      {/* Actual Sliding Swipeable Front Card */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        dragMomentum={false}
        animate={controls}
        onDragEnd={handleDragEnd}
        className="absolute inset-0 bg-[#0D1117] flex items-center justify-between px-4 cursor-grab active:cursor-grabbing border-b border-slate-900 z-10"
      >
        <div className="flex items-center space-x-3 truncate">
          {/* Category Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#161B22] border border-slate-800 flex items-center justify-center text-lg shrink-0">
            {catInfo.emoji}
          </div>

          {/* Details */}
          <div className="truncate flex flex-col justify-start">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-100 truncate">
                {transaction.note || transaction.category}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-[9px] font-bold uppercase tracking-wider mt-0.5">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm ${
                account?.id === 'acc-a'
                  ? 'bg-blue-600/10 border border-blue-500/10 text-blue-400'
                  : 'bg-purple-600/10 border border-purple-500/10 text-purple-400'
              }`}>
                {account && (() => {
                  const logoDomain = getBankLogoDomain(account.name);
                  return logoDomain ? (
                    <img 
                      src={`https://www.google.com/s2/favicons?sz=32&domain=${logoDomain}`} 
                      alt="" 
                      className="w-3 h-3 object-contain rounded-xs bg-white p-0.5 border border-slate-700/50 shrink-0" 
                    />
                  ) : null;
                })()}
                <span>{account ? account.name : 'Account'}</span>
              </span>
              <span className="flex items-center space-x-0.5 text-slate-500">
                <Calendar className="w-2.5 h-2.5" />
                <span>{transaction.date}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p className={`text-sm font-black font-mono tracking-tight ${isCredit ? 'text-emerald-400' : 'text-slate-100'}`}>
            {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
          </p>
          <p className="text-[9px] uppercase tracking-wider font-mono text-slate-500 font-bold mt-0.5">
            {transaction.category}
          </p>
        </div>

        {/* Swipe Hint Indicator (Shows only if swiped back) */}
        {isSwiped && (
          <button
            onClick={handleResetDrag}
            className="absolute left-0 top-0 bottom-0 w-2.5 bg-blue-500 cursor-pointer pointer-events-auto"
            title="Reset position"
          />
        )}
      </motion.div>
    </div>
  );
}
