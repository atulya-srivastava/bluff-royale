import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import FeatureCard from '../components/FeatureCard.jsx';
import RulesModal from '../components/RulesModal.jsx';
import LeaderboardModal from '../components/LeaderboardModal.jsx';
import LoginModal from '../components/LoginModal.jsx';
import logoImg from '../assets/logo.png';
import { Users, Trophy, Lock, Swords, Sparkles, Shield, Dices, ChevronRight, Play } from 'lucide-react';

/**
 * Landing Page for Bluff Royale.
 * Classic online card game aesthetic.
 * Hero section + below-the-fold feature preview cards.
 */
const Landing = ({ onStartGame }) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const featureCards = [
    {
      id: 'multiplayer',
      title: 'Multiplayer Rooms',
      description: 'Jump into fast-paced 2 to 6 player real-time card tables with live chat and smooth turn flow.',
      icon: Users,
      badge: 'Live',
      status: 'Ready to Join',
      onClick: () => onStartGame(),
    },
    {
      id: 'ranked',
      title: 'Ranked Matches',
      description: 'Climb the competitive ladder, earn master titles, and test your poker face against top bluffers.',
      icon: Swords,
      badge: 'Competitive',
      status: 'Season 1 Active',
      onClick: () => setLeaderboardOpen(true),
    },
    {
      id: 'private',
      title: 'Private Lobbies',
      description: 'Create custom password-protected rooms to play with friends using secret shareable room codes.',
      icon: Lock,
      badge: 'Custom',
      status: 'Create Code',
      onClick: () => onStartGame(),
    },
    {
      id: 'leaderboard',
      title: 'Daily Leaderboard',
      description: 'Track highest win streaks, challenge success ratios, and claim your spot in the Hall of Fame.',
      icon: Trophy,
      badge: 'Daily',
      status: 'View Rankings',
      onClick: () => setLeaderboardOpen(true),
    },
  ];

  return (
    <div id="home" className="min-h-screen bg-wood-pattern text-[#f5e6d3] font-sans relative selection:bg-[#d4af37] selection:text-[#1c1008]">
      
      {/* Top Navbar */}
      <Navbar
        onPlayClick={onStartGame}
        onRulesClick={() => setRulesOpen(true)}
        onLeaderboardClick={() => setLeaderboardOpen(true)}
        onLoginClick={() => setLoginOpen(true)}
      />

      {/* Main Hero Section (Single Screen Hero) */}
      <main>
        <Hero
          onPlayClick={onStartGame}
          onRulesClick={() => setRulesOpen(true)}
        />

        {/* Below the fold: Feature Previews Section */}
        <section className="py-16 bg-gradient-to-b from-transparent via-[#1c1008]/90 to-[#140904] border-t border-[#3b2314] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2d1a0e] border border-[#8c622b] text-[#d4af37] text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" /> Game Features
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-black text-[#f5e6d3] tracking-tight">
                Everything You Need to <span className="text-[#d4af37]">Master the Bluff</span>
              </h2>
              <p className="text-sm text-[#dfc299] font-medium">
                Choose your game mode and experience classic card table gameplay built for modern web browsers.
              </p>
            </div>

            {/* Feature Cards Grid (4 Preview Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureCards.map((card) => (
                <FeatureCard
                  key={card.id}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  badge={card.badge}
                  status={card.status}
                  onClick={card.onClick}
                />
              ))}
            </div>

          </div>
        </section>
      </main>

      {/* Classic Card Table Footer */}
      <footer className="bg-[#140904] border-t border-[#3b2314] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Bluff Royale" className="w-7 h-7 object-contain" />
            <span className="font-heading text-base font-extrabold text-[#f5e6d3] tracking-wider uppercase">
              BLUFF <span className="text-[#d4af37]">ROYALE</span>
            </span>
          </div>

          <p className="text-xs text-[#8c622b] font-medium text-center sm:text-right">
            &copy; {new Date().getFullYear()} Bluff Royale. Classic Web Card Game. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Interactive Modals */}
      <RulesModal
        isOpen={rulesOpen}
        onClose={() => setRulesOpen(false)}
        onPlayNow={onStartGame}
      />

      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        onPlayNow={onStartGame}
      />

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={(name) => {
          onStartGame(name);
        }}
      />

    </div>
  );
};

export default Landing;
