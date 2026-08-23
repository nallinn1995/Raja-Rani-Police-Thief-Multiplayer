import React, { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, SlidersHorizontal, Headphones, Bluetooth, Speaker, Check, Radio } from "lucide-react";
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

type AudioOutputMode = "speaker" | "headset" | "bluetooth";

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
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [audioError, setAudioError] = useState("");

  // Teams-style Audio Output mode: Speaker | Headset | Bluetooth
  const [outputMode, setOutputMode] = useState<AudioOutputMode>("speaker");
  const [isOutputMenuOpen, setIsOutputMenuOpen] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const isSpeakerMutedRef = useRef(false);
  const isMutedRef = useRef(true);

  // Enumerate audio output devices
  useEffect(() => {
    const updateAudioDevices = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter((d) => d.kind === "audiooutput");
        setAvailableDevices(outputs);
      } catch (err) {
        console.warn("[VoiceChat] Failed to enumerate audio devices:", err);
      }
    };

    updateAudioDevices();
    if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === "function") {
      navigator.mediaDevices.addEventListener("devicechange", updateAudioDevices);
    }
    return () => {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.removeEventListener === "function") {
        navigator.mediaDevices.removeEventListener("devicechange", updateAudioDevices);
      }
    };
  }, []);

  // Apply selected audio output device to all peer audio elements and background music
  const changeOutputMode = async (mode: AudioOutputMode) => {
    setOutputMode(mode);
    setIsOutputMenuOpen(false);

    // Find best matching hardware deviceId if available
    let targetDeviceId = "";
    if (mode === "bluetooth") {
      const match = availableDevices.find((d) =>
        /bluetooth|airpods|buds|wireless|hands-free|bth/i.test(d.label)
      );
      if (match) targetDeviceId = match.deviceId;
    } else if (mode === "headset") {
      const match = availableDevices.find(
        (d) =>
          /headset|headphones|earphone|usb/i.test(d.label) &&
          !/bluetooth|airpods|buds/i.test(d.label)
      );
      if (match) targetDeviceId = match.deviceId;
    } else {
      const match = availableDevices.find((d) =>
        /speaker|default|internal|built-in/i.test(d.label)
      );
      if (match) targetDeviceId = match.deviceId || "default";
      else targetDeviceId = "default";
    }

    // Call setSinkId on all remote player audio elements
    audioElementsRef.current.forEach(async (audio) => {
      if (audio && typeof (audio as any).setSinkId === "function" && targetDeviceId) {
        try {
          await (audio as any).setSinkId(targetDeviceId);
        } catch (e) {
          console.warn("[VoiceChat] setSinkId error for peer audio:", e);
        }
      }
    });

    // Also route background music audio element
    const bgmAudio = document.querySelector("audio") as HTMLAudioElement | null;
    if (bgmAudio && typeof (bgmAudio as any).setSinkId === "function" && targetDeviceId) {
      try {
        await (bgmAudio as any).setSinkId(targetDeviceId);
      } catch (e) {
        console.warn("[VoiceChat] setSinkId error for bgm audio:", e);
      }
    }
  };

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

  // Acquire local microphone stream on demand (when player explicitly un-mutes)
  const requestMicrophoneStream = async (): Promise<MediaStream | null> => {
    if (localStreamRef.current) return localStreamRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

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

      return stream;
    } catch (err: any) {
      console.error("[VoiceChat] Failed to get user media:", err);
      setAudioError(err?.message?.includes("Permission") ? "Mic access blocked" : "Mic not found");
      return null;
    }
  };

  // Connect to peers in room (allows receiving speaker audio even before local mic is enabled)
  useEffect(() => {
    if (!socket || !room || !currentPlayerId) return;

    room.players.forEach((p: Player) => {
      if (p.id !== currentPlayerId && !peersRef.current.has(p.id)) {
        const shouldInitiate = currentPlayerId < p.id;
        if (shouldInitiate) {
          createPeerConnection(p.id, true);
        }
      }
    });
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
    let animTimer: any = null;
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

          animTimer = setTimeout(checkSpeaking, 100);
        };

        checkSpeaking();
      }
    } catch (e) {
      console.error("[VoiceChat] Audio analyser error:", e);
    }

    return () => {
      if (animTimer) clearTimeout(animTimer);
      if (silenceTimeout) clearTimeout(silenceTimeout);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    };
  }, [localStreamRef.current, socket, room?.id, currentPlayerId]);

  const toggleMute = async () => {
    const newMutedState = !isMuted;

    // If player is un-muting and microphone stream is not yet acquired, request it on this click
    if (!newMutedState && !localStreamRef.current) {
      const stream = await requestMicrophoneStream();
      if (!stream) {
        // If permission was denied by the user, keep muted
        return;
      }
    }

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

  const OUTPUT_OPTIONS = [
    {
      id: "speaker" as const,
      label: "Speaker",
      sublabel: "Built-in / Device Speaker",
      icon: Speaker,
      gradient: "from-amber-400 to-amber-600",
      activeBorder: "border-amber-400 bg-amber-950/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]",
      badgeColor: "bg-amber-400 text-amber-950",
    },
    {
      id: "headset" as const,
      label: "Headset",
      sublabel: "Wired / USB Headphones",
      icon: Headphones,
      gradient: "from-cyan-400 to-blue-600",
      activeBorder: "border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]",
      badgeColor: "bg-cyan-400 text-cyan-950",
    },
    {
      id: "bluetooth" as const,
      label: "Bluetooth",
      sublabel: "AirPods / Wireless Earbuds",
      icon: Bluetooth,
      gradient: "from-purple-400 to-fuchsia-600",
      activeBorder: "border-purple-400 bg-purple-950/40 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.4)]",
      badgeColor: "bg-purple-400 text-purple-950",
    },
  ];

  // Show voice controls (Mic, Speaker, Output Routing) only when all players are joined / in active room
  const hasRoomVoice = Boolean(
    room &&
    socket &&
    currentPlayerId &&
    room.players &&
    (room.gameState !== "waiting" || room.players.length >= 4)
  );

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

          {/* Music Toggle Button (Always available) */}
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

          {/* Room Voice Chat & Output Controls - Shown only when all players are joined in the room */}
          {hasRoomVoice && (
            <>
              {/* Audio Output Mode Button (Speaker | Headset | Bluetooth) */}
              <div className="relative">
                <button
                  onClick={() => setIsOutputMenuOpen((prev) => !prev)}
                  className={`p-3 rounded-full shadow-lg transition-all transform hover:scale-110 active:scale-95 border-2 flex items-center justify-center ${
                    outputMode === "bluetooth"
                      ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                      : outputMode === "headset"
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                      : "bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                  }`}
                  title={`Audio Output: ${outputMode.toUpperCase()} (Click to select Speaker, Headset, or Bluetooth)`}
                >
                  {outputMode === "bluetooth" && <Bluetooth className="w-5 h-5 animate-pulse" />}
                  {outputMode === "headset" && <Headphones className="w-5 h-5" />}
                  {outputMode === "speaker" && <Speaker className="w-5 h-5" />}
                </button>

                {/* Output Routing Popover Menu */}
                {isOutputMenuOpen && (
                  <div className="absolute bottom-16 right-0 w-72 bg-[#17062D]/98 backdrop-blur-2xl border-2 border-[#7C3AED]/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-3 text-white z-[80] animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-800/60">
                      <div className="flex items-center gap-1.5 text-xs font-bold font-serif uppercase tracking-wider text-[#FBE278]">
                        <Radio className="w-4 h-4 text-[#FBE278] animate-pulse" />
                        <span>AUDIO OUTPUT</span>
                      </div>
                      <span className="text-[10px] text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded-full font-mono font-semibold">
                        {outputMode.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {OUTPUT_OPTIONS.map((opt) => {
                        const isSelected = outputMode === opt.id;
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => changeOutputMode(opt.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                              isSelected
                                ? `${opt.activeBorder} shadow-md`
                                : "bg-[#250A47]/60 border-purple-900/40 text-gray-300 hover:bg-[#320D5E]/80 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${opt.gradient} text-white shadow-sm`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold flex items-center gap-1.5">
                                  <span>{opt.label}</span>
                                  {isSelected && (
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${opt.badgeColor}`}>
                                      Active
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 truncate">{opt.sublabel}</div>
                              </div>
                            </div>

                            {isSelected && <Check className="w-4 h-4 text-[#FBE278] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

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

              {/* Speaker Mute Button */}
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
