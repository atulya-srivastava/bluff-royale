import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, AlertCircle, Clock, Trophy, HelpCircle, X, Volume2, VolumeX, Target, Layers, User, Sparkles, WifiOff, Eye, CheckCircle2, XCircle, Flame, ShieldCheck, Swords } from 'lucide-react';

function GameBoard({ roomState, playerId, cards, socket, roomCode, muted, setMuted, onLeaveRoom }) {
  const [selectedCards, setSelectedCards] = useState([]);
  
  // Custom Claim Rank Selection State (Only for starting a round)
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimRank, setClaimRank] = useState('A');
  const [localDismissedResult, setLocalDismissedResult] = useState(false);

  // Pair equal cards together by rank order
  const rankOrder = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  const sortedCards = [...cards].sort((a, b) => {
    const orderA = rankOrder[a.rank] || 0;
    const orderB = rankOrder[b.rank] || 0;
    if (orderA !== orderB) return orderA - orderB;
    const suitOrder = { '♠': 1, '♥': 2, '♦': 3, '♣': 4 };
    return (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
  });

  // Dynamic penalty flying card animation refs & state
  const [cardFlowAnim, setCardFlowAnim] = useState(null);
  const prevPhaseRef = useRef(null);
  const logEndRef = useRef(null);
  const discardPileRef = useRef(null);
  const localHandRef = useRef(null);
  const playerRefs = useRef({});

  const localPlayer = roomState.players.find(p => p.id === playerId);
  const activeIndex = roomState.gameState?.turnIndex;
  const activePlayer = roomState.players[activeIndex];
  const isMyTurn = activePlayer?.id === playerId;
  const phase = roomState.gameState?.phase;
  const lastPlay = roomState.gameState?.lastPlay;
  const isCreator = localPlayer?.isCreator;
  const challengeResult = roomState.gameState?.challengeResult;
  const activeRank = roomState.gameState?.activeRank;

  // Auto-scroll history
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [roomState.gameState?.history]);

  // Reset local dismiss when a new challenge result comes in
  useEffect(() => {
    if (challengeResult) {
      setLocalDismissedResult(false);
    }
  }, [challengeResult]);

  // Trigger dynamic penalty flying cards to penalised player's exact screen position AFTER modal closes
  useEffect(() => {
    // When leaving resolution phase into play phase
    if (prevPhaseRef.current === 'resolution' && phase === 'play') {
      const lastReveal = roomState.gameState?.history?.findLast?.(h => h.type === 'challenge_reveal');
      if (lastReveal && lastReveal.loserId) {
        const loserId = lastReveal.loserId;
        
        // Small 150ms timeout ensures DOM is fully rendered after modal unmount
        setTimeout(() => {
          let targetX = 0;
          let targetY = 300;

          if (discardPileRef.current) {
            const originRect = discardPileRef.current.getBoundingClientRect();
            const originX = originRect.left + originRect.width / 2;
            const originY = originRect.top + originRect.height / 2;

            let targetEl = null;
            if (loserId === playerId) {
              targetEl = localHandRef.current;
            } else if (playerRefs.current[loserId]) {
              targetEl = playerRefs.current[loserId];
            }

            if (targetEl) {
              const targetRect = targetEl.getBoundingClientRect();
              const destX = targetRect.left + targetRect.width / 2;
              const destY = targetRect.top + targetRect.height / 2;
              targetX = destX - originX;
              targetY = destY - originY;
            }
          }

          setCardFlowAnim({
            loserId,
            targetX,
            targetY,
            cardCount: Math.min(lastReveal.penaltyCards || 6, 8)
          });

          setTimeout(() => setCardFlowAnim(null), 1400);
        }, 150);
      }
    }
    prevPhaseRef.current = phase;
  }, [phase, playerId, roomState.gameState?.history]);

  const handleCardClick = (cardId) => {
    if (phase !== 'play' || !isMyTurn) return;

    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        if (prev.length >= 4) return prev;
        return [...prev, cardId];
      }
    });
  };

  const handlePlayButtonClick = () => {
    if (selectedCards.length === 0) return;

    if (!activeRank) {
      const selectedObjects = selectedCards.map(id => cards.find(c => c.id === id)).filter(Boolean);
      if (selectedObjects.length > 0) {
        setClaimRank(selectedObjects[0].rank);
      }
      setShowClaimModal(true);
    } else {
      socket.emit('play_cards', {
        roomCode,
        cardIds: selectedCards,
        claimedRank: activeRank
      });
      setSelectedCards([]);
    }
  };

  const handleConfirmClaim = () => {
    if (!socket || selectedCards.length === 0) return;

    socket.emit('play_cards', {
      roomCode,
      cardIds: selectedCards,
      claimedRank: claimRank
    });

    setSelectedCards([]);
    setShowClaimModal(false);
  };

  const handlePass = () => {
    if (!socket) return;
    socket.emit('pass_turn', { roomCode });
    setSelectedCards([]);
  };

  const handleChallenge = () => {
    if (!socket) return;
    socket.emit('challenge_bluff', { roomCode });
  };

  const handleResetGame = () => {
    if (!socket) return;
    socket.emit('reset_game', { roomCode });
  };

  // Re-order players so local player is bottom
  const localIdx = roomState.players.findIndex(p => p.id === playerId);
  const otherPlayers = [];
  for (let i = 1; i < roomState.players.length; i++) {
    otherPlayers.push(roomState.players[(localIdx + i) % roomState.players.length]);
  }

  // Responsive player positions around table felt
  const getPositionClasses = (count, index) => {
    if (count === 1) {
      return 'top-4 left-1/2 -translate-x-1/2';
    }
    if (count === 2) {
      return index === 0 ? 'top-6 left-[12%]' : 'top-6 right-[12%]';
    }
    if (count === 3) {
      if (index === 0) return 'top-1/2 left-4 -translate-y-1/2';
      if (index === 1) return 'top-4 left-1/2 -translate-x-1/2';
      return 'top-1/2 right-4 -translate-y-1/2';
    }
    if (count === 4) {
      if (index === 0) return 'top-[60%] left-4 -translate-y-1/2';
      if (index === 1) return 'top-4 left-[20%]';
      if (index === 2) return 'top-4 right-[20%]';
      return 'top-[60%] right-4 -translate-y-1/2';
    }
    if (index === 0) return 'top-[62%] left-4 -translate-y-1/2';
    if (index === 1) return 'top-6 left-[18%]';
    if (index === 2) return 'top-4 left-1/2 -translate-x-1/2';
    if (index === 3) return 'top-6 right-[18%]';
    return 'top-[62%] right-4 -translate-y-1/2';
  };

  const getSuitColor = (suit) => (suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-slate-900');

  const getDiscardPileTransform = (idx) => {
    const angle = (idx * 17) % 35 - 17;
    const x = (idx * 5) % 11 - 5;
    const y = (idx * 4) % 11 - 5;
    return `rotate(${angle}deg) translate(${x}px, ${y}px)`;
  };

  const getChallengeResultDetails = () => {
    if (!challengeResult) return null;
    const { winner, loser, success } = challengeResult;
    const challengerName = success ? winner : loser;
    const throwerName = success ? loser : winner;
    return {
      challengerName,
      throwerName,
      success,
      statement: success 
        ? `${challengerName} wins the CLAIM, ${throwerName} lied!`
        : `${throwerName} wins the CLAIM, ${throwerName} told the truth!`
    };
  };

  const challengeDetails = getChallengeResultDetails();

  return (
    <div className="w-full min-h-screen flex flex-col justify-between p-3 relative overflow-hidden select-none bg-wood-pattern">
      
      {/* Top Header Bar (Icon & Symbol Driven) */}
      <div className="w-full flex justify-between items-center bg-[#2d1a0e]/95 border border-[#5c3b1e] px-3.5 py-2 rounded-2xl backdrop-blur-md z-30 shadow-xl">
        <div className="flex items-center gap-2.5">
          {/* Room Code Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1c1008] rounded-xl border border-[#4a2c18]" title="Room Access Code">
            <User className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="text-xs font-black text-[#d4af37] font-mono tracking-wider">{roomCode}</span>
          </div>

          {/* Target Rank Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1c1008] rounded-xl border border-[#4a2c18]" title="Target Card Rank for Round">
            <Target className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span className="text-xs font-black text-[#f5e6d3]">
              {activeRank ? `${activeRank}s` : 'ANY'}
            </span>
          </div>
        </div>

        {/* Remainder Cards Section */}
        {roomState.gameState?.remainderCards && roomState.gameState.remainderCards.length > 0 && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#1c1008]/90 rounded-xl border border-[#4a2c18]" title="Leftover Cards face up on table">
            <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
            <div className="flex gap-1">
              {roomState.gameState.remainderCards.map((card) => (
                <span 
                  key={card.id} 
                  className={`text-xs font-black px-1.5 py-0.5 bg-[#2d1a0e] border border-[#5c3b1e] rounded-md ${
                    card.suit === '♥' || card.suit === '♦' ? 'text-red-400' : 'text-[#f5e6d3]'
                  }`}
                >
                  {card.rank}{card.suit}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Player Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1c1008] rounded-xl border border-[#4a2c18]" title="Your Handle">
            <div className="w-4 h-4 rounded-full bg-[#3b2314] text-[9px] font-black text-[#d4af37] flex items-center justify-center border border-[#8c622b]">
              {localPlayer?.username?.substring(0, 1).toUpperCase()}
            </div>
            <span className="text-xs font-black text-[#f5e6d3] max-w-20 truncate">{localPlayer?.username}</span>
          </div>
          
          {/* Mute Button */}
          <button
            onClick={() => setMuted(!muted)}
            className="p-1.5 bg-[#1c1008] hover:bg-[#3b2314] text-[#d4af37] rounded-xl border border-[#5c3b1e] transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-95"
            title={muted ? 'Unmute game sounds' : 'Mute game sounds'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#d4af37]" />}
          </button>

          {/* Exit Room Button */}
          <button
            onClick={onLeaveRoom}
            className="p-1.5 sm:px-3 sm:py-1.5 bg-[#4a1212]/80 hover:bg-[#631818] border border-[#8c2323] text-rose-200 text-xs font-black rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1 active:scale-95"
            title="Leave Game Room"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Casino Felt Table Area */}
      <div className="grow flex items-center justify-center relative w-full h-[52vh] max-h-110 my-4">
        
        {/* Felt Oval Table */}
        <div className="w-[88%] h-[72%] max-w-210 rounded-[160px] bg-felt-dark classic-table-bezel absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          
          {/* Center Table Info & Cards */}
          <div className="flex items-center gap-6 sm:gap-10 z-20">
            
            {/* Target Rank Display */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-[#d4af37] text-[10px] font-extrabold uppercase tracking-widest" title="Target Rank required for this round">
                <Target className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rank</span>
              </div>
              {activeRank ? (
                <div className="w-13 h-19 bg-[#f5e6d3] text-[#1c1008] font-black rounded-xl border-2 border-[#d4af37] shadow-2xl flex flex-col justify-between p-1.5 transform hover:scale-105 transition-transform">
                  <div className="text-xs leading-none font-black">{activeRank}</div>
                  <div className="text-center text-2xl font-black leading-none text-[#b45309]">{activeRank}</div>
                  <div className="text-xs leading-none text-right rotate-180 font-black">{activeRank}</div>
                </div>
              ) : (
                <div className="w-13 h-19 border-2 border-dashed border-[#d4af37]/60 bg-[#1c1008]/90 rounded-xl flex flex-col items-center justify-center text-center p-1 text-[#dfc299] shadow-inner" title="Any rank can be started">
                  <Sparkles className="w-5 h-5 text-[#d4af37] animate-pulse" />
                  <span className="text-[9px] font-extrabold text-[#d4af37] mt-1">ANY</span>
                </div>
              )}
            </div>

            {/* Discard Pile Stack */}
            <div ref={discardPileRef} className="relative w-20 h-28 flex items-center justify-center" title="Table Discard Pile">
              {roomState.gameState?.discardPileCount > 0 ? (
                <>
                  {[...Array(Math.min(5, roomState.gameState.discardPileCount))].map((_, i) => (
                    <div
                      key={i}
                      style={{ transform: getDiscardPileTransform(i) }}
                      className="absolute w-14 h-20 bg-linear-to-br from-[#4a1212] to-[#1c0808] border border-[#d4af37]/60 rounded-lg shadow-md"
                    />
                  ))}
                  <div 
                    style={{ transform: getDiscardPileTransform(roomState.gameState.discardPileCount) }}
                    className="absolute w-14 h-20 bg-linear-to-br from-[#5c1616] to-[#260a0a] border-2 border-[#d4af37] rounded-lg shadow-2xl flex flex-col items-center justify-center p-1"
                  >
                    <div className="w-full h-full border border-dashed border-[#d4af37]/40 rounded flex flex-col items-center justify-center">
                      <Layers className="w-4 h-4 text-[#d4af37] mb-0.5" />
                      <span className="text-sm font-black text-[#f5e6d3] leading-none">
                        {roomState.gameState.discardPileCount}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-14 h-20 border-2 border-dashed border-[#8c622b]/50 rounded-lg flex flex-col items-center justify-center gap-1 opacity-60">
                  <Layers className="w-4 h-4 text-[#8c622b]" />
                  <span className="text-[9px] font-extrabold text-[#8c622b]">0</span>
                </div>
              )}
            </div>

            {/* Turn Timer Indicator (Only shown if timer duration > 0) */}
            {roomState.settings?.timerDuration > 0 && (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1 text-[#d4af37] text-[10px] font-extrabold uppercase tracking-widest" title="Turn Timer">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Timer</span>
                </div>
                <div className={`w-13 h-13 rounded-full bg-[#1c1008]/95 border-2 flex flex-col items-center justify-center shadow-2xl transition-all ${
                  roomState.gameState?.timerLeft === null 
                    ? 'border-[#5c3b1e] text-[#dfc299]'
                    : roomState.gameState?.timerLeft <= 4 
                      ? 'border-red-500 text-red-400 active-pulse-ring' 
                      : roomState.gameState?.timerLeft <= 8 
                        ? 'border-[#f59e0b] text-[#f59e0b]' 
                        : 'border-[#d4af37] text-[#d4af37]'
                }`}>
                  <span className="text-lg font-black font-mono leading-none">{roomState.gameState?.timerLeft ?? roomState.settings.timerDuration}</span>
                </div>
              </div>
            )}

          </div>

          {/* Active Action Banner Overlay (Visual Symbol Badges) */}
          {((phase === 'challenge') || (roomState.settings?.timerDuration === 0 && lastPlay)) && lastPlay && (
            <div className="absolute top-[78%] left-1/2 -translate-x-1/2 bg-[#1c1008]/95 border-2 border-[#d4af37] px-4 py-2 rounded-2xl text-center shadow-2xl z-30 flex items-center gap-3 backdrop-blur-md">
              <div className="flex items-center gap-1 bg-[#3b2314] px-2 py-1 rounded-lg border border-[#8c622b]">
                <User className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="text-xs font-black text-[#f5e6d3]">{lastPlay.username}</span>
              </div>
              
              <div className="flex items-center gap-1 text-[#dfc299] text-xs font-extrabold">
                <Layers className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>{lastPlay.cardCount}×</span>
              </div>

              <div className="flex items-center gap-1 bg-[#f5e6d3] text-[#1c1008] px-2 py-0.5 rounded-md font-black text-xs border border-[#d4af37]">
                <Target className="w-3 h-3 text-[#b45309]" />
                <span>{lastPlay.claimedRank}</span>
              </div>
            </div>
          )}

          {/* Dynamic Flying Penalty Cards Animation to Penalized Candidate */}
          {cardFlowAnim && (
            <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
              {[...Array(cardFlowAnim.cardCount)].map((_, i) => {
                const spreadAngle = (i - (cardFlowAnim.cardCount - 1) / 2) * 12;
                return (
                  <div
                    key={i}
                    className="absolute w-12 h-18 card-back-pattern animate-penalty-fly"
                    style={{
                      animationDelay: `${i * 0.08}s`,
                      '--tx': `${cardFlowAnim.targetX}px`,
                      '--ty': `${cardFlowAnim.targetY}px`,
                      '--rot': `${spreadAngle}deg`,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Opponents Badges */}
        {otherPlayers.map((player, idx) => {
          const isPlayerTurn = activeIndex !== null && roomState.players[activeIndex]?.id === player.id;
          const posClass = getPositionClasses(otherPlayers.length, idx);

          return (
            <div 
              key={player.id} 
              ref={(el) => (playerRefs.current[player.id] = el)}
              className={`absolute flex flex-col items-center z-30 ${posClass}`}
            >
              <div className={`px-2.5 py-1.5 rounded-2xl bg-[#2d1a0e]/95 border-2 flex items-center gap-2 shadow-2xl backdrop-blur-sm transition-all duration-300 ${
                player.disconnected 
                  ? 'opacity-40 border-rose-600' 
                  : player.passed 
                    ? 'opacity-60 border-[#5c3b1e]' 
                    : isPlayerTurn 
                      ? 'border-[#d4af37] ring-2 ring-[#d4af37]/40 bg-[#3b2314]' 
                      : 'border-[#5c3b1e]'
              }`}>
                <div className="w-7 h-7 rounded-full bg-[#1c1008] border border-[#d4af37] flex items-center justify-center text-[10px] font-black text-[#d4af37] shadow-inner">
                  {player.username.substring(0, 2).toUpperCase()}
                </div>
                
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[11px] font-black text-[#f5e6d3] max-w-17.5 truncate">{player.username}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {player.disconnected ? (
                      <WifiOff className="w-3 h-3 text-red-400" title="Offline" />
                    ) : player.passed ? (
                      <span className="text-[8px] text-[#dfc299] font-black px-1 bg-[#1c1008] rounded border border-[#5c3b1e]">PASS</span>
                    ) : isPlayerTurn}
                  </div>
                </div>

                <div className="px-2 py-0.5 bg-[#1c1008] border border-[#d4af37]/60 rounded-lg text-xs font-black text-[#d4af37] flex items-center gap-1 shadow-inner" title={`${player.cardCount} cards in hand`}>
                  <Layers className="w-3 h-3 text-[#d4af37]" />
                  <span>{player.cardCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Area: Hand Cards & Player Controls */}
      <div ref={localHandRef} className="w-full flex flex-col items-center gap-3 z-45 bg-[#2d1a0e]/95 border-t-2 border-[#5c3b1e] p-3 rounded-t-2xl backdrop-blur-md shadow-2xl">
        
        {/* Clean Turn Status Indicator */}
        <div className="w-full flex justify-between items-center max-w-4xl border-b border-[#4a2c18] pb-2 px-1">
          <div className="flex items-center gap-2">
            {isMyTurn ? (
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-ping" />
            ) : (
              <Clock className="w-4 h-4 text-[#8c622b]" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-[#dfc299]">
              {isMyTurn ? 'Your Turn' : `${activePlayer?.username || 'Player'}'s turn waiting...`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isMyTurn && phase === 'play' && (
              <>
                {activeRank && (
                  <button
                    onClick={handlePass}
                    className="btn-brown px-4 py-1.5 text-xs rounded-lg cursor-pointer active:scale-95 transition-all"
                  >
                    Pass
                  </button>
                )}

                <button
                  onClick={handlePlayButtonClick}
                  disabled={selectedCards.length === 0}
                  className="btn-gold px-5 py-1.5 text-xs rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Play {selectedCards.length > 0 ? selectedCards.length : ''} Card{selectedCards.length > 1 ? 's' : ''}
                </button>
              </>
            )}

            {((phase === 'challenge') || (roomState.settings?.timerDuration === 0 && phase === 'play' && lastPlay)) && lastPlay?.playerId !== playerId && (
              <button
                onClick={handleChallenge}
                className="btn-red px-5 py-1.5 text-xs rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="iphone-shimmer-text text-xs font-black uppercase tracking-wider">
                  Call Bluff
                </span>
                <span className="text-white/90 text-xs font-bold">›</span>
              </button>
            )}
          </div>
        </div>

        {/* Hand Cards Display (Evenly Distributed Rows) */}
        <div className="w-full flex flex-col items-center justify-center py-1 min-h-28 max-h-64 overflow-y-auto no-scrollbar max-w-5xl relative">
          {sortedCards.length > 0 ? (
            (() => {
              // Calculate distribution maintaining a target difference of 3 between rows
              const totalCards = sortedCards.length;
              const cardRows = [];

              if (totalCards <= 8) {
                cardRows.push(sortedCards);
              } else {
                // Split into 2 rows with row 1 having 3 more cards than row 2
                const row1Count = Math.min(totalCards, Math.ceil((totalCards + 3) / 2));
                cardRows.push(sortedCards.slice(0, row1Count));
                if (row1Count < totalCards) {
                  cardRows.push(sortedCards.slice(row1Count));
                }
              }

              return (
                <div className={`flex flex-col items-center gap-y-3 w-full px-4 pt-3 pb-2 transition-all duration-300 ${
                  (!isMyTurn || phase !== 'play') ? 'opacity-50 pointer-events-none filter grayscale-30' : ''
                }`}>
                  {cardRows.map((rowCards, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center flex-wrap gap-x-2.5 sm:gap-x-3">
                      {rowCards.map((card) => {
                        const isSelected = selectedCards.includes(card.id);

                        return (
                          <div
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className={`playing-card-real relative w-12 h-18 sm:w-14 sm:h-21 md:w-15 md:h-22 rounded-lg flex flex-col justify-between p-1 md:p-1.5 font-bold cursor-pointer select-none border shadow-md ${
                              isSelected ? 'playing-card-selected' : ''
                            }`}
                          >
                            {/* Inner Fine Gold Border Line (Authentic Playing Card) */}
                            <div className="absolute inset-0.75 border border-black/10 rounded pointer-events-none" />

                            <div className="flex flex-col items-start leading-none relative z-10">
                              <span className="text-xs sm:text-sm font-black tracking-tighter text-slate-900 leading-none">{card.rank}</span>
                              <span className={`text-[10px] sm:text-xs leading-none ${getSuitColor(card.suit)}`}>
                                {card.suit}
                              </span>
                            </div>

                            <div className={`text-center text-lg sm:text-xl leading-none self-center relative z-10 ${getSuitColor(card.suit)}`}>
                              {card.suit}
                            </div>

                            <div className="flex flex-col items-start leading-none rotate-180 relative z-10">
                              <span className="text-xs sm:text-sm font-black tracking-tighter text-slate-900 leading-none">{card.rank}</span>
                              <span className={`text-[8px] sm:text-[10px] leading-none ${getSuitColor(card.suit)}`}>
                                {card.suit}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="text-[#dfc299] font-bold uppercase tracking-widest text-[10px]">
              No cards remaining in hand.
            </div>
          )}
        </div>
      </div>

      {/* Claim Rank Modal (Minimal Text / Visual Rank Grid) */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-99 backdrop-blur-md p-4 animate-fadeIn">
          <div className="golden-card-panel p-5 max-w-xs sm:max-w-sm w-full rounded-3xl border-2 border-[#d4af37] shadow-2xl flex flex-col gap-4 relative">
            
            {/* Minimal Header with Icons */}
            <div className="flex justify-between items-center border-b border-[#5c3b1e] pb-2.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#d4af37]" />
                <span className="text-xs font-black text-[#f5e6d3] uppercase tracking-wider">Claim Rank</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#d4af37] px-2 py-0.5 bg-[#1c1008] border border-[#d4af37]/60 rounded-full flex items-center gap-1">
                  <Layers className="w-3 h-3" /> {selectedCards.length}
                </span>
                <button 
                  onClick={() => setShowClaimModal(false)}
                  className="text-[#dfc299] hover:text-[#d4af37] transition-colors cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Visual Rank Button Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 py-1">
              {['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].map(rank => {
                const isSelected = claimRank === rank;
                return (
                  <button
                    key={rank}
                    onClick={() => setClaimRank(rank)}
                    className={`h-11 rounded-xl font-black text-sm flex items-center justify-center border-2 transition-all cursor-pointer shadow-md active:scale-95 ${
                      isSelected
                        ? 'bg-[#d4af37] border-amber-300 text-[#1c1008] scale-105 shadow-amber-500/30'
                        : 'bg-[#1c1008] border-[#5c3b1e] text-[#f5e6d3] hover:border-[#d4af37]/60 hover:text-[#d4af37]'
                    }`}
                  >
                    {rank}
                  </button>
                );
              })}
            </div>

            {/* Confirm Action Button */}
            <button
              onClick={handleConfirmClaim}
              className="btn-gold w-full py-2.5 text-xs font-black rounded-xl shadow-lg cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 mt-1"
            >
              <span>Play</span>
              <span className="px-1.5 py-0.2 bg-[#1c1008] text-[#d4af37] rounded text-[10px]">{selectedCards.length}× {claimRank}</span>
            </button>
          </div>
        </div>
      )}

      {/* Premium Challenge Outcome Modal */}
      {challengeResult && phase === 'resolution' && !localDismissedResult && challengeDetails && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center backdrop-blur-md p-4 animate-fadeIn" style={{ background: 'rgba(15, 8, 4, 0.94)' }}>
          <div className={`golden-card-panel max-w-md w-full rounded-3xl p-6 border-2 text-center flex flex-col items-center gap-5 relative shadow-2xl overflow-hidden ${
            challengeResult.success 
              ? 'border-red-500/80 shadow-red-950/50' 
              : 'border-[#d4af37] shadow-amber-950/50'
          }`}>
            
            {/* Ambient Background Glow Effect */}
            <div className={`absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full filter blur-3xl pointer-events-none ${
              challengeResult.success ? 'bg-red-600/20' : 'bg-[#d4af37]/20'
            }`} />

            {/* Header Badge */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-2 ${
                challengeResult.success 
                  ? 'bg-linear-to-b from-red-900 to-rose-950 border-red-400 text-red-400 animate-pulse' 
                  : 'bg-linear-to-b from-amber-800 to-[#2d1a0e] border-[#d4af37] text-[#d4af37]'
              }`}>
                {challengeResult.success ? (
                  <Flame className="w-8 h-8 text-red-400" />
                ) : (
                  <ShieldCheck className="w-8 h-8 text-[#d4af37]" />
                )}
              </div>

              <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${
                challengeResult.success ? 'text-red-400 drop-shadow-md' : 'text-[#d4af37] drop-shadow-md'
              }`}>
                {challengeResult.success ? 'BLUFF CAUGHT!' : 'HONEST PLAY!'}
              </h2>

              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#dfc299] px-3 py-0.5 rounded-full bg-[#1c1008] border border-[#5c3b1e]">
                {challengeResult.success ? 'Deception Discovered' : 'Claim Verified Genuine'}
              </span>
            </div>

            {/* Duel Arena: Challenger vs Thrower */}
            <div className="grid grid-cols-7 items-center justify-items-center w-full py-3 px-4 bg-[#1c1008]/90 border border-[#5c3b1e] rounded-2xl z-10 shadow-inner">
              
              {/* Challenger Side */}
              <div className="col-span-3 flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border-2 shadow-md ${
                  challengeResult.success 
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300' 
                    : 'bg-rose-950 border-rose-500 text-rose-300'
                }`}>
                  {challengeDetails.challengerName.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-extrabold text-[#f5e6d3] truncate max-w-24">
                  {challengeDetails.challengerName}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-wider ${
                  challengeResult.success ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {challengeResult.success ? 'WON CALL' : 'PENALIZED'}
                </span>
              </div>

              {/* VS Icon Badge */}
              <div className="col-span-1 flex items-center justify-center w-7 h-7 rounded-full bg-[#2d1a0e] border border-[#8c622b] text-[#d4af37]">
                <Swords className="w-3.5 h-3.5" />
              </div>

              {/* Thrower Side */}
              <div className="col-span-3 flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border-2 shadow-md ${
                  !challengeResult.success 
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300' 
                    : 'bg-rose-950 border-rose-500 text-rose-300'
                }`}>
                  {challengeDetails.throwerName.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-extrabold text-[#f5e6d3] truncate max-w-24">
                  {challengeDetails.throwerName}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-wider ${
                  !challengeResult.success ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {!challengeResult.success ? 'TRUTHFUL' : 'BLUFFED'}
                </span>
              </div>

            </div>

            {/* Revealed Cards Display */}
            {challengeResult.cards && (
              <div className="flex flex-col items-center gap-2.5 z-10 w-full">
                <div className="flex items-center gap-1.5 text-xs text-[#dfc299] uppercase font-black tracking-widest">
                  <Eye className="w-4 h-4 text-[#d4af37]" />
                  <span>Revealed Table Cards</span>
                </div>

                <div className="flex gap-3 justify-center flex-wrap max-w-full">
                  {challengeResult.cards.map((card, idx) => {
                    const isMatch = lastPlay?.claimedRank ? card.rank === lastPlay.claimedRank : true;

                    return (
                      <div
                        key={idx}
                        className={`relative w-13 h-19 rounded-xl flex flex-col justify-between p-1.5 font-extrabold shadow-xl border-2 transition-transform transform hover:scale-105 ${
                          isMatch 
                            ? 'bg-[#f5e6d3] border-emerald-500 text-slate-900 ring-2 ring-emerald-500/40' 
                            : 'bg-[#fee2e2] border-rose-500 text-rose-950 ring-2 ring-rose-500/40'
                        }`}
                      >
                        {/* Corner Rank & Suit */}
                        <div className="flex flex-col items-start leading-none">
                          <span className="text-xs font-black">{card.rank}</span>
                          <span className={`text-[9px] ${getSuitColor(card.suit)}`}>{card.suit}</span>
                        </div>

                        {/* Center Suit Icon */}
                        <div className={`text-center text-lg leading-none self-center ${getSuitColor(card.suit)}`}>
                          {card.suit}
                        </div>

                        {/* Inverted Corner */}
                        <div className="flex flex-col items-start leading-none rotate-180">
                          <span className="text-xs font-black">{card.rank}</span>
                          <span className={`text-[9px] ${getSuitColor(card.suit)}`}>{card.suit}</span>
                        </div>

                        {/* Truth / Fake Badge Indicator */}
                        <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black border border-white shadow-md ${
                          isMatch ? 'bg-emerald-500' : 'bg-rose-600'
                        }`}>
                          {isMatch ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Outcome Penalty Notice */}
            <div className={`py-2.5 px-4 rounded-xl border w-full text-xs font-bold flex items-center justify-center gap-2 z-10 ${
              challengeResult.success 
                ? 'bg-red-950/40 border-red-900/60 text-red-200' 
                : 'bg-amber-950/40 border-amber-900/60 text-amber-200'
            }`}>
              <Layers className="w-4 h-4 shrink-0 text-[#d4af37]" />
              <span>
                {challengeResult.success
                  ? `${challengeDetails.throwerName} picks up the entire table pile!`
                  : `${challengeDetails.challengerName} takes all pile cards as penalty!`}
              </span>
            </div>

          </div>
        </div>
      )}

      {/* Game Over Win Modal */}
      {roomState.status === 'gameover' && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-999 backdrop-blur-md p-4">
          <div className="golden-card-panel p-8 max-w-md w-full rounded-2xl border-2 border-[#d4af37] text-center shadow-2xl flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#1c1008] border-2 border-[#d4af37] flex items-center justify-center text-[#d4af37]">
              <Trophy className="w-8 h-8 fill-[#d4af37]/20 animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#f5e6d3] uppercase tracking-tight">Game Completed</h2>
              <p className="text-[#dfc299] text-xs mt-1">We have a winner in the room</p>
            </div>
            
            <div className="py-4 px-6 bg-[#1c1008] border border-[#5c3b1e] rounded-xl w-full">
              <span className="text-[10px] text-[#dfc299] uppercase font-black tracking-widest">Champion</span>
              <p className="text-xl font-extrabold text-[#d4af37] mt-1">{roomState.gameState?.winner}</p>
            </div>

            {isCreator ? (
              <button
                onClick={handleResetGame}
                className="btn-gold w-full py-3 text-sm rounded-xl cursor-pointer"
              >
                Reset Game Lobby
              </button>
            ) : (
              <p className="text-xs text-[#dfc299] font-semibold italic">
                Waiting for the host to restart the game...
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default GameBoard;
