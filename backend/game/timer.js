// ──────────────────────────────────────────────
// Timer management
// Depends on the `io` instance (passed in) so it
// can emit tick events without a circular import.
// ──────────────────────────────────────────────

import { getCleanRoomState } from '../utils/state.js';

/**
 * Clear any existing timer on `room` and start a fresh countdown.
 * If timerDuration is 0 (no timer), sets timerLeft to null and returns.
 *
 * @param {object} room      - The active room object.
 * @param {object} io        - The Socket.IO server instance.
 * @param {Function} onExpire - Callback invoked when the timer hits zero.
 */
export function resetTimer(room, io, onExpire) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
  }

  const duration = room.settings.timerDuration;
  if (duration === 0) {
    room.gameState.timerLeft = null;
    return;
  }

  // Challenge phase has a shorter, fixed duration (10 s)
  room.gameState.timerLeft = room.gameState.phase === 'challenge' ? 10 : duration;

  room.timerInterval = setInterval(() => {
    room.gameState.timerLeft--;

    io.to(room.id).emit('timer_tick', {
      timerLeft: room.gameState.timerLeft,
      phase: room.gameState.phase,
    });

    if (room.gameState.timerLeft <= 0) {
      clearInterval(room.timerInterval);
      onExpire(room);
    }
  }, 1000);
}

/**
 * Handle what happens when the turn timer runs out.
 * Delegates to `handlePass` (play phase) or `moveToNextTurn` (challenge phase).
 *
 * @param {object}   room           - The active room object.
 * @param {object}   io             - The Socket.IO server instance.
 * @param {Function} handlePass     - Game-logic pass handler.
 * @param {Function} moveToNextTurn - Game-logic next-turn handler.
 */
export function handleTimerExpiration(room, io, handlePass, moveToNextTurn) {
  if (room.gameState.phase === 'play') {
    const activePlayer = room.players[room.gameState.turnIndex];
    room.gameState.history.push({
      type: 'timer_expiry',
      message: `${activePlayer.username} ran out of time and passed.`,
    });
    handlePass(room, activePlayer.id);
  } else if (room.gameState.phase === 'challenge') {
    room.gameState.history.push({
      type: 'challenge_expired',
      message: `No one challenged. The cards are safe.`,
    });
    moveToNextTurn(room);
  }
}
