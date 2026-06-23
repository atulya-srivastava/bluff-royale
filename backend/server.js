import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

app.get('/health', (req, res) => {
  res.send('Server is running');
});

// Serve frontend static assets in production if built
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  // Keep health check working, serve index.html for other frontend routes
  app.get(/^(?!\/health|\/socket\.io).*$/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
});

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  
  for (const suit of suits) {
    for (let i = 0; i < ranks.length; i++) {
      const rank = ranks[i];
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value: i + 1,
      });
    }
  }
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function startGame(room) {
  room.status = 'playing';
  room.gameState = {
    turnIndex: 0,
    discardPile: [],
    lastPlay: null,
    phase: 'play', // 'play' or 'challenge'
    winner: null,
    history: [],
    remainderCards: [],
    roundTurnsCount: 0,
    activeRank: null, // Round rank (e.g. '5' for 5s round)
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
    message: `Game started! Cards dealt. ${room.gameState.remainderCards.length > 0 ? `Computer discarded: ${room.gameState.remainderCards.map(c => c.rank + c.suit).join(', ')}` : 'No cards discarded.'}`,
  });

  resetTimer(room);
}

function resetTimer(room) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
  }

  const duration = room.settings.timerDuration;
  if (duration === 0) {
    room.gameState.timerLeft = null;
    return;
  }

  // Challenge phase has a shorter, fixed duration (e.g. 10s)
  room.gameState.timerLeft = room.gameState.phase === 'challenge' ? 10 : duration;

  room.timerInterval = setInterval(() => {
    room.gameState.timerLeft--;
    
    io.to(room.id).emit('timer_tick', {
      timerLeft: room.gameState.timerLeft,
      phase: room.gameState.phase,
    });

    if (room.gameState.timerLeft <= 0) {
      clearInterval(room.timerInterval);
      handleTimerExpiration(room);
    }
  }, 1000);
}

