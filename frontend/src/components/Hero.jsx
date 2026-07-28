import React from 'react';
import Button from './Button.jsx';
import logoHeroImg from '../assets/logo-hero.png';
import { Play, BookOpen, Dices } from 'lucide-react';

/**
 * Hero component for Bluff Royale landing page.
 * Split layout: Left (Heading, description, buttons), Right (Clean large fixed logo emblem).
 */
const Hero = ({ onPlayClick, onRulesClick }) => {
  return (
    <section className="relative py-12 overflow-hidden">
      {/* Subtle warm golden ambient backdrop accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-full bg-radial from-[#5c3719]/25 via-transparent to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT SIDE */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2d1a0e] border border-[#d4af37] text-[#d4af37] text-xs font-bold uppercase tracking-widest shadow-sm">
              <Dices className="w-4 h-4 text-[#f59e0b]" />
              <span>Classic Multiplayer Card Table</span>
            </div>

            {/* Large Heading */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#f5e6d3] leading-tight tracking-tight drop-shadow-md">
              The Ultimate <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#f59e0b] via-[#d4af37] to-[#f59e0b]">
                Bluff Card Game
              </span>
            </h1>

            {/* Small Description */}
            <p className="text-base sm:text-lg text-[#dfc299] max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Outsmart your friends, call their bluff, and become the last player standing. Play online in fast-paced multiplayer rooms.
            </p>

            {/* Action Buttons (Primary: Play Now, Secondary: Learn Rules) */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={Play}
                onClick={onPlayClick}
                className="w-full sm:w-auto shadow-xl"
              >
                Play Now
              </Button>

              <Button
                variant="secondary"
                size="lg"
                icon={BookOpen}
                onClick={onRulesClick}
                className="w-full sm:w-auto"
              >
                Learn Rules
              </Button>
            </div>

            {/* Trust / Stats highlights */}
            <div className="pt-6 border-t border-[#3b2314] grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <span className="block font-heading text-2xl font-black text-[#d4af37]">2-6</span>
                <span className="text-xs text-[#dfc299] uppercase font-semibold tracking-wider">Players / Room</span>
              </div>
              <div>
                <span className="block font-heading text-2xl font-black text-[#f59e0b]">100%</span>
                <span className="text-xs text-[#dfc299] uppercase font-semibold tracking-wider">Skill & Strategy</span>
              </div>
              <div>
                <span className="block font-heading text-2xl font-black text-[#d4af37]">Instant</span>
                <span className="text-xs text-[#dfc299] uppercase font-semibold tracking-wider">Browser Play</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Large Fixed Emblem Logo (Clean, borderless, no duplicate buttons) */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="w-full flex items-center justify-center">
              <img
                src={logoHeroImg}
                alt="Bluff Royale Royal Cards Crest Emblem"
                className="w-full h-auto object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.9)]"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
