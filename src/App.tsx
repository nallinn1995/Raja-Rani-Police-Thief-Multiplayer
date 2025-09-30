import  { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { apiService } from './services/apiService';
import { HomePage } from './components/HomePage';
import { CreateRoom } from './components/CreateRoom';
import { JoinRoom } from './components/JoinRoom';
import { WaitingRoom } from './components/WaitingRoom';
import { GameBoard } from './components/GameBoard';
import { RoundResult } from './components/RoundResult';
import { Leaderboard } from './components/Leaderboard';
import { Room, Player, ChatMessage, RoundResult as RoundResultType } from './types/game';


const socket = io(import.meta.env.VITE_SERVER_URL);

type AppState = 'home' | 'create' | 'join' | 'waiting' | 'playing' | 'result' | 'leaderboard';

function App() {
  //const socket = useSocket();
  const [appState, setAppState] = useState<AppState>('home');
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [myRole, setMyRole] = useState<string>('');
  const [policeId, setPoliceId] = useState<string>('');
  const [allRoles, setAllRoles] = useState<Player[]>([]);
  const [roundResult, setRoundResult] = useState<RoundResultType | null>(null);
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string>('');



  useEffect(() => {
    if (!socket) return;

    socket.on('room-state', (data) => {
      setRoom(data.room);
      setCurrentPlayerId(data.playerId);
      setPoliceId(data.policeId || '');
      
      const currentPlayer = data.room.players.find((p: Player) => p.id === data.playerId);
      if (currentPlayer?.role) {
        setMyRole(currentPlayer.role);
      }
      
      if (data.room.gameState === 'waiting') {
        setAppState('waiting');
      }
    });

    socket.on('player-joined', (data) => {
      if (room) {
        setRoom({ ...room, players: data.players });
      }
    });

    socket.on('game-started', (data) => {
      setRoom(prev => prev ? { ...prev, ...data, gameState: 'role-assignment' } : null);
      setAppState('playing');
    });

    socket.on('role-assigned', (data) => {
      setMyRole(data.role);
      setRoom(prev => prev ? { ...prev, players: data.players } : null);
    });

    socket.on('police-reveal-phase', () => {
      setRoom(prev => prev ? { ...prev, gameState: 'police-reveal' } : null);
    });

    socket.on('all-roles', (data) => {
      setAllRoles(data.players);
    });

    socket.on('police-revealed', (data) => {
      setPoliceId(data.policeId);
      setRoom(prev => prev ? { ...prev, gameState: 'guessing' } : null);
    });

    socket.on('round-result', (data) => {
      setRoundResult(data);
      setRoom(prev => prev ? { 
        ...prev, 
        gameState: 'results',
        players: data.players.map((p: any) => ({ ...p, role: undefined }))
      } : null);
      setAppState('result');
      setAllRoles([]);
    });

    socket.on('game-finished', (data) => {
      setLeaderboard(data.leaderboard);
      setAppState('leaderboard');
    });

    socket.on('chat-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('chat-history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on('connect_error', (err) => {
      setError('Connection failed. Please try again.');
      console.error('Socket connection error:', err);
    });

    return () => {
      socket.off('room-state');
      socket.off('player-joined');
      socket.off('game-started');
      socket.off('role-assigned');
      socket.off('police-reveal-phase');
      socket.off('all-roles');
      socket.off('police-revealed');
      socket.off('round-result');
      socket.off('game-finished');
      socket.off('chat-message');
      socket.off('chat-history');
      socket.off('connect_error');
    };
  }, [socket, room]);

  const handleCreateRoom = async (roomName: string, playerName: string, totalRounds: number) => {
    return await apiService.createRoom(roomName, playerName, totalRounds);
  };

  const handleJoinRoom = async (roomCode: string, playerName: string) => {
    return await apiService.joinRoom(roomCode, playerName);
  };

  const handleRoomCreated = (roomCode: string, playerId: string) => {
    setCurrentPlayerId(playerId);
    if (socket) {
      socket.emit('join-room', { roomCode, playerId });
    }
  };

  const handleRoomJoined = (roomCode: string, playerId: string) => {
    setCurrentPlayerId(playerId);
    if (socket) {
      socket.emit('join-room', { roomCode, playerId });
    }
  };

  const handlePoliceReveal = () => {
    if (socket && room) {
      socket.emit('police-reveal', { roomCode: room.id, playerId: currentPlayerId });

    }
  };

  const handleMakeGuess = (guessedThiefId: string) => {
    if (socket && room) {
      socket.emit('make-guess', { roomCode: room.id, playerId: currentPlayerId, guessedThiefId });
    }
  };

  const handleSendMessage = (message: string) => {
    if (socket && room) {
      socket.emit('chat-message', { roomCode: room.id, playerId: currentPlayerId, message });
    }
  };

  const handlePlayAgain = () => {
    setAppState('home');
    setRoom(null);
    setCurrentPlayerId('');
    setMyRole('');
    setPoliceId('');
    setAllRoles([]);
    setRoundResult(null);
    setLeaderboard([]);
    setMessages([]);
    setError('');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Connection Error</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  switch (appState) {
    case 'home':
      return (
        <HomePage
          onCreateRoom={() => setAppState('create')}
          onJoinRoom={() => setAppState('join')}
        />
      );

    case 'create':
      return (
        <CreateRoom
          onBack={() => setAppState('home')}
          onRoomCreated={handleRoomCreated}
          createRoom={handleCreateRoom}
        />
      );

    case 'join':
      return (
        <JoinRoom
          onBack={() => setAppState('home')}
          onRoomJoined={handleRoomJoined}
          joinRoom={handleJoinRoom}
        />
      );

    case 'waiting':
      return room ? (
        <WaitingRoom
          room={room}
          currentPlayerId={currentPlayerId}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      ) : null;

    case 'playing':
      return room ? (
        <GameBoard
          room={room}
          currentPlayerId={currentPlayerId}
          myRole={myRole}
          policeId={policeId}
          allRoles={allRoles}
          messages={messages}
          onPoliceReveal={handlePoliceReveal}
          onMakeGuess={handleMakeGuess}
          onSendMessage={handleSendMessage}
        />
      ) : null;

    case 'result':
      return roundResult ? (
        <RoundResult result={roundResult} />
      ) : null;

    case 'leaderboard':
      return (
        <Leaderboard
          leaderboard={leaderboard}
          onPlayAgain={handlePlayAgain}
        />
      );

    default:
      return null;
  }
}

export default App;