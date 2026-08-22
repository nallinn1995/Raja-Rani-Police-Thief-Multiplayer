import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types/game';

interface ChatProps {
  messages: ChatMessage[];
  currentPlayerId: string;
  onSendMessage: (message: string) => void;
  onClose: () => void;
}

export const Chat: React.FC<ChatProps> = ({ messages, currentPlayerId, onSendMessage, onClose }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#060210]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
      <div className="p-[1.5px] rounded-3xl bg-gradient-to-b from-purple-500/50 via-indigo-500/20 to-purple-900/50 shadow-[0_0_60px_rgba(147,51,234,0.3)] w-full max-w-md h-[520px] max-h-[85vh] flex flex-col relative overflow-hidden">
        <div className="bg-[#12052b]/95 backdrop-blur-2xl rounded-[calc(1.5rem-1.5px)] w-full h-full flex flex-col border border-[#3b176e]/70 relative overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#1b083e]/90 border-b border-[#3b176e] rounded-t-[calc(1.5rem-1.5px)] shadow-md">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-amber-300">
                <MessageSquare className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black bg-gradient-to-r from-amber-300 to-yellow-100 bg-clip-text text-transparent">
                  Group Chat
                </h3>
                <p className="text-[10px] text-purple-300 font-medium">
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white bg-[#250d4d] hover:bg-[#391578] border border-purple-500/30 rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-[#0a031a]/80 selection:bg-purple-500 selection:text-white">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-900/30 border border-purple-700/40 flex items-center justify-center text-purple-300">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">No messages yet</p>
                  <p className="text-xs text-slate-400 mt-1">Start the room conversation below! 💬</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isMe = message.playerId === currentPlayerId;
                return (
                  <div
                    key={message.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {!isMe && (
                      <span className="text-[11px] font-bold text-amber-300 mb-1 ml-1">
                        {message.playerName}
                      </span>
                    )}

                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-lg ${
                        isMe
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none border border-purple-400/30 shadow-purple-950/50'
                          : 'bg-[#1e0b42] text-slate-100 rounded-tl-none border border-[#3e1b73] shadow-black/40'
                      }`}
                    >
                      <p className="break-words">{message.message}</p>
                      <span
                        className={`text-[10px] block mt-1 text-right ${
                          isMe ? 'text-purple-200/80' : 'text-slate-400'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Form Input */}
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-[#160735] border-t border-[#3b176e] rounded-b-[calc(1.5rem-1.5px)]">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 bg-[#0b031c] border border-[#3e1b73] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-slate-400 rounded-xl text-sm transition-all duration-200 outline-none"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-30 disabled:hover:from-amber-400 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};