// src/components/GameBGM.tsx
import React, { useEffect, useState } from "react";
import * as Tone from "tone";

const GameBGM: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleMusic = async () => {
    if (!isPlaying) {
      await Tone.start();

      // LOW PULSING BASS (tension)
      const bass = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 2,
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 1 },
      }).toDestination();

      const bassLoop = new Tone.Loop((time) => {
        bass.triggerAttackRelease("C2", "1n", time);
      }, "1n").start(0);

      // METALLIC HI-HAT / CLANKS for suspense
      const metallic = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.15, release: 0.01 },
        harmonicity: 6,
        modulationIndex: 20,
        resonance: 3000,
        octaves: 1.5,
      }).toDestination();

      const metallicLoop = new Tone.Loop((time) => {
        if (Math.random() > 0.6) {
          metallic.triggerAttackRelease("32n", time);
        }
      }, "4n").start(0);

      // DISSONANT MELODY (minor 2nds, minor 7ths)
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.2, release: 1 },
      }).toDestination();

      const melodyChords: string[][] = [
        ["C4", "Db4", "G4"], // dissonant minor 2nd
        ["Eb4", "G4", "Bb4"], // minor chord
        ["F4", "Gb4", "Bb4"], // suspenseful
        ["G4", "Bb4", "Db5"], // unsettling
      ];

      let step = 0;
      const melodyLoop = new Tone.Loop((time) => {
        synth.triggerAttackRelease(melodyChords[step % melodyChords.length], "2n", time);
        step++;
      }, "2n").start(0);

      // Slight random stabs / tension notes
      const stabSynth = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
      }).toDestination();

      const stabLoop = new Tone.Loop((time) => {
        if (Math.random() > 0.7) {
          const notes = ["C5", "D5", "Eb5", "F5", "G5"];
          stabSynth.triggerAttackRelease(notes[Math.floor(Math.random() * notes.length)], "32n", time);
        }
      }, "8n").start(0);

      // Transport setup
      Tone.Transport.bpm.value = 60; // slow suspense pace
      Tone.Transport.start();

      setIsPlaying(true);

      return () => {
        bass.dispose();
        metallic.dispose();
        synth.dispose();
        stabSynth.dispose();
        bassLoop.dispose();
        metallicLoop.dispose();
        melodyLoop.dispose();
        stabLoop.dispose();
      };
    } else {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
      }}
    >
      <button
        onClick={toggleMusic}
        style={{
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          background: isPlaying ? "#e74c3c" : "#2C3E50", // red for suspense
          color: "white",
          border: "none",
          fontSize: "30px",
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
          transition: "transform 0.2s ease, background 0.3s ease",
          animation: isPlaying ? "pulse 1.5s infinite" : "none",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")
        }
      >
        {isPlaying ? "🔊" : "🔇"}
      </button>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 10px #e74c3c; }
            50% { transform: scale(1.1); box-shadow: 0 0 20px #c0392b; }
            100% { transform: scale(1); box-shadow: 0 0 10px #e74c3c; }
          }
        `}
      </style>
    </div>
  );
};

export default GameBGM;
