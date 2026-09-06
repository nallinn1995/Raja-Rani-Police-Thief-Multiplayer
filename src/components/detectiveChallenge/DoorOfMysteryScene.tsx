import React, { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
  Animation,
  QuadraticEase,
  EasingFunction,
  PointerEventTypes,
  ParticleSystem,
  Texture,
  Mesh,
} from "@babylonjs/core";
import { DetectiveDoorOutcome } from "../../types/detectiveChallenge";
import {
  playDoorTapSound,
  playDoorOpenSound,
  playSafeDoorSound,
  playBombExplosionSound,
  playThiefCaughtSound,
  playStampSlamSound,
} from "../../utils/mysteryAudio";

interface DoorMeshRef {
  frame: Mesh;
  panel: Mesh;
  doorId: number;
  doorMat: StandardMaterial;
  revealMat: StandardMaterial;
  revealTexture: DynamicTexture;
  isOpen: boolean;
  status: "LOCKED" | "SAFE" | "BOMB" | "THIEF" | "CLUE" | "LIFE";
  clueText?: string | null;
  hingeRoot: Mesh;
  openedAtTime: number;
  lastRenderTime: number;
  stampSoundPlayed: boolean;
}

interface DoorOfMysterySceneProps {
  revealedDoors: Map<number, DetectiveDoorOutcome>;
  selectedDoorId?: number | null;
  latestDoorResult: { doorId: number; result: DetectiveDoorOutcome; clue?: string | null } | null;
  activeClue?: string | null;
  onOpenDoor: (doorId: number) => void;
  canInteract: boolean;
  onFallback?: () => void;
  resetKey?: number;
  roomCode?: string;
}

