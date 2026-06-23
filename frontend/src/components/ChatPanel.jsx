import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, ListFilter, ChevronLeft, ChevronRight, Send, CornerDownRight,
  Gamepad2, Play, ChevronsRight, Eye, RotateCcw, Trophy, AlertTriangle 
} from 'lucide-react';

function ChatPanel({ roomState, roomCode, socket, playerId }) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'logs'
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  
  const chatEndRef = useRef(null);

  // Sync initial chat messages from roomState
  useEffect(() => {
    if (roomState && roomState.chatLog) {
      setMessages(roomState.chatLog);
    }
  }, [roomState?.chatLog]);

  // Receive chat messages from socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      setMessages(prev => {
        const exists = prev.some(
          m => m.username === msg.username && m.message === msg.message && m.timestamp === msg.timestamp
        );
        if (exists) return prev;
        return [...prev, msg];
      });
    };

    socket.on('chat_message', handleNewMessage);
    return () => {
      socket.off('chat_message', handleNewMessage);
    };
  }, [socket]);

  // Auto-scroll chat and logs
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab, roomState?.gameState?.history]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!socket || !inputMessage.trim()) return;

    socket.emit('send_chat_message', {
      roomCode,
      message: inputMessage.trim()
    });
    setInputMessage('');
  };

  const renderLogItem = (log, index) => {
    let icon = <CornerDownRight className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />;
    let itemClass = "bg-slate-900/30 border-slate-900/40 text-slate-300";
    let title = "";
    
    switch (log.type) {
      case 'start':
        icon = <Gamepad2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />;
        itemClass = "bg-emerald-950/20 border-emerald-900/30 text-emerald-200";
        title = "Game Started";
        break;
      case 'play':
        icon = <Play className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" fill="currentColor" />;
        itemClass = "bg-sky-950/20 border-sky-900/30 text-sky-200";
        title = "Play Made";
        break;
      case 'pass':
        icon = <ChevronsRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />;
        itemClass = "bg-slate-900/50 border-slate-800 text-slate-400";
        title = "Passed";
        break;
      case 'challenge_reveal':
        const isLie = log.message.includes("lied");
        icon = <Eye className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isLie ? 'text-red-400' : 'text-amber-400'}`} />;
        itemClass = isLie 
          ? "bg-red-950/20 border-red-900/30 text-red-200" 
          : "bg-amber-950/20 border-amber-900/30 text-amber-200";
        title = isLie ? "Bluff Caught!" : "Show Reveal";
        break;
      case 'round_clear':
        icon = <RotateCcw className="w-3.5 h-3.5 text-teal-400 mt-0.5 flex-shrink-0" />;
        itemClass = "bg-teal-950/20 border-teal-900/30 text-teal-200";
        title = "Round Complete";
        break;
      case 'win':
        icon = <Trophy className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" />;
        itemClass = "bg-yellow-950/30 border-yellow-900/40 text-yellow-200 font-extrabold";
        title = "Winner!";
        break;
      case 'timer_expiry':
      case 'challenge_expired':
        icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />;
        itemClass = "bg-rose-950/20 border-rose-900/30 text-rose-200";
        title = "Expired";
        break;
      case 'connect':
        icon = <Gamepad2 className="w-3.5 h-3.5 text-emerald-450 mt-0.5 flex-shrink-0" />;
        itemClass = "bg-emerald-950/20 border-emerald-900/30 text-emerald-200";
        title = "Reconnected";
        break;
      case 'disconnect':
        icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />;
        itemClass = "bg-rose-950/20 border-rose-900/30 text-rose-200";
        title = "Disconnected";
        break;
      default:
        break;
    }

    return (
      <div key={index} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${itemClass} shadow-sm`}>
        {icon}
        <div className="flex flex-col gap-0.5">
          {title && (
            <span className="text-[8px] font-black uppercase tracking-wider opacity-75">{title}</span>
          )}
          <span className="text-[10px] leading-relaxed font-semibold">{log.message}</span>
        </div>
      </div>
    );
  };

  const getPlayerColorScheme = (msgUsername) => {
    const defaultScheme = {
      text: 'text-slate-300',
      name: 'text-slate-450',
      bg: 'bg-slate-900/50',
      border: 'border-slate-850/80'
    };

    if (!roomState || !roomState.players) return defaultScheme;

    const idx = roomState.players.findIndex(p => p.username === msgUsername);
    if (idx === -1) return defaultScheme;

    const colors = [
      { // 0: Emerald
        text: 'text-emerald-250',
        name: 'text-emerald-400',
        bg: 'bg-emerald-950/20',
        border: 'border-emerald-900/20'
      },
      { // 1: Sky
        text: 'text-sky-250',
        name: 'text-sky-400',
        bg: 'bg-sky-950/20',
        border: 'border-sky-900/20'
      },
      { // 2: Violet
        text: 'text-purple-250',
        name: 'text-purple-400',
        bg: 'bg-purple-950/20',
        border: 'border-purple-900/20'
      },
      { // 3: Amber
        text: 'text-amber-250',
        name: 'text-amber-400',
        bg: 'bg-amber-950/20',
        border: 'border-amber-900/20'
      },
      { // 4: Rose
        text: 'text-rose-250',
        name: 'text-rose-400',
        bg: 'bg-rose-950/20',
        border: 'border-rose-900/20'
      },
      { // 5: Fuchsia
        text: 'text-fuchsia-250',
        name: 'text-fuchsia-400',
        bg: 'bg-fuchsia-950/20',
        border: 'border-fuchsia-900/20'
      }
    ];

    return colors[idx % colors.length];
  };

  const hasStarted = roomState && roomState.status !== 'lobby';

  return (
    <div className="relative flex">
      {/* Sidebar Panel */}
      <div className={`flex flex-col bg-slate-950/95 border-r border-slate-800 transition-all duration-300 h-screen ${
        isOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'
      }`}>
        
        {/* Tab Headers */}
        <div className="flex border-b border-slate-850 p-2 bg-slate-950">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-grow flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Lobby Chat
          </button>
          
          {hasStarted && (
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-grow flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              Game Feed
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
          {activeTab === 'logs' && hasStarted ? (
            roomState.gameState?.history.length > 0 ? (
              roomState.gameState.history.map((log, i) => renderLogItem(log, i))
            ) : (
              <div className="text-center text-slate-600 font-bold uppercase text-[9px] tracking-widest my-auto">
                No Game Activity Logs
              </div>
            )
          ) : (
            messages.length > 0 ? (
              messages.map((msg, i) => {
                const isMe = msg.playerId === playerId || (roomState?.players?.find(p => p.id === playerId)?.username === msg.username);
                const scheme = getPlayerColorScheme(msg.username);

                return (
                  <div 
                    key={i} 
                    className={`flex flex-col p-2.5 rounded-lg border ${scheme.bg} ${scheme.border} max-w-[85%] ${
                      isMe ? 'self-end items-end rounded-tr-none' : 'self-start items-start rounded-tl-none'
                    } shadow-md transition-all`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {!isMe && (
                        <span className={`text-[10px] font-black ${scheme.name}`}>{msg.username}</span>
                      )}
                      {isMe && (
                        <span className="text-[10px] font-black text-slate-400">You</span>
                      )}
                      <span className="text-[8px] text-slate-500 font-semibold">{msg.timestamp}</span>
                    </div>
                    <p className={`text-xs ${scheme.text} font-medium break-words leading-relaxed ${isMe ? 'text-right' : 'text-left'}`}>
                      {msg.message}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-slate-600 font-bold uppercase text-[9px] tracking-widest my-auto">
                No Chat Messages Yet
              </div>
            )
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input form */}
        {activeTab === 'chat' && (
          <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-900 flex gap-2">
            <input
              type="text"
              placeholder="Send message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              maxLength={100}
              className="flex-grow bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Close Toggle inside Panel */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-16 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border-y border-r border-slate-800 rounded-r-lg flex items-center justify-center shadow-lg transition-all cursor-pointer z-50"
          title="Collapse Panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Toggle Tab when Panel is Closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border-y border-r border-slate-800 rounded-r-lg flex items-center justify-center shadow-lg transition-all cursor-pointer z-50 animate-pulse"
          title="Expand Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default ChatPanel;
