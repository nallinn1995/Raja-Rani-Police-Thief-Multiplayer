import React, { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, SlidersHorizontal } from "lucide-react";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/solid";
import { Socket } from "socket.io-client";
import { Room, Player } from "../types/game";

interface VoiceChatManagerProps {
  socket?: Socket | null;
  room?: Room | null;
  currentPlayerId?: string;
  isMusicPlaying: boolean;
  toggleMusic: () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

export const VoiceChatManager: React.FC<VoiceChatManagerProps> = ({
  socket,
  room,
  currentPlayerId,
  isMusicPlaying,
  toggleMusic,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [audioError, setAudioError] = useState("");

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const isSpeakerMutedRef = useRef(false);
  const isMutedRef = useRef(false);

  // Auto-open audio controls popover upon entering a room
  useEffect(() => {
    if (room?.id) {
      setIsOpen(true);
    }
  }, [room?.id]);

  // Synchronize ref with state
  useEffect(() => {
    isSpeakerMutedRef.current = isSpeakerMuted;
    audioElementsRef.current.forEach((audio) => {
      audio.muted = isSpeakerMuted;
    });
  }, [isSpeakerMuted]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Unlock browser audio playback policy on user click or touch
  useEffect(() => {
    const unlockAudio = () => {
      audioElementsRef.current.forEach((audioElement) => {
        if (audioElement && audioElement.paused) {
          audioElement.play().catch(() => {});
        }
      });
    };
    window.addEventListener("click", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // Helper to flush queued ICE candidates once remote description is set
  const flushPendingCandidates = async (partnerId: string, pc: RTCPeerConnection) => {
    const candidates = pendingCandidatesRef.current.get(partnerId) || [];
    if (candidates.length === 0) return;

    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn(`[VoiceChat] Error adding queued ICE candidate for ${partnerId}:`, err);
      }
    }
    pendingCandidatesRef.current.set(partnerId, []);
  };

  // Create and initialize a peer connection for a partner
  const createPeerConnection = useCallback(
    (partnerId: string, isInitiator: boolean) => {
      if (!socket || !room || !currentPlayerId) return null;

      // Close and remove previous connection if exists
      const existingPc = peersRef.current.get(partnerId);
      if (existingPc) {
        try {
          existingPc.close();
        } catch {
          // Ignore
        }
        peersRef.current.delete(partnerId);
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peersRef.current.set(partnerId, pc);

      // Attach existing local audio tracks
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle receiving remote audio track
      pc.ontrack = (event) => {
        let audioElement = audioElementsRef.current.get(partnerId);
        if (!audioElement) {
          audioElement = new Audio();
          audioElement.autoplay = true;
          (audioElement as any).playsInline = true;
          audioElement.muted = isSpeakerMutedRef.current;
          document.body.appendChild(audioElement);
          audioElementsRef.current.set(partnerId, audioElement);
        }

        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        if (audioElement.srcObject !== remoteStream) {
          audioElement.srcObject = remoteStream;
        }

        audioElement.play().catch((e) => {
          console.log("[VoiceChat] Remote audio autoplay pending user gesture:", e);
        });
      };

      // Handle ICE Candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && room && currentPlayerId) {
          socket.emit("voice-candidate", {
            roomCode: room.id,
            senderId: currentPlayerId,
            targetId: partnerId,
            candidate: event.candidate,
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          console.log(`[VoiceChat] Connection to ${partnerId} is ${pc.connectionState}`);
        }
      };

      // If this client is the initiator, create and send the offer
      if (isInitiator) {
        pc.createOffer({ offerToReceiveAudio: true })
          .then(async (offer) => {
            if (pc.signalingState === "closed") return;
            await pc.setLocalDescription(offer);
            if (socket && room && currentPlayerId) {
              socket.emit("voice-offer", {
                roomCode: room.id,
                senderId: currentPlayerId,
                targetId: partnerId,
                sdp: pc.localDescription,
              });
            }
          })
          .catch((err) => {
            console.error("[VoiceChat] Error creating offer:", err);
          });
      }

      return pc;
    },
    [socket, room, currentPlayerId]
  );

  // Acquire local microphone stream
  useEffect(() => {
    if (!socket || !room || !currentPlayerId) return;

    let isCancelled = false;

    const initMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setAudioError("");

        // Ensure track enabled state matches current isMuted state
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMutedRef.current;
        });

        // Add track to all existing peer connections
        peersRef.current.forEach((pc) => {
          if (pc.signalingState !== "closed") {
            const senders = pc.getSenders();
            const hasAudio = senders.some((s) => s.track && s.track.kind === "audio");
            if (!hasAudio) {
              stream.getAudioTracks().forEach((track) => {
                pc.addTrack(track, stream);
              });
            }
          }
        });

        // Deterministically initiate connection to other players in room (smaller playerId initiates)
        room.players.forEach((p: Player) => {
          if (p.id !== currentPlayerId && !peersRef.current.has(p.id)) {
            const shouldInitiate = currentPlayerId < p.id;
            if (shouldInitiate) {
              createPeerConnection(p.id, true);
            }
          }
        });
      } catch (err: any) {
        console.error("[VoiceChat] Failed to get user media:", err);
        setAudioError(err?.message?.includes("Permission") ? "Mic access blocked" : "Mic not found");
      }
    };

    if (!localStreamRef.current) {
      initMicrophone();
    } else {
      // Connect to any new players
      room.players.forEach((p: Player) => {
        if (p.id !== currentPlayerId && !peersRef.current.has(p.id)) {
          const shouldInitiate = currentPlayerId < p.id;
          if (shouldInitiate) {
            createPeerConnection(p.id, true);
          }
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [socket, room?.players, currentPlayerId, createPeerConnection]);

  // Clean up departed players
  useEffect(() => {
    if (!room?.players) return;
    const currentActiveIds = new Set(room.players.map((p) => p.id));

    peersRef.current.forEach((pc, partnerId) => {
      if (!currentActiveIds.has(partnerId)) {
        try {
          pc.close();
        } catch {
          // Ignore
        }
        peersRef.current.delete(partnerId);
        pendingCandidatesRef.current.delete(partnerId);

        const audio = audioElementsRef.current.get(partnerId);
        if (audio) {
          audio.srcObject = null;
          audio.remove();
          audioElementsRef.current.delete(partnerId);
        }
      }
    });
  }, [room?.players]);

  // Clean up all voice chat resources on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;

      peersRef.current.forEach((pc) => {
        try {
          pc.close();
        } catch {
          // Ignore
        }
      });
      peersRef.current.clear();
      pendingCandidatesRef.current.clear();

      audioElementsRef.current.forEach((audio) => {
        audio.srcObject = null;
        audio.remove();
      });
      audioElementsRef.current.clear();
    };
  }, []);

  // WebRTC Socket Listeners
  useEffect(() => {
    if (!socket || !room || !currentPlayerId) return;

    const onVoiceOffer = async ({
      senderId,
      sdp,
    }: {
      senderId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      let pc = peersRef.current.get(senderId);
      if (!pc || pc.signalingState === "closed") {
        pc = createPeerConnection(senderId, false)!;
      }
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingCandidates(senderId, pc);

        if (sdp.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("voice-answer", {
            roomCode: room.id,
            senderId: currentPlayerId,
            targetId: senderId,
            sdp: pc.localDescription,
          });
        }
      } catch (err) {
        console.error("[VoiceChat] Error handling voice offer:", err);
      }
    };

    const onVoiceAnswer = async ({
      senderId,
      sdp,
    }: {
      senderId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      const pc = peersRef.current.get(senderId);
      if (!pc || pc.signalingState === "closed") return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingCandidates(senderId, pc);
      } catch (err) {
        console.error("[VoiceChat] Error handling voice answer:", err);
      }
    };

    const onVoiceCandidate = async ({
      senderId,
      candidate,
    }: {
      senderId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peersRef.current.get(senderId);

      // If PC exists and remote description is set, add candidate directly
      if (pc && pc.remoteDescription && pc.signalingState !== "closed") {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("[VoiceChat] Error adding ICE candidate:", err);
        }
      } else {
        // Queue candidate to apply once remote description arrives
        const queue = pendingCandidatesRef.current.get(senderId) || [];
        queue.push(candidate);
        pendingCandidatesRef.current.set(senderId, queue);
      }
    };

    socket.on("voice-offer", onVoiceOffer);
    socket.on("voice-answer", onVoiceAnswer);
    socket.on("voice-candidate", onVoiceCandidate);

    return () => {
      socket.off("voice-offer", onVoiceOffer);
      socket.off("voice-answer", onVoiceAnswer);
      socket.off("voice-candidate", onVoiceCandidate);
    };
  }, [socket, room?.id, currentPlayerId, createPeerConnection]);

  // Real-time mic volume level analyzer for speaking indicator animations
  useEffect(() => {
    if (!localStreamRef.current || !socket || !room?.id || !currentPlayerId) return;

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animId: number;
    let wasSpeaking = false;
    let silenceTimeout: NodeJS.Timeout | null = null;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;

        source = audioCtx.createMediaStreamSource(localStreamRef.current);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkSpeaking = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          const isSpeakingNow = avg > 10 && !isMutedRef.current;

          if (isSpeakingNow) {
            if (silenceTimeout) {
              clearTimeout(silenceTimeout);
              silenceTimeout = null;
            }
            if (!wasSpeaking) {
              wasSpeaking = true;
              socket.emit("player-speaking", {
                roomCode: room.id,
                playerId: currentPlayerId,
                isSpeaking: true,
              });
            }
          } else {
            if (wasSpeaking && !silenceTimeout) {
              silenceTimeout = setTimeout(() => {
                wasSpeaking = false;
                socket.emit("player-speaking", {
                  roomCode: room.id,
                  playerId: currentPlayerId,
                  isSpeaking: false,
                });
                silenceTimeout = null;
              }, 500);
            }
          }

          animId = requestAnimationFrame(checkSpeaking);
        };

        checkSpeaking();
      }
    } catch (e) {
      console.error("[VoiceChat] Audio analyser error:", e);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (silenceTimeout) clearTimeout(silenceTimeout);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    };
  }, [localStreamRef.current, socket, room?.id, currentPlayerId]);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    isMutedRef.current = newMutedState;

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMutedState;
      });
    }

    if (socket && room && currentPlayerId && newMutedState) {
      socket.emit("player-speaking", {
        roomCode: room.id,
        playerId: currentPlayerId,
        isSpeaking: false,
      });
    }
  };

  const toggleSpeaker = () => {
    const newSpeakerState = !isSpeakerMuted;
    setIsSpeakerMuted(newSpeakerState);
    isSpeakerMutedRef.current = newSpeakerState;
    audioElementsRef.current.forEach((audio) => {
      audio.muted = newSpeakerState;
    });
  };

  const hasRoomVoice = Boolean(room && socket && currentPlayerId);

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex flex-col items-end">
      {/* Floating Audio Controls Popover Menu */}
      {isOpen && (
        <div className="mb-3 bg-[#1D0C3A]/95 backdrop-blur-xl border border-[#5A2C81] p-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center gap-3 transition-all duration-300">
          {audioError && (
            <span className="text-red-400 text-xs bg-red-950/80 px-2 py-1 rounded border border-red-800">
              {audioError}
            </span>
          )}

          {/* Music Toggle Button */}
          <button
            onClick={toggleMusic}
            className={`p-3 rounded-full shadow-lg transition-all transform hover:scale-110 active:scale-95 border-2 border-white/60 flex items-center justify-center ${
              isMusicPlaying
                ? "bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)]"
                : "bg-gray-800/90 text-gray-400 hover:text-white"
            }`}
            title={isMusicPlaying ? "Mute Music" : "Play Music"}
          >
            {isMusicPlaying ? (
              <Volume2 className="w-5 h-5 animate-pulse text-yellow-300" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>

          {/* Room Mic & Speaker Controls */}
          {hasRoomVoice && (
            <>
              {/* Mic Button */}
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full shadow-lg transition-all transform hover:scale-110 active:scale-95 border-2 border-white/60 flex items-center justify-center ${
                  isMuted
                    ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    : "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 animate-pulse" />}
              </button>

              {/* Speaker Button */}
              <button
                onClick={toggleSpeaker}
                className={`p-3 rounded-full shadow-lg transition-all transform hover:scale-110 active:scale-95 border-2 border-white/60 flex items-center justify-center ${
                  isSpeakerMuted
                    ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    : "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                }`}
                title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
              >
                {isSpeakerMuted ? <SpeakerXMarkIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>
      )}

      {/* Main Single Floating Toggle Action Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-3.5 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 border-2 border-white/80 flex items-center justify-center ${
          isOpen
            ? "bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 text-white ring-4 ring-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.8)]"
            : "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
        }`}
        title="Toggle Audio Controls"
        aria-label="Toggle audio controls"
      >
        <SlidersHorizontal className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};
