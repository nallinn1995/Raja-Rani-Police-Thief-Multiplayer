import React, { useState, useEffect } from "react";
import { Shield, Eye, MessageCircle, Heart } from "lucide-react";
import { Player, ChatMessage } from "../types/game";
import { Chat } from "./Chat";

interface GameBoardProps {
  room: {
    id: string;
    name: string;
    currentRound: number;
    totalRounds: number;
    gameState: string;
    guessingEndTime?: number;
    players: Player[];
  };
  currentPlayerId: string;
  myRole?: string;
  policeId?: string;
  allRoles?: Player[];
  messages: ChatMessage[];
  onPoliceReveal: () => void;
  onMakeGuess: (guessedThiefId: string) => void;
  onSendMessage: (message: string) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  room,
  currentPlayerId,
  myRole,
  policeId,
  allRoles,
  messages,
  onPoliceReveal,
  onMakeGuess,
  onSendMessage,
}) => {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [showChat, setShowChat] = useState(false);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [lastReadMessageCount, setLastReadMessageCount] = useState(0);
  const [currentPlayerName, setCurrentPlayerName] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const heartbeatAudioRef = React.useRef<HTMLAudioElement>(null);
  const policeSirenAudioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (room.gameState === "guessing" && room.guessingEndTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((room.guessingEndTime! - Date.now()) / 1000));
        setTimeLeft(remaining);
      }, 500);

      if (heartbeatAudioRef.current) {
        heartbeatAudioRef.current.play().catch((e) => console.log("Audio autoplay prevented", e));
      }
      if (policeSirenAudioRef.current) {
        policeSirenAudioRef.current.volume = 0.3; // softer than heartbeat
        policeSirenAudioRef.current.play().catch((e) => console.log("Audio autoplay prevented", e));
      }

      return () => {
        clearInterval(interval);
        if (heartbeatAudioRef.current) {
          heartbeatAudioRef.current.pause();
          heartbeatAudioRef.current.currentTime = 0;
        }
        if (policeSirenAudioRef.current) {
          policeSirenAudioRef.current.pause();
          policeSirenAudioRef.current.currentTime = 0;
        }
      };
    } else {
      if (heartbeatAudioRef.current) {
        heartbeatAudioRef.current.pause();
        heartbeatAudioRef.current.currentTime = 0;
      }
      if (policeSirenAudioRef.current) {
        policeSirenAudioRef.current.pause();
        policeSirenAudioRef.current.currentTime = 0;
      }
    }
  }, [room.gameState, room.guessingEndTime]);

  useEffect(() => {
    if (!showChat) {
      setUnreadMsgs(messages.length - lastReadMessageCount);
    }
  }, [messages.length, showChat, lastReadMessageCount]);

  const handleShowChat = () => {
    setShowChat(true);
    setUnreadMsgs(0);
    setLastReadMessageCount(messages.length);
  };




  useEffect(() => {
    // Use direct value (not updater fn) to avoid setState-during-render warning
    setCurrentPlayerName(
      room.players.find((player) => player.id === currentPlayerId)?.name ?? ""
    );
    if (room.gameState === "role-assignment") {
      // Animate card flips
      room.players.forEach((player, index) => {
        setTimeout(() => {
          setFlippedCards((prev) => new Set([...prev, player.id]));
        }, index * 500 + 1000);
      });
    }
  }, [currentPlayerId, room, room.gameState, room.players]);



  const isPolice = myRole === "Police";
  const canRevealPolice = room.gameState === "police-reveal" && isPolice;
  const canMakeGuess =
    room.gameState === "guessing" && currentPlayerId === policeId;



  const getPlayerRole = (playerId: string) => {
    if (playerId === currentPlayerId) return myRole;

    if (allRoles) {
      const player = allRoles.find((p) => p.id === playerId);
      return player?.role;
    }
    return null;
  };

  const showRole = (role: string) => {

    if (role === myRole) {
      return myRole;
    } else {
      return "?";
    }
  };

  return (
    <div className="relative min-h-screen bg-[#11052C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054] via-[#11052C] to-[#0A0217] p-4 overflow-y-auto overflow-x-hidden text-white font-sans sm:flex sm:flex-col sm:items-center sm:justify-center">
      {/* Background Particles/Stars */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDuration: Math.random() * 3 + 2 + 's',
              animationDelay: Math.random() * 2 + 's',
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {room.gameState === "guessing" && (
        <div className="pointer-events-none fixed inset-0 z-40 animate-red-glow opacity-50"></div>
      )}
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[#1D0C3A]/95 backdrop-blur-xl rounded-[calc(2rem-2px)] shadow-[0_0_40px_rgba(147,51,234,0.3)] border border-[#3A1C61] p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#ffd700] to-[#b8860b] title-font tracking-wide">Hi {currentPlayerName}, Welcome to {room.name}</h1>

            <div className="flex items-center space-x-4">
              {room.gameState === "guessing" && (
                <div className={`flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-full border ${timeLeft <= 10 ? 'border-red-400' : 'border-red-200'} shadow-sm`}>
                  <Heart className={`w-5 h-5 text-red-500 ${timeLeft <= 10 ? 'animate-ping' : 'animate-pulse'}`} />
                  <span className={`font-bold ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-red-500'}`}>
                    {timeLeft}s
                  </span>
                </div>
              )}
              <button
                onClick={handleShowChat}
                className="p-2 text-fuchsia-400 hover:text-white transition-colors relative bg-[#11052C] border border-[#3A1C61] rounded-full drop-shadow-md"
              >
                <MessageCircle className="w-6 h-6" />
                {unreadMsgs > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center border border-[#1D0C3A]">
                    {unreadMsgs > 9 ? "9+" : unreadMsgs}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-400 font-sans tracking-wide">
            <span>
              Round <strong className="text-yellow-400">{room.currentRound}</strong> of <strong className="text-yellow-400">{room.totalRounds}</strong>
            </span>
            <span>State: <strong className="text-fuchsia-400 capitalize">{room.gameState}</strong></span>
          </div>
        </div>

        {/* Player Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {room.players.map((player) => {
            const playerRole = getPlayerRole(player.id);
            const isFlipped = flippedCards.has(player.id);
            const canClick =
              canMakeGuess && playerRole && playerRole !== "Police";

            return (
              <div
                key={player.id}
                className={`relative h-40 transition-all duration-500 ${
                  canClick ? "cursor-pointer hover:scale-105" : ""
                }`}
                onClick={canClick ? () => onMakeGuess(player.id) : undefined}
              >
                <div className={`card ${isFlipped ? "flipped" : ""}`}>
                  {/* Card Back */}
                  <div className="card-face card-back">
                    <div className="bg-[#11052C] border border-[#5A2C81] rounded-xl h-full flex flex-col items-center justify-center text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                      <Eye className="w-8 h-8 mb-2 text-gray-500" />
                      <span className="text-sm font-medium text-gray-400">{player.name}</span>
                    </div>
                  </div>

                  {/* Card Front */}
                  <div className="card-face card-front">
                    <div
                      className={`bg-[#0A0217] border border-[#5A2C81] rounded-xl h-full flex flex-col items-center justify-center text-white shadow-[0_0_20px_rgba(250,204,21,0.2)] ${
                        canClick ? "hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] border-fuchsia-500" : ""
                      }`}
                    >
                      <span className={`text-2xl font-black title-font tracking-wide mt-2 ${playerRole === 'Raja' ? 'text-yellow-400' : playerRole === 'Rani' ? 'text-pink-400' : playerRole === 'Police' ? 'text-blue-400' : 'text-green-400'}`}>
                        {showRole(playerRole || '')}
                      </span>
                      <span className="text-sm mt-2 text-gray-300 font-sans">{player.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Game Actions */}
        <div className="bg-[#1D0C3A]/95 backdrop-blur-xl rounded-[calc(2rem-2px)] shadow-[0_0_40px_rgba(147,51,234,0.3)] border border-[#3A1C61] p-6 mb-6">
          {canRevealPolice && (
            <div className="text-center">
              <div className="mb-4 p-4 bg-[#11052C] rounded-xl border border-blue-900/50 shadow-inner">
                <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2 drop-shadow-md" />
                <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500 mb-2 tracking-wide">
                  You are the Police!
                </h3>
                <p className="text-blue-200/70 text-sm font-sans tracking-wide">
                  Click below to reveal yourself and start finding the thief
                </p>
              </div>
              <button
                onClick={onPoliceReveal}
                className="w-full relative group mt-2 max-w-sm mx-auto block"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
                <div className="relative w-full bg-[#11052C] border border-[#3B82F6]/50 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform group-hover:scale-105 shadow-xl tracking-wider">
                  I am Police
                </div>
              </button>
            </div>
          )}

          {room.gameState === "guessing" && (
            <div className="text-center p-4 bg-[#11052C] rounded-xl border border-yellow-900/50 shadow-inner">
              <Shield className="w-8 h-8 text-yellow-500 mx-auto mb-2 drop-shadow-md" />
              <p className="text-yellow-300 font-medium tracking-wide">
                {policeId === currentPlayerId
                  ? "Click on a player card to make your guess!"
                  : `Waiting for ${
                      room.players.find((p) => p.id === policeId)?.name
                    } to make their guess...`}
              </p>
            </div>
          )}

          {room.gameState === "role-assignment" && (
            <div className="text-center p-4 bg-[#11052C] rounded-xl border border-[#3A1C61] shadow-inner">
              <div className="animate-pulse">
                <p className="text-gray-300 tracking-wide font-medium">Assigning roles...</p>
              </div>
            </div>
          )}

          {room.gameState === "waiting" && (
            <div className="text-center p-4 bg-[#11052C] rounded-xl border border-fuchsia-900/50 shadow-inner flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-400 mx-auto mb-3"></div>
              <p className="text-fuchsia-300 tracking-wide font-medium">Waiting for game to start...</p>
            </div>
          )}
        </div>
      </div>

      {showChat && (
        <Chat
          messages={messages}
          currentPlayerId={currentPlayerId}
          onSendMessage={onSendMessage}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Heartbeat and Siren audio */}
      <audio
        ref={heartbeatAudioRef}
        loop
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/Heartbeat.ogg"
      />
      <audio
        ref={policeSirenAudioRef}
        loop
        src="https://actions.google.com/sounds/v1/alarms/police_siren.ogg"
      />
    </div>
  );
};
