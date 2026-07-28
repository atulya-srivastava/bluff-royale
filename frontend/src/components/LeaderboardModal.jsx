import React from 'react';
import { X, Trophy, Crown, Medal, Flame } from 'lucide-react';
import Button from './Button.jsx';

const LeaderboardModal = ({ isOpen, onClose, onPlayNow }) => {
  if (!isOpen) return null;

  const mockLeaderboard = [
    { rank: 1, name: 'RoyalBluffer_99', wins: 142, winRate: '78%', rating: 2450 },
    { rank: 2, name: 'AceHunter', wins: 128, winRate: '72%', rating: 2310 },
    { rank: 3, name: 'PokerFace_Sam', wins: 115, winRate: '69%', rating: 2190 },
    { rank: 4, name: 'DeceptionMaster', wins: 98, winRate: '64%', rating: 2040 },
    { rank: 5, name: 'CardShark_Vic', wins: 87, winRate: '61%', rating: 1950 },
  ];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="golden-card-panel max-w-xl w-full rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-2xl relative">
        
        {/* Header */}
        <div className="bg-[#24140b] p-5 border-b border-[#5c3b1e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#3b2314] border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-[#f5e6d3]">Daily Leaderboard</h2>
              <p className="text-xs text-[#dfc299]">Top Bluffers of the Season</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#dfc299] hover:text-[#d4af37] hover:bg-[#3b2314] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="bg-[#1c1008] rounded-xl border border-[#4a2d18] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#2d1a0e] text-[#d4af37] uppercase tracking-wider font-bold border-b border-[#4a2d18]">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4 text-center">Wins</th>
                  <th className="py-3 px-4 text-center">Win Rate</th>
                  <th className="py-3 px-4 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3b2314] text-[#dfc299]">
                {mockLeaderboard.map((item) => (
                  <tr key={item.rank} className="hover:bg-[#2d1a0e]/50 transition-colors">
                    <td className="py-3 px-4 font-bold flex items-center gap-1.5">
                      {item.rank === 1 && <Crown className="w-4 h-4 text-[#f59e0b]" />}
                      {item.rank === 2 && <Medal className="w-4 h-4 text-slate-300" />}
                      {item.rank === 3 && <Medal className="w-4 h-4 text-amber-700" />}
                      <span>#{item.rank}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#f5e6d3]">{item.name}</td>
                    <td className="py-3 px-4 text-center font-semibold text-[#f59e0b]">{item.wins}</td>
                    <td className="py-3 px-4 text-center font-medium">{item.winRate}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#d4af37]">{item.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#1c1008] p-4 border-t border-[#4a2d18] flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-bold text-[#dfc299] hover:text-[#d4af37]"
          >
            Close
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              if (onPlayNow) onPlayNow();
            }}
          >
            Climb the Ranks
          </Button>
        </div>

      </div>
    </div>
  );
};

export default LeaderboardModal;
