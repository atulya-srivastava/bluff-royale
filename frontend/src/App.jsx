import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby.jsx';
import GameBoard from './components/GameBoard.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import { ShieldAlert, RefreshCw, Volume2, VolumeX } from 'lucide-react';

// Premium Sound Synthesizer using Web Audio API
const soundPlayer = {
  ctx: null,
  muted: false,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  play(type) {
    if (this.muted) return;
    try {
      this.init();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      
      const now = this.ctx.currentTime;
      
      switch (type) {
        case 'deal': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
          
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }
        case 'play': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(250, now);
          osc.frequency.exponentialRampToValueAtTime(350, now + 0.15);
          
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }
        case 'challenge': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100, now);
          osc.frequency.linearRampToValueAtTime(280, now + 0.25);
          
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case 'success': {
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(523.25, now);
          osc1.frequency.setValueAtTime(659.25, now + 0.08);
          
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(783.99, now + 0.16);
          
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);
          
          osc1.start(now);
          osc1.stop(now + 0.35);
          osc2.start(now);
          osc2.stop(now + 0.35);
          break;
        }
        case 'fail': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(130, now);
          osc.frequency.setValueAtTime(110, now + 0.1);
          
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.3);
          break;
        }
        case 'timer': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, now);
          
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }
      }
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }
};

function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [username, setUsername] = useState('');
  const [roomState, setRoomState] = useState(null);
  const [cards, setCards] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [muted, setMuted] = useState(false);
  
  useEffect(() => {
    // Under Vite's proxy, '/socket.io' resolves to backend (localhost:5000)
    // In production, connect to VITE_BACKEND_URL env variable or fallback to same origin
    const socketUrl = import.meta.env.VITE_BACKEND_URL || undefined;
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      setErrorMsg('');
      console.log('Connected to backend socket server.');
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('room_created', ({ roomCode, playerId }) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setErrorMsg('');
    });

    socketInstance.on('room_joined', ({ roomCode, playerId }) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setErrorMsg('');
    });

    socketInstance.on('room_update', (state) => {
      setRoomState(state);
    });

    socketInstance.on('game_started', (state) => {
      setRoomState(state);
      soundPlayer.play('deal');
    });

    socketInstance.on('deal_cards', (dealtCards) => {
      setCards(dealtCards);
    });

    socketInstance.on('game_state_update', (state) => {
      const prevPhase = roomState?.gameState?.phase;
      const newPhase = state?.gameState?.phase;
      
      setRoomState(state);

      if (prevPhase === 'play' && newPhase === 'challenge') {
        soundPlayer.play('play');
      } else if (newPhase === 'resolution') {
        soundPlayer.play('challenge');
      } else if (newPhase === 'play' && prevPhase === 'challenge') {
        soundPlayer.play('success');
      }
    });

    socketInstance.on('timer_tick', ({ timerLeft, phase }) => {
      setRoomState(prev => {
        if (!prev || !prev.gameState) return prev;
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            timerLeft,
          }
        };
      });
      if (timerLeft <= 5 && timerLeft > 0) {
        soundPlayer.play('timer');
      }
    });

    socketInstance.on('game_reset', (state) => {
      setRoomState(state);
      setCards([]);
    });

    socketInstance.on('error_message', (msg) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 5000);
      soundPlayer.play('fail');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    soundPlayer.muted = muted;
  }, [muted]);

  // Accidental tab close / page reload protection
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (roomCode) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave the game?';
        return 'Are you sure you want to leave the game?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomCode]);

  const handleCreateRoom = (name) => {
    if (!socket || !connected) return;
    setUsername(name);
    socket.emit('create_room', { username: name });
  };

  const handleJoinRoom = (name, code) => {
    if (!socket || !connected) return;
    setUsername(name);
    socket.emit('join_room', { roomCode: code, username: name });
  };

  const handleLeaveRoom = () => {
    if (!socket) return;
    const confirmLeave = window.confirm("Are you sure you want to leave the room? Your progress will be lost.");
    if (!confirmLeave) return;
    socket.disconnect();
    socket.connect();
    setRoomCode('');
    setRoomState(null);
    setCards([]);
    setErrorMsg('');
  };

  if (!connected && !roomCode) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#0a0e17] px-4">
        <div className="glass-panel-glow p-8 max-w-md w-full text-center flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-emerald-500 w-12 h-12" />
          <h2 className="text-2xl font-bold tracking-tight text-white">Connecting to server...</h2>
          <p className="text-slate-400 text-sm">Waiting for the card game server backend to establish contact.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 relative font-sans">
      {/* Sound Control Banner (only on welcome screen) */}
      {!roomCode && (
        <header className="absolute top-4 right-4 flex justify-end items-center z-50">
          <button
            onClick={() => setMuted(!muted)}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-full border border-slate-700/50 backdrop-blur-sm transition-all cursor-pointer"
            title={muted ? 'Unmute game sounds' : 'Mute game sounds'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </header>
      )}

      {/* Global Error Popups */}
      {errorMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-rose-950/90 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-lg shadow-xl backdrop-blur-md max-w-sm animate-bounce">
          <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Main Routing */}
      {!roomCode ? (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="glass-panel p-8 max-w-md w-full relative z-10 rounded-2xl border border-slate-800 shadow-2xl">
            <div className="text-center mb-8">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest px-3 py-1 bg-emerald-950/40 rounded-full border border-emerald-500/20">WebSocket Multiplayer</span>
              <h1 className="text-4xl font-extrabold mt-3 tracking-tight text-white">BLUFF <span className="text-emerald-500">ROYALE</span></h1>
              <p className="text-slate-400 text-sm mt-2">The classic game of Cheat & cards. Spot the lie, empty your hand.</p>
            </div>
            
            <Lobby 
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              socket={socket}
            />
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col md:flex-row overflow-hidden relative">
          <ChatPanel 
            roomState={roomState}
            roomCode={roomCode}
            socket={socket}
            playerId={playerId}
          />
          <div className="flex-grow min-h-screen overflow-hidden relative">
            {roomState && roomState.status === 'lobby' ? (
              <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="glass-panel p-8 max-w-lg w-full relative z-10 rounded-2xl border border-slate-800 shadow-2xl">
                  <Lobby 
                    roomState={roomState}
                    playerId={playerId}
                    socket={socket}
                    roomCode={roomCode}
                    muted={muted}
                    setMuted={setMuted}
                    onLeaveRoom={handleLeaveRoom}
                  />
                </div>
              </div>
            ) : roomState ? (
              <GameBoard 
                roomState={roomState}
                playerId={playerId}
                cards={cards}
                socket={socket}
                roomCode={roomCode}
                muted={muted}
                setMuted={setMuted}
                onLeaveRoom={handleLeaveRoom}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
