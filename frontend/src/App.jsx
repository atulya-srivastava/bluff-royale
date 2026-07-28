import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Landing from './pages/Landing.jsx';
import Lobby from './components/Lobby.jsx';
import GameBoard from './components/GameBoard.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import { ShieldAlert, RefreshCw, Volume2, VolumeX, ArrowLeft } from 'lucide-react';

// Sound Synthesizer using Web Audio API
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
  const [view, setView] = useState('landing'); // 'landing' | 'lobby'
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

  const handleStartGame = (presetUsername) => {
    if (presetUsername) {
      setUsername(presetUsername);
    }
    setView('lobby');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    setView('landing');
  };

  return (
    <div className="min-h-screen bg-[#1c1008] text-[#f5e6d3] relative font-sans">
      
      {/* Mute Control Banner */}
      <header className="fixed top-4 right-4 flex justify-end items-center z-50">
        <button
          onClick={() => setMuted(!muted)}
          className="p-2.5 bg-[#2d1a0e]/90 hover:bg-[#3b2314] text-[#d4af37] rounded-full border border-[#5c3b1e] backdrop-blur-md transition-all cursor-pointer shadow-lg"
          title={muted ? 'Unmute game sounds' : 'Mute game sounds'}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </header>

      {/* Global Error Popups */}
      {errorMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-[#4a1212] border border-[#d4af37] text-[#f5e6d3] px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md max-w-sm animate-bounce">
          <ShieldAlert className="w-5 h-5 text-[#f59e0b] flex-shrink-0" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Main View Router */}
      {view === 'landing' && !roomCode ? (
        <Landing onStartGame={handleStartGame} />
      ) : !roomCode ? (
        /* Lobby Join/Host View */
        <div className="min-h-screen bg-wood-pattern flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
          
          <button
            onClick={() => setView('landing')}
            className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-bold text-[#dfc299] hover:text-[#d4af37] bg-[#2d1a0e]/80 border border-[#5c3b1e] px-4 py-2 rounded-full backdrop-blur-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home Page
          </button>

          <div className="golden-card-panel p-8 max-w-md w-full relative z-10 rounded-2xl border-2 border-[#d4af37] shadow-2xl">
            <div className="text-center mb-8">
              <span className="text-[#d4af37] text-xs font-bold uppercase tracking-widest px-3 py-1 bg-[#3b2314] rounded-full border border-[#8c622b]">
                Real-Time Card Table
              </span>
              <h1 className="font-heading text-4xl font-black mt-3 tracking-tight text-[#f5e6d3]">
                BLUFF <span className="text-[#d4af37]">ROYALE</span>
              </h1>
              <p className="text-[#dfc299] text-sm mt-2 font-medium">
                Enter your alias to host or join a live card room.
              </p>
            </div>
            
            <Lobby 
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              socket={socket}
              defaultUsername={username}
            />
          </div>
        </div>
      ) : (
        /* In-Room Game View */
        <div className="min-h-screen flex flex-col md:flex-row overflow-hidden relative">
          <ChatPanel 
            roomState={roomState}
            roomCode={roomCode}
            socket={socket}
            playerId={playerId}
          />
          <div className="flex-grow min-h-screen overflow-hidden relative">
            {roomState && roomState.status === 'lobby' ? (
              <div className="min-h-screen bg-wood-pattern flex items-center justify-center px-4 py-12 relative overflow-hidden">
                <div className="golden-card-panel p-8 max-w-lg w-full relative z-10 rounded-2xl border-2 border-[#d4af37] shadow-2xl">
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
