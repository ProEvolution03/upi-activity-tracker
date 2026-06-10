import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2200);

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.5, ease: 'easeInOut' } }}
      className="absolute inset-0 bg-[#05070A] flex flex-col items-center justify-between p-8 z-50 text-white select-none"
    >
      {/* Decorative background grid/ambient light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.12)_0%,transparent_70%)] pointer-events-none" />

      {/* Top spacing */}
      <div className="h-10" />

      {/* Center Logo Group */}
      <div className="flex flex-col items-center justify-center">
        {/* Animated outer ring */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            boxShadow: [
              '0 0 20px 0px rgba(37, 99, 235, 0.2)',
              '0 0 35px 10px rgba(37, 99, 235, 0.4)',
              '0 0 20px 0px rgba(37, 99, 235, 0.2)',
            ],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: 'easeInOut',
          }}
          className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center mb-6"
        >
          {/* Inner details to represent instant payment arrows */}
          <div className="relative w-16 h-16 rounded-xl bg-slate-950/20 backdrop-blur-xs flex items-center justify-center">
            <motion.span
              initial={{ scale: 0.6, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="text-3xl font-black italic text-white tracking-widest font-sans"
            >
              U
            </motion.span>
            
            {/* Double UPI diagonal arrows logo style */}
            <div className="absolute top-2 right-2 flex space-x-1">
              <motion.div 
                animate={{ x: [0, 2, 0], y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" 
              />
            </div>
            <div className="absolute bottom-2 left-2 flex space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-2xl font-bold tracking-tight uppercase bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent font-sans"
        >
          UPI TRACKER
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-[9px] text-slate-400 tracking-widest uppercase mt-2 font-mono"
        >
          Personal Finance Engine v4.0
        </motion.p>
      </div>

      {/* Footer Details */}
      <div className="flex flex-col items-center w-full max-w-xs mb-8">
        {/* Loading state bar */}
        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mb-4 relative">
          <motion.div
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 1.8, ease: 'easeInOut', repeat: 0 }}
            className="absolute top-0 bottom-0 w-3/4 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
          />
        </div>

        {/* Secure marker */}
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Local Storage Secure</span>
        </div>
      </div>
    </motion.div>
  );
}
