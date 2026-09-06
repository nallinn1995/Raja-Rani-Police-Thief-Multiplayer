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
} from "../../utils/mysteryAudio";

interface DoorMeshRef {
  frame: Mesh;
  panel: Mesh;
  doorId: number;
  doorMat: StandardMaterial;
  revealMat: StandardMaterial;
  isOpen: boolean;
  status: "LOCKED" | "SAFE" | "BOMB" | "THIEF";
  hingeRoot: Mesh;
}

interface DoorOfMysterySceneProps {
  revealedDoors: Map<number, DetectiveDoorOutcome>;
  selectedDoorId?: number | null;
  latestDoorResult: { doorId: number; result: DetectiveDoorOutcome } | null;
  onOpenDoor: (doorId: number) => void;
  canInteract: boolean;
  onFallback?: () => void;
  resetKey?: number;
}

export const DoorOfMysteryScene: React.FC<DoorOfMysterySceneProps> = ({
  revealedDoors,
  latestDoorResult,
  onOpenDoor,
  canInteract,
  onFallback,
  resetKey,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const doorMeshesRef = useRef<Map<number, DoorMeshRef>>(new Map());
  const spotlightRef = useRef<PointLight | null>(null);
  const floorMeshRef = useRef<Mesh | null>(null);
  const currentLayoutRef = useRef<{ cols: number; rows: number }>({ cols: 4, rows: 3 });

  // Keep refs for callbacks so events don't get stale closures
  const canInteractRef = useRef(canInteract);
  const onOpenDoorRef = useRef(onOpenDoor);
  const revealedDoorsRef = useRef(revealedDoors);
  const onFallbackRef = useRef(onFallback);

  useEffect(() => {
    canInteractRef.current = canInteract;
    onOpenDoorRef.current = onOpenDoor;
    revealedDoorsRef.current = revealedDoors;
    onFallbackRef.current = onFallback;
  }, [canInteract, onOpenDoor, revealedDoors, onFallback]);

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

  // Helper 2: Generate interior compartment reveal texture (revealed when door opens outward)
  const createRevealInteriorTexture = (
    scene: Scene,
    doorNum: number,
    state: "LOCKED" | "SAFE" | "BOMB" | "THIEF"
  ) => {
    const texture = new DynamicTexture(`doorRevealTex-${doorNum}-${state}`, { width: 512, height: 768 }, scene, false);
    const ctx = texture.getContext() as CanvasRenderingContext2D;

    if (state === "SAFE") {
      // Emerald Chamber
      const grad = ctx.createLinearGradient(0, 0, 0, 768);
      grad.addColorStop(0, "#064E3B");
      grad.addColorStop(0.5, "#022C22");
      grad.addColorStop(1, "#064E3B");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 768);

      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 14;
      ctx.strokeRect(16, 16, 480, 736);

      ctx.font = "900 130px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🛡️", 256, 320);

      ctx.font = "900 52px sans-serif";
      ctx.fillStyle = "#34D399";
      ctx.fillText("SAFE!", 256, 470);

      ctx.font = "bold 28px sans-serif";
      ctx.fillStyle = "#A7F3D0";
      ctx.fillText("SECTOR CLEARED", 256, 530);

      ctx.font = "bold 24px sans-serif";
      ctx.fillStyle = "#FDE68A";
      ctx.fillText("+100 PTS", 256, 600);
    } else if (state === "BOMB") {
      // Crimson Bomb Chamber
      const grad = ctx.createLinearGradient(0, 0, 0, 768);
      grad.addColorStop(0, "#7F1D1D");
      grad.addColorStop(0.5, "#450A0A");
      grad.addColorStop(1, "#7F1D1D");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 768);

      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 14;
      ctx.strokeRect(16, 16, 480, 736);

      ctx.font = "900 130px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("💣", 256, 320);

      ctx.font = "900 50px sans-serif";
      ctx.fillStyle = "#F87171";
      ctx.fillText("BOOBY TRAP!", 256, 470);

      ctx.font = "bold 30px sans-serif";
      ctx.fillStyle = "#FECACA";
      ctx.fillText("-1 LIFE LOST", 256, 530);

      ctx.font = "bold 26px sans-serif";
      ctx.fillStyle = "#FCA5A5";
      ctx.fillText("EXPLOSION DETECTED", 256, 600);
    } else if (state === "THIEF") {
      // Golden Thief Vault
      const grad = ctx.createLinearGradient(0, 0, 0, 768);
      grad.addColorStop(0, "#78350F");
      grad.addColorStop(0.5, "#451A03");
      grad.addColorStop(1, "#78350F");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 768);

      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 14;
      ctx.strokeRect(16, 16, 480, 736);

      ctx.font = "900 130px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🕵️", 256, 320);

      ctx.font = "900 48px sans-serif";
      ctx.fillStyle = "#FBBF24";
      ctx.fillText("THIEF CAUGHT!", 256, 470);

      ctx.font = "bold 30px sans-serif";
      ctx.fillStyle = "#FEF3C7";
      ctx.fillText("CRIMINAL CAPTURED", 256, 530);

      ctx.font = "bold 26px sans-serif";
      ctx.fillStyle = "#FDE68A";
      ctx.fillText("+1000 PTS VICTORY", 256, 600);
    } else {
      // Dark chamber interior (waiting to be opened)
      ctx.fillStyle = "#0A0314";
      ctx.fillRect(0, 0, 512, 768);
    }

    texture.update();
    return texture;
  };

  // Build Particle Effect for Bomb (Fire/Sparks) or Thief (Golden Rays)
  const triggerParticleExplosion = (scene: Scene, position: Vector3, type: "BOMB" | "THIEF" | "SAFE") => {
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

    // Calculate optimal matrix layout based on screen dimensions and aspect ratio
    const getOptimalLayout = (aspect: number, width: number, height: number): { cols: number; rows: number } => {
      // Mobile portrait or narrow vertical viewports: 3 columns x 4 rows
      if (aspect < 0.9 || (width < 700 && height > width)) {
        return { cols: 3, rows: 4 };
      }
      // Ultra-wide displays or phone landscape viewports: 6 columns x 2 rows
      if (aspect >= 1.95 || (height < 520 && aspect > 1.7)) {
        return { cols: 6, rows: 2 };
      }
      // Standard landscape desktop / laptop / tablet: 4 columns x 3 rows
      return { cols: 4, rows: 3 };
    };

    // Reposition all 12 door meshes dynamically according to active matrix mode
    const repositionDoors = (cols: number, rows: number) => {
      const startX = -((cols - 1) * spacingX) / 2;
      const startY = ((rows - 1) * spacingY) / 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const doorNum = row * cols + col + 1;
          if (doorNum > 12) break;
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

      // Tailored camera framing for the active layout mode
      if (cols === 3) {
        // Portrait 3x4 layout:
        // Offset target downward slightly so the top HUD bar does not overlap top row
        camera.target = new Vector3(0, -0.45, 0);
        camera.radius = Math.max(10.2, 7.8 / aspect);
      } else if (cols === 6) {
        // Ultra-wide / mobile landscape 6x2 layout
        camera.target = new Vector3(0, -0.2, 0);
        camera.radius = Math.max(7.8, 11.2 / aspect);
      } else {
        // Standard 4x3 desktop / tablet layout
        camera.target = new Vector3(0, -0.3, 0);
        if (aspect < 1.2) {
          camera.radius = Math.max(9.6, 7.2 / aspect);
        } else {
          camera.radius = 8.8;
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

    // 4. Build the 12 3D Doors Matrix dynamically
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
        if (doorNum > 12) break;
        const posX = startX + col * spacingX;
        const posY = startY - row * spacingY;

        // Outer Stone/Gold Door Frame
        const frame = MeshBuilder.CreateBox(
          `doorFrame-${doorNum}`,
          { width: doorWidth + 0.18, height: doorHeight + 0.18, depth: 0.12 },
          scene
        );
        frame.position = new Vector3(posX, posY, 0.04);

        const frameMat = new StandardMaterial(`frameMat-${doorNum}`, scene);
        frameMat.diffuseColor = new Color3(0.18, 0.08, 0.28);
        frameMat.specularColor = new Color3(0.85, 0.65, 0.25);
        frameMat.emissiveColor = new Color3(0.04, 0.02, 0.07);
        frame.material = frameMat;

        // Interior compartment reveal plane inside the frame
        const revealPlane = MeshBuilder.CreatePlane(
          `doorReveal-${doorNum}`,
          { width: doorWidth - 0.02, height: doorHeight - 0.02 },
          scene
        );
        revealPlane.position = new Vector3(0, 0, -0.05);
        revealPlane.parent = frame;

        const revealMat = new StandardMaterial(`revealMat-${doorNum}`, scene);
        revealMat.diffuseTexture = createRevealInteriorTexture(scene, doorNum, "LOCKED");
        revealMat.specularColor = new Color3(0.2, 0.2, 0.2);
        revealPlane.material = revealMat;

        // Hinge Pivot Node on the left edge of door
        const hingeRoot = new Mesh(`hinge-${doorNum}`, scene);
        hingeRoot.position = new Vector3(posX - doorWidth / 2, posY, 0);

        // Door Panel Mesh (child of hinge pivot for realistic outward swing)
        const panel = MeshBuilder.CreateBox(
          `doorPanel-${doorNum}`,
          { width: doorWidth, height: doorHeight, depth: 0.08 },
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
          isOpen: false,
          status: "LOCKED",
          hingeRoot,
        });
      }
    }

    // 5. Pointer/Touch Picking Interaction
    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) return;
      if (!canInteractRef.current) return;

      const pickResult = pointerInfo.pickInfo;
      if (!pickResult || !pickResult.hit || !pickResult.pickedMesh) return;

      const meshName = pickResult.pickedMesh.name;
      const match = meshName.match(/door(Panel|Handle|HandlePlate|Frame)-(\d+)/);
      if (!match) return;

      const doorNum = parseInt(match[2], 10);
      const doorData = doorMeshesRef.current.get(doorNum);

      // Ignore if already revealed or open
      if (!doorData || doorData.isOpen || revealedDoorsRef.current.has(doorNum)) {
        return;
      }

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

    // 6. Start Render Loop
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

    const scene = sceneRef.current;

    // Update the interior compartment texture behind the opening door
    const newRevealTex = createRevealInteriorTexture(scene, doorId, result);
    door.revealMat.diffuseTexture = newRevealTex;

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
    scene.beginAnimation(door.hingeRoot, 0, 18, false);

    // Particle FX at revealed door compartment
    const worldPos = new Vector3(
      door.hingeRoot.position.x + 0.72,
      door.hingeRoot.position.y,
      door.hingeRoot.position.z - 0.2
    );
    triggerParticleExplosion(scene, worldPos, result);
  }, [latestDoorResult]);

  // Sync existing revealed doors or reset when game is restarted
  useEffect(() => {
    if (!sceneRef.current) return;

    if (revealedDoors.size === 0) {
      // RESET: Close and lock all 12 doors back to initial chamber state!
      doorMeshesRef.current.forEach((door) => {
        if (sceneRef.current) {
          sceneRef.current.stopAnimation(door.hingeRoot);
        }
        door.isOpen = false;
        door.status = "LOCKED";
        door.hingeRoot.rotation.y = 0;
        door.hingeRoot.animations = [];
        door.revealMat.diffuseTexture = null;
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
        const revealTex = createRevealInteriorTexture(sceneRef.current!, doorId, result);
        door.revealMat.diffuseTexture = revealTex;
        if (result === "SAFE") door.revealMat.emissiveColor = new Color3(0.1, 0.45, 0.25);
        if (result === "BOMB") door.revealMat.emissiveColor = new Color3(0.55, 0.1, 0.1);
        if (result === "THIEF") door.revealMat.emissiveColor = new Color3(0.65, 0.5, 0.1);
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
