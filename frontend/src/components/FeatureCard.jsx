import React from 'react';
import { Shield, Sparkles, Users, Trophy, Lock, Swords, ChevronRight } from 'lucide-react';

/**
 * FeatureCard component for preview sections below the fold.
 * Vintage wooden card box style with warm gold trim.
 */
const FeatureCard = ({ title, description, icon: Icon, badge, status, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="golden-card-panel rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden transition-all duration-300 group cursor-pointer"
    >
      {/* Top subtle wood/gold accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#5c3b1e] via-[#d4af37] to-[#5c3b1e]"></div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-b from-[#3b2314] to-[#1c1008] border border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow-inner group-hover:scale-105 transition-transform">
            {Icon ? <Icon className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>

          {badge && (
            <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#3b2314] text-[#d4af37] border border-[#8c622b] rounded-full">
              {badge}
            </span>
          )}
        </div>

        <h3 className="font-heading text-xl font-bold text-[#f5e6d3] group-hover:text-[#d4af37] transition-colors mb-2">
          {title}
        </h3>

        <p className="text-sm text-[#dfc299] leading-relaxed mb-6 font-normal">
          {description}
        </p>
      </div>

      <div className="pt-4 border-t border-[#4a2d18] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#b89326]">
        <span>{status || 'Preview Available'}</span>
        <span className="inline-flex items-center gap-1 text-[#d4af37] group-hover:translate-x-1 transition-transform">
          Explore <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};

export default FeatureCard;
