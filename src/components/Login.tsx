import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, LogIn, ChevronRight, Settings } from 'lucide-react';

interface LoginProps {
  onLogin: (user: { email: string; name: string; picture: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [clientId, setClientId] = useState(() => localStorage.getItem('upitrack_google_client_id') || '');
  const [showConfig, setShowConfig] = useState(false);
  const [simEmail, setSimEmail] = useState('demo.user@gmail.com');
  const [simName, setSimName] = useState('Demo User');
  const [loginMode, setLoginMode] = useState<'real' | 'simulated'>('simulated');
  const [error, setError] = useState('');

  // Save client ID on change
  const handleSaveClientId = (val: string) => {
    setClientId(val.trim());
    localStorage.setItem('upitrack_google_client_id', val.trim());
    setError('');
  };

  // Decode Google JWT
  const decodeGoogleToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode JWT', e);
      return null;
    }
  };

  // Callback from Google Auth
  const handleCredentialResponse = (response: any) => {
    const payload = decodeGoogleToken(response.credential);
    if (payload && payload.email) {
      onLogin({
        email: payload.email,
        name: payload.name || payload.given_name || 'Google User',
        picture: payload.picture || '',
      });
    } else {
      setError('Auth token invalid. Please try again.');
    }
  };

  // Setup Google Sign In button if script loaded and client ID exists
  useEffect(() => {
    if (loginMode === 'real' && clientId && (window as any).google) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById('googleSignInBtn'),
          { 
            theme: 'filled_black', 
            size: 'large', 
            width: 320,
            text: 'signin_with',
            shape: 'pill'
          }
        );
      } catch (e) {
        console.error('Google Auth Init Failed', e);
        setError('Google authentication initialization failed. Check your Client ID.');
      }
    }
  }, [clientId, loginMode]);

  const handleSimulatedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!simEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    
    // Simulate user avatar using standard initials
    const initials = simName.split(' ').map(n => n[0]).join('').toUpperCase();
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(simName)}&background=2563EB&color=fff&bold=true`;

    onLogin({
      email: simEmail.trim().toLowerCase(),
      name: simName.trim(),
      picture: avatarUrl,
    });
  };

  return (
    <div className="absolute inset-0 bg-[#05070A] overflow-y-auto px-6 py-8 flex flex-col justify-between text-white no-scrollbar select-none">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />

      {/* Top Bar / App Header */}
      <div className="text-center mt-6 relative z-10 flex flex-col items-center">
        {/* Sleek App Icon Container */}
        <div className="w-20 h-20 rounded-2xl overflow-hidden mb-5 border border-slate-800 shadow-xl shadow-blue-500/5">
          <img 
            src="/apple-touch-icon.png" 
            alt="UPI PayTrack Icon" 
            className="w-full h-full object-cover" 
          />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-white font-sans">UPI PayTrack</h2>
        <p className="text-[9px] text-blue-400 font-mono font-bold uppercase tracking-widest mt-1">
          Personal Multi-User Ledger Engine
        </p>
      </div>

      {/* Main Login Card area */}
      <div className="my-auto relative z-10 py-6 max-w-sm mx-auto w-full">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center space-x-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Tab selector for Real vs Simulated Login */}
        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 mb-5 text-[10px] font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setLoginMode('simulated')}
            className={`py-2 rounded-lg transition-all ${
              loginMode === 'simulated' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Demo Sandbox
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('real')}
            className={`py-2 rounded-lg transition-all ${
              loginMode === 'real' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Google OAuth
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loginMode === 'simulated' ? (
            <motion.form
              key="sim-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSimulatedSubmit}
              className="space-y-4"
            >
              <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl space-y-4">
                <span className="text-[9px] uppercase font-bold tracking-wider text-blue-400 font-mono block">
                  Interactive Dev Sandbox Mode
                </span>
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">User Display Name</label>
                  <input
                    type="text"
                    required
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-sm outline-hidden font-semibold transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Google Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={simEmail}
                      onChange={(e) => setSimEmail(e.target.value)}
                      placeholder="e.g. user@gmail.com"
                      className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-3 py-2 text-sm outline-hidden font-semibold transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Launch Demo Ledger</span>
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="real-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 flex flex-col items-center"
            >
              <div className="bg-[#0D1117] border border-slate-800 p-5 rounded-2xl w-full text-center space-y-4">
                <span className="text-[9px] uppercase font-bold tracking-wider text-blue-400 font-mono block">
                  Google API Integration
                </span>

                {clientId ? (
                  <div className="flex flex-col items-center justify-center py-2">
                    <div id="googleSignInBtn" className="my-2 z-20"></div>
                    <button
                      onClick={() => handleSaveClientId('')}
                      className="text-[9px] text-slate-500 hover:text-slate-300 underline uppercase tracking-wider mt-4"
                    >
                      Clear Client ID Config
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5 text-left">
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      To enable live Google Sign-in on your domain, configure your Google OAuth Client ID below:
                    </p>
                    
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">OAuth Client ID</label>
                      <input
                        type="text"
                        placeholder="Paste your client ID from Google Console"
                        onChange={(e) => handleSaveClientId(e.target.value)}
                        className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs outline-hidden font-semibold transition text-slate-300"
                      />
                    </div>
                    
                    <div className="p-3 bg-blue-600/5 border border-blue-500/10 rounded-xl text-[9px] leading-relaxed text-blue-400 font-semibold font-mono uppercase">
                      ⚠️ Needs Authorized Javascript Origin `https://YOUR_DOMAIN.netlify.app` configured in Google Console!
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Privacy notice */}
      <div className="flex flex-col items-center relative z-10 mt-6">
        <div className="flex items-center space-x-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Local Account Isolation Secured</span>
        </div>
      </div>
    </div>
  );
}
