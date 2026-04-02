import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Socket } from "socket.io-client";
import { Room } from "../types/game";

interface VoiceChatManagerProps {
  socket: Socket;
  room: Room;
  currentPlayerId: string;
}

export const VoiceChatManager: React.FC<VoiceChatManagerProps> = ({
  socket,
  room,
  currentPlayerId,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState("");

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioContextRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Ice servers configuration
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const connectToPeer = (partnerId: string, initiator: boolean) => {
    if (peersRef.current.has(partnerId)) return; // Already connected or connecting

    const pc = new RTCPeerConnection(rtcConfig);
    peersRef.current.set(partnerId, pc);

    // Add local stream tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote track
    pc.ontrack = (event) => {
      let audioElement = audioContextRef.current.get(partnerId);
      if (!audioElement) {
        audioElement = new Audio();
        audioElement.autoplay = true;
        audioContextRef.current.set(partnerId, audioElement);
      }
      audioElement.srcObject = event.streams[0];
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("voice-candidate", {
          roomCode: room.id,
          senderId: currentPlayerId,
          targetId: partnerId,
          candidate: event.candidate,
        });
      }
    };

    // Renegotiation needed (e.g. adding tracks dynamically)
    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("voice-offer", {
          roomCode: room.id,
          senderId: currentPlayerId,
          targetId: partnerId,
          sdp: pc.localDescription,
        });
      } catch (e) {
        console.error("Renegotiation error:", e);
      }
    };

    // If initiator, create offer
    if (initiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socket.emit("voice-offer", {
            roomCode: room.id,
            senderId: currentPlayerId,
            targetId: partnerId,
            sdp: pc.localDescription,
          });
        })
        .catch((e) => console.error("Offer error:", e));
    }
  };

  useEffect(() => {
    // 1. Get local audio
    let initialized = false;
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        localStreamRef.current = stream;

        // Connect to existing players in room using higher ID rule to avoid glare
        room.players.forEach((p) => {
          if (p.id !== currentPlayerId) {
            if (currentPlayerId > p.id) {
              connectToPeer(p.id, true);
            }
          }
        });

        // Add tracks to any peers that were created before audio was ready
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
      // Cleanup happens only when leaving room (unmounting)
      // Do not clean up during re-renders.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      audioContextRef.current.forEach((audio) => {
        audio.srcObject = null;
        audio.remove();
      });
      audioContextRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle new players joining mid-session
  // Since we run initAudio once, it connects to existing players.
  // When a new player joins, `room.players` updates.
  useEffect(() => {
    if (!localStreamRef.current) return;

    room.players.forEach((p) => {
      if (p.id !== currentPlayerId && !peersRef.current.has(p.id)) {
        if (currentPlayerId > p.id) {
          connectToPeer(p.id, true);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.players, currentPlayerId]);

  // Listen for socket signaling
  useEffect(() => {
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
        // Only create answer if it's an offer
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
      if (pc) {
        try {
          // Some old browsers crash if local/remote description is not set yet
          if (pc.remoteDescription) {
             await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
             // Quick hack: queue it, but usually standard delays make this safe
             setTimeout(() => pc.addIceCandidate(new RTCIceCandidate(candidate)), 1000);
          }
        } catch (e) {
          console.error("Add ICE candidate error:", e);
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
  }, [socket, room.id, currentPlayerId]);

  // Handle mute toggle
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  return (
    <div className="fixed top-6 right-6 z-[60] flex items-center gap-2">
      {audioError && (
        <span className="text-red-500 text-sm bg-red-100 px-2 py-1 rounded-md shadow">
          {audioError}
        </span>
      )}
      <button
        onClick={toggleMute}
        className={`p-3 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 border-2 border-white ${
          isMuted
            ? "bg-red-500 hover:bg-red-600 shadow-[0_5px_15px_rgba(239,68,68,0.5)] text-white"
            : "bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 shadow-[0_5px_15px_rgba(34,197,94,0.5)] text-white"
        }`}
        title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
      >
        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6 animate-pulse" />}
      </button>
    </div>
  );
};
