import React, { useEffect, useRef, useState } from "react";
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
} from "@babylonjs/core";
import { Player } from "../../types/game";
import { playCardShuffleSound } from "../../utils/soundUtils";

interface CardState {
  id: string;
  selectedBy: string | null;
}

interface BabylonRoleCardSceneProps {
  cardsState: CardState[];
  players: Player[];
  currentPlayerId: string;
  myPrivateRole?: { cardId: string; role: string } | null;
  onSelectCard: (cardId: string) => void;
  onFallback?: () => void;
}

const ROLE_ASSETS: Record<string, { title: string; subtitle: string; imageSrc: string; themeColor: string }> = {
  Raja: {
    title: "RAJA",
    subtitle: "The King of the Kingdom",
    imageSrc: "/assets/images/raja.png",
    themeColor: "#FFD700",
  },
  Rani: {
    title: "RANI",
    subtitle: "The Queen of the Kingdom",
    imageSrc: "/assets/images/rani.png",
    themeColor: "#FF69B4",
  },
  Police: {
    title: "POLICE",
    subtitle: "The Kingdom's Investigator",
    imageSrc: "/assets/images/police.png",
    themeColor: "#1E90FF",
  },
  Thief: {
    title: "THIEF",
    subtitle: "The Secret Culprit",
    imageSrc: "/assets/images/thief.png",
    themeColor: "#50C878",
  },
};

const DEFAULT_CARDS: CardState[] = [
  { id: "card-0", selectedBy: null },
  { id: "card-1", selectedBy: null },
  { id: "card-2", selectedBy: null },
  { id: "card-3", selectedBy: null },
];

/**
 * Calculates responsive card positions based on viewport width.
 * Mobile view (<640px): 2x2 grid layout (2 cards top, 2 cards bottom) to avoid edge clipping.
 * Desktop view (>=640px): 1x4 horizontal row with perfectly balanced proportions.
 */
const getCardTargetPosition = (idx: number, isMobile: boolean): { x: number; y: number; z: number } => {
  if (isMobile) {
    // 2x2 Grid Layout for Mobile (<640px):
    const x = idx % 2 === 0 ? -1.0 : 1.0;
    const y = idx < 2 ? 1.35 : -1.35;
    return { x, y, z: 0 };
  } else {
    // 1x4 Horizontal Row for Desktop (>=640px):
    const desktopPositions = [-2.35, -0.78, 0.78, 2.35];
    return { x: desktopPositions[idx] ?? 0, y: 0, z: 0 };
  }
};