function handleTimerExpiration(room) {
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

function startNewRound(room) {
  room.gameState.discardPile = [];
  room.gameState.roundTurnsCount = 0;
  room.gameState.activeRank = null;
  room.players.forEach(p => p.passed = false);
  
  room.gameState.history.push({
    type: 'round_clear',
    message: `Round complete! Table cards discarded. Starting new round.`,
  });
}

function checkWinConditions(room) {
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

function moveToNextTurn(room) {
  // If a player emptied their hand during the play, and the challenge phase ended without challenge, they win!
  if (checkWinConditions(room)) {
    io.to(room.id).emit('game_state_update', getCleanRoomState(room));
    return;
  }

  room.gameState.phase = 'play';
  room.gameState.lastPlay = null;
  room.gameState.challengeResult = null;

  const activePlayersCount = room.players.filter(p => !p.disconnected).length;
  room.gameState.roundTurnsCount++;

  // End of round: all players have either played or passed
  if (room.gameState.roundTurnsCount >= activePlayersCount) {
    startNewRound(room);
  }

  // Next player selection
  let attempts = 0;
  do {
    room.gameState.turnIndex = (room.gameState.turnIndex + 1) % room.players.length;
    attempts++;
  } while (room.players[room.gameState.turnIndex].disconnected && attempts < room.players.length);

  resetTimer(room);
  io.to(room.id).emit('game_state_update', getCleanRoomState(room));
}

function handlePass(room, playerId) {
  const player = room.players.find(p => p.id === playerId);
  if (!player) return;

  player.passed = true;
  room.gameState.history.push({
    type: 'pass',
    message: `${player.username} passed.`,
  });

  moveToNextTurn(room);
}

function getCleanRoomState(room) {
  return {
    id: room.id,
    status: room.status,
    settings: room.settings,
    players: room.players.map(p => ({
      id: p.id,
      username: p.username,
      cardCount: p.cards ? p.cards.length : 0,
      isReady: p.isReady,
      isCreator: p.isCreator,
      passed: p.passed,
      disconnected: p.disconnected,
    })),
    chatLog: room.chatLog || [],
    gameState: room.gameState ? {
      turnIndex: room.gameState.turnIndex,
      discardPileCount: room.gameState.discardPile.length,
      lastPlay: room.gameState.lastPlay ? {
        playerId: room.gameState.lastPlay.playerId,
        username: room.players.find(p => p.id === room.gameState.lastPlay.playerId)?.username,
        cardCount: room.gameState.lastPlay.cardCount,
        claimedRank: room.gameState.lastPlay.claimedRank,
      } : null,
      phase: room.gameState.phase,
      winner: room.gameState.winner,
      history: room.gameState.history.slice(-15),
      remainderCards: room.gameState.remainderCards,
      timerLeft: room.gameState.timerLeft,
      challengeResult: room.gameState.challengeResult,
      roundTurnsCount: room.gameState.roundTurnsCount,
      activeRank: room.gameState.activeRank,
    } : null,
  };
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Create Room
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

  // Join Room
  socket.on('join_room', ({ roomCode, username }) => {
    const code = roomCode.toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('error_message', 'Room not found.');
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

  // Update Settings
  socket.on('update_settings', ({ roomCode, settings }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isCreator) return;

    room.settings = { ...room.settings, ...settings };
    io.to(roomCode).emit('room_update', getCleanRoomState(room));
  });

  // Player Ready
  socket.on('toggle_ready', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    player.isReady = !player.isReady;
    io.to(roomCode).emit('room_update', getCleanRoomState(room));
  });

  // Start Game
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

    startGame(room);
    
    room.players.forEach(p => {
      io.to(p.id).emit('deal_cards', p.cards);
    });
    io.to(roomCode).emit('game_started', getCleanRoomState(room));
  });

  // Play Cards
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

    // Lock the round rank if it was not set
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

      // End of round: all players have either played or passed
      if (room.gameState.roundTurnsCount >= activePlayersCount) {
        startNewRound(room);
      }

      // Next player selection
      let attempts = 0;
      do {
        room.gameState.turnIndex = (room.gameState.turnIndex + 1) % room.players.length;
        attempts++;
      } while (room.players[room.gameState.turnIndex].disconnected && attempts < room.players.length);
    } else {
      room.gameState.phase = 'challenge';
    }

    resetTimer(room);
    io.to(roomCode).emit('game_state_update', getCleanRoomState(room));
  });

  // SHOW Rule Challenge
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
    
    // Check if thrower was bluffing (lied)
    const isBluff = playedCards.some(card => card.rank !== claimedRank);
    
    if (isBluff) {
      // 1. Claim Was False (Caught bluffing)
      room.gameState.history.push({
        type: 'challenge_reveal',
        message: `${challenger.username} called SHOW! Cards: ${playedCards.map(c => c.rank + c.suit).join(', ')}. ${thrower.username} lied!`,
      });

      // Challenged player takes all cards on the table
      thrower.cards.push(...room.gameState.discardPile);
      room.gameState.discardPile = [];

      io.to(thrower.id).emit('deal_cards', thrower.cards);

      // Create challenge result information
      room.gameState.challengeResult = {
        winner: challenger.username,
        loser: thrower.username,
        success: true, // Bluffer was caught
        message: `${challenger.username} called SHOW! ${thrower.username} was caught bluffing! ${thrower.username} takes all cards on the table.`,
        cards: playedCards,
        claimedRank,
        cardCount: playedCards.length,
      };

      // Reset the round (target rank resets, turns resets)
      room.gameState.activeRank = null;
      room.gameState.roundTurnsCount = 0;
      room.players.forEach(p => p.passed = false);

      // Challenger starts the next round
      room.gameState.turnIndex = room.players.indexOf(challenger);

    } else {
      // 2. Claim Was True (Truthful play)
      room.gameState.history.push({
        type: 'challenge_reveal',
        message: `${challenger.username} called SHOW! Cards: ${playedCards.map(c => c.rank + c.suit).join(', ')}. ${thrower.username} was telling the truth!`,
      });

      // Challenger takes all cards on the table
      challenger.cards.push(...room.gameState.discardPile);
      room.gameState.discardPile = [];

      io.to(challenger.id).emit('deal_cards', challenger.cards);

      // Create challenge result information
      room.gameState.challengeResult = {
        winner: thrower.username,
        loser: challenger.username,
        success: false, // Challenger failed
        message: `${challenger.username} called SHOW! ${thrower.username} was telling the truth! ${challenger.username} takes all cards on the table.`,
        cards: playedCards,
        claimedRank,
        cardCount: playedCards.length,
      };

      // Reset the round (target rank resets, turns resets)
      room.gameState.activeRank = null;
      room.gameState.roundTurnsCount = 0;
      room.players.forEach(p => p.passed = false);

      // Challenged player (thrower) starts the next round
      room.gameState.turnIndex = room.players.indexOf(thrower);
    }

    // Set resolution phase and pause for 6 seconds
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

        // After 6 seconds, resolve the turn/round transitions
        if (checkWinConditions(room)) {
          io.to(room.id).emit('game_state_update', getCleanRoomState(room));
        } else {
          room.gameState.phase = 'play';
          room.gameState.lastPlay = null;
          room.gameState.challengeResult = null;
          resetTimer(room);
          io.to(room.id).emit('game_state_update', getCleanRoomState(room));
        }
      }
    }, 1000);
  });

  // Chat Message
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

    if (!room.chatLog) {
      room.chatLog = [];
    }
    room.chatLog.push(msgObj);
    if (room.chatLog.length > 50) room.chatLog.shift();

    io.to(roomCode).emit('chat_message', msgObj);
  });

  // Pass Turn
  socket.on('pass_turn', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    if (room.gameState.turnIndex !== room.players.indexOf(player) || room.gameState.phase !== 'play') {
      socket.emit('error_message', 'It is not your turn.');
      return;
    }

    handlePass(room, socket.id);
  });

  // Reset Game
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

  // Disconnect
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
            handlePass(room, player.id);
          } else {
            io.to(code).emit('game_state_update', getCleanRoomState(room));
          }
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
