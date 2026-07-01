import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key } from 'lucide-react';

interface LoginProps {
  onLogin: (user: { email: string; name: string; picture: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  // Try to load client ID from Vite env variable first, fallback to localStorage
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [clientId, setClientId] = useState(() => envClientId || localStorage.getItem('upitrack_google_client_id') || '');
  const [tempClientId, setTempClientId] = useState('');
  const [error, setError] = useState('');

  // Save client ID on change
  const handleSaveClientId = (val: string) => {
    const trimmed = val.trim();
    setClientId(trimmed);
    localStorage.setItem('upitrack_google_client_id', trimmed);
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
    if (!clientId) return;

    let intervalId: any;

    const initGoogleSignIn = () => {
      if ((window as any).google) {
        if (intervalId) clearInterval(intervalId);
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
          });
          const btnElem = document.getElementById('googleSignInBtn');
          if (btnElem) {
            (window as any).google.accounts.id.renderButton(
              btnElem,
              { 
                theme: 'filled_black', 
                size: 'large', 
                width: 320,
                text: 'signin_with',
                shape: 'pill'
              }
            );
          }
        } catch (e) {
          console.error('Google Auth Init Failed', e);
          setError('Google authentication initialization failed. Check your Client ID.');
        }
      }
    };

    // Try immediately
    initGoogleSignIn();

    // If not loaded yet, poll until it is
    if (!(window as any).google) {
      intervalId = setInterval(initGoogleSignIn, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [clientId]);

  return (
    <div className="absolute inset-0 bg-[#05070A] overflow-y-auto px-6 pt-[calc(env(safe-area-inset-top,0px)+32px)] pb-[calc(env(safe-area-inset-bottom,0px)+20px)] flex flex-col justify-between text-white no-scrollbar select-none">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />

      {/* Top Bar / App Header */}
      <div className="text-center mt-6 relative z-10 flex flex-col items-center">
        {/* App Icon Container */}
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

        <div className="bg-[#0D1117] border border-slate-800 p-6 rounded-2xl w-full text-center space-y-4">
          <span className="text-[9px] uppercase font-bold tracking-wider text-blue-400 font-mono block">
            Google Identity Login
          </span>

          {clientId ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 bg-[#161B22]/50 border border-slate-800/80 rounded-2xl space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)] pointer-events-none" />
              
              {/* Outer ring glow */}
              <div className="relative p-0.5 rounded-full bg-gradient-to-r from-blue-600/30 to-indigo-600/30 shadow-xl shadow-blue-500/10">
                <div id="googleSignInBtn" className="z-20 relative rounded-full overflow-hidden"></div>
              </div>
              
              <p className="text-[10px] text-slate-400 leading-relaxed max-w-[240px] text-center font-medium">
                Sign in securely with Google. Your ledger activity is saved locally and never shared.
              </p>
            </div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (tempClientId.trim()) {
                  handleSaveClientId(tempClientId);
                }
              }}
              className="space-y-4 text-left"
            >
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Google Client ID is required to sign in. Enter it below to initialize Google Sign-in:
              </p>
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">OAuth Client ID</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={tempClientId}
                    onChange={(e) => setTempClientId(e.target.value)}
                    placeholder="Paste Client ID here"
                    className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-3 py-2 text-xs outline-hidden font-semibold transition text-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <span>Save & Initialize Google Login</span>
              </button>
              
              <div className="p-3 bg-blue-600/5 border border-blue-500/10 rounded-xl text-[9px] leading-relaxed text-blue-400 font-semibold font-mono uppercase">
                💡 Note: You can also define VITE_GOOGLE_CLIENT_ID in your .env file or Netlify build settings to set this automatically!
              </div>
            </form>
          )}
        </div>
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
