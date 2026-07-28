import React, { useState } from 'react';
import { User, Copy, Check, Crown, Play, Settings2, Sparkles, Volume2, VolumeX } from 'lucide-react';

function Lobby({ roomState, onCreateRoom, onJoinRoom, playerId, socket, roomCode, muted, setMuted, onLeaveRoom }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateSetting = (key, value) => {
    if (!socket || !roomState) return;
    const newSettings = { ...roomState.settings, [key]: value };
    socket.emit('update_settings', { roomCode, settings: newSettings });
  };

  const handleToggleReady = () => {
    if (!socket) return;
    socket.emit('toggle_ready', { roomCode });
  };

  const handleStartGame = () => {
    if (!socket) return;
    socket.emit('start_game', { roomCode });
  };

  if (!roomCode) {
    return (
      <div className="flex flex-col gap-5">
        {/* User Handle Input (Icon Badged) */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[#d4af37]">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            className="w-full pl-10 pr-4 py-3 bg-[#1c1008] border border-[#5c3b1e] rounded-xl text-[#f5e6d3] placeholder-[#8c622b] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all font-bold text-sm"
          />
        </div>

        {/* Create Lobby Button (Icon Specific) */}
        <button
          onClick={() => { if (name.trim()) onCreateRoom(name.trim()); }}
          disabled={!name.trim()}
          className="btn-gold w-full py-3 text-xs font-black rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <Sparkles className="w-4 h-4 text-[#1c1008]" />
          <span>Create Lobby</span>
        </button>

        {/* Divider Symbol */}
        <div className="flex items-center gap-3 my-0.5">
          <div className="h-px bg-[#4a2c18] grow" />
          <span className="text-[10px] text-[#8c622b] font-black tracking-widest uppercase">OR</span>
          <div className="h-px bg-[#4a2c18] grow" />
        </div>

        {/* Join Code Input + Action (Icon Specific) */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="CODE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={4}
            className="w-1/2 px-3 py-2.5 bg-[#1c1008] border border-[#5c3b1e] rounded-xl text-[#d4af37] placeholder-[#8c622b] focus:outline-none focus:border-[#d4af37] text-center font-black tracking-widest text-base font-mono transition-all"
          />
          <button
            onClick={() => { if (name.trim() && code.length === 4) onJoinRoom(name.trim(), code); }}
            disabled={!name.trim() || code.length !== 4}
            className="btn-brown w-1/2 py-2.5 text-xs font-black rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Play className="w-4 h-4 text-[#d4af37]" />
            <span>Join</span>
          </button>
        </div>
      </div>
    );
  }

  const localPlayer = roomState.players.find(p => p.id === playerId);
  const isCreator = localPlayer?.isCreator;
  const readyCount = roomState.players.filter(p => p.isReady || p.isCreator).length;
  const canStart = roomState.players.length >= 3 && roomState.players.every(p => p.isCreator || p.isReady);

  return (
    <div className="flex flex-col gap-5">
      {/* Header Bar */}
      <div className="flex justify-between items-center border-b border-[#5c3b1e] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#f5e6d3] uppercase tracking-wider">Game Lobby</h2>
            <button
              onClick={() => setMuted(!muted)}
              className="p-1.5 bg-[#1c1008] hover:bg-[#3b2314] text-[#d4af37] rounded-xl border border-[#5c3b1e] transition-all cursor-pointer shadow-md"
              title={muted ? 'Unmute game sounds' : 'Mute game sounds'}
            >
              {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#d4af37]" />}
            </button>
            <button
              onClick={onLeaveRoom}
              className="px-2.5 py-1 bg-[#4a1212] hover:bg-[#631818] border border-[#8c2323] text-rose-200 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer shadow-md"
            >
              Exit
            </button>
          </div>
          <p className="text-[#dfc299] text-[11px] font-bold mt-0.5">Players ({roomState.players.length} / 6)</p>
        </div>

        {/* Room Code + Copy Badge */}
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-[#dfc299] font-extrabold uppercase tracking-widest">Code</span>
          <div className="flex items-center gap-1.5 bg-[#1c1008] px-3 py-1.5 rounded-xl border border-[#5c3b1e] mt-0.5 shadow-inner">
            <span className="text-sm font-black text-[#d4af37] font-mono tracking-widest">{roomCode}</span>
            <button
              onClick={handleCopyCode}
              className="p-1 text-[#dfc299] hover:text-[#d4af37] transition-all cursor-pointer"
              title="Copy Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Players Grid / List */}
      <div className="flex flex-col gap-2">
        {roomState.players.map((player) => (
          <div
            key={player.id}
            className={`flex justify-between items-center px-3.5 py-2.5 rounded-xl border shadow-md transition-all ${
              player.id === playerId
                ? 'bg-[#3b2314] border-[#d4af37] ring-1 ring-[#d4af37]/30'
                : 'bg-[#1c1008] border-[#4a2c18]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#1c1008] border border-[#d4af37] flex items-center justify-center text-xs font-black text-[#d4af37] shadow-inner">
                  {player.username.substring(0, 2).toUpperCase()}
                </div>
                {player.isCreator && (
                  <div className="absolute -top-1 -right-1 bg-[#d4af37] p-0.5 rounded-full text-[#1c1008] shadow-md">
                    <Crown className="w-3 h-3 fill-[#1c1008]" />
                  </div>
                )}
              </div>
              <span className="text-xs font-black text-[#f5e6d3]">
                {player.username} {player.id === playerId && <span className="text-[10px] text-[#dfc299] font-bold">(You)</span>}
              </span>
            </div>

            <div>
              {player.isCreator ? (
                <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-wider bg-[#2d1a0e] border border-[#d4af37]/60 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Host
                </span>
              ) : player.isReady ? (
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                  <Check className="w-3 h-3 text-emerald-400" /> Ready
                </span>
              ) : (
                <span className="text-[10px] font-black text-[#dfc299]/60 uppercase tracking-wider bg-[#1c1008] border border-[#4a2c18] px-2.5 py-0.5 rounded-lg">
                  Waiting
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Host Settings */}
      <div className="bg-[#1c1008] border border-[#4a2c18] rounded-xl p-3 flex justify-between items-center shadow-inner">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-[#d4af37]" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-[#f5e6d3]">Turn Timer</span>
            <span className="text-[9px] text-[#dfc299] font-bold">Limit per move</span>
          </div>
        </div>
        <select
          value={roomState.settings.timerDuration} 
          onChange={(e) => handleUpdateSetting('timerDuration', Number(e.target.value))}
          disabled={!isCreator}
          className="bg-[#2d1a0e] border border-[#5c3b1e] rounded-lg px-3 py-1 text-xs font-black text-[#d4af37] focus:outline-none focus:border-[#d4af37] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          <option value={0}>∞ Casual (No Timer)</option>
          <option value={15}>15 Seconds</option>
          <option value={30}>30 Seconds</option>
          <option value={45}>45 Seconds</option>
          <option value={60}>60 Seconds</option>
        </select>
      </div>

      {/* Action Controls */}
      <div className="mt-1">
        {isCreator ? (
          <button
            onClick={handleStartGame}
            disabled={!canStart}
            className="btn-gold w-full py-3 text-xs font-black rounded-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Play className="w-4 h-4 fill-[#1c1008]" />
            <span>Start Game ({readyCount}/{roomState.players.length} Ready)</span>
          </button>
        ) : (
          <button
            onClick={handleToggleReady}
            className={`w-full py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-black cursor-pointer shadow-lg active:scale-95 ${
              localPlayer?.isReady
                ? 'bg-emerald-950 border-2 border-emerald-500 text-emerald-300 shadow-emerald-950/50'
                : 'btn-brown'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{localPlayer?.isReady ? 'You Are Ready!' : 'Ready Up'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default Lobby;
