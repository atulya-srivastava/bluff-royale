import React, { useState } from 'react';
import { X, User, Lock, LogIn, Sparkles } from 'lucide-react';
import Button from './Button.jsx';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLoginSuccess) {
      onLoginSuccess(username || 'Player');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="golden-card-panel max-w-md w-full rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-2xl relative">
        
        {/* Header */}
        <div className="bg-[#24140b] p-5 border-b border-[#5c3b1e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#3b2314] border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-[#f5e6d3]">Player Login</h2>
              <p className="text-xs text-[#dfc299]">Access your stats & rank achievements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#dfc299] hover:text-[#d4af37] hover:bg-[#3b2314] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-1">
              Username / Player Alias
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c622b]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter player handle..."
                required
                className="w-full bg-[#1c1008] border border-[#4a2d18] rounded-xl py-3 pl-10 pr-4 text-[#f5e6d3] placeholder-[#8c622b] focus:border-[#d4af37] focus:outline-none text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-1">
              Secret Passcode
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c622b]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#1c1008] border border-[#4a2d18] rounded-xl py-3 pl-10 pr-4 text-[#f5e6d3] placeholder-[#8c622b] focus:border-[#d4af37] focus:outline-none text-sm font-semibold"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              type="submit"
              icon={LogIn}
              className="w-full"
            >
              Sign In to Play
            </Button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                if (onLoginSuccess) onLoginSuccess('Guest_Bluffer');
                onClose();
              }}
              className="text-xs text-[#dfc299] hover:text-[#d4af37] font-semibold underline decoration-[#5c3b1e]"
            >
              Or Continue as Guest Player
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default LoginModal;
