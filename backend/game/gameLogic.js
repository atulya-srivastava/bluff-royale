// ──────────────────────────────────────────────
// Core game logic
// All functions that mutate room.gameState live here.
// `io` is passed in to allow emitting events without
// a circular dependency on the socket-handler layer.
// ──────────────────────────────────────────────

import { createDeck, shuffle } from '../utils/deck.js';
import { getCleanRoomState } from '../utils/state.js';
import { resetTimer, handleTimerExpiration } from './timer.js';

// ─── Internal helpers ─────────────────────────

/**
 * Advance the turn index, skipping disconnected players.
 */
function advanceTurnIndex(room) {
  let attempts = 0;
  do {
    room.gameState.turnIndex = (room.gameState.turnIndex + 1) % room.players.length;
    attempts++;
  } while (room.players[room.gameState.turnIndex].disconnected && attempts < room.players.length);
}

// ─── Exported game functions ──────────────────

/**
 * Clear the discard pile and reset pass states for a new round.
 */
export function startNewRound(room) {
  room.gameState.discardPile = [];
  room.gameState.roundTurnsCount = 0;
  room.gameState.activeRank = null;
  room.players.forEach(p => (p.passed = false));

  room.gameState.history.push({
    type: 'round_clear',
    message: `Round complete! Table cards discarded. Starting new round.`,
  });
}

/**
 * Check if any player has emptied their hand; if so, mark the game over.
 * Returns true when a winner is found.
 */
export function checkWinConditions(room) {
  const winner = room.players.find(p => p.cards.length === 0);
  if (winner) {
    room.status = 'gameover';
    room.gameState.winner = winner.username;
    room.gameState.history.push({
      type: 'win',
      message: `🏆 ${winner.username} HAS WON THE GAME! 🏆`,
    });
    if (room.timerInterval) clearInterval(room.timerInterval);
    return true;
  }
  return false;
}

/**
 * Advance to the next player's turn, broadcasting the updated state.
 */
export function moveToNextTurn(room, io) {
  if (checkWinConditions(room)) {
    io.to(room.id).emit('game_state_update', getCleanRoomState(room));
    return;
  }

  room.gameState.phase = 'play';
  room.gameState.lastPlay = null;
  room.gameState.challengeResult = null;

  const activePlayersCount = room.players.filter(p => !p.disconnected).length;
  room.gameState.roundTurnsCount++;

  // End of round: all active players have played or passed
  if (room.gameState.roundTurnsCount >= activePlayersCount) {
    startNewRound(room);
  }

  advanceTurnIndex(room);

  resetTimer(room, io, expiredRoom =>
    handleTimerExpiration(expiredRoom, io,
      (r, pid) => handlePass(r, pid, io),
      r => moveToNextTurn(r, io),
    )
  );

  io.to(room.id).emit('game_state_update', getCleanRoomState(room));
}

/**
 * Mark a player as having passed and advance the turn.
 */
export function handlePass(room, playerId, io) {
  const player = room.players.find(p => p.id === playerId);
  if (!player) return;

  player.passed = true;
  room.gameState.history.push({
    type: 'pass',
    message: `${player.username} passed.`,
  });

  moveToNextTurn(room, io);
}

/**
 * Initialise a new game: deal cards, randomise starting player, start timer.
 */
export function startGame(room, io) {
  room.status = 'playing';
  room.gameState = {
    turnIndex: 0,
    discardPile: [],
    lastPlay: null,
    phase: 'play', // 'play' | 'challenge' | 'resolution'
    winner: null,
    history: [],
    remainderCards: [],
    roundTurnsCount: 0,
    activeRank: null,
    challengeResult: null,
  };

  const deck = shuffle(createDeck());
  const playerCount = room.players.length;
  const cardsPerPlayer = Math.floor(deck.length / playerCount);
  const remainderCount = deck.length % playerCount;

  const remainderCards = [];
  for (let i = 0; i < remainderCount; i++) {
    remainderCards.push(deck.pop());
  }
  room.gameState.remainderCards = remainderCards;

  room.players.forEach((player, idx) => {
    player.cards = deck.slice(idx * cardsPerPlayer, (idx + 1) * cardsPerPlayer);
    player.passed = false;
    player.isReady = false;
  });

  room.gameState.turnIndex = Math.floor(Math.random() * playerCount);

  room.gameState.history.push({
    type: 'start',
    message: `Game started! Cards dealt. ${
      room.gameState.remainderCards.length > 0
        ? `Computer discarded: ${room.gameState.remainderCards.map(c => c.rank + c.suit).join(', ')}`
        : 'No cards discarded.'
    }`,
  });

  resetTimer(room, io, expiredRoom =>
    handleTimerExpiration(expiredRoom, io,
      (r, pid) => handlePass(r, pid, io),
      r => moveToNextTurn(r, io),
    )
  );
}
