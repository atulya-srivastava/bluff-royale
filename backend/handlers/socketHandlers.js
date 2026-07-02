// ──────────────────────────────────────────────
// Socket.IO event handlers
// Registers all game events on each connected socket.
// ──────────────────────────────────────────────

import rooms from '../rooms.js';
import { generateRoomCode } from '../utils/deck.js';
import { getCleanRoomState } from '../utils/state.js';
import {
  startGame,
  startNewRound,
  checkWinConditions,
  moveToNextTurn,
  handlePass,
} from '../game/gameLogic.js';
import { resetTimer } from '../game/timer.js';

// ─── Private timer helper ─────────────────────
// Wires resetTimer to the game-logic expiry callbacks so callers
// don't have to repeat the boilerplate.
function _resetTimerForRoom(room, io) {
  resetTimer(room, io, expiredRoom => _handleExpiry(expiredRoom, io));
}

function _handleExpiry(room, io) {
  if (room.gameState.phase === 'play') {
    const activePlayer = room.players[room.gameState.turnIndex];
    room.gameState.history.push({
      type: 'timer_expiry',
      message: `${activePlayer.username} ran out of time and passed.`,
    });
    handlePass(room, activePlayer.id, io);
  } else if (room.gameState.phase === 'challenge') {
    room.gameState.history.push({
      type: 'challenge_expired',
      message: `No one challenged. The cards are safe.`,
    });
    moveToNextTurn(room, io);
  }
}

// ─── Public registration function ────────────

/**
 * Bind all Socket.IO event listeners to `io`.
 * Call this once after the io server is created.
 *
 * @param {object} io - The Socket.IO Server instance.
 */