export const BabylonRoleCardScene: React.FC<BabylonRoleCardSceneProps> = ({
  cardsState,
  players,
  currentPlayerId: _currentPlayerId,
  myPrivateRole,
  onSelectCard,
  onFallback,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // References to keep scene objects across state updates
  const sceneRef = useRef<Scene | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const cardMeshesRef = useRef<Record<string, any>>({});
  const frontMaterialsRef = useRef<Record<string, StandardMaterial>>({});
  const hasFlippedRef = useRef<Record<string, boolean>>({});

  const activeCards = cardsState && cardsState.length >= 4 ? cardsState : DEFAULT_CARDS;

  const cardsStateRef = useRef(cardsState);
  const myPrivateRoleRef = useRef(myPrivateRole);
  const onSelectCardRef = useRef(onSelectCard);
  const playShuffleAnimationRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    cardsStateRef.current = cardsState;
    myPrivateRoleRef.current = myPrivateRole;
    onSelectCardRef.current = onSelectCard;
  }, [cardsState, myPrivateRole, onSelectCard]);

  // Helper to generate procedural Card Back texture (upside-down fixed with invertY = false)
  const createCardBackTexture = (scene: Scene, cardNumber: number) => {
    const texture = new DynamicTexture(`cardBackTexture-${cardNumber}`, { width: 512, height: 736 }, scene, false);
    const ctx = texture.getContext() as any;

    // Dark Royal Purple Background
    const grad = ctx.createLinearGradient(0, 0, 0, 736);
    grad.addColorStop(0, "#290947");
    grad.addColorStop(0.5, "#130426");
    grad.addColorStop(1, "#290947");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 736);

    // Inner Pattern Grid Lines
    ctx.strokeStyle = "rgba(251, 226, 120, 0.08)";
    ctx.lineWidth = 2;
    for (let i = -736; i < 736; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 736, 736);
      ctx.stroke();
    }

    // Outer Gold Ornate Border Frame
    ctx.strokeStyle = "#FBE278";
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, 472, 696);

    ctx.strokeStyle = "#B8860B";
    ctx.lineWidth = 4;
    ctx.strokeRect(32, 32, 448, 672);

    // Corner Accents
    const drawCorner = (x: number, y: number) => {
      ctx.fillStyle = "#FBE278";
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCorner(44, 44);
    drawCorner(468, 44);
    drawCorner(44, 692);
    drawCorner(468, 692);

    // Center Emblem Circle
    ctx.beginPath();
    ctx.arc(256, 368, 110, 0, Math.PI * 2);
    ctx.fillStyle = "#1D0736";
    ctx.fill();
    ctx.strokeStyle = "#FBE278";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Inner Gold Crown Emblem & Question Mark Text
    ctx.fillStyle = "#FBE278";
    ctx.font = "900 96px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 256, 368);

    // Top Card Label
    ctx.font = "bold 24px monospace";
    ctx.fillStyle = "rgba(251, 226, 120, 0.7)";
    ctx.fillText(`CARD ${cardNumber}`, 256, 100);

    // Bottom Mystery Text
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#D8C7E0";
    ctx.fillText("SECRET DESTINY", 256, 620);

    texture.update();
    return texture;
  };

  // Helper to generate Card Front texture for revealed role (right side up & unmirrored)
  const createCardFrontTexture = (scene: Scene, role: string) => {
    const asset = ROLE_ASSETS[role] || {
      title: role.toUpperCase(),
      subtitle: "Kingdom Role",
      imageSrc: "",
      themeColor: "#FFD700",
    };

    const texture = new DynamicTexture(`cardFrontTexture-${role}`, { width: 512, height: 736 }, scene, false);
    texture.uScale = -1;
    texture.uOffset = 1;
    texture.vScale = -1;
    texture.vOffset = 1;
    const ctx = texture.getContext() as any;

    // Dark Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 0, 736);
    grad.addColorStop(0, "#300A52");
    grad.addColorStop(0.5, "#0E021E");
    grad.addColorStop(1, "#300A52");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 736);

    // Gold Outer Frame
    ctx.strokeStyle = asset.themeColor;
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, 472, 696);

    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 4;
    ctx.strokeRect(32, 32, 448, 672);

    // Header Title
    ctx.font = "900 32px serif";
    ctx.fillStyle = "#FBE278";
    ctx.textAlign = "center";
    ctx.fillText("YOUR DESTINY", 256, 80);

    // Role Name Banner
    ctx.fillStyle = asset.themeColor;
    ctx.font = "900 52px serif";
    ctx.fillText(asset.title, 256, 520);

    // Role Subtitle
    ctx.font = "600 22px sans-serif";
    ctx.fillStyle = "#E2D4EE";
    ctx.fillText(asset.subtitle, 256, 570);

    // Secret Badge Banner
    ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
    ctx.fillRect(80, 620, 352, 44);
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 620, 352, 44);
    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "#34D399";
    ctx.fillText("🛡️ PRIVATE TO YOU", 256, 648);

    // Load Character Image onto Canvas Texture
    if (asset.imageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = asset.imageSrc;
      img.onload = () => {
        // Draw character artwork inside glowing circular frame
        ctx.save();
        ctx.beginPath();
        ctx.arc(256, 290, 140, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 116, 150, 280, 280);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(256, 290, 140, 0, Math.PI * 2);
        ctx.strokeStyle = asset.themeColor;
        ctx.lineWidth = 8;
        ctx.stroke();

        texture.update();
      };
    }

    texture.update();
    return texture;
  };

  // Helper to generate Card Locked texture for cards chosen by other players
  const createCardLockedTexture = (scene: Scene, playerName?: string) => {
    const texture = new DynamicTexture(`cardLockedTexture-${Math.random()}`, { width: 512, height: 736 }, scene, false);
    const ctx = texture.getContext() as any;

    // Dark Royal Lock Background
    const grad = ctx.createLinearGradient(0, 0, 0, 736);
    grad.addColorStop(0, "#23053D");
    grad.addColorStop(0.5, "#0D0219");
    grad.addColorStop(1, "#23053D");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 736);

    // Inner Pattern Grid
    ctx.strokeStyle = "rgba(168, 85, 247, 0.15)";
    ctx.lineWidth = 2;
    for (let i = -736; i < 736; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 736, 736);
      ctx.stroke();
    }

    // Outer Purple/Gold Lock Frame
    ctx.strokeStyle = "#A855F7";
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, 472, 696);

    ctx.strokeStyle = "#FBE278";
    ctx.lineWidth = 4;
    ctx.strokeRect(32, 32, 448, 672);

    // Center Lock Emblem Circle
    ctx.beginPath();
    ctx.arc(256, 368, 110, 0, Math.PI * 2);
    ctx.fillStyle = "#16052B";
    ctx.fill();
    ctx.strokeStyle = "#FBE278";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Lock Icon 🔒
    ctx.font = "900 80px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🔒", 256, 368);

    // Top Label
    ctx.font = "bold 26px sans-serif";
    ctx.fillStyle = "#FBE278";
    ctx.fillText("LOCKED", 256, 100);

    // Bottom Selected Player Label
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#D8C7E0";
    ctx.fillText(playerName ? `TAKEN BY ${playerName.toUpperCase()}` : "TAKEN BY PLAYER", 256, 620);

    texture.update();
    return texture;
  };

  const mountTimeRef = useRef<number>(Date.now());

  // Initialize Babylon Engine & 3D Scene
  useEffect(() => {
    mountTimeRef.current = Date.now();
    if (!canvasRef.current) return;

    let engine: Engine;
    try {
      engine = new Engine(canvasRef.current, true, {
        preserveDrawingBuffer: false,
        stencil: false,
        powerPreference: "high-performance",
        disableWebGL2Support: false,
      });
      // Cap hardware scaling on high-DPI mobile screens to prevent GPU overheating
      engine.setHardwareScalingLevel(window.devicePixelRatio > 1.5 ? 1.35 : 1.0);
      engineRef.current = engine;
    } catch (err) {
      console.warn("Babylon.js WebGL initialization failed, falling back to 2D UI:", err);
      if (onFallback) onFallback();
      return;
    }

    const scene = new Scene(engine);
    sceneRef.current = scene;
    scene.clearColor = new Color4(0, 0, 0, 0); // Transparent background to layer over dark purple container

    // 1. Camera (ArcRotateCamera with dynamic responsive fitting)
    const camera = new ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2.5, 5.8, new Vector3(0, 0, 0), scene);
    camera.inputs.clear(); // Disable user rotation/drag

    const updateCameraResponsive = () => {
      if (!engine || !camera) return;
      const width = engine.getRenderWidth();
      const height = engine.getRenderHeight();
      if (!width || !height) return;

      const aspect = width / height;
      const isMobile = window.innerWidth < 640;

      if (isMobile) {
        // Mobile 2x2 Grid: fits both vertically and horizontally with safe padding
        const vertUnits = 5.2;
        const horizUnits = 3.6;
        const radiusForVert = vertUnits / (2 * Math.tan(camera.fov / 2));
        const radiusForHoriz = (horizUnits / aspect) / (2 * Math.tan(camera.fov / 2));
        camera.radius = Math.max(radiusForVert, radiusForHoriz, 6.8);
        camera.target = new Vector3(0, 0, 0);
      } else {
        // Desktop 1x4 Horizontal Row: calculates required camera distance so all 4 cards never clip on any resolution/aspect ratio
        const vertUnits = 3.2;
        const horizUnits = 6.6;
        const radiusForVert = vertUnits / (2 * Math.tan(camera.fov / 2));
        const radiusForHoriz = (horizUnits / aspect) / (2 * Math.tan(camera.fov / 2));
        camera.radius = Math.max(radiusForVert, radiusForHoriz, 5.4);
        camera.target = new Vector3(0, 0, 0);
      }
    };

    updateCameraResponsive();

    // 2. Lighting Setup
    const hemiLight = new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);
    hemiLight.diffuse = new Color3(0.7, 0.5, 0.95); // Purple ambient tint
    hemiLight.groundColor = new Color3(0.15, 0.05, 0.25);
    hemiLight.intensity = 0.95;

    const dirLight = new DirectionalLight("DirLight", new Vector3(-1, -2, 1), scene);
    dirLight.diffuse = new Color3(1.0, 0.85, 0.45); // Gold directional highlight
    dirLight.intensity = 1.3;

    const pointLight = new PointLight("SelectLight", new Vector3(0, 2, -2), scene);
    pointLight.diffuse = new Color3(1.0, 0.9, 0.5);
    pointLight.intensity = 0.5;

    const isMobileInit = window.innerWidth < 640;

    // 3. Build 4 Physical 3D Box Cards (Proportionately scaled to fit beautifully on all screens)
    activeCards.forEach((card, idx) => {
      const cardMesh = MeshBuilder.CreateBox(
        card.id,
        {
          width: 1.48,
          height: 2.22,
          depth: 0.05,
        },
        scene
      );

      const targetPos = getCardTargetPosition(idx, isMobileInit);
      cardMesh.position = new Vector3(targetPos.x, targetPos.y, targetPos.z);

      const backTexture = createCardBackTexture(scene, idx + 1);
      const backMat = new StandardMaterial(`backMat-${card.id}`, scene);
      backMat.diffuseTexture = backTexture;
      backMat.specularColor = new Color3(0.4, 0.3, 0.5);
      backMat.emissiveColor = new Color3(0.08, 0.04, 0.15);

      cardMesh.material = backMat;

      // Custom metadata for interactivity
      (cardMesh as any).cardId = card.id;
      (cardMesh as any).cardIdx = idx;
      (cardMesh as any).baseX = targetPos.x;
      (cardMesh as any).baseY = targetPos.y;
      (cardMesh as any).baseZ = targetPos.z;

      cardMeshesRef.current[card.id] = cardMesh;
    });

    // 4. Cinematic 3D Card Shuffle Animation on Mount & Round Start
    const playShuffleAnimation = () => {
      playCardShuffleSound();
      const isMobile = window.innerWidth < 640;

      activeCards.forEach((card, idx) => {
        const mesh = cardMeshesRef.current[card.id];
        if (!mesh) return;

        scene.stopAnimation(mesh);
        mesh.animations = [];
        mesh.rotation.y = 0;
        mesh.rotation.x = 0;
        mesh.rotation.z = 0;

        const targetPos = getCardTargetPosition(idx, isMobile);
        const tempPos = isMobile
          ? getCardTargetPosition((idx + 1) % 4, isMobile)
          : getCardTargetPosition((idx + 2) % 4, isMobile);

        const animX = new Animation("shuffleX", "position.x", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const animY = new Animation("shuffleY", "position.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const animRotZ = new Animation("shuffleRotZ", "rotation.z", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);

        const easing = new QuadraticEase();
        easing.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        animX.setEasingFunction(easing);
        animY.setEasingFunction(easing);

        animX.setKeys([
          { frame: 0, value: targetPos.x },
          { frame: 20, value: tempPos.x },
          { frame: 45, value: targetPos.x },
        ]);

        animY.setKeys([
          { frame: 0, value: targetPos.y },
          { frame: 20, value: targetPos.y + 0.6 },
          { frame: 45, value: targetPos.y },
        ]);

        animRotZ.setKeys([
          { frame: 0, value: 0 },
          { frame: 20, value: (idx % 2 === 0 ? 1 : -1) * 0.15 },
          { frame: 45, value: 0 },
        ]);

        mesh.animations = [animX, animY, animRotZ];
        scene.beginAnimation(mesh, 0, 45, false, 1.0 + idx * 0.08);
      });
    };

    playShuffleAnimationRef.current = playShuffleAnimation;
    playShuffleAnimation();

    // 5. Interactive Pointer Pick & Hover Handling
    const pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
        if (pointerInfo.pickInfo && pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh) {
          const pickedId = (pointerInfo.pickInfo.pickedMesh as any).cardId;
          if (pickedId) {
            setHoveredCardId(pickedId);
            const mesh = pointerInfo.pickInfo.pickedMesh;
            if (!hasFlippedRef.current[pickedId] && (!mesh.animations || !mesh.animations.length)) {
              const baseY = (mesh as any).baseY ?? 0;
              mesh.position.y = baseY + 0.15;
            }
          }
        } else {
          setHoveredCardId(null);
          // Reset unselected card Y positions to their base positions
          Object.entries(cardMeshesRef.current).forEach(([id, mesh]) => {
            const baseY = (mesh as any).baseY ?? 0;
            if (!hasFlippedRef.current[id] && mesh.position.y === baseY + 0.15) {
              mesh.position.y = baseY;
            }
          });
        }
      }

      if (pointerInfo.type === PointerEventTypes.POINTERPICK) {
        if (pointerInfo.pickInfo && pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh) {
          const pickedId = (pointerInfo.pickInfo.pickedMesh as any).cardId;
          if (pickedId && !myPrivateRoleRef.current) {
            const targetCard = cardsStateRef.current?.find((c) => c.id === pickedId);
            if (targetCard && !targetCard.selectedBy) {
              onSelectCardRef.current(pickedId);
            }
          }
        }
      }
    });

    // Render Loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Resize Handler
    const handleResize = () => {
      engine.resize();
      updateCameraResponsive();
      const isMobileNow = window.innerWidth < 640;
      activeCards.forEach((card, idx) => {
        const mesh = cardMeshesRef.current[card.id];
        if (mesh && !hasFlippedRef.current[card.id] && (!mesh.animations || !mesh.animations.length)) {
          const pos = getCardTargetPosition(idx, isMobileNow);
          mesh.position.x = pos.x;
          mesh.position.y = pos.y;
          mesh.position.z = pos.z;
          (mesh as any).baseX = pos.x;
          (mesh as any).baseY = pos.y;
          (mesh as any).baseZ = pos.z;
        }
      });
    };
    window.addEventListener("resize", handleResize);

    // Pause WebGL rendering when tab is hidden to save battery & prevent heating
    const handleVisibilityChange = () => {
      if (!engine || !scene) return;
      if (document.hidden) {
        engine.stopRenderLoop();
      } else {
        engine.stopRenderLoop();
        engine.runRenderLoop(() => {
          scene.render();
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Component Unmount Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (pointerObserver) {
        scene.onPointerObservable.remove(pointerObserver);
      }
      scene.dispose();
      engine.dispose();
      sceneRef.current = null;
      engineRef.current = null;
      playShuffleAnimationRef.current = null;
    };
  }, []);

  // Track previous cardsState to detect round restarts
  const prevCardsStateRef = useRef<CardState[]>(cardsState);

  // Update card positions, selection states, and private role reveal animations dynamically
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const allCardsUnselected = activeCards.every((c) => c.selectedBy === null);
    const prevHadSelections = prevCardsStateRef.current.some((c) => c.selectedBy !== null);
    const isNewRound = !myPrivateRole && allCardsUnselected && prevHadSelections;

    if (!myPrivateRole && (allCardsUnselected || isNewRound)) {
      // Clear flip cache when starting a fresh card selection round
      hasFlippedRef.current = {};
    }

    if (isNewRound && playShuffleAnimationRef.current) {
      playShuffleAnimationRef.current();
    }

    prevCardsStateRef.current = cardsState;

    const isMobileCurrent = window.innerWidth < 640;

    activeCards.forEach((card, idx) => {
      const mesh = cardMeshesRef.current[card.id];
      if (!mesh) return;

      const isMySelection = myPrivateRole && myPrivateRole.cardId === card.id;
      const targetPos = getCardTargetPosition(idx, isMobileCurrent);

      // If no private role assigned yet and card is not selected, restore default material and transform
      if (!myPrivateRole && !card.selectedBy) {
        scene.stopAnimation(mesh);
        mesh.animations = [];
        const backMat = scene.getMaterialByName(`backMat-${card.id}`);
        if (backMat) {
          mesh.material = backMat;
        }
        mesh.rotation.y = 0;
        mesh.rotation.x = 0;
        mesh.rotation.z = 0;
        mesh.position.x = targetPos.x;
        mesh.position.y = targetPos.y;
        mesh.position.z = targetPos.z;
        (mesh as any).baseX = targetPos.x;
        (mesh as any).baseY = targetPos.y;
        (mesh as any).baseZ = targetPos.z;
        mesh.scaling = new Vector3(1, 1, 1);
      }

      // Handle PRIVATE 3D FLIP REVEAL for the selecting player ONLY
      if (isMySelection && myPrivateRole && !hasFlippedRef.current[card.id]) {
        hasFlippedRef.current[card.id] = true;

        scene.stopAnimation(mesh);
        mesh.animations = [];

        // 1. Assign Role Front Texture to card material
        const frontTexture = createCardFrontTexture(scene, myPrivateRole.role);
        const mat = frontMaterialsRef.current[card.id] || new StandardMaterial(`frontMat-${card.id}`, scene);
        mat.diffuseTexture = frontTexture;
        mat.emissiveColor = new Color3(0.2, 0.15, 0.3);
        mesh.material = mat;

        // 2. Smooth 3D Flip & Camera Focus Animation
        const animRotY = new Animation("flipY", "rotation.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const animZ = new Animation("moveZ", "position.z", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const animY = new Animation("moveY", "position.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);

        const easing = new QuadraticEase();
        easing.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
        animRotY.setEasingFunction(easing);

        animRotY.setKeys([
          { frame: 0, value: 0 },
          { frame: 45, value: Math.PI },
        ]);

        // Keep position z within FOV bounds (-0.6 instead of -1.2) to avoid cropping card edges
        animZ.setKeys([
          { frame: 0, value: 0 },
          { frame: 25, value: -0.7 },
          { frame: 45, value: -0.55 },
        ]);

        animY.setKeys([
          { frame: 0, value: mesh.position.y },
          { frame: 25, value: 0.35 },
          { frame: 45, value: 0.25 },
        ]);

        mesh.animations = [animRotY, animZ, animY];
        scene.beginAnimation(mesh, 0, 45, false, 1.0);

        // 3. Magical Gold & Purple Particle Burst Effect
        const particleSystem = new ParticleSystem("particles", 120, scene);
        particleSystem.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", scene);
        particleSystem.emitter = mesh;
        particleSystem.minEmitBox = new Vector3(-0.8, -1.1, 0);
        particleSystem.maxEmitBox = new Vector3(0.8, 1.1, 0);
        particleSystem.color1 = new Color4(1.0, 0.85, 0.3, 1.0);
        particleSystem.color2 = new Color4(0.8, 0.3, 0.9, 1.0);
        particleSystem.minSize = 0.08;
        particleSystem.maxSize = 0.22;
        particleSystem.minLifeTime = 0.4;
        particleSystem.maxLifeTime = 0.9;
        particleSystem.emitRate = 100;
        particleSystem.targetStopDuration = 1.2;
        particleSystem.start();
      }

      // If card selected by someone else -> stays face down, locked visually with Lock texture
      if (card.selectedBy && !isMySelection) {
        scene.stopAnimation(mesh);
        mesh.animations = [];
        const selectingPlayer = players.find((p) => p.id === card.selectedBy);
        const lockTexture = createCardLockedTexture(scene, selectingPlayer?.name);
        const lockMat = new StandardMaterial(`lockMat-${card.id}`, scene);
        lockMat.diffuseTexture = lockTexture;
        lockMat.emissiveColor = new Color3(0.12, 0.05, 0.2);
        mesh.material = lockMat;
        mesh.rotation.y = 0;
        mesh.position.x = targetPos.x;
        mesh.position.y = targetPos.y - 0.12;
        mesh.position.z = targetPos.z;
        mesh.scaling = new Vector3(0.95, 0.95, 0.95);
      }
    });
  }, [cardsState, myPrivateRole, players]);

  return (
    <div className="relative w-full h-[400px] sm:h-[440px] md:h-[480px] lg:h-[520px] max-h-[65vh] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.25)] border border-[#4A2078]/60 bg-gradient-to-b from-[#1C0836]/90 via-[#0B0218]/95 to-[#1C0836]/90 flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full touch-none focus:outline-none cursor-pointer block" />

      {/* Hover Instruction Overlay */}
      {hoveredCardId && !myPrivateRole && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#11052C]/90 border border-[#FBE278]/60 text-[#FBE278] text-xs font-bold px-4 py-1.5 rounded-full shadow-lg pointer-events-none animate-bounce">
          ✨ Click to lock your destiny with this 3D card
        </div>
      )}
    </div>
  );
};
