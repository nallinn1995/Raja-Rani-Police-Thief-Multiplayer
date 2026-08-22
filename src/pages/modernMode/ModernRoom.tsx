import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { ModernHeader } from '../../components/modernMode/ModernHeader';
import { ModernKingdomTable } from '../../components/modernMode/ModernKingdomTable';
import { ModernActionBar } from '../../components/modernMode/ModernActionBar';
import { ModernRulesModal } from '../../components/modernMode/ModernRulesModal';
import { ModernPhaseTransition } from '../../components/modernMode/ModernPhaseTransition';
import { ModernRoundResult } from '../../components/modernMode/ModernRoundResult';
import { ModernLeaderboard } from '../../components/modernMode/ModernLeaderboard';
import { modernSocketHandler } from '../../socket/modernMode/modernSocketHandler';
import { ModernPlayerState, ModernRole, ModernRoundResultData } from '../../types/modernMode';

interface ModernRoomProps {
  socket: Socket;
  roomCode: string;
  currentPlayerId: string;
  initialPlayers?: any[];
  onReturnHome: () => void;
}

export const ModernRoom: React.FC<ModernRoomProps> = ({
  socket,
  roomCode,
  currentPlayerId,
  initialPlayers = [],
  onReturnHome,
}) => {
  const [currentPhase, setCurrentPhase] = useState<string>('rules');
  const [timerSeconds, setTimerSeconds] = useState<number>(25);
  const [maxTimerSeconds, setMaxTimerSeconds] = useState<number>(25);
  const [players, setPlayers] = useState<ModernPlayerState[]>(() => {
    if (initialPlayers && initialPlayers.length > 0) {
      return initialPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: !!p.isHost,
        score: p.score || 0,
        role: p.role || 'Villager',
      })) as ModernPlayerState[];
    }
    return [];
  });
  const [readyCount, setReadyCount] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [allReady, setAllReady] = useState<boolean>(false);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [hasSubmittedAction, setHasSubmittedAction] = useState<boolean>(false);
  const [mantriDecision, setMantriDecision] = useState<'yes' | 'no' | null>(null);

  const [showTransition, setShowTransition] = useState<boolean>(false);
  const [transitionData, setTransitionData] = useState<{ title: string; subtitle: string; icon: string }>({
    title: '⚔️ Kingdom Security Alert!',
    subtitle: 'Royal Investigation Complete. Police Investigation Begins...',
    icon: '👮',
  });

  const [resultData, setResultData] = useState<ModernRoundResultData | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  const me = players.find((p) => p.id === currentPlayerId);
  const myRole = me ? (me.role as ModernRole) : null;
  const isHost =
    (me && !!me.isHost) ||
    (players.length > 0 && (players[0].id === currentPlayerId || !!players[0].isHost && players[0].id === currentPlayerId)) ||
    (initialPlayers && initialPlayers.length > 0 && (initialPlayers[0].id === currentPlayerId || (initialPlayers.find(p => p.id === currentPlayerId)?.isHost)));

  // Reset phase specific state when phase changes
  useEffect(() => {
    setHasSubmittedAction(false);
    setSelectedPlayerId(null);
    if (currentPhase !== 'mantri-shield') {
      setMantriDecision(null);
    }
  }, [currentPhase]);

  // Set up socket listeners for Modern Mode events
  useEffect(() => {
    if (!socket) return;

    socket.on('modern:rulesState', (data: { readyCount: number; readyPlayerIds: string[]; players?: any[] }) => {
      setReadyCount(data.readyCount);
      if (data.players && data.players.length > 0) {
        const playersList = data.players;
        setPlayers((prev) => {
          if (prev.length === 0) {
            return playersList.map((p: any) => ({
              id: p.id,
              name: p.name,
              isHost: !!p.isHost,
              score: p.score || 0,
              role: p.role || 'Villager',
            })) as ModernPlayerState[];
          }
          return prev;
        });
      }
      const ready = data.readyPlayerIds.includes(currentPlayerId);
      setIsReady(ready);
      setAllReady(data.readyCount >= 6);
    });

    socket.on('modern:gameStateUpdate', (data: {
      phase: string;
      timerSeconds: number;
      maxTimerSeconds: number;
      players: ModernPlayerState[];
    }) => {
      setCurrentPhase(data.phase);
      setTimerSeconds(data.timerSeconds);
      setMaxTimerSeconds(data.maxTimerSeconds);
      setPlayers(data.players);

      const updatedMe = data.players.find((p) => p.id === currentPlayerId);
      if (updatedMe) {
        setHasSubmittedAction(!!updatedMe.hasSubmittedAction);
      }
    });

    socket.on('modern:yourRole', (data: { role: ModernRole }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === currentPlayerId ? { ...p, role: data.role } : p))
      );
    });

    socket.on('modern:youAreProtected', (data: { message: string }) => {
      toast.info(data.message || '🛡️ You are protected by the Mantri Royal Shield!', {
        autoClose: 5000,
      });
      setPlayers((prev) =>
        prev.map((p) => (p.id === currentPlayerId ? { ...p, isShielded: true } : p))
      );
    });

    socket.on('modern:phaseTransition', (data: { title: string; subtitle: string; icon: string }) => {
      setTransitionData(data);
      setShowTransition(true);
      setTimeout(() => {
        setShowTransition(false);
      }, 3000);
    });

    socket.on('modern:roundResult', (data: ModernRoundResultData) => {
      setResultData(data);
      setCurrentPhase('result-phase');
    });

    return () => {
      socket.off('modern:rulesState');
      socket.off('modern:gameStateUpdate');
      socket.off('modern:yourRole');
      socket.off('modern:youAreProtected');
      socket.off('modern:phaseTransition');
      socket.off('modern:roundResult');
    };
  }, [socket, currentPlayerId]);

  // Determine which player IDs are selectable based on current role & phase
  const getSelectablePlayerIds = (): string[] => {
    if (hasSubmittedAction || !myRole) return [];

    if (currentPhase === 'mantri-shield' && myRole === 'Mantri') {
      return players
        .filter((p) => p.id !== currentPlayerId)
        .map((p) => p.id);
    }

    if (currentPhase === 'royal-phase') {
      if (myRole === 'Raja' || myRole === 'Rani') {
        return players.filter((p) => p.id !== currentPlayerId).map((p) => p.id);
      }
    }

    if (currentPhase === 'investigation-phase' && myRole === 'Police') {
      return players.filter((p) => p.id !== currentPlayerId).map((p) => p.id);
    }

    return [];
  };

  const selectableIds = getSelectablePlayerIds();
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  // Ready Toggle handler
  const handleToggleReady = (ready: boolean) => {
    setIsReady(ready);
    modernSocketHandler.toggleRuleReady(socket, roomCode, currentPlayerId, ready);
  };

  // Start Game handler
  const handleStartGame = () => {
    modernSocketHandler.startGame(socket, roomCode, currentPlayerId);
  };

  // Mantri Shield choice handler
  const handleMantriShieldChoice = (targetId: string | null) => {
    modernSocketHandler.submitMantriShield(socket, roomCode, currentPlayerId, targetId);
    setHasSubmittedAction(true);
    if (targetId) {
      const targetP = players.find((p) => p.id === targetId);
      toast.success(`Royal Shield Activated for ${targetP?.name || 'Selected Player'}!`);
    } else {
      toast.info('Skipped Royal Shield protection for this round.');
    }
  };

  // Raja / Rani / Police action handler
  const handleConfirmAction = (targetId?: string) => {
    const target = targetId || selectedPlayerId;
    if (!target) return;

    if (currentPhase === 'royal-phase') {
      if (myRole === 'Raja') {
        modernSocketHandler.submitRajaGuess(socket, roomCode, currentPlayerId, target);
      } else if (myRole === 'Rani') {
        modernSocketHandler.submitRaniGuess(socket, roomCode, currentPlayerId, target);
      }
    } else if (currentPhase === 'investigation-phase' && myRole === 'Police') {
      modernSocketHandler.submitPoliceGuess(socket, roomCode, currentPlayerId, target);
    }

    setHasSubmittedAction(true);
    toast.success('Choice submitted and locked!');
  };

  // Villager Witness Statement choice handler
  const handleVillagerWitnessChoice = (choice: 'agree' | 'disagree') => {
    modernSocketHandler.submitVillagerWitness(socket, roomCode, currentPlayerId, choice);
    setHasSubmittedAction(true);
    toast.success(`Witness statement (${choice.toUpperCase()}) submitted!`);
  };

  // Render Result Screen or Leaderboard
  if (currentPhase === 'result-phase' && resultData) {
    if (showLeaderboard) {
      return (
        <ModernLeaderboard
          resultData={resultData}
          onReturnHome={onReturnHome}
        />
      );
    }
    return (
      <ModernRoundResult
        resultData={resultData}
        isHost={isHost}
        onNextRound={() => modernSocketHandler.nextRound(socket, roomCode, currentPlayerId)}
        onViewLeaderboard={() => setShowLeaderboard(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#11052C] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3A1054] via-[#11052C] to-[#0A0217] text-white font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Top Header */}
      <ModernHeader
        roomCode={roomCode}
        currentPhase={currentPhase}
        timerSeconds={timerSeconds}
        maxTimerSeconds={maxTimerSeconds}
        playerCount={players.length}
      />

      {/* Main Kingdom Area */}
      <main className="flex-1 flex flex-col items-center justify-start px-2 sm:px-4 pt-1 pb-4">
        {/* Interactive Action Bar positioned at Top above cards */}
        <ModernActionBar
          myRole={myRole}
          currentPhase={currentPhase}
          selectedPlayerId={selectedPlayerId}
          selectedPlayerName={selectedPlayer ? selectedPlayer.name : null}
          hasSubmittedAction={hasSubmittedAction}
          mantriDecision={mantriDecision}
          onMantriDecisionChange={(decision) => setMantriDecision(decision)}
          onConfirmAction={handleConfirmAction}
          onVillagerWitnessChoice={handleVillagerWitnessChoice}
          onMantriShieldChoice={handleMantriShieldChoice}
        />

        {/* Kingdom Round Table & Cards */}
        <ModernKingdomTable
          players={players}
          currentPlayerId={currentPlayerId}
          myRole={myRole}
          currentPhase={currentPhase}
          selectablePlayerIds={selectableIds}
          selectedPlayerId={selectedPlayerId}
          mantriShowProtectButtons={mantriDecision === 'yes'}
          onSelectPlayer={(id) => setSelectedPlayerId(id)}
          onMantriProtectPlayer={(targetId) => handleMantriShieldChoice(targetId)}
        />
      </main>

      {/* Rules Modal (Pre-Game Instructions) */}
      {currentPhase === 'rules' && (
        <ModernRulesModal
          isHost={isHost}
          readyCount={readyCount}
          totalPlayers={6}
          isReady={isReady}
          allReady={allReady}
          onToggleReady={handleToggleReady}
          onStartGame={handleStartGame}
        />
      )}

      {/* Phase Transition Modal */}
      <ModernPhaseTransition
        isVisible={showTransition}
        title={transitionData.title}
        subtitle={transitionData.subtitle}
        icon={transitionData.icon}
      />
    </div>
  );
};
