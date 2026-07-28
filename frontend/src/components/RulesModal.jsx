import React from 'react';
import { X, BookOpen, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import Button from './Button.jsx';

const RulesModal = ({ isOpen, onClose, onPlayNow }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="golden-card-panel max-w-2xl w-full rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-2xl relative">
        
        {/* Header */}
        <div className="bg-[#24140b] p-5 border-b border-[#5c3b1e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#3b2314] border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-[#f5e6d3]">Rules of Bluff Royale</h2>
              <p className="text-xs text-[#dfc299]">Master the art of deception & card control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#dfc299] hover:text-[#d4af37] hover:bg-[#3b2314] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="bg-[#1c1008] p-4 rounded-xl border border-[#4a2d18]">
            <h3 className="font-heading font-bold text-[#d4af37] mb-1 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#f59e0b]" /> Objective
            </h3>
            <p className="text-sm text-[#dfc299]">
              Be the first player to discard all cards in your hand. You can play cards honestly or bluff!
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-heading font-bold text-[#f5e6d3] text-base">How to Play Step-by-Step</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#2d1a0e] p-3 rounded-lg border border-[#4a2d18]">
                <span className="font-bold text-[#d4af37] block mb-1">1. Claim a Rank</span>
                <p className="text-[#dfc299]">
                  Select 1 to 4 cards from your hand face-down onto the pile and state their rank (e.g., "Two Aces").
                </p>
              </div>

              <div className="bg-[#2d1a0e] p-3 rounded-lg border border-[#4a2d18]">
                <span className="font-bold text-[#d4af37] block mb-1">2. Tell the Truth or Bluff</span>
                <p className="text-[#dfc299]">
                  The cards played do NOT actually have to match the declared rank. That's the bluff!
                </p>
              </div>

              <div className="bg-[#2d1a0e] p-3 rounded-lg border border-[#4a2d18]">
                <span className="font-bold text-[#d4af37] block mb-1">3. Call "BLUFF!"</span>
                <p className="text-[#dfc299]">
                  Any opponent can challenge the move before the next turn if they suspect a lie.
                </p>
              </div>

              <div className="bg-[#2d1a0e] p-3 rounded-lg border border-[#4a2d18]">
                <span className="font-bold text-[#d4af37] block mb-1">4. Resolution</span>
                <p className="text-[#dfc299]">
                  If the player lied, they pick up the entire pile! If they were truthful, the challenger takes the pile.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#24140b] p-3.5 rounded-xl border border-[#8c622b] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" />
            <div className="text-xs text-[#dfc299]">
              <strong className="text-[#f5e6d3]">Pro Tip:</strong> Timing your challenges is key. Calling a bluff on a large pile high-stakes turn can win or cost you the match!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#1c1008] p-4 border-t border-[#4a2d18] flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-bold text-[#dfc299] hover:text-[#d4af37]"
          >
            Close Rules
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              if (onPlayNow) onPlayNow();
            }}
          >
            Play Now
          </Button>
        </div>

      </div>
    </div>
  );
};

export default RulesModal;