export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── Create Room ──────────────────────────────
    socket.on('create_room', ({ username }) => {
      const roomCode = generateRoomCode();
      const player = {
        id: socket.id,
        username: username || `Player ${socket.id.substring(0, 4)}`,
        cards: [],
        isReady: false,
        isCreator: true,
        passed: false,
        disconnected: false,
      };

      const room = {
        id: roomCode,
        status: 'lobby',
        players: [player],
        settings: {
          timerDuration: 0,
        },
        timerInterval: null,
      };

      rooms.set(roomCode, room);
      socket.join(roomCode);

      socket.emit('room_created', { roomCode, playerId: socket.id });
      io.to(roomCode).emit('room_update', getCleanRoomState(room));
      console.log(`Room created: ${roomCode} by player ${socket.id}`);
    });

    // ── Join Room ────────────────────────────────
    socket.on('join_room', ({ roomCode, username }) => {
      const code = roomCode.toUpperCase();
      const room = rooms.get(code);

      if (!room) {
        socket.emit('error_message', 'Room not found.');
        return;
      }

      // Reconnection path
      const existingPlayer = room.players.find(p => p.username === username);
      if (existingPlayer && existingPlayer.disconnected) {
        existingPlayer.id = socket.id;
        existingPlayer.disconnected = false;

        socket.join(code);
        socket.emit('room_joined', { roomCode: code, playerId: socket.id });
        socket.emit('deal_cards', existingPlayer.cards);

        room.gameState.history.push({
          type: 'connect',
          message: `${existingPlayer.username} reconnected.`,
        });

        io.to(code).emit('room_update', getCleanRoomState(room));
        console.log(`Player ${existingPlayer.username} reconnected with new socket ${socket.id}`);
        return;
      }

      if (room.status !== 'lobby') {
        socket.emit('error_message', 'Game is already in progress.');
        return;
      }

      if (room.players.length >= 6) {
        socket.emit('error_message', 'Room is full (max 6 players).');
        return;
      }

      const player = {
        id: socket.id,
        username: username || `Player ${socket.id.substring(0, 4)}`,
        cards: [],
        isReady: false,
        isCreator: false,
        passed: false,
        disconnected: false,
      };

      room.players.push(player);
      socket.join(code);

      socket.emit('room_joined', { roomCode: code, playerId: socket.id });
      io.to(code).emit('room_update', getCleanRoomState(room));
      console.log(`Player ${socket.id} joined room ${code}`);
    });

    // ── Update Settings ──────────────────────────
    socket.on('update_settings', ({ roomCode, settings }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player || !player.isCreator) return;

      room.settings = { ...room.settings, ...settings };
      io.to(roomCode).emit('room_update', getCleanRoomState(room));
    });

    // ── Toggle Ready ─────────────────────────────
    socket.on('toggle_ready', ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      player.isReady = !player.isReady;
      io.to(roomCode).emit('room_update', getCleanRoomState(room));
    });

    // ── Start Game ───────────────────────────────
    socket.on('start_game', ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player || !player.isCreator) return;

      if (room.players.length < 3) {
        socket.emit('error_message', 'Need at least 3 players to start.');
        return;
      }

      const allReady = room.players.every(p => p.isCreator || p.isReady);
      if (!allReady) {
        socket.emit('error_message', 'Not all players are ready.');
        return;
      }

      startGame(room, io);

      room.players.forEach(p => {
        io.to(p.id).emit('deal_cards', p.cards);
      });
      io.to(roomCode).emit('game_started', getCleanRoomState(room));
    });

    // ── Play Cards ───────────────────────────────
    socket.on('play_cards', ({ roomCode, cardIds, claimedRank }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      if (room.gameState.turnIndex !== room.players.indexOf(player) || room.gameState.phase !== 'play') {
        socket.emit('error_message', 'It is not your turn.');
        return;
      }

      if (cardIds.length < 1 || cardIds.length > 4) {
        socket.emit('error_message', 'You must play between 1 and 4 cards.');
        return;
      }

      // Enforce round active rank
      const activeRank = room.gameState.activeRank;
      if (activeRank && claimedRank !== activeRank) {
        socket.emit('error_message', `You must claim ${activeRank}s in this round.`);
        return;
      }

      const cardsToPlay = [];
      for (const cid of cardIds) {
        const cardIdx = player.cards.findIndex(c => c.id === cid);
        if (cardIdx === -1) {
          socket.emit('error_message', 'Invalid cards selected.');
          return;
        }
        cardsToPlay.push(player.cards[cardIdx]);
      }

      player.cards = player.cards.filter(c => !cardIds.includes(c.id));
      player.passed = false;

      // Lock the round rank if not already set
      if (!room.gameState.activeRank) {
        room.gameState.activeRank = claimedRank;
      }

      const actualPlay = {
        playerId: socket.id,
        cards: cardsToPlay,
        claimedRank,
        cardCount: cardsToPlay.length,
      };

      room.gameState.discardPile.push(...cardsToPlay);
      room.gameState.lastPlay = actualPlay;

      room.gameState.history.push({
        type: 'play',
        message: `${player.username} played ${cardIds.length} card${cardIds.length > 1 ? 's' : ''} claiming: "${cardIds.length} ${claimedRank}${cardIds.length > 1 ? 's' : ''}".`,
      });

      socket.emit('deal_cards', player.cards);

      if (room.settings.timerDuration === 0) {
        room.gameState.phase = 'play';
        const activePlayersCount = room.players.filter(p => !p.disconnected).length;
        room.gameState.roundTurnsCount++;

        if (room.gameState.roundTurnsCount >= activePlayersCount) {
          startNewRound(room);
        }

        // Advance to next player
        let attempts = 0;
        do {
          room.gameState.turnIndex = (room.gameState.turnIndex + 1) % room.players.length;
          attempts++;
        } while (room.players[room.gameState.turnIndex].disconnected && attempts < room.players.length);
      } else {
        room.gameState.phase = 'challenge';
      }

      _resetTimerForRoom(room, io);
      io.to(roomCode).emit('game_state_update', getCleanRoomState(room));
    });

    // ── Challenge (SHOW) ─────────────────────────
    socket.on('challenge_bluff', ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const canChallenge = room.settings.timerDuration === 0
        ? (room.gameState.phase === 'play' && room.gameState.lastPlay)
        : (room.gameState.phase === 'challenge' && room.gameState.lastPlay);

      if (!canChallenge) {
        socket.emit('error_message', 'No active play to challenge.');
        return;
      }

      const challenger = room.players.find(p => p.id === socket.id);
      if (!challenger) return;

      const throwerId = room.gameState.lastPlay.playerId;
      const thrower = room.players.find(p => p.id === throwerId);

      if (challenger.id === throwerId) {
        socket.emit('error_message', 'You cannot challenge your own play.');
        return;
      }

      const playedCards = room.gameState.lastPlay.cards;
      const claimedRank = room.gameState.lastPlay.claimedRank;
      const isBluff = playedCards.some(card => card.rank !== claimedRank);

      if (isBluff) {
        // ── Caught bluffing ──
        room.gameState.history.push({
          type: 'challenge_reveal',
          message: `${challenger.username} called SHOW! Cards: ${playedCards.map(c => c.rank + c.suit).join(', ')}. ${thrower.username} lied!`,
        });

        thrower.cards.push(...room.gameState.discardPile);
        room.gameState.discardPile = [];
        io.to(thrower.id).emit('deal_cards', thrower.cards);

        room.gameState.challengeResult = {
          winner: challenger.username,
          loser: thrower.username,
          success: true,
          message: `${challenger.username} called SHOW! ${thrower.username} was caught bluffing! ${thrower.username} takes all cards on the table.`,
          cards: playedCards,
          claimedRank,
          cardCount: playedCards.length,
        };

        room.gameState.activeRank = null;
        room.gameState.roundTurnsCount = 0;
        room.players.forEach(p => (p.passed = false));
        room.gameState.turnIndex = room.players.indexOf(challenger);
      } else {
        // ── Truthful play ──
        room.gameState.history.push({
          type: 'challenge_reveal',
          message: `${challenger.username} called SHOW! Cards: ${playedCards.map(c => c.rank + c.suit).join(', ')}. ${thrower.username} was telling the truth!`,
        });

        challenger.cards.push(...room.gameState.discardPile);
        room.gameState.discardPile = [];
        io.to(challenger.id).emit('deal_cards', challenger.cards);

        room.gameState.challengeResult = {
          winner: thrower.username,
          loser: challenger.username,
          success: false,
          message: `${challenger.username} called SHOW! ${thrower.username} was telling the truth! ${challenger.username} takes all cards on the table.`,
          cards: playedCards,
          claimedRank,
          cardCount: playedCards.length,
        };

        room.gameState.activeRank = null;
        room.gameState.roundTurnsCount = 0;
        room.players.forEach(p => (p.passed = false));
        room.gameState.turnIndex = room.players.indexOf(thrower);
      }

      // Resolution phase: 5-second pause before resuming
      room.gameState.phase = 'resolution';
      if (room.timerInterval) clearInterval(room.timerInterval);
      room.gameState.timerLeft = 5;

      io.to(roomCode).emit('game_state_update', getCleanRoomState(room));

      room.timerInterval = setInterval(() => {
        room.gameState.timerLeft--;

        io.to(room.id).emit('timer_tick', {
          timerLeft: room.gameState.timerLeft,
          phase: room.gameState.phase,
        });

        if (room.gameState.timerLeft <= 0) {
          clearInterval(room.timerInterval);

          if (checkWinConditions(room)) {
            io.to(room.id).emit('game_state_update', getCleanRoomState(room));
          } else {
            room.gameState.phase = 'play';
            room.gameState.lastPlay = null;
            room.gameState.challengeResult = null;
            _resetTimerForRoom(room, io);
            io.to(room.id).emit('game_state_update', getCleanRoomState(room));
          }
        }
      }, 1000);
    });

    // ── Chat Message ─────────────────────────────
    socket.on('send_chat_message', ({ roomCode, message }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      const msgObj = {
        type: 'chat',
        playerId: player.id,
        username: player.username,
        message: message.substring(0, 150),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (!room.chatLog) room.chatLog = [];
      room.chatLog.push(msgObj);
      if (room.chatLog.length > 50) room.chatLog.shift();

      io.to(roomCode).emit('chat_message', msgObj);
    });

    // ── Pass Turn ────────────────────────────────
    socket.on('pass_turn', ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      if (room.gameState.turnIndex !== room.players.indexOf(player) || room.gameState.phase !== 'play') {
        socket.emit('error_message', 'It is not your turn.');
        return;
      }

      handlePass(room, socket.id, io);
    });

    // ── Reset Game ───────────────────────────────
    socket.on('reset_game', ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player || !player.isCreator) return;

      room.status = 'lobby';
      room.gameState = null;
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }

      room.players.forEach(p => {
        p.cards = [];
        p.isReady = false;
        p.passed = false;
      });

      io.to(roomCode).emit('game_reset', getCleanRoomState(room));
    });

    // ── Disconnect ───────────────────────────────
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);

      for (const [code, room] of rooms.entries()) {
        const pIdx = room.players.findIndex(p => p.id === socket.id);
        if (pIdx !== -1) {
          const player = room.players[pIdx];

          if (room.status === 'lobby') {
            room.players.splice(pIdx, 1);
            if (room.players.length === 0) {
              rooms.delete(code);
            } else {
              if (player.isCreator) {
                room.players[0].isCreator = true;
              }
              io.to(code).emit('room_update', getCleanRoomState(room));
            }
          } else {
            player.disconnected = true;
            room.gameState.history.push({
              type: 'disconnect',
              message: `${player.username} disconnected.`,
            });

            const activePlayers = room.players.filter(p => !p.disconnected);
            if (activePlayers.length === 0) {
              if (room.timerInterval) clearInterval(room.timerInterval);
              rooms.delete(code);
              return;
            }

            if (room.gameState.phase === 'play' && room.gameState.turnIndex === pIdx) {
              handlePass(room, player.id, io);
            } else {
              io.to(code).emit('game_state_update', getCleanRoomState(room));
            }
          }
          break;
        }
      }
    });
  });
}