export const DoorOfMysteryScene: React.FC<DoorOfMysterySceneProps> = ({
  revealedDoors,
  latestDoorResult,
  activeClue,
  onOpenDoor,
  canInteract,
  onFallback,
  resetKey,
  roomCode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const doorMeshesRef = useRef<Map<number, DoorMeshRef>>(new Map());
  const spotlightRef = useRef<PointLight | null>(null);
  const floorMeshRef = useRef<Mesh | null>(null);
  const currentLayoutRef = useRef<{ cols: number; rows: number }>({ cols: 4, rows: 3 });
  const thiefImgRef = useRef<HTMLImageElement | null>(null);

  // Keep refs for callbacks so events don't get stale closures
  const canInteractRef = useRef(canInteract);
  const onOpenDoorRef = useRef(onOpenDoor);
  const revealedDoorsRef = useRef(revealedDoors);
  const onFallbackRef = useRef(onFallback);
  const roomCodeRef = useRef(roomCode);

  useEffect(() => {
    canInteractRef.current = canInteract;
    onOpenDoorRef.current = onOpenDoor;
    revealedDoorsRef.current = revealedDoors;
    onFallbackRef.current = onFallback;
    roomCodeRef.current = roomCode;
  }, [canInteract, onOpenDoor, revealedDoors, onFallback, roomCode]);

  // Pre-load local Thief Character Image
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/images/thief.png";
    img.onload = () => {
      thiefImgRef.current = img;
      // If a thief door is already open, redraw immediately
      doorMeshesRef.current.forEach((door) => {
        if (door.isOpen && door.status === "THIEF") {
          drawDoorInterior(door, performance.now());
        }
      });
    };
    if (img.complete && img.naturalWidth > 0) {
      thiefImgRef.current = img;
    }
  }, []);

  // Helper 1: Generate rich procedural wooden texture for the door panel
  const createWoodDoorTexture = (scene: Scene, doorNum: number) => {
    const texture = new DynamicTexture(`doorWoodTex-${doorNum}`, { width: 512, height: 768 }, scene, false);
    const ctx = texture.getContext() as CanvasRenderingContext2D;

    // 1. Rich dark mahogany / polished oak background
    const woodGrad = ctx.createLinearGradient(0, 0, 512, 768);
    woodGrad.addColorStop(0, "#422110");
    woodGrad.addColorStop(0.25, "#2A1307");
    woodGrad.addColorStop(0.65, "#3D1D0D");
    woodGrad.addColorStop(1, "#210D04");
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, 0, 512, 768);

    // 2. Realistic vertical wood grain fibers
    ctx.save();
    for (let i = 0; i < 512; i += 3) {
      const alpha = 0.03 + Math.sin(i * 0.12) * 0.02 + Math.random() * 0.03;
      ctx.strokeStyle = i % 6 === 0 ? `rgba(18, 7, 2, ${alpha * 1.6})` : `rgba(195, 115, 60, ${alpha})`;
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.bezierCurveTo(
        i + Math.sin(i) * 5,
        250,
        i - Math.cos(i) * 5,
        500,
        i + Math.sin(i * 0.4) * 4,
        768
      );
      ctx.stroke();
    }
    ctx.restore();

    // 3. Three Vertical Planks with carved dark grooves and bevel highlights
    const plankWidth = 512 / 3;
    for (let p = 1; p < 3; p++) {
      const x = p * plankWidth;
      // Dark shadow groove
      ctx.strokeStyle = "#100502";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.lineTo(x, 752);
      ctx.stroke();

      // Right edge highlight
      ctx.strokeStyle = "rgba(217, 119, 6, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 3, 16);
      ctx.lineTo(x + 3, 752);
      ctx.stroke();
    }

    // 4. Outer Wood Frame with Bevel
    ctx.strokeStyle = "#170702";
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, 496, 752);

    ctx.strokeStyle = "#9A5023";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 472, 728);

    // Inset horizontal structural rails (top, center, bottom)
    const rails = [34, 350, 664];
    rails.forEach((ry) => {
      ctx.fillStyle = "rgba(35, 14, 5, 0.7)";
      ctx.fillRect(24, ry, 464, 46);
      ctx.strokeStyle = "rgba(217, 119, 6, 0.45)";
      ctx.lineWidth = 2;
      ctx.strokeRect(24, ry, 464, 46);

      // Antique brass studs on rails
      const studXs = [42, 470];
      studXs.forEach((sx) => {
        ctx.fillStyle = "#F59E0B";
        ctx.beginPath();
        ctx.arc(sx, ry + 23, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#78350F";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });

    // 5. Antique Brass Door Number Medallion (Upper center)
    const badgeGrad = ctx.createRadialGradient(256, 175, 8, 256, 175, 75);
    badgeGrad.addColorStop(0, "#FEF08A");
    badgeGrad.addColorStop(0.5, "#D97706");
    badgeGrad.addColorStop(1, "#78350F");
    ctx.fillStyle = badgeGrad;
    ctx.beginPath();
    ctx.arc(256, 175, 66, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#FFFBEB";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = "#92400E";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(256, 175, 56, 0, Math.PI * 2);
    ctx.stroke();

    // Door Number Text (01 to 12)
    ctx.fillStyle = "#1E0A02";
    ctx.font = "900 58px 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(doorNum < 10 ? `0${doorNum}` : `${doorNum}`, 256, 177);

    // 6. Brass Keyhole Escutcheon Plate (Center)
    const plateGrad = ctx.createLinearGradient(0, 440, 0, 560);
    plateGrad.addColorStop(0, "#FBBF24");
    plateGrad.addColorStop(1, "#92400E");
    ctx.fillStyle = plateGrad;
    ctx.beginPath();
    ctx.roundRect(206, 440, 100, 110, [16]);
    ctx.fill();
    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Keyhole
    ctx.fillStyle = "#110401";
    ctx.beginPath();
    ctx.arc(256, 475, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(250, 482);
    ctx.lineTo(262, 482);
    ctx.lineTo(259, 516);
    ctx.lineTo(253, 516);
    ctx.closePath();
    ctx.fill();

    // "INVESTIGATE" Ribbon Label below keyhole
    ctx.fillStyle = "#D97706";
    ctx.beginPath();
    ctx.roundRect(136, 585, 240, 38, [10]);
    ctx.fill();
    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#160601";
    ctx.font = "900 22px sans-serif";
    ctx.fillText("INVESTIGATE", 256, 604);

    texture.update();
    return texture;
  };

  // Utility: cross-browser rounded rectangle
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number | number[]
  ) => {
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      const radius = typeof r === "number" ? r : r[0] || 0;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    }
  };

  // 1. Locked Door Interior (Dark Chamber before opening)
  const drawLockedInterior = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#0A0314";
    ctx.fillRect(0, 0, 512, 768);
  };

  // 2. Safe Door Interior: Shield-Check Icon with Radiant Gleam & Pulse
  const drawSafeInterior = (ctx: CanvasRenderingContext2D, elapsed: number) => {
    const W = 512;
    const H = 768;
    const cx = 256;
    const cy = 310;

    // A. Chamber Background
    const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 400);
    bgGrad.addColorStop(0, "#064E3B");
    bgGrad.addColorStop(0.5, "#022C22");
    bgGrad.addColorStop(1, "#011A13");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Chamber Frame Border
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 14;
    ctx.strokeRect(16, 16, W - 32, H - 32);

    // B. Shield-Check Icon
    // Radiant pulsating aura
    const pulse = Math.sin(elapsed * 0.006);
    const auraR = 145 + 10 * pulse;
    const auraGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, auraR);
    auraGrad.addColorStop(0, "rgba(16, 185, 129, 0.4)");
    auraGrad.addColorStop(0.6, "rgba(5, 150, 105, 0.18)");
    auraGrad.addColorStop(1, "rgba(6, 78, 59, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Shield geometry
    const left = cx - 95;
    const right = cx + 95;
    const top = cy - 110;
    const bottom = cy + 120;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left, top + 15);
    ctx.bezierCurveTo(left + 30, top, cx - 30, top + 18, cx, top + 22);
    ctx.bezierCurveTo(cx + 30, top + 18, right - 30, top, right, top + 15);
    ctx.bezierCurveTo(right + 4, cy - 20, right - 10, cy + 50, cx, bottom);
    ctx.bezierCurveTo(left + 10, cy + 50, left - 4, cy - 20, left, top + 15);
    ctx.closePath();

    // Shield body gradient
    const shieldGrad = ctx.createLinearGradient(0, top, 0, bottom);
    shieldGrad.addColorStop(0, "#059669");
    shieldGrad.addColorStop(0.35, "#047857");
    shieldGrad.addColorStop(0.85, "#064E3B");
    shieldGrad.addColorStop(1, "#022C22");
    ctx.fillStyle = shieldGrad;
    ctx.shadowColor = "rgba(16, 185, 129, 0.75)";
    ctx.shadowBlur = 25;
    ctx.fill();

    // Outer Golden / Emerald Rim
    ctx.lineWidth = 10;
    const rimGrad = ctx.createLinearGradient(left, top, right, bottom);
    rimGrad.addColorStop(0, "#34D399");
    rimGrad.addColorStop(0.5, "#FBBF24");
    rimGrad.addColorStop(1, "#10B981");
    ctx.strokeStyle = rimGrad;
    ctx.stroke();

    // Inner Bevel Stroke
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.stroke();

    // Gleam light sweep clipped inside the shield
    ctx.clip();
    const sweepX = ((elapsed * 0.22) % 650) - 200;
    const gleamGrad = ctx.createLinearGradient(cx - 150 + sweepX, top, cx - 50 + sweepX, bottom);
    gleamGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
    gleamGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
    gleamGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gleamGrad;
    ctx.fillRect(left - 20, top - 20, 240, 270);
    ctx.restore();

    // Shield-Check Mark (sharp, bold checkmark icon inside shield)
    ctx.save();
    ctx.beginPath();
    const chkStart = { x: cx - 46, y: cy + 5 };
    const chkMid = { x: cx - 12, y: cy + 42 };
    const chkEnd = { x: cx + 48, y: cy - 42 };

    ctx.moveTo(chkStart.x, chkStart.y);
    ctx.lineTo(chkMid.x, chkMid.y);
    ctx.lineTo(chkEnd.x, chkEnd.y);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 22;

    // Glowing white with mint halo
    ctx.shadowColor = "#34D399";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();

    // Inner sharp core
    ctx.lineWidth = 12;
    ctx.strokeStyle = "#ECFDF5";
    ctx.stroke();
    ctx.restore();

    // C. Text Banners
    ctx.font = "900 52px sans-serif";
    ctx.fillStyle = "#34D399";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(16, 185, 129, 0.6)";
    ctx.shadowBlur = 15;
    ctx.fillText("SAFE!", cx, 475);

    ctx.shadowBlur = 0;
    ctx.font = "bold 28px sans-serif";
    ctx.fillStyle = "#A7F3D0";
    ctx.fillText("SECTOR CLEARED", cx, 535);

    // +100 PTS Badge
    drawRoundedRect(ctx, 166, 580, 180, 42, 12);
    ctx.fillStyle = "#F59E0B";
    ctx.fill();
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "900 22px sans-serif";
    ctx.fillStyle = "#1E0A02";
    ctx.fillText("+100 PTS", cx, 601);
  };

  // 3. Bomb Door Interior: Animated Bomb Icon with Burning Fuse & Dynamic Sparks
  const drawBombInterior = (ctx: CanvasRenderingContext2D, elapsed: number) => {
    const W = 512;
    const H = 768;
    const cx = 256;
    const cy = 330;

    // A. Chamber Background
    const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 400);
    bgGrad.addColorStop(0, "#7F1D1D");
    bgGrad.addColorStop(0.5, "#450A0A");
    bgGrad.addColorStop(1, "#180202");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Hazard Stripes Top and Bottom
    const stripeW = 28;
    for (let x = -stripeW; x < W + stripeW; x += stripeW * 2) {
      // Top Hazard
      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeW, 0);
      ctx.lineTo(x + stripeW - 20, 24);
      ctx.lineTo(x - 20, 24);
      ctx.closePath();
      ctx.fill();

      // Bottom Hazard
      ctx.beginPath();
      ctx.moveTo(x, H - 24);
      ctx.lineTo(x + stripeW, H - 24);
      ctx.lineTo(x + stripeW - 20, H);
      ctx.lineTo(x - 20, H);
      ctx.closePath();
      ctx.fill();
    }

    // Flashing Red Emergency Beacon
    const alarmPulse = 0.5 + 0.5 * Math.sin(elapsed * 0.009);
    const glowGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 180);
    glowGrad.addColorStop(0, `rgba(239, 68, 68, ${0.18 + alarmPulse * 0.22})`);
    glowGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.fill();

    // Chamber Frame Border
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 14;
    ctx.strokeRect(16, 16, W - 32, H - 32);

    // B. Animated Bomb Icon
    const bombScale = 1.0 + 0.04 * Math.sin(elapsed * 0.012);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(bombScale, bombScale);

    // Bomb Sphere Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.beginPath();
    ctx.ellipse(0, 105, 95, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bomb Metallic Sphere
    const radius = 94;
    const bombGrad = ctx.createRadialGradient(-32, -32, 10, 0, 0, radius);
    bombGrad.addColorStop(0, "#64748B"); // specular hot spot
    bombGrad.addColorStop(0.2, "#334155");
    bombGrad.addColorStop(0.65, "#0F172A");
    bombGrad.addColorStop(1, "#020617");

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = bombGrad;
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = 20;
    ctx.fill();

    // Gloss arc highlight
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius - 8, -Math.PI * 0.85, -Math.PI * 0.35);
    ctx.lineWidth = 7;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    // Brass Collar / Neck
    const neckW = 46;
    const neckH = 22;
    const neckY = -radius - 12;
    const neckGrad = ctx.createLinearGradient(-neckW / 2, 0, neckW / 2, 0);
    neckGrad.addColorStop(0, "#78350F");
    neckGrad.addColorStop(0.4, "#F59E0B");
    neckGrad.addColorStop(0.7, "#FEF08A");
    neckGrad.addColorStop(1, "#92400E");
    ctx.fillStyle = neckGrad;
    drawRoundedRect(ctx, -neckW / 2, neckY, neckW, neckH, 5);
    ctx.fill();
    ctx.strokeStyle = "#451A03";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Curved Rope Fuse
    const fuseEndX = 48;
    const fuseEndY = neckY - 48;
    ctx.beginPath();
    ctx.moveTo(0, neckY + 2);
    ctx.bezierCurveTo(12, neckY - 20, 24, neckY - 35, fuseEndX, fuseEndY);
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#D97706";
    ctx.lineCap = "round";
    ctx.stroke();

    // Braided texture
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#451A03";
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Animated Burning Fuse Sparks & Flame
    const flameFlicker = Math.sin(elapsed * 0.035) * 4;
    const flameH = 28 + Math.sin(elapsed * 0.02) * 6;

    const flameGrad = ctx.createRadialGradient(fuseEndX, fuseEndY, 2, fuseEndX, fuseEndY, 22);
    flameGrad.addColorStop(0, "#FFFFFF");
    flameGrad.addColorStop(0.3, "#FDE047");
    flameGrad.addColorStop(0.7, "#F97316");
    flameGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.arc(fuseEndX + flameFlicker * 0.5, fuseEndY - flameH * 0.3, 22, 0, Math.PI * 2);
    ctx.fill();

    // Animated sparks flying off fuse
    for (let s = 0; s < 7; s++) {
      const sparkPhase = (elapsed * 0.4 + s * 95) % 400;
      const sparkDist = (sparkPhase / 400) * 40;
      const sparkAngle = (s * 52 * Math.PI) / 180 + Math.sin(elapsed * 0.01) * 0.3;
      const sx = fuseEndX + Math.cos(sparkAngle) * sparkDist;
      const sy = fuseEndY - 10 + Math.sin(sparkAngle) * sparkDist - sparkDist * 0.3;
      const sparkAlpha = Math.max(0, 1 - sparkPhase / 400);

      ctx.fillStyle = s % 2 === 0 ? `rgba(254, 240, 138, ${sparkAlpha})` : `rgba(249, 115, 22, ${sparkAlpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 2 + (1 - sparkAlpha) * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hazard Warning Symbol on Bomb Body
    const triY = -12;
    ctx.beginPath();
    ctx.moveTo(0, triY - 26);
    ctx.lineTo(26, triY + 22);
    ctx.lineTo(-26, triY + 22);
    ctx.closePath();
    ctx.fillStyle = "#FBBF24";
    ctx.fill();
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Exclamation mark
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.rect(-3, triY - 14, 6, 18);
    ctx.arc(0, triY + 12, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // C. Warning Text Banners
    ctx.font = "900 48px sans-serif";
    ctx.fillStyle = "#F87171";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(239, 68, 68, 0.7)";
    ctx.shadowBlur = 16;
    ctx.fillText("TRAP!", cx, 475);

    ctx.shadowBlur = 0;
    // -1 LIFE Pill Badge
    drawRoundedRect(ctx, 166, 520, 180, 42, 12);
    ctx.fillStyle = "#DC2626";
    ctx.fill();
    ctx.strokeStyle = "#FECACA";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "900 22px sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("-1 LIFE LOST", cx, 541);

    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#FCA5A5";
    ctx.fillText("EXPLOSION DETECTED", cx, 600);
  };

  // 4. Thief Door Interior: Thief Image + Jail Iron Bars In Front + Animated "ARRESTED" Stamp
  const drawThiefJailCell = (
    ctx: CanvasRenderingContext2D,
    elapsed: number,
    thiefImg: HTMLImageElement | null,
    roomCode?: string
  ) => {
    const W = 512;
    const H = 768;

    // A. Prison Cell Stone Block Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#130722");
    bgGrad.addColorStop(0.5, "#0B0314");
    bgGrad.addColorStop(1, "#180628");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Stone block mortar lines
    ctx.strokeStyle = "rgba(45, 18, 77, 0.4)";
    ctx.lineWidth = 3;
    const rowHeight = 70;
    for (let r = 0; r < H; r += rowHeight) {
      ctx.beginPath();
      ctx.moveTo(16, r);
      ctx.lineTo(W - 16, r);
      ctx.stroke();

      const isEven = (r / rowHeight) % 2 === 0;
      const colStep = 120;
      const startOffset = isEven ? 0 : 60;
      for (let c = startOffset; c < W; c += colStep) {
        ctx.beginPath();
        ctx.moveTo(c, r);
        ctx.lineTo(c, r + rowHeight);
        ctx.stroke();
      }
    }

    // Overhead prison spotlight beam
    const spotGrad = ctx.createRadialGradient(256, 120, 20, 256, 400, 320);
    spotGrad.addColorStop(0, "rgba(245, 158, 11, 0.18)");
    spotGrad.addColorStop(0.7, "rgba(168, 85, 247, 0.08)");
    spotGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, W, H);

    // B. Thief Character Image (BEHIND the bars!)
    // Soft ground shadow under thief
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.beginPath();
    ctx.ellipse(256, 680, 140, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    if (thiefImg && thiefImg.complete && thiefImg.naturalWidth > 0) {
      // Scale thief nicely inside chamber
      const thiefWidth = 350;
      const thiefHeight = 490;
      const thiefX = 256 - thiefWidth / 2;
      const thiefY = 175;
      ctx.drawImage(thiefImg, thiefX, thiefY, thiefWidth, thiefHeight);
    } else {
      // Crisp vector thief illustration as instant fallback
      const tX = 256;
      const tY = 360;
      // Body / Striped prison shirt
      ctx.fillStyle = "#1E293B";
      ctx.beginPath();
      ctx.ellipse(tX, tY + 120, 110, 140, 0, 0, Math.PI * 2);
      ctx.fill();
      // White prison stripes
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 14;
      for (let sy = tY + 40; sy < tY + 220; sy += 30) {
        ctx.beginPath();
        ctx.moveTo(tX - 90, sy);
        ctx.lineTo(tX + 90, sy);
        ctx.stroke();
      }
      // Head
      ctx.fillStyle = "#FBBF24";
      ctx.beginPath();
      ctx.arc(tX, tY - 30, 60, 0, Math.PI * 2);
      ctx.fill();
      // Black robber mask
      ctx.fillStyle = "#0F172A";
      ctx.beginPath();
      ctx.ellipse(tX, tY - 35, 62, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eye cutouts
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(tX - 24, tY - 35, 12, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(tX + 24, tY - 35, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0F172A";
      ctx.beginPath();
      ctx.arc(tX - 22, tY - 35, 5, 0, Math.PI * 2);
      ctx.arc(tX + 26, tY - 35, 5, 0, Math.PI * 2);
      ctx.fill();
      // Black robber beanie hat
      ctx.fillStyle = "#09090B";
      ctx.beginPath();
      ctx.arc(tX, tY - 60, 62, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(tX - 64, tY - 65, 128, 16);
    }

    // C. Heavy Jail Iron Bars (IN FRONT OF the Thief!)
    // 6 vertical cylindrical steel bars
    const barXs = [72, 145, 218, 294, 367, 440];
    const barWidth = 18;

    // Drop shadows cast by bars onto the thief
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    barXs.forEach((bx) => {
      ctx.fillRect(bx + 6, 20, barWidth, 728);
    });

    // Vertical steel bars with 3D cylindrical highlights
    barXs.forEach((bx) => {
      const barGrad = ctx.createLinearGradient(bx, 0, bx + barWidth, 0);
      barGrad.addColorStop(0, "#111827");    // deep shadow left
      barGrad.addColorStop(0.2, "#374151");   // dark metal
      barGrad.addColorStop(0.45, "#E5E7EB");  // specular silvery metallic shine
      barGrad.addColorStop(0.7, "#9CA3AF");   // brushed steel
      barGrad.addColorStop(1, "#1F2937");    // dark shadow right

      ctx.fillStyle = barGrad;
      ctx.fillRect(bx, 20, barWidth, 728);

      ctx.strokeStyle = "#4B5563";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, 20, barWidth, 728);
    });

    // 3 Heavy Horizontal Steel Crossbeams
    const crossYs = [95, 410, 685];
    const crossHeight = 24;

    crossYs.forEach((cy) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(20, cy + 4, W - 40, crossHeight);

      const beamGrad = ctx.createLinearGradient(0, cy, 0, cy + crossHeight);
      beamGrad.addColorStop(0, "#9CA3AF"); // top highlight
      beamGrad.addColorStop(0.3, "#374151");
      beamGrad.addColorStop(0.8, "#1F2937");
      beamGrad.addColorStop(1, "#111827"); // bottom shadow
      ctx.fillStyle = beamGrad;
      ctx.fillRect(20, cy, W - 40, crossHeight);

      ctx.strokeStyle = "#4B5563";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, cy, W - 40, crossHeight);

      // Heavy steel rivets/bolts at every bar intersection
      barXs.forEach((bx) => {
        const rx = bx + barWidth / 2;
        const ry = cy + crossHeight / 2;

        ctx.beginPath();
        ctx.arc(rx, ry, 6, 0, Math.PI * 2);
        const rivetGrad = ctx.createRadialGradient(rx - 2, ry - 2, 1, rx, ry, 6);
        rivetGrad.addColorStop(0, "#F3F4F6");
        rivetGrad.addColorStop(0.6, "#6B7280");
        rivetGrad.addColorStop(1, "#111827");
        ctx.fillStyle = rivetGrad;
        ctx.fill();
        ctx.strokeStyle = "#1F2937";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    });

    // Heavy Jail Security Padlock on the center crossbar
    const lockX = 256;
    const lockY = 410 + crossHeight / 2;
    ctx.save();
    // Shackle
    ctx.beginPath();
    ctx.arc(lockX, lockY - 14, 14, Math.PI, 0, false);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#9CA3AF";
    ctx.stroke();
    // Body
    const lockGrad = ctx.createLinearGradient(lockX - 16, lockY - 8, lockX + 16, lockY + 22);
    lockGrad.addColorStop(0, "#F59E0B");
    lockGrad.addColorStop(1, "#78350F");
    ctx.fillStyle = lockGrad;
    drawRoundedRect(ctx, lockX - 18, lockY - 8, 36, 32, 6);
    ctx.fill();
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Keyhole
    ctx.fillStyle = "#110401";
    ctx.beginPath();
    ctx.arc(lockX, lockY + 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(lockX - 2, lockY + 5, 4, 8);
    ctx.restore();

    // Outer Chamber Border
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 14;
    ctx.strokeRect(16, 16, W - 32, H - 32);

    // D. Animated "ARRESTED" Text Stamp (IN FRONT OF the bars and thief!)
    let scale = 1.0;
    let alpha = 1.0;
    const slamStart = 150;
    const slamLand = 380;
    const slamSettle = 520;

    if (elapsed < slamStart) {
      scale = 3.0;
      alpha = Math.max(0, (elapsed / slamStart) * 0.3);
    } else if (elapsed < slamLand) {
      const p = (elapsed - slamStart) / (slamLand - slamStart);
      scale = 3.0 - 2.0 * Math.pow(p, 3);
      alpha = 0.3 + 0.7 * p;
    } else if (elapsed < slamSettle) {
      const bp = (elapsed - slamLand) / (slamSettle - slamLand);
      scale = 1.0 + 0.12 * Math.sin(bp * Math.PI);
      alpha = 1.0;
    } else {
      scale = 1.0 + 0.015 * Math.sin((elapsed - slamSettle) * 0.005);
      alpha = 1.0;
    }

    ctx.save();
    ctx.translate(256, 385);
    ctx.rotate((-12.5 * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    const stampW = 390;
    const stampH = 135;
    const sLeft = -stampW / 2;
    const sTop = -stampH / 2;

    // Semi-translucent red ink wash fill
    ctx.fillStyle = "rgba(185, 28, 28, 0.32)";
    drawRoundedRect(ctx, sLeft, sTop, stampW, stampH, 10);
    ctx.fill();

    // Thick Outer Red Stamp Border
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#DC2626";
    ctx.shadowColor = "rgba(239, 68, 68, 0.9)";
    ctx.shadowBlur = 18;
    ctx.stroke();

    // Thin Inner Border
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#EF4444";
    ctx.strokeRect(sLeft + 8, sTop + 8, stampW - 16, stampH - 16);

    // Top Tag
    ctx.fillStyle = "#FCA5A5";
    ctx.font = "900 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★ POLICE DEPARTMENT • CRIMINAL DIVISION ★", 0, sTop + 24);

    // Giant Main Stamp Text: ARRESTED
    ctx.font = "900 58px 'Impact', 'Arial Black', sans-serif";
    ctx.fillStyle = "#EF4444";
    ctx.shadowColor = "rgba(220, 38, 38, 1)";
    ctx.shadowBlur = 14;
    ctx.fillText("ARRESTED", 0, 8);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#B91C1C";
    ctx.strokeText("ARRESTED", 0, 8);

    // Bottom Tag
    ctx.fillStyle = "#FECACA";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`THIEF CAUGHT • ROOM ${roomCode || "CASE CLOSED"}`, 0, sTop + stampH - 22);

    // Rubber stamp distress grunge hatch marks
    ctx.strokeStyle = "rgba(254, 202, 202, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sLeft + 25, 0);
    ctx.lineTo(sLeft + 45, 12);
    ctx.moveTo(stampW / 2 - 45, -8);
    ctx.lineTo(stampW / 2 - 25, 4);
    ctx.stroke();

    ctx.restore();

    // E. Header / Footer Chamber Badges
    drawRoundedRect(ctx, 146, 38, 220, 36, 10);
    ctx.fillStyle = "#F59E0B";
    ctx.fill();
    ctx.strokeStyle = "#FEF3C7";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#160601";
    ctx.font = "900 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CRIMINAL CAPTURED", 256, 56);

    drawRoundedRect(ctx, 156, 706, 200, 36, 10);
    ctx.fillStyle = "#10B981";
    ctx.fill();
    ctx.strokeStyle = "#A7F3D0";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#022C22";
    ctx.font = "900 18px sans-serif";
    ctx.fillText("+1000 PTS VICTORY", 256, 724);
  };

  // 5. Secret Clue Door Interior: Glowing Magnifying Glass, Mystical Parchment & Dynamic Riddle Text
  const drawClueInterior = (ctx: CanvasRenderingContext2D, elapsed: number, clueText?: string | null) => {
    const W = 512;
    const H = 768;
    const cx = 256;
    const cy = 250;

    // A. Chamber Background (Arcane Violet & Midnight Indigo)
    const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 450);
    bgGrad.addColorStop(0, "#4C1D95");
    bgGrad.addColorStop(0.4, "#2E1065");
    bgGrad.addColorStop(0.8, "#170836");
    bgGrad.addColorStop(1, "#090317");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Chamber Frame Border
    ctx.strokeStyle = "#C084FC";
    ctx.lineWidth = 14;
    ctx.strokeRect(16, 16, W - 32, H - 32);

    // Glowing Arcane Rings in background
    const pulse = Math.sin(elapsed * 0.005);
    const ringR = 120 + 8 * pulse;
    ctx.strokeStyle = "rgba(192, 132, 252, 0.25)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(245, 158, 11, 0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR + 25, 0, Math.PI * 2);
    ctx.stroke();

    // B. Golden Magnifying Glass with luminous lens
    ctx.save();
    // Glass Lens Glow
    const lensGrad = ctx.createRadialGradient(cx - 15, cy - 15, 10, cx, cy, 75);
    lensGrad.addColorStop(0, "rgba(238, 242, 255, 0.95)");
    lensGrad.addColorStop(0.4, "rgba(192, 132, 252, 0.6)");
    lensGrad.addColorStop(0.8, "rgba(147, 51, 234, 0.3)");
    lensGrad.addColorStop(1, "rgba(88, 28, 135, 0.15)");
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 75, 0, Math.PI * 2);
    ctx.fill();

    // Magnifying Glass icon inside lens
    ctx.font = "56px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🔍", cx - 4, cy - 2);

    // Golden Lens Rim
    const rimGrad = ctx.createLinearGradient(cx - 75, cy - 75, cx + 75, cy + 75);
    rimGrad.addColorStop(0, "#FEF08A");
    rimGrad.addColorStop(0.5, "#F59E0B");
    rimGrad.addColorStop(1, "#92400E");
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, 78, 0, Math.PI * 2);
    ctx.stroke();

    // Brass Handle
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((42 * Math.PI) / 180);
    const handleGrad = ctx.createLinearGradient(65, -12, 160, 12);
    handleGrad.addColorStop(0, "#78350F");
    handleGrad.addColorStop(0.3, "#F59E0B");
    handleGrad.addColorStop(0.7, "#FEF3C7");
    handleGrad.addColorStop(1, "#451A03");
    ctx.fillStyle = handleGrad;
    drawRoundedRect(ctx, 80, -10, 80, 20, 6);
    ctx.fill();
    ctx.strokeStyle = "#92400E";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // C. Top Badge: "SECRET CLUE!"
    drawRoundedRect(ctx, 136, 42, 240, 42, 10);
    const topBadgeGrad = ctx.createLinearGradient(136, 0, 376, 0);
    topBadgeGrad.addColorStop(0, "#9333EA");
    topBadgeGrad.addColorStop(0.5, "#C084FC");
    topBadgeGrad.addColorStop(1, "#7E22CE");
    ctx.fillStyle = topBadgeGrad;
    ctx.fill();
    ctx.strokeStyle = "#FDE047";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 8;
    ctx.fillText("SECRET CLUE!", cx, 63);
    ctx.shadowBlur = 0;

    // D. Parchment Clue Scroll Box
    const boxX = 36;
    const boxY = 405;
    const boxW = 440;
    const boxH = 265;
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 18);
    const parchGrad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
    parchGrad.addColorStop(0, "#1F1235");
    parchGrad.addColorStop(0.5, "#2A1847");
    parchGrad.addColorStop(1, "#170C29");
    ctx.fillStyle = parchGrad;
    ctx.fill();
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Scroll header ribbon
    ctx.fillStyle = "#F59E0B";
    ctx.font = "900 20px sans-serif";
    ctx.fillText("📜 CLASSIFIED INTELLIGENCE", cx, boxY + 36);

    // Riddle / Clue Text (Multi-line wrapped)
    const textToDisplay = clueText || "Mysterious clues revealed! Check the crime scene.";
    ctx.fillStyle = "#FEF3C7";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const words = textToDisplay.split(" ");
    let line = "";
    const lines: string[] = [];
    const maxLineW = boxW - 50;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + (line ? " " : "") + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineW && line !== "") {
        lines.push(line);
        line = words[i];
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);

    const startTextY = boxY + 105;
    const lineSpacing = 32;
    lines.forEach((l, idx) => {
      ctx.fillText(l, cx, startTextY + idx * lineSpacing);
    });

    // Sub-note in clue box
    ctx.font = "600 15px sans-serif";
    ctx.fillStyle = "#C084FC";
    ctx.fillText("★ Clue pinned to detective HUD banner ★", cx, boxY + boxH - 28);

    // E. Bottom Victory / Intel Points Badge
    drawRoundedRect(ctx, 146, 696, 220, 38, 10);
    ctx.fillStyle = "#F59E0B";
    ctx.fill();
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "900 20px sans-serif";
    ctx.fillStyle = "#1E0A02";
    ctx.fillText("+150 PTS INTEL", cx, 715);
  };

  // 6. Extra Life Door Interior: Beating Heart & Vitality Restoration Chamber
  const drawLifeInterior = (ctx: CanvasRenderingContext2D, elapsed: number) => {
    const W = 512;
    const H = 768;
    const cx = 256;
    const cy = 320;

    // A. Chamber Background (Radiant Crimson & Sacred Ruby)
    const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 420);
    bgGrad.addColorStop(0, "#881337");
    bgGrad.addColorStop(0.4, "#4C0519");
    bgGrad.addColorStop(0.8, "#28020D");
    bgGrad.addColorStop(1, "#120005");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Chamber Frame Border
    ctx.strokeStyle = "#FB7185";
    ctx.lineWidth = 14;
    ctx.strokeRect(16, 16, W - 32, H - 32);

    // Radiant aura & realistic heartbeat
    const beat = Math.sin(elapsed * 0.007);
    const sharpBeat = Math.pow(Math.max(0, beat), 3);
    const heartScale = 1.0 + 0.12 * sharpBeat;

    const auraR = 170 + 20 * sharpBeat;
    const auraGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, auraR);
    auraGrad.addColorStop(0, "rgba(244, 63, 94, 0.45)");
    auraGrad.addColorStop(0.5, "rgba(225, 29, 72, 0.2)");
    auraGrad.addColorStop(1, "rgba(136, 19, 55, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Floating vitality sparkles
    for (let i = 0; i < 8; i++) {
      const spPhase = (elapsed * 0.08 + i * 60) % 240;
      const spY = cy + 100 - spPhase;
      const spX = cx + Math.sin(elapsed * 0.004 + i * 1.5) * (70 + (i % 3) * 25);
      const spAlpha = Math.sin((spPhase / 240) * Math.PI);
      ctx.fillStyle = `rgba(254, 205, 211, ${spAlpha})`;
      ctx.beginPath();
      ctx.arc(spX, spY, 3 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    // B. Beating Golden-Ruby Heart
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(heartScale, heartScale);

    ctx.beginPath();
    const hx = 0;
    const hy = -20;
    ctx.moveTo(hx, hy + 40);
    ctx.bezierCurveTo(hx, hy, hx - 100, hy - 70, hx - 100, hy + 20);
    ctx.bezierCurveTo(hx - 100, hy + 85, hx - 40, hy + 130, hx, hy + 175);
    ctx.bezierCurveTo(hx + 40, hy + 130, hx + 100, hy + 85, hx + 100, hy + 20);
    ctx.bezierCurveTo(hx + 100, hy - 70, hx, hy, hx, hy + 40);
    ctx.closePath();

    const heartGrad = ctx.createLinearGradient(0, -90, 0, 180);
    heartGrad.addColorStop(0, "#FDA4AF");
    heartGrad.addColorStop(0.3, "#F43F5E");
    heartGrad.addColorStop(0.7, "#E11D48");
    heartGrad.addColorStop(1, "#881337");
    ctx.fillStyle = heartGrad;
    ctx.shadowColor = "rgba(244, 63, 94, 0.85)";
    ctx.shadowBlur = 30;
    ctx.fill();

    // Gold rim around heart
    ctx.strokeStyle = "#FDE047";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Crisp White Health Cross in Center
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#FFFFFF";
    const crossW = 20;
    const crossL = 64;
    drawRoundedRect(ctx, -crossL / 2, 40 - crossW / 2, crossL, crossW, 5);
    ctx.fill();
    drawRoundedRect(ctx, -crossW / 2, 40 - crossL / 2, crossW, crossL, 5);
    ctx.fill();

    ctx.restore();

    // C. Top Badge: "+1 EXTRA LIFE!"
    drawRoundedRect(ctx, 116, 42, 280, 44, 12);
    const lifeBadgeGrad = ctx.createLinearGradient(116, 0, 396, 0);
    lifeBadgeGrad.addColorStop(0, "#E11D48");
    lifeBadgeGrad.addColorStop(0.5, "#F43F5E");
    lifeBadgeGrad.addColorStop(1, "#BE123C");
    ctx.fillStyle = lifeBadgeGrad;
    ctx.fill();
    ctx.strokeStyle = "#FECDD3";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 26px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 8;
    ctx.fillText("+1 EXTRA LIFE!", cx, 64);
    ctx.shadowBlur = 0;

    // D. Sub-banners
    ctx.font = "900 38px sans-serif";
    ctx.fillStyle = "#FECDD3";
    ctx.shadowColor = "rgba(244, 63, 94, 0.6)";
    ctx.shadowBlur = 14;
    ctx.fillText("VITALITY RESTORED", cx, 550);
    ctx.shadowBlur = 0;

    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#FDA4AF";
    ctx.fillText("1 EXTRA CHANCE GAINED", cx, 605);

    // E. Bottom Badge: "+150 PTS VITALITY"
    drawRoundedRect(ctx, 136, 696, 240, 38, 10);
    ctx.fillStyle = "#10B981";
    ctx.fill();
    ctx.strokeStyle = "#A7F3D0";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "900 20px sans-serif";
    ctx.fillStyle = "#022C22";
    ctx.fillText("+150 PTS VITALITY", cx, 715);
  };

  // Dispatch interior frame render to the active door texture
  const drawDoorInterior = (door: DoorMeshRef, now: number) => {
    if (!door.revealTexture) return;
    const ctx = door.revealTexture.getContext() as CanvasRenderingContext2D;
    const elapsed = now - door.openedAtTime;

    if (door.status === "THIEF") {
      if (!door.stampSoundPlayed && elapsed >= 280) {
        door.stampSoundPlayed = true;
        playStampSlamSound();
      }
      drawThiefJailCell(ctx, elapsed, thiefImgRef.current, roomCodeRef.current);
    } else if (door.status === "BOMB") {
      drawBombInterior(ctx, elapsed);
    } else if (door.status === "SAFE") {
      drawSafeInterior(ctx, elapsed);
    } else if (door.status === "CLUE") {
      drawClueInterior(ctx, elapsed, door.clueText || activeClue);
    } else if (door.status === "LIFE") {
      drawLifeInterior(ctx, elapsed);
    } else {
      drawLockedInterior(ctx);
    }

    door.revealTexture.update(true);
    door.lastRenderTime = now;
  };

  // Build Particle Effect for Bomb (Fire/Sparks), Thief (Golden Rays), Clue (Arcane Sparkles), or Life (Crimson/Pink)
  const triggerParticleExplosion = (scene: Scene, position: Vector3, type: DetectiveDoorOutcome) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const particleSystem = new ParticleSystem(`particles-${type}`, 60, scene);
    particleSystem.particleTexture = new Texture(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      scene
    );

    particleSystem.emitter = position;
    particleSystem.minEmitBox = new Vector3(-0.3, -0.3, -0.1);
    particleSystem.maxEmitBox = new Vector3(0.3, 0.3, 0.1);

    if (type === "BOMB") {
      particleSystem.color1 = new Color4(1.0, 0.2, 0.0, 1.0);
      particleSystem.color2 = new Color4(1.0, 0.6, 0.0, 1.0);
      particleSystem.colorDead = new Color4(0.2, 0.1, 0.1, 0.0);
      particleSystem.minSize = 0.08;
      particleSystem.maxSize = 0.22;
      particleSystem.minLifeTime = 0.3;
      particleSystem.maxLifeTime = 0.8;
      particleSystem.emitRate = 120;
      particleSystem.direction1 = new Vector3(-2, -2, -2);
      particleSystem.direction2 = new Vector3(2, 2, -2);
      particleSystem.gravity = new Vector3(0, -9.81, 0);
    } else if (type === "THIEF") {
      particleSystem.color1 = new Color4(1.0, 0.85, 0.2, 1.0);
      particleSystem.color2 = new Color4(1.0, 0.6, 0.0, 1.0);
      particleSystem.colorDead = new Color4(0.5, 0.4, 0.1, 0.0);
      particleSystem.minSize = 0.06;
      particleSystem.maxSize = 0.18;
      particleSystem.minLifeTime = 0.5;
      particleSystem.maxLifeTime = 1.2;
      particleSystem.emitRate = 80;
      particleSystem.direction1 = new Vector3(-1, 2, -1);
      particleSystem.direction2 = new Vector3(1, 3, 1);
      particleSystem.gravity = new Vector3(0, 2, 0);
    } else if (type === "CLUE") {
      particleSystem.color1 = new Color4(0.75, 0.4, 1.0, 1.0); // Violet
      particleSystem.color2 = new Color4(1.0, 0.85, 0.3, 1.0); // Gold
      particleSystem.colorDead = new Color4(0.2, 0.1, 0.4, 0.0);
      particleSystem.minSize = 0.05;
      particleSystem.maxSize = 0.16;
      particleSystem.minLifeTime = 0.5;
      particleSystem.maxLifeTime = 1.0;
      particleSystem.emitRate = 70;
      particleSystem.direction1 = new Vector3(-1, 1, -1);
      particleSystem.direction2 = new Vector3(1, 2, 1);
      particleSystem.gravity = new Vector3(0, 0.5, 0);
    } else if (type === "LIFE") {
      particleSystem.color1 = new Color4(1.0, 0.25, 0.5, 1.0); // Rose
      particleSystem.color2 = new Color4(1.0, 0.8, 0.9, 1.0);  // Pink/White
      particleSystem.colorDead = new Color4(0.4, 0.05, 0.15, 0.0);
      particleSystem.minSize = 0.06;
      particleSystem.maxSize = 0.18;
      particleSystem.minLifeTime = 0.5;
      particleSystem.maxLifeTime = 1.1;
      particleSystem.emitRate = 70;
      particleSystem.direction1 = new Vector3(-1, 1, -1);
      particleSystem.direction2 = new Vector3(1, 2.5, 1);
      particleSystem.gravity = new Vector3(0, 1.5, 0);
    } else {
      particleSystem.color1 = new Color4(0.2, 0.9, 0.6, 1.0);
      particleSystem.color2 = new Color4(0.1, 0.7, 0.9, 1.0);
      particleSystem.colorDead = new Color4(0.0, 0.2, 0.3, 0.0);
      particleSystem.minSize = 0.04;
      particleSystem.maxSize = 0.12;
      particleSystem.minLifeTime = 0.4;
      particleSystem.maxLifeTime = 0.8;
      particleSystem.emitRate = 40;
      particleSystem.direction1 = new Vector3(-1, -1, -1);
      particleSystem.direction2 = new Vector3(1, 1, 1);
    }

    particleSystem.start();
    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => particleSystem.dispose(), 1500);
    }, 600);
  };

  // Camera Shake Animation for Bomb detonate
  const triggerCameraShake = () => {
    if (!cameraRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const camera = cameraRef.current;
    const origRadius = camera.radius;
    let shakeCount = 0;
    const interval = setInterval(() => {
      const offsetX = (Math.random() - 0.5) * 0.15;
      const offsetY = (Math.random() - 0.5) * 0.15;
      camera.target = new Vector3(offsetX, offsetY, 0);
      shakeCount++;
      if (shakeCount > 6) {
        clearInterval(interval);
        camera.target = new Vector3(0, 0, 0);
        camera.radius = origRadius;
      }
    }, 40);
  };

  // Initialize Babylon Scene
  useEffect(() => {
    if (!canvasRef.current) return;

    let engine: Engine;
    try {
      engine = new Engine(canvasRef.current, true, {
        preserveDrawingBuffer: false,
        stencil: false,
        powerPreference: "high-performance",
      });
      engine.setHardwareScalingLevel(window.devicePixelRatio > 1.5 ? 1.3 : 1.0);
      engineRef.current = engine;
    } catch (err) {
      console.warn("Babylon initialization failed:", err);
      if (onFallbackRef.current) onFallbackRef.current();
      return;
    }

    const scene = new Scene(engine);
    sceneRef.current = scene;
    scene.clearColor = new Color4(0.04, 0.015, 0.08, 1); // Dark Royal Chamber

    // 1. Camera setup with mobile / desktop responsiveness
    const camera = new ArcRotateCamera("MysteryCamera", -Math.PI / 2, Math.PI / 2.3, 8.8, new Vector3(0, 0, 0), scene);
    camera.inputs.clear(); // Fixed view for consistent gameplay
    cameraRef.current = camera;

    // Door & Spacing Dimensions
    const doorWidth = 1.45;
    const doorHeight = 2.1;
    const spacingX = 1.95;
    const spacingY = 2.45;

    // Calculate optimal matrix layout based on screen dimensions and aspect ratio (10 doors total)
    const getOptimalLayout = (aspect: number, width: number, height: number): { cols: number; rows: number } => {
      // Mobile portrait or narrow vertical viewports: 2 columns x 5 rows
      if (aspect < 0.95 || (width < 700 && height > width)) {
        return { cols: 2, rows: 5 };
      }
      // Landscape desktop / laptop / tablet / mobile landscape: 5 columns x 2 rows
      return { cols: 5, rows: 2 };
    };

    // Reposition all 10 door meshes dynamically according to active matrix mode
    const repositionDoors = (cols: number, rows: number) => {
      const startX = -((cols - 1) * spacingX) / 2;
      const startY = ((rows - 1) * spacingY) / 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const doorNum = row * cols + col + 1;
          if (doorNum > 10) break;
          const posX = startX + col * spacingX;
          const posY = startY - row * spacingY;

          const doorData = doorMeshesRef.current.get(doorNum);
          if (doorData) {
            doorData.frame.position.x = posX;
            doorData.frame.position.y = posY;
            doorData.hingeRoot.position.x = posX - doorWidth / 2;
            doorData.hingeRoot.position.y = posY;
          }
        }
      }

      if (floorMeshRef.current) {
        floorMeshRef.current.position.y = startY - rows * spacingY + 1.25;
      }
      currentLayoutRef.current = { cols, rows };
    };

    const updateCameraResponsive = () => {
      if (!engine || !camera) return;
      const width = engine.getRenderWidth();
      const height = engine.getRenderHeight();
      if (!width || !height) return;

      const aspect = width / height;
      const { cols, rows } = getOptimalLayout(aspect, width, height);

      // Dynamically reposition door meshes if resolution requires a matrix change
      if (
        currentLayoutRef.current.cols !== cols ||
        currentLayoutRef.current.rows !== rows
      ) {
        repositionDoors(cols, rows);
      }

      // Tailored camera framing for 10-door matrix layouts
      if (cols === 2) {
        // Mobile portrait 2x5 layout (tall matrix)
        camera.target = new Vector3(0, -0.4, 0);
        camera.radius = Math.max(11.2, 8.2 / aspect);
      } else {
        // Landscape 5x2 layout (wide matrix)
        camera.target = new Vector3(0, -0.25, 0);
        if (aspect < 1.6) {
          camera.radius = Math.max(8.5, 9.2 / aspect);
        } else {
          camera.radius = 8.5;
        }
      }
    };

    // 2. Mysterious Royal Lighting
    const hemiLight = new HemisphericLight("MysteryHemi", new Vector3(0, 1, 0), scene);
    hemiLight.diffuse = new Color3(0.65, 0.45, 0.85); // Royal violet
    hemiLight.groundColor = new Color3(0.08, 0.02, 0.12);
    hemiLight.intensity = 0.85;

    const dirLight = new DirectionalLight("MysteryDir", new Vector3(-0.5, -1, 1), scene);
    dirLight.diffuse = new Color3(1.0, 0.85, 0.55); // Warm gold rim
    dirLight.intensity = 1.15;

    const spotlight = new PointLight("DoorFocusLight", new Vector3(0, 1, -4), scene);
    spotlight.diffuse = new Color3(1.0, 0.9, 0.6);
    spotlight.intensity = 0.4;
    spotlightRef.current = spotlight;

    // 3. Reflective Floor Plane
    const floor = MeshBuilder.CreateGround("CorridorFloor", { width: 22, height: 22 }, scene);
    floor.position.y = -3.55;
    floorMeshRef.current = floor;
    const floorMat = new StandardMaterial("floorMat", scene);
    floorMat.diffuseColor = new Color3(0.07, 0.02, 0.11);
    floorMat.specularColor = new Color3(0.35, 0.2, 0.45);
    floor.material = floorMat;

    // 4. Build the 10 3D Doors Matrix dynamically
    const initialAspect = (engine.getRenderWidth() || 800) / (engine.getRenderHeight() || 600);
    const initialLayout = getOptimalLayout(initialAspect, engine.getRenderWidth(), engine.getRenderHeight());
    const cols = initialLayout.cols;
    const rows = initialLayout.rows;
    currentLayoutRef.current = { cols, rows };

    const startX = -((cols - 1) * spacingX) / 2;
    const startY = ((rows - 1) * spacingY) / 2;

    doorMeshesRef.current.clear();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const doorNum = row * cols + col + 1;
        if (doorNum > 10) break;
        const posX = startX + col * spacingX;
        const posY = startY - row * spacingY;

        // Outer Stone/Gold Door Frame Backplate
        const frame = MeshBuilder.CreateBox(
          `doorFrame-${doorNum}`,
          { width: doorWidth + 0.18, height: doorHeight + 0.18, depth: 0.04 },
          scene
        );
        frame.position = new Vector3(posX, posY, 0.08);

        const frameMat = new StandardMaterial(`frameMat-${doorNum}`, scene);
        frameMat.diffuseColor = new Color3(0.18, 0.08, 0.28);
        frameMat.specularColor = new Color3(0.85, 0.65, 0.25);
        frameMat.emissiveColor = new Color3(0.04, 0.02, 0.07);
        frame.material = frameMat;

        // Interior compartment reveal plane inside the frame - in front of backplate, behind closed door
        const revealPlane = MeshBuilder.CreatePlane(
          `doorReveal-${doorNum}`,
          { width: doorWidth - 0.02, height: doorHeight - 0.02 },
          scene
        );
        revealPlane.position = new Vector3(posX, posY, 0.045);

        const revealMat = new StandardMaterial(`revealMat-${doorNum}`, scene);
        const revealTexture = new DynamicTexture(`doorRevealTex-${doorNum}`, { width: 512, height: 768 }, scene, false);
        drawLockedInterior(revealTexture.getContext() as CanvasRenderingContext2D);
        revealTexture.update(true);
        revealMat.diffuseTexture = revealTexture;
        revealMat.emissiveTexture = revealTexture;
        revealMat.disableLighting = true;
        revealMat.backFaceCulling = false;
        revealPlane.material = revealMat;

        // Hinge Pivot Node on the left edge of door
        const hingeRoot = new Mesh(`hinge-${doorNum}`, scene);
        hingeRoot.position = new Vector3(posX - doorWidth / 2, posY, 0);

        // Door Panel Mesh (child of hinge pivot for realistic outward swing)
        const panel = MeshBuilder.CreateBox(
          `doorPanel-${doorNum}`,
          { width: doorWidth, height: doorHeight, depth: 0.06 },
          scene
        );
        // Offset panel relative to hinge root so pivot is precisely at left hinge
        panel.position = new Vector3(doorWidth / 2, 0, 0);
        panel.parent = hingeRoot;

        const doorMat = new StandardMaterial(`doorMat-${doorNum}`, scene);
        const woodTex = createWoodDoorTexture(scene, doorNum);
        doorMat.diffuseTexture = woodTex;
        doorMat.specularColor = new Color3(0.35, 0.2, 0.1);
        doorMat.emissiveColor = new Color3(0.05, 0.02, 0.01);
        panel.material = doorMat;

        // Metallic Handle Plate on the door surface (opening edge = right side)
        // panel local space: center is 0, right edge is +doorWidth/2
        const handleX = doorWidth / 2 - 0.16;
        const handlePlate = MeshBuilder.CreateBox(
          `doorHandlePlate-${doorNum}`,
          { width: 0.09, height: 0.38, depth: 0.015 },
          scene
        );
        handlePlate.position = new Vector3(handleX, 0, -0.048);
        handlePlate.parent = panel;

        const handleMat = new StandardMaterial(`handleMat-${doorNum}`, scene);
        handleMat.diffuseColor = new Color3(0.95, 0.75, 0.25); // Antique polished brass
        handleMat.specularColor = new Color3(1.0, 0.9, 0.6);
        handlePlate.material = handleMat;

        // Metallic Knob mounted on the plate
        const handleKnob = MeshBuilder.CreateSphere(
          `doorHandle-${doorNum}`,
          { diameter: 0.12, segments: 16 },
          scene
        );
        handleKnob.position = new Vector3(handleX, -0.03, -0.075);
        handleKnob.parent = panel;
        handleKnob.material = handleMat;

        doorMeshesRef.current.set(doorNum, {
          frame,
          panel,
          doorId: doorNum,
          doorMat,
          revealMat,
          revealTexture,
          isOpen: false,
          status: "LOCKED",
          hingeRoot,
          openedAtTime: 0,
          lastRenderTime: 0,
          stampSoundPlayed: false,
        });
      }
    }

    // 5. Pointer/Touch Picking Interaction
    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) return;

      const pickResult = pointerInfo.pickInfo;
      if (!pickResult || !pickResult.hit || !pickResult.pickedMesh) return;

      const meshName = pickResult.pickedMesh.name;
      // Match panel, handle, plate, frame AND the reveal plane so clicking an open icon also works
      const match = meshName.match(/door(Panel|Handle|HandlePlate|Frame|Reveal)-(\d+)/);
      if (!match) return;

      const doorNum = parseInt(match[2], 10);
      const doorData = doorMeshesRef.current.get(doorNum);
      if (!doorData) return;

      const alreadyRevealed = revealedDoorsRef.current.has(doorNum);

      // ── TOGGLE: Close an open revealed door ────────────────────────────────
      // (allowed even when canInteract is false – purely local visual)
      if (doorData.isOpen && alreadyRevealed) {
        playDoorTapSound();
        const animClose = new Animation(
          `doorCloseAnim-${doorNum}`,
          "rotation.y",
          30,
          Animation.ANIMATIONTYPE_FLOAT,
          Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        animClose.setKeys([
          { frame: 0, value: doorData.hingeRoot.rotation.y },
          { frame: 14, value: 0 },
        ]);
        const easeClose = new QuadraticEase();
        easeClose.setEasingMode(EasingFunction.EASINGMODE_EASEIN);
        animClose.setEasingFunction(easeClose);
        doorData.hingeRoot.animations = [animClose];
        if (sceneRef.current) sceneRef.current.beginAnimation(doorData.hingeRoot, 0, 14, false);
        doorData.isOpen = false;
        return;
      }

      // ── TOGGLE: Re-open a closed (but already revealed) door ───────────────
      // (allowed even when canInteract is false – purely local visual)
      if (!doorData.isOpen && alreadyRevealed) {
        playDoorTapSound();
        doorData.isOpen = true;
        doorData.openedAtTime = performance.now() - 3000; // skip stamp intro
        doorData.lastRenderTime = 0;
        drawDoorInterior(doorData, performance.now());
        if (doorData.status === "SAFE")  doorData.revealMat.emissiveColor = new Color3(0.1, 0.45, 0.25);
        if (doorData.status === "BOMB")  doorData.revealMat.emissiveColor = new Color3(0.55, 0.1, 0.1);
        if (doorData.status === "THIEF") doorData.revealMat.emissiveColor = new Color3(0.65, 0.5, 0.1);
        if (doorData.status === "CLUE")  doorData.revealMat.emissiveColor = new Color3(0.5, 0.2, 0.8);
        if (doorData.status === "LIFE")  doorData.revealMat.emissiveColor = new Color3(0.8, 0.15, 0.3);
        const animReOpen = new Animation(
          `doorReOpenAnim-${doorNum}`,
          "rotation.y",
          30,
          Animation.ANIMATIONTYPE_FLOAT,
          Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        animReOpen.setKeys([
          { frame: 0, value: 0 },
          { frame: 14, value: Math.PI * 0.65 },
        ]);
        const easeOpen = new QuadraticEase();
        easeOpen.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
        animReOpen.setEasingFunction(easeOpen);
        doorData.hingeRoot.animations = [animReOpen];
        if (sceneRef.current) sceneRef.current.beginAnimation(doorData.hingeRoot, 0, 14, false);
        return;
      }

      // ── FIRST OPEN: requires canInteract gate ──────────────────────────────
      if (!canInteractRef.current) return;
      if (doorData.isOpen || alreadyRevealed) return;

      playDoorTapSound();

      // Subtle press feedback
      doorData.hingeRoot.position.z = 0.05;
      setTimeout(() => {
        if (doorData.hingeRoot) doorData.hingeRoot.position.z = 0;
      }, 100);

      // Focus dynamic light on tapped door
      if (spotlightRef.current) {
        spotlightRef.current.position = new Vector3(
          doorData.hingeRoot.position.x + 0.7,
          doorData.hingeRoot.position.y,
          -2.2
        );
        spotlightRef.current.intensity = 0.95;
      }

      // Send action to server
      onOpenDoorRef.current(doorNum);
    });

    // 6. Start Render Loop & Dynamic Interior Animation Loop
    scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      doorMeshesRef.current.forEach((door) => {
        if (door.isOpen && door.status !== "LOCKED" && door.revealTexture) {
          // Throttle updates to ~33ms (30fps) for smooth animations with zero lag
          if (now - door.lastRenderTime >= 30) {
            drawDoorInterior(door, now);
          }
        }
      });
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    // Trigger initial responsive camera framing
    updateCameraResponsive();

    const handleResize = () => {
      engine.resize();
      updateCameraResponsive();
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      scene.dispose();
      engine.dispose();
      sceneRef.current = null;
      engineRef.current = null;
    };
  }, []);

  // Handle Door Result Animations when server responds
  useEffect(() => {
    if (!latestDoorResult || !sceneRef.current) return;
    const { doorId, result } = latestDoorResult;
    const door = doorMeshesRef.current.get(doorId);
    if (!door) return;

    door.isOpen = true;
    door.status = result;
    if (latestDoorResult.clue) {
      door.clueText = latestDoorResult.clue;
    }
    door.openedAtTime = performance.now();
    door.lastRenderTime = 0;
    door.stampSoundPlayed = false;

    // Immediately render frame 0 of the result interior
    drawDoorInterior(door, performance.now());

    // Play appropriate sound effect
    if (result === "SAFE") {
      playDoorOpenSound();
      setTimeout(() => playSafeDoorSound(), 200);
      door.revealMat.emissiveColor = new Color3(0.1, 0.45, 0.25);
    } else if (result === "BOMB") {
      playDoorOpenSound();
      setTimeout(() => {
        playBombExplosionSound();
        triggerCameraShake();
      }, 150);
      door.revealMat.emissiveColor = new Color3(0.55, 0.1, 0.1);
    } else if (result === "THIEF") {
      playDoorOpenSound();
      setTimeout(() => playThiefCaughtSound(), 250);
      door.revealMat.emissiveColor = new Color3(0.65, 0.5, 0.1);
    } else if (result === "CLUE") {
      playDoorOpenSound();
      setTimeout(() => playSafeDoorSound(), 200);
      door.revealMat.emissiveColor = new Color3(0.5, 0.2, 0.8);
    } else if (result === "LIFE") {
      playDoorOpenSound();
      setTimeout(() => playSafeDoorSound(), 200);
      door.revealMat.emissiveColor = new Color3(0.8, 0.15, 0.3);
    }

    // Door Swing Animation: Open OUTWARD (positive rotation around Y axis) towards camera
    const animSwing = new Animation(
      `doorOpenAnim-${doorId}`,
      "rotation.y",
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: 0 },
      { frame: 18, value: Math.PI * 0.65 }, // ~117 degrees outward toward the camera!
    ];
    animSwing.setKeys(keys);

    const easing = new QuadraticEase();
    easing.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
    animSwing.setEasingFunction(easing);

    door.hingeRoot.animations = [animSwing];
    sceneRef.current.beginAnimation(door.hingeRoot, 0, 18, false);

    // Particle FX at revealed door compartment
    const worldPos = new Vector3(
      door.hingeRoot.position.x + 0.72,
      door.hingeRoot.position.y,
      door.hingeRoot.position.z - 0.2
    );
    triggerParticleExplosion(sceneRef.current, worldPos, result);
  }, [latestDoorResult]);

  // Sync existing revealed doors or reset when game is restarted
  useEffect(() => {
    if (!sceneRef.current) return;

    if (revealedDoors.size === 0) {
      // RESET: Close and lock all 10 doors back to initial chamber state!
      doorMeshesRef.current.forEach((door) => {
        if (sceneRef.current) {
          sceneRef.current.stopAnimation(door.hingeRoot);
        }
        door.isOpen = false;
        door.status = "LOCKED";
        door.hingeRoot.rotation.y = 0;
        door.hingeRoot.animations = [];
        door.openedAtTime = 0;
        door.lastRenderTime = 0;
        door.stampSoundPlayed = false;
        if (door.revealTexture) {
          drawLockedInterior(door.revealTexture.getContext() as CanvasRenderingContext2D);
          door.revealTexture.update(true);
        }
        door.revealMat.emissiveColor = new Color3(0, 0, 0);
      });
      return;
    }

    revealedDoors.forEach((result, doorId) => {
      const door = doorMeshesRef.current.get(doorId);
      if (door && !door.isOpen) {
        door.isOpen = true;
        door.status = result;
        // Keep open outward
        door.hingeRoot.rotation.y = Math.PI * 0.65;
        door.openedAtTime = performance.now() - 3000;
        door.lastRenderTime = 0;
        door.stampSoundPlayed = true;
        drawDoorInterior(door, performance.now());
        if (result === "SAFE") door.revealMat.emissiveColor = new Color3(0.1, 0.45, 0.25);
        if (result === "BOMB") door.revealMat.emissiveColor = new Color3(0.55, 0.1, 0.1);
        if (result === "THIEF") door.revealMat.emissiveColor = new Color3(0.65, 0.5, 0.1);
        if (result === "CLUE") door.revealMat.emissiveColor = new Color3(0.5, 0.2, 0.8);
        if (result === "LIFE") door.revealMat.emissiveColor = new Color3(0.8, 0.15, 0.3);
      }
    });
  }, [revealedDoors, resetKey]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-gradient-to-b from-[#0b0317] via-[#140624] to-[#070110]">
      {/* 3D Babylon Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none outline-none cursor-pointer"
        tabIndex={0}
        aria-label="3D Mystery Door Chamber Scene"
      />
    </div>
  );
};
