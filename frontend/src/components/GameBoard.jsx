import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, AlertCircle, Clock, Trophy, HelpCircle, X, Volume2, VolumeX } from 'lucide-react';

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

  // Card flow animation on the table (after popup dismisses)
  const [cardFlowAnim, setCardFlowAnim] = useState(null); // { loserName: string }
  const prevPhaseRef = useRef(null);

  const logEndRef = useRef(null);

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

  // Trigger card flow animation on table when resolution ends
  useEffect(() => {
    if (prevPhaseRef.current === 'resolution' && phase === 'play') {
      // Get loser name from the last challenge result stored in history
      const lastReveal = roomState.gameState?.history?.findLast?.(h => h.type === 'challenge_reveal');
      if (lastReveal) {
        // Extract loser from the message or use a generic label
        setCardFlowAnim({ active: true });
        setTimeout(() => setCardFlowAnim(null), 2200);
      }
    }
    prevPhaseRef.current = phase;
  }, [phase]);

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

  // Re-order players so local player is always bottom center
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
    // 5 other players
    if (index === 0) return 'top-[62%] left-4 -translate-y-1/2';
    if (index === 1) return 'top-6 left-[18%]';
    if (index === 2) return 'top-4 left-1/2 -translate-x-1/2';
    if (index === 3) return 'top-6 right-[18%]';
    return 'top-[62%] right-4 -translate-y-1/2';
  };

  const getSuitColor = (suit) => (suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-slate-900');

  // Random rotation offset generator for pile card depth
  const getDiscardPileTransform = (idx) => {
    const angle = (idx * 17) % 35 - 17;
    const x = (idx * 5) % 11 - 5;
    const y = (idx * 4) % 11 - 5;
    return `rotate(${angle}deg) translate(${x}px, ${y}px)`;
  };

  // Format details for the SHOW challenge overlay popup
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
    <div className="w-full min-h-screen flex flex-col justify-between p-3 relative overflow-hidden select-none bg-[#070b13]">
      
      {/* Header Bar */}
      <div className="w-full flex justify-between items-center bg-slate-900/80 border border-slate-800 p-3 rounded-xl backdrop-blur-md z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 bg-slate-950 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Room Code:</span>
            <span className="text-xs font-black text-emerald-400 font-mono ml-1.5">{roomCode}</span>
          </div>
          <div className="px-2.5 py-1 bg-slate-950 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Round Target:</span>
            <span className="text-xs font-bold text-amber-400 ml-1.5">
              {activeRank ? `${activeRank}s Round` : 'Choose Target'}
            </span>
          </div>
        </div>

        {/* Remainder Cards Section */}
        {roomState.gameState?.remainderCards && roomState.gameState.remainderCards.length > 0 && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-950/60 rounded border border-slate-800">
            <AlertCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leftover Cards:</span>
            <div className="flex gap-1.5">
              {roomState.gameState.remainderCards.map((card) => (
                <span 
                  key={card.id} 
                  className={`text-xs font-extrabold px-1.5 py-0.5 bg-slate-900 border border-slate-700/50 rounded ${
                    card.suit === '♥' || card.suit === '♦' ? 'text-red-400' : 'text-slate-300'
                  }`}
                >
                  {card.rank}{card.suit}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-350 font-semibold mr-1">
            Player: <span className="text-slate-100 font-extrabold">{localPlayer?.username}</span>
          </div>
          
          <button
            onClick={() => setMuted(!muted)}
            className="p-2 bg-slate-950 hover:bg-slate-900 text-slate-300 rounded border border-slate-850 transition-all cursor-pointer flex items-center justify-center"
            title={muted ? 'Unmute game sounds' : 'Mute game sounds'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onLeaveRoom}
            className="px-3 py-2 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/40 text-rose-300 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer"
          >
            Exit Game
          </button>
        </div>
      </div>

      {/* Felt Poker Table Area */}
      <div className="flex-grow flex items-center justify-center relative w-full h-[52vh] max-h-[440px] my-4">
        
        <div className="w-[88%] h-[68%] max-w-[840px] rounded-[160px] poker-table-felt poker-table-rim absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          
          {/* Center Discard, Target Card, and Timer */}
          <div className="flex items-center gap-8 z-20">
            
            {/* Target Rank Display */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Target Rank</span>
              {activeRank ? (
                <div className="w-12 h-18 bg-white text-slate-950 font-black rounded border border-amber-500 shadow-lg flex flex-col justify-between p-1.5">
                  <div className="text-[9px] leading-none">{activeRank}</div>
                  <div className="text-center text-xl font-bold leading-none">{activeRank}</div>
                  <div className="text-[9px] leading-none text-right rotate-180">{activeRank}</div>
                </div>
              ) : (
                <div className="w-12 h-18 border border-dashed border-slate-700 bg-slate-950/60 rounded flex items-center justify-center text-center p-1 text-[8px] font-bold text-slate-500 uppercase leading-tight">
                  Any Rank
                </div>
              )}
            </div>

            {/* Discard Pile stack */}
            <div className="relative w-18 h-26 flex items-center justify-center">
              {roomState.gameState?.discardPileCount > 0 ? (
                <>
                  {[...Array(Math.min(5, roomState.gameState.discardPileCount))].map((_, i) => (
                    <div
                      key={i}
                      style={{ transform: getDiscardPileTransform(i) }}
                      className="absolute w-14 h-20 bg-gradient-to-br from-red-800 to-red-950 border border-slate-200 rounded shadow-md"
                    />
                  ))}
                  <div 
                    style={{ transform: getDiscardPileTransform(roomState.gameState.discardPileCount) }}
                    className="absolute w-14 h-20 bg-gradient-to-br from-red-850 to-red-950 border-2 border-slate-100 rounded shadow-xl flex flex-col items-center justify-center p-1"
                  >
                    <div className="w-full h-full border border-dashed border-red-500/30 rounded flex flex-col items-center justify-center">
                      <span className="text-[8px] font-bold text-red-200 leading-none">PILE</span>
                      <span className="text-sm font-black text-white mt-0.5">
                        {roomState.gameState.discardPileCount}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-14 h-20 border-2 border-dashed border-emerald-500/20 rounded flex items-center justify-center">
                  <span className="text-[8px] font-bold text-emerald-500/30 uppercase tracking-widest text-center">Empty Table</span>
                </div>
              )}
            </div>

            {/* Timer circle */}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-full bg-slate-950/90 border-3 flex flex-col items-center justify-center shadow-lg transition-all ${
                roomState.gameState?.timerLeft === null 
                  ? 'border-slate-800 text-slate-500'
                  : roomState.gameState?.timerLeft <= 4 
                    ? 'border-red-500 text-red-400 active-pulse-ring' 
                    : roomState.gameState?.timerLeft <= 8 
                      ? 'border-amber-500 text-amber-400' 
                      : 'border-emerald-500 text-emerald-400'
              }`}>
                {roomState.gameState?.timerLeft !== null ? (
                  <span className="text-base font-black font-mono leading-none">{roomState.gameState?.timerLeft}</span>
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                <span className="text-[6px] font-bold uppercase tracking-widest mt-0.5 leading-none">
                  {phase === 'challenge' ? 'Bluff' : phase === 'resolution' ? 'Wait' : 'Play'}
                </span>
              </div>
            </div>

          </div>

          {/* Active Play Banner Overlay */}
          {((phase === 'challenge') || (roomState.settings?.timerDuration === 0 && lastPlay)) && lastPlay && (
            <div className="absolute top-[80%] left-1/2 -translate-x-1/2 bg-slate-950/90 border border-amber-500/30 px-3.5 py-1.5 rounded-lg text-center shadow-2xl z-30 max-w-xs">
              <p className="text-[11px] text-slate-200 font-medium">
                <span className="text-amber-400 font-extrabold">{lastPlay.username}</span> played{' '}
                <span className="text-white font-extrabold">{lastPlay.cardCount}</span> card{lastPlay.cardCount > 1 ? 's' : ''} claiming:{' '}
                <span className="text-emerald-400 font-extrabold">
                  "{lastPlay.claimedRank}{lastPlay.cardCount > 1 ? 's' : ''}"
                </span>
              </p>
            </div>
          )}

          {/* Card Flow Animation on Table (after popup dismisses) */}
          {cardFlowAnim && (
            <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
              {[...Array(6)].map((_, i) => {
                const angles = [-50, -30, -10, 10, 30, 50];
                const distances = [120, 140, 110, 135, 125, 145];
                const angle = angles[i];
                const dist = distances[i];
                const rad = (angle * Math.PI) / 180;
                const tx = Math.sin(rad) * dist;
                const ty = -Math.cos(rad) * dist;
                return (
                  <div
                    key={i}
                    className="absolute w-9 h-13 bg-gradient-to-br from-red-800 to-red-950 border border-slate-300 rounded shadow-lg"
                    style={{
                      animation: `cardScatter 1.8s ease-out ${i * 0.12}s forwards`,
                      opacity: 0,
                      '--tx': `${tx}px`,
                      '--ty': `${ty}px`,
                      '--rot': `${angle}deg`,
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
            <div key={player.id} className={`absolute flex flex-col items-center z-30 ${posClass}`}>
              <div className={`px-2.5 py-1.5 rounded-xl bg-slate-900 border-2 flex items-center gap-2 shadow-lg ${
                player.disconnected 
                  ? 'opacity-40 border-rose-600' 
                  : player.passed 
                    ? 'opacity-60 border-slate-700' 
                    : isPlayerTurn 
                      ? 'border-emerald-500 active-pulse-ring' 
                      : 'border-slate-800'
              }`}>
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                  {player.username.substring(0, 2).toUpperCase()}
                </div>
                
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-bold text-slate-100 max-w-[65px] truncate">{player.username}</span>
                  {player.disconnected ? (
                    <span className="text-[7px] text-red-500 font-bold uppercase mt-0.5">Offline</span>
                  ) : player.passed ? (
                    <span className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Pass</span>
                  ) : isPlayerTurn ? (
                    <span className="text-[7px] text-emerald-400 font-bold uppercase mt-0.5">Active</span>
                  ) : (
                    <span className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Waiting</span>
                  )}
                </div>

                <div className="px-1.5 py-0.5 bg-slate-950 rounded text-[9px] font-black text-amber-400 flex items-center gap-0.5">
                  <span>🃏</span>
                  <span>{player.cardCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Area: Controls and Hand */}
      <div className="w-full flex flex-col items-center gap-3 z-45 bg-slate-950/90 border-t border-slate-800 p-3 rounded-t-2xl backdrop-blur-md shadow-lg">
        
        <div className="w-full flex justify-between items-center max-w-4xl border-b border-slate-900 pb-2">
          <div className="flex items-center gap-2">
            {
              isMyTurn ?  <span className={`w-2 h-2 rounded-full bg-emerald-500 animate-ping`}></span> :
             <Clock className='w-4 h-4 text-gray-700 '/>
            }
           
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isMyTurn ? 'Your Play Turn' : `${activePlayer?.username || 'Player'}'s turn waiting...`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isMyTurn && phase === 'play' && (
              <>
                {activeRank && (
                  <button
                    onClick={handlePass}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded border border-slate-800 cursor-pointer active:scale-95 transition-all"
                  >
                    Pass
                  </button>
                )}

                <button
                  onClick={handlePlayButtonClick}
                  disabled={selectedCards.length === 0}
                  className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-850 disabled:to-slate-850 text-white text-xs font-bold rounded shadow active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed disabled:text-slate-500 disabled:shadow-none"
                >
                  Play {selectedCards.length > 0 ? selectedCards.length : ''} Card{selectedCards.length > 1 ? 's' : ''}
                </button>
              </>
            )}

            {((phase === 'challenge') || (roomState.settings?.timerDuration === 0 && phase === 'play' && lastPlay)) && lastPlay?.playerId !== playerId && (
              <button
                onClick={handleChallenge}
                className="px-5 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white text-xs font-black rounded shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                🚨 SHOW!
              </button>
            )}
          </div>
        </div>

        {/* Hand Cards */}
        <div className="w-full flex justify-center items-center py-1 h-36 overflow-y-visible max-w-4xl relative">
          {sortedCards.length > 0 ? (
            <div className={`flex justify-center flex-wrap gap-x-2.5 gap-y-7 px-6 pt-7 pb-2 max-h-36 overflow-y-auto no-scrollbar pr-2 transition-all duration-300 ${
              (!isMyTurn || phase !== 'play') ? 'opacity-40 pointer-events-none filter grayscale-[40%]' : ''
            }`}>
              {sortedCards.map((card) => {
                const isSelected = selectedCards.includes(card.id);

                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    className={`card-lift relative w-12 h-18 md:w-14 md:h-20 rounded-md flex flex-col justify-between p-1 md:p-1.5 font-bold cursor-pointer select-none border border-slate-350 shadow ${
                      isSelected 
                        ? 'selected bg-emerald-50 text-slate-950' 
                        : 'bg-slate-50 text-slate-900'
                    }`}
                  >
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[10px] md:text-xs leading-none">{card.rank}</span>
                      <span className={`text-[8px] md:text-[10px] leading-none ${getSuitColor(card.suit)}`}>
                        {card.suit}
                      </span>
                    </div>

                    <div className={`text-center text-base md:text-lg leading-none self-center ${getSuitColor(card.suit)}`}>
                      {card.suit}
                    </div>

                    <div className="flex flex-col items-start leading-none rotate-180">
                      <span className="text-[10px] md:text-xs leading-none">{card.rank}</span>
                      <span className={`text-[8px] md:text-[10px] leading-none ${getSuitColor(card.suit)}`}>
                        {card.suit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">
              No cards in hand.
            </div>
          )}
        </div>
      </div>

      {/* 3. Custom Claim Modal Popup (Starters only) */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-[99] backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel-glow p-6 max-w-sm w-full rounded-xl border border-slate-800 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-400" /> Start Round Target Rank
              </h3>
              <button 
                onClick={() => setShowClaimModal(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 py-2">
              <p className="text-xs text-slate-300 font-medium">
                You are playing <span className="text-emerald-400 font-black text-sm">{selectedCards.length}</span> cards. Choose claimed rank:
              </p>
              
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Claimed Rank (e.g. 5s)</label>
                <select
                  value={claimRank}
                  onChange={(e) => setClaimRank(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-sm font-bold p-2.5 rounded focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].map(rank => (
                    <option key={rank} value={rank}>{rank}s</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowClaimModal(false)}
                className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClaim}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded shadow active:scale-95 transition-all cursor-pointer"
              >
                Start Round
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Big Center-Screen SHOW Result Popup */}
      {challengeResult && phase === 'resolution' && !localDismissedResult && challengeDetails && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-fade-in" style={{ background: 'rgba(2, 6, 15, 0.93)', backdropFilter: 'blur(14px)' }}>
          <div className={`show-popup-enter p-8 md:p-10 max-w-md w-full rounded-3xl border-2 text-center flex flex-col items-center gap-5 relative ${
            challengeResult.success
              ? 'bg-gradient-to-b from-[#2d0f0f] to-[#180606] border-red-500/50 glow-red'
              : 'bg-gradient-to-b from-[#2d220f] to-[#140f06] border-amber-500/50 glow-yellow'
          }`}>

            {/* Headline */}
            <h2 className={`text-3xl md:text-4xl font-black uppercase tracking-tight mt-1 ${
              challengeResult.success ? 'text-red-400' : 'text-amber-400'
            }`}>
              {challengeResult.success ? '🚨 BLUFF CAUGHT!' : '😌 CLAIM WAS TRUE!'}
            </h2>

            {/* Avatars Row: Challenger vs Thrower */}
            <div className="flex items-center justify-center gap-6 w-full py-3">
              {/* Challenger Avatar */}
              <div className="flex flex-col items-center gap-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black border-3 shadow-lg ${
                  challengeResult.success
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                    : 'bg-red-950 border-red-500 text-red-400'
                }`}>
                  {challengeDetails.challengerName.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-extrabold text-white">{challengeDetails.challengerName}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                  challengeResult.success
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50'
                    : 'bg-red-950/80 text-red-400 border-red-500/50'
                }`}>
                  {challengeResult.success ? '👑 Winner' : '💀 Loser'}
                </span>
              </div>

              {/* VS Divider */}
              <div className="flex flex-col items-center gap-1 px-2">
                <span className="text-2xl font-black text-slate-600">VS</span>
              </div>

              {/* Thrower Avatar */}
              <div className="flex flex-col items-center gap-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black border-3 shadow-lg ${
                  challengeResult.success
                    ? 'bg-red-950 border-red-500 text-red-400'
                    : 'bg-emerald-950 border-emerald-500 text-emerald-400'
                }`}>
                  {challengeDetails.throwerName.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-extrabold text-white">{challengeDetails.throwerName}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                  challengeResult.success
                    ? 'bg-red-950/80 text-red-400 border-red-500/50'
                    : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50'
                }`}>
                  {challengeResult.success ? '💀 Loser' : '👑 Winner'}
                </span>
              </div>
            </div>

            {/* Result text */}
            <div className="py-3 px-6 bg-slate-950/80 border border-slate-800/50 rounded-xl w-full">
              <p className="text-sm text-slate-300 font-semibold">
                {challengeResult.success
                  ? <>{challengeDetails.throwerName} <span className="text-red-400 font-extrabold">LIED</span></>
                  : <>{challengeDetails.challengerName} was <span className="text-red-400 font-extrabold">WRONG</span></>
                }
              </p>
            </div>

            {/* Compact Card Chips */}
            {challengeResult.cards && (
              <div className="flex flex-col items-center gap-2.5">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.15em]">
                  The cards were:
                </span>
                <div className="flex gap-2 justify-center flex-wrap">
                  {challengeResult.cards.map((card, idx) => (
                    <div
                      key={idx}
                      className="card-flip-in flex items-center gap-1 bg-white rounded-lg px-3 py-2 shadow-md border border-slate-200"
                      style={{ animationDelay: `${idx * 0.12}s` }}
                    >
                      <span className="text-base font-black text-slate-900">{card.rank}</span>
                      <span className={`text-lg leading-none ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-slate-900'}`}>
                        {card.suit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Game Over Win Modal */}
      {roomState.status === 'gameover' && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-[999] backdrop-blur-md p-4">
          <div className="glass-panel p-8 max-w-md w-full rounded-2xl border border-emerald-500/20 text-center shadow-2xl flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-500 flex items-center justify-center text-emerald-400">
              <Trophy className="w-8 h-8 fill-emerald-400/25 animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Game Completed</h2>
              <p className="text-slate-400 text-xs mt-1">We have a winner in the room</p>
            </div>
            
            <div className="py-4 px-6 bg-slate-900 border border-slate-800 rounded-xl w-full">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Champion</span>
              <p className="text-xl font-extrabold text-amber-400 mt-1">{roomState.gameState?.winner}</p>
            </div>

            {isCreator ? (
              <button
                onClick={handleResetGame}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-lg shadow-lg hover:shadow-emerald-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Reset Game Lobby
              </button>
            ) : (
              <p className="text-xs text-slate-500 font-semibold italic">
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
