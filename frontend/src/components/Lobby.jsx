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
      <div className="flex flex-col gap-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Your Username</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Enter name (e.g. CardMaster)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
              className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-sm"
            />
          </div>
        </div>

        <div className="h-px bg-slate-800 my-1"></div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { if (name.trim()) onCreateRoom(name.trim()); }}
            disabled={!name.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold rounded-lg shadow-lg hover:shadow-emerald-500/10 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:text-slate-500 disabled:shadow-none"
          >
            <Sparkles className="w-5 h-5" />
            Create New Lobby
          </button>
        </div>

        <div className="flex items-center gap-3 my-1">
          <div className="h-px bg-slate-800 flex-grow"></div>
          <span className="text-xs text-slate-500 font-black tracking-widest uppercase">OR</span>
          <div className="h-px bg-slate-800 flex-grow"></div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Room Code</label>
            <input
              type="text"
              placeholder="Enter 4-letter code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={4}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center font-bold tracking-widest text-lg transition-all"
            />
          </div>
          <button
            onClick={() => { if (name.trim() && code.length === 4) onJoinRoom(name.trim(), code); }}
            disabled={!name.trim() || code.length !== 4}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-white font-bold rounded-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800/80 disabled:cursor-not-allowed"
          >
            Join Lobby
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
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Game Room Lobby</h2>
            <button
              onClick={() => setMuted(!muted)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded border border-slate-800/80 transition-all cursor-pointer flex items-center justify-center"
              title={muted ? 'Unmute game sounds' : 'Mute game sounds'}
            >
              {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={onLeaveRoom}
              className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/30 text-rose-300 text-[10px] font-black uppercase tracking-wider rounded transition-all cursor-pointer"
            >
              Exit
            </button>
          </div>
          <p className="text-slate-400 text-xs mt-1">Waiting for players ({roomState.players.length} / 6)</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lobby Code</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-black text-emerald-400 tracking-wider bg-slate-900 px-3 py-1 rounded border border-slate-800 font-mono">{roomCode}</span>
            <button
              onClick={handleCopyCode}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/50 transition-all active:scale-95 cursor-pointer"
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <User className="w-4 h-4 text-slate-500" /> Players List
        </h3>
        <div className="flex flex-col gap-2">
          {roomState.players.map((player) => (
            <div
              key={player.id}
              className={`flex justify-between items-center px-4 py-3 rounded-lg border ${
                player.id === playerId
                  ? 'bg-slate-800/40 border-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-200">
                    {player.username.substring(0, 2).toUpperCase()}
                  </div>
                  {player.isCreator && (
                    <div className="absolute -top-1.5 -right-1.5 bg-amber-500 p-0.5 rounded-full text-slate-950" title="Lobby Host">
                      <Crown className="w-3 h-3 fill-slate-950" />
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-sm text-slate-200">
                    {player.username} {player.id === playerId && <span className="text-[10px] font-bold text-slate-400">(You)</span>}
                  </span>
                </div>
              </div>

              <div>
                {player.isCreator ? (
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded">Host</span>
                ) : player.isReady ? (
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ready
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800/60 border border-slate-700/30 px-2.5 py-1 rounded">Waiting</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <Settings2 className="w-4 h-4 text-emerald-500" /> Host Settings
        </h3>

        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-200">Turn Timer</span>
            <span className="text-xs text-slate-500">Seconds to make a move</span>
          </div>
          <div>
            <select
              value={roomState.settings.timerDuration} 
              onChange={(e) => handleUpdateSetting('timerDuration', Number(e.target.value))}
              disabled={!isCreator}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-sm font-semibold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:cursor-not-allowed"
            >
              <option value={0}>No Timer (Casual)</option>
              <option value={15}>15 Seconds</option>
              <option value={30}>30 Seconds</option>
              <option value={45}>45 Seconds</option>
              <option value={60}>60 Seconds</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-2">
        {isCreator ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold rounded-lg shadow-lg hover:shadow-emerald-500/10 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:text-slate-500 disabled:shadow-none"
            >
              <Play className="w-5 h-5 fill-white" />
              Start Game ({readyCount}/{roomState.players.length} Ready)
            </button>
            {!canStart && (
              <p className="text-[10px] text-slate-500 text-center font-medium">
                {roomState.players.length < 3 
                  ? 'Need at least 3 players in the lobby.' 
                  : 'Wait for all players to toggle Ready.'}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={handleToggleReady}
            className={`w-full py-4 rounded-lg transition-all flex items-center justify-center gap-2 border font-bold cursor-pointer ${
              localPlayer?.isReady
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/60'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            <Check className="w-5 h-5" />
            {localPlayer?.isReady ? 'You Are Ready!' : 'Ready Up'}
          </button>
        )}
      </div>
    </div>
  );
}

export default Lobby;
