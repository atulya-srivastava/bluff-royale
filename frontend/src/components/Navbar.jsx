import React, { useState } from 'react';
import Button from './Button.jsx';
import logoImg from '../assets/logo-hero.png';
import { Menu, X, Play, Crown } from 'lucide-react';

const Navbar = ({ onPlayClick, onRulesClick, onLeaderboardClick, onLoginClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#24140b]/90 backdrop-blur-md border-b border-[#4a2d18] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Bluff Royale Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative w-12 h-12 flex items-center justify-center p-0.5 filter drop-shadow-md group-hover:scale-105 transition-transform">
              <img
                src={logoImg}
                alt="Bluff Royale Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-heading text-2xl font-black tracking-tight text-[#f5e6d3] uppercase flex items-center gap-1.5">
                BLUFF <span className="text-[#d4af37] drop-shadow-sm">ROYALE</span>
              </span>
              <span className="block text-[10px] font-semibold text-[#b89326] tracking-widest uppercase -mt-1">
                Multiplayer Card Game
              </span>
            </div>
          </div>

          {/* Right: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#home"
              className="text-[#f5e6d3] hover:text-[#d4af37] text-sm font-semibold tracking-wide transition-colors"
            >
              Home
            </a>
            <button
              onClick={onRulesClick}
              className="text-[#dfc299] hover:text-[#d4af37] text-sm font-semibold tracking-wide transition-colors cursor-pointer"
            >
              How to Play
            </button>
            <button
              onClick={onLeaderboardClick}
              className="text-[#dfc299] hover:text-[#d4af37] text-sm font-semibold tracking-wide transition-colors cursor-pointer"
            >
              Leaderboard
            </button>
            <button
              onClick={onLoginClick}
              className="text-[#dfc299] hover:text-[#d4af37] text-sm font-semibold tracking-wide transition-colors cursor-pointer"
            >
              Login
            </button>

            {/* Play Now Primary Button */}
            <Button
              variant="primary"
              size="md"
              icon={Play}
              onClick={onPlayClick}
            >
              Play Now
            </Button>
          </nav>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#dfc299] hover:text-[#d4af37] hover:bg-[#3b2314] transition-colors focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1c1008] border-b border-[#4a2d18] px-4 pt-3 pb-6 space-y-3">
          <a
            href="#home"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#f5e6d3] hover:text-[#d4af37] text-base font-semibold py-2"
          >
            Home
          </a>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onRulesClick();
            }}
            className="block w-full text-left text-[#dfc299] hover:text-[#d4af37] text-base font-semibold py-2"
          >
            How to Play
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onLeaderboardClick();
            }}
            className="block w-full text-left text-[#dfc299] hover:text-[#d4af37] text-base font-semibold py-2"
          >
            Leaderboard
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onLoginClick();
            }}
            className="block w-full text-left text-[#dfc299] hover:text-[#d4af37] text-base font-semibold py-2"
          >
            Login
          </button>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              icon={Play}
              onClick={() => {
                setMobileMenuOpen(false);
                onPlayClick();
              }}
              className="w-full"
            >
              Play Now
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
