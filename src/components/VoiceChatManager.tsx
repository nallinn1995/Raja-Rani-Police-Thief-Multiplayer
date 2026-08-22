import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX, SlidersHorizontal } from "lucide-react";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/solid";
import { Socket } from "socket.io-client";
import { Room } from "../types/game";

interface VoiceChatManagerProps {
  socket?: Socket | null;
  room?: Room | null;
  currentPlayerId?: string;
  isMusicPlaying: boolean;
  toggleMusic: () => void;
}

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

  // Open audio controls toggle automatically upon entering a room
  useEffect(() => {
    if (room?.id) {
      setIsOpen(true);
    }
  }, [room?.id]);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioContextRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const isSpeakerMutedRef = useRef(false);

  // Ice servers configuration
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Unlock audio playback on user click (bypasses Chrome Autoplay restriction)
  useEffect(() => {
    const unlockAudio = () => {
      audioContextRef.current.forEach((audioElement) => {
        if (audioElement && audioElement.paused) {
          audioElement.play().catch((e) => console.log("Audio unlock play handled", e));
        }
      });
    };
    window.addEventListener("click", unlockAudio);
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  const connectToPeer = (partnerId: string, initiator: boolean) => {
    if (!socket || !room || !currentPlayerId) return;
    if (peersRef.current.has(partnerId)) return;

    const pc = new RTCPeerConnection(rtcConfig);
    peersRef.current.set(partnerId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.ontrack = (event) => {
      let audioElement = audioContextRef.current.get(partnerId);
      if (!audioElement) {
        audioElement = new Audio();
        audioElement.autoplay = true;
        audioElement.muted = isSpeakerMutedRef.current;
        document.body.appendChild(audioElement);
        audioContextRef.current.set(partnerId, audioElement);
      }
      
      if (audioElement.srcObject !== event.streams[0]) {
        audioElement.srcObject = event.streams[0];
      }

      audioElement.play().catch((e) => console.error("Audio playback error:", e));
    };

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

    pc.onnegotiationneeded = async () => {
      try {
        if (!socket || !room || !currentPlayerId || (pc.signalingState as string) === "closed") return;
        if (pc.signalingState !== "stable") return;
        const offer = await pc.createOffer();
        if ((pc.signalingState as string) === "closed") return;
        await pc.setLocalDescription(offer);
        socket.emit("voice-offer", {
          roomCode: room.id,
          senderId: currentPlayerId,
          targetId: partnerId,
          sdp: pc.localDescription,
        });
      } catch (e) {
        // Quietly handle renegotiation race conditions
      }
    };

    if (initiator) {
      if (pc.signalingState !== "closed") {
        pc.createOffer()
          .then((offer) => {
            if (pc.signalingState !== "closed") {
              return pc.setLocalDescription(offer);
            }
          })
          .then(() => {
            if (socket && room && currentPlayerId && pc.signalingState !== "closed") {
              socket.emit("voice-offer", {
                roomCode: room.id,
                senderId: currentPlayerId,
                targetId: partnerId,
                sdp: pc.localDescription,
              });
            }
          })
          .catch(() => {});
      }
    }
  };

  useEffect(() => {
    if (!socket || !room || !currentPlayerId) return;

    let initialized = false;
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        localStreamRef.current = stream;

        room.players.forEach((p) => {
          if (p.id !== currentPlayerId) {
            if (currentPlayerId > p.id) {
              connectToPeer(p.id, true);
            }
          }
        });

        peersRef.current.forEach((pc) => {
          const senders = pc.getSenders();
          const hasAudio = senders.some(
            (s) => s.track && s.track.kind === "audio"
          );
          if (!hasAudio) {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          }
        });
        initialized = true;
      } catch (err) {
        setAudioError("Mic access denied");
        console.error("Failed to get local audio", err);
      }
    };

    if (!localStreamRef.current && !initialized) {
      initAudio();
    }

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      audioContextRef.current.forEach((audio) => {
        audio.srcObject = null;
        audio.remove();
      });
      audioContextRef.current.clear();
    };
  }, [socket, room, currentPlayerId]);

  useEffect(() => {
    if (!localStreamRef.current || !room || !currentPlayerId) return;

    room.players.forEach((p) => {
      if (p.id !== currentPlayerId && !peersRef.current.has(p.id)) {
        if (currentPlayerId > p.id) {
          connectToPeer(p.id, true);
        }
      }
    });
  }, [room?.players, currentPlayerId]);

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
      if (!pc) {
        connectToPeer(senderId, false);
        pc = peersRef.current.get(senderId);
      }
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
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
      } catch (e) {
        console.error("Answer error:", e);
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
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        } catch (e) {
          console.error("Set remote desc error:", e);
        }
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
      if (pc && (pc.signalingState as string) !== "closed") {
        try {
          if (pc.remoteDescription && (pc.signalingState as string) !== "closed") {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (e) {
          // Ignore candidate errors on closed connections
        }
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
  }, [socket, room?.id, currentPlayerId]);

  // Real-time mic volume level analyzer for speaking dot animations
  useEffect(() => {
    if (!localStreamRef.current || !socket || !room?.id || !currentPlayerId) return;

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animId: number;
    let wasSpeaking = false;
    let silenceTimeout: NodeJS.Timeout | null = null;

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;

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

        const isSpeakingNow = avg > 8 && !isMuted;

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
            }, 600);
          }
        }

        animId = requestAnimationFrame(checkSpeaking);
      };

      checkSpeaking();
    } catch (e) {
      console.error("Audio analyser error:", e);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (silenceTimeout) clearTimeout(silenceTimeout);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close();
      }
    };
  }, [localStreamRef.current, isMuted, socket, room?.id, currentPlayerId]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const newMutedState = !isMuted;
        audioTrack.enabled = !newMutedState;
        setIsMuted(newMutedState);
      }
    }
  };

  const toggleSpeaker = () => {
    const newState = !isSpeakerMuted;
    setIsSpeakerMuted(newState);
    isSpeakerMutedRef.current = newState;
    audioContextRef.current.forEach((audio) => {
      audio.muted = newState;
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
