import { GameMode } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubmitScore } from "@/hooks/useQueries";
import {
  ArrowLeft,
  ChevronRight,
  Coins,
  FastForward,
  Heart,
  Info,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Trophy,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Position {
  x: number;
  y: number;
}

type TowerType =
  | "pebble"
  | "fishCannon"
  | "iceMage"
  | "wavecaller"
  | "lookout"
  | "engineer";
type EnemyType =
  | "gull"
  | "crab"
  | "seal"
  | "jelly"
  | "krakenling"
  | "stormLord";
type RouteType = "route1" | "route2" | "route3";
type GameSpeed = 0.5 | 1 | 2;

interface Tower {
  id: number;
  x: number;
  y: number;
  type: TowerType;
  level: number;
  range: number;
  damage: number;
  fireRate: number;
  lastFired: number;
  upgradeCost: number;
  upgradeLevel: number;
  specialEffect?: string;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  pathIndex: number;
  type: EnemyType;
  reward: number;
  burrowed?: boolean;
  burrowTimer?: number;
  regenTimer?: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetId: number;
  damage: number;
  splash?: boolean;
  slow?: boolean;
  speed: number;
}

interface Alert {
  id: number;
  message: string;
  timestamp: number;
}

interface PuffinTowerDefenseGameProps {
  onBack: () => void;
}

const TOWER_DATA: Record<
  TowerType,
  {
    name: string;
    cost: number;
    baseDamage: number;
    baseRange: number;
    baseFireRate: number;
    description: string;
    role: string;
    attackType: string;
    specialAbility: string;
    image: string;
    upgrades: string[];
  }
> = {
  pebble: {
    name: "Pebble-Launcher",
    cost: 50,
    baseDamage: 15,
    baseRange: 120,
    baseFireRate: 800,
    description: "Rapid single-target attacks",
    role: "Basic DPS",
    attackType: "Single-Target Projectile",
    specialAbility: "Fast fire rate for consistent damage",
    image: "/assets/generated/pebble-launcher-puffin-transparent.dim_64x64.png",
    upgrades: ["Double-Beak Mode", "Precision Pebble"],
  },
  fishCannon: {
    name: "Fish-Cannon Nest",
    cost: 80,
    baseDamage: 25,
    baseRange: 100,
    baseFireRate: 1500,
    description: "Splash damage fish projectiles",
    role: "Area Damage",
    attackType: "Splash Projectile",
    specialAbility: "Damages multiple enemies in blast radius",
    image: "/assets/generated/fish-cannon-nest-transparent.dim_64x64.png",
    upgrades: ["Frozen Fish Ammo", "Tidal Burst"],
  },
  iceMage: {
    name: "Ice-Mage Puffin",
    cost: 70,
    baseDamage: 10,
    baseRange: 110,
    baseFireRate: 1000,
    description: "Slows enemies with frost",
    role: "Crowd Control",
    attackType: "Frost Projectile",
    specialAbility: "Slows enemy movement speed significantly",
    image: "/assets/generated/ice-mage-puffin-transparent.dim_64x64.png",
    upgrades: ["Frost Feathers", "Icy Storm Aura"],
  },
  wavecaller: {
    name: "Wavecaller Drum",
    cost: 100,
    baseDamage: 30,
    baseRange: 90,
    baseFireRate: 2000,
    description: "AOE wave splash damage",
    role: "Heavy AOE",
    attackType: "Wave Blast",
    specialAbility: "Large area-of-effect wave attacks",
    image: "/assets/generated/wavecaller-drum-tower-transparent.dim_64x64.png",
    upgrades: ["Tidal Blast", "Echo Resonance"],
  },
  lookout: {
    name: "Lookout Tower",
    cost: 60,
    baseDamage: 5,
    baseRange: 150,
    baseFireRate: 1200,
    description: "Boosts nearby towers",
    role: "Support",
    attackType: "Light Projectile",
    specialAbility: "Increases damage and range of nearby towers",
    image: "/assets/generated/lookout-puffin-tower-transparent.dim_64x64.png",
    upgrades: ["Sharp-Eyed Scout"],
  },
  engineer: {
    name: "Engineer Turret",
    cost: 90,
    baseDamage: 20,
    baseRange: 130,
    baseFireRate: 1100,
    description: "Shell-shrapnel projectiles",
    role: "Balanced DPS",
    attackType: "Mechanical Projectile",
    specialAbility: "Reliable damage with good range",
    image: "/assets/generated/engineer-puffin-turret-transparent.dim_64x64.png",
    upgrades: ["Shell Armor Reinforcement", "Steam Booster"],
  },
};

const ENEMY_DATA: Record<
  EnemyType,
  {
    name: string;
    baseHealth: number;
    baseSpeed: number;
    reward: number;
    image: string;
    size: number;
  }
> = {
  gull: {
    name: "Greedy Gull",
    baseHealth: 30,
    baseSpeed: 2.5,
    reward: 8,
    image: "/assets/generated/greedy-gull-transparent.dim_48x48.png",
    size: 48,
  },
  crab: {
    name: "Sneaky Crab",
    baseHealth: 50,
    baseSpeed: 1.5,
    reward: 12,
    image: "/assets/generated/sneaky-crab-transparent.dim_48x48.png",
    size: 48,
  },
  seal: {
    name: "Frost Seal",
    baseHealth: 120,
    baseSpeed: 0.8,
    reward: 20,
    image: "/assets/generated/frost-seal-transparent.dim_64x64.png",
    size: 64,
  },
  jelly: {
    name: "Jelly Swarm",
    baseHealth: 15,
    baseSpeed: 1.2,
    reward: 5,
    image: "/assets/generated/jelly-swarm-transparent.dim_32x32.png",
    size: 32,
  },
  krakenling: {
    name: "Krakenling",
    baseHealth: 200,
    baseSpeed: 0.6,
    reward: 40,
    image: "/assets/generated/krakenling-transparent.dim_96x96.png",
    size: 96,
  },
  stormLord: {
    name: "Storm Gull Lord",
    baseHealth: 500,
    baseSpeed: 1.0,
    reward: 100,
    image: "/assets/generated/storm-gull-lord-transparent.dim_128x128.png",
    size: 128,
  },
};

const ROUTE_DATA: Record<
  RouteType,
  {
    name: string;
    path: Position[];
  }
> = {
  route1: {
    name: "Northern Path",
    path: [
      { x: 0, y: 150 },
      { x: 150, y: 150 },
      { x: 150, y: 300 },
      { x: 350, y: 300 },
      { x: 350, y: 100 },
      { x: 550, y: 100 },
      { x: 550, y: 250 },
      { x: 700, y: 250 },
      { x: 700, y: 400 },
      { x: 800, y: 400 },
    ],
  },
  route2: {
    name: "Central Path",
    path: [
      { x: 0, y: 300 },
      { x: 200, y: 300 },
      { x: 200, y: 450 },
      { x: 400, y: 450 },
      { x: 400, y: 200 },
      { x: 600, y: 200 },
      { x: 600, y: 350 },
      { x: 800, y: 350 },
    ],
  },
  route3: {
    name: "Southern Path",
    path: [
      { x: 0, y: 450 },
      { x: 100, y: 450 },
      { x: 100, y: 200 },
      { x: 300, y: 200 },
      { x: 300, y: 500 },
      { x: 500, y: 500 },
      { x: 500, y: 300 },
      { x: 650, y: 300 },
      { x: 650, y: 150 },
      { x: 800, y: 150 },
    ],
  },
};

export default function PuffinTowerDefenseGame({
  onBack,
}: PuffinTowerDefenseGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);

  const towersRef = useRef<Tower[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const alertsRef = useRef<Alert[]>([]);
  const nextTowerIdRef = useRef(0);
  const nextEnemyIdRef = useRef(0);
  const nextProjectileIdRef = useRef(0);
  const nextAlertIdRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const enemiesSpawnedRef = useRef(0);
  const mousePositionRef = useRef<Position>({ x: 0, y: 0 });

  const [isGameActive, setIsGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(
    "pebble",
  );
  const [selectedRoute, setSelectedRoute] = useState<RouteType>("route1");
  const [showRouteSelect, setShowRouteSelect] = useState(false);
  const [placementMode, setPlacementMode] = useState(false);
  const [gameSpeed, setGameSpeed] = useState<GameSpeed>(0.5);
  const [isPaused, setIsPaused] = useState(false);

  const [wave, setWave] = useState(1);
  const [health, setHealth] = useState(20);
  const [fish, setFish] = useState(150);
  const [score, setScore] = useState(0);
  const [waveInProgress, setWaveInProgress] = useState(false);

  const submitScoreMutation = useSubmitScore();

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const TILE_SIZE = 50;

  const PATH = ROUTE_DATA[selectedRoute].path;

  const showAlert = (message: string) => {
    const alert: Alert = {
      id: nextAlertIdRef.current++,
      message,
      timestamp: Date.now(),
    };
    alertsRef.current.push(alert);

    setTimeout(() => {
      alertsRef.current = alertsRef.current.filter((a) => a.id !== alert.id);
    }, 3000);
  };

  const initGame = () => {
    towersRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    alertsRef.current = [];
    nextTowerIdRef.current = 0;
    nextEnemyIdRef.current = 0;
    nextProjectileIdRef.current = 0;
    nextAlertIdRef.current = 0;
    spawnTimerRef.current = 0;
    enemiesSpawnedRef.current = 0;
    lastTimestampRef.current = 0;

    setWave(1);
    setHealth(20);
    setFish(150);
    setScore(0);
    setIsGameActive(true);
    setGameOver(false);
    setShowNameInput(false);
    setShowRouteSelect(false);
    setSelectedTower(null);
    setSelectedTowerType("pebble");
    setWaveInProgress(false);
    setPlacementMode(false);
    setGameSpeed(0.5);
    setIsPaused(false);
  };

  const randomizeRoute = () => {
    const routes: RouteType[] = ["route1", "route2", "route3"];
    const randomRoute = routes[Math.floor(Math.random() * routes.length)];
    setSelectedRoute(randomRoute);
  };

  const startWave = () => {
    setWaveInProgress(true);
    enemiesSpawnedRef.current = 0;
    spawnTimerRef.current = 0;
    showAlert(`Wave ${wave} Start!`);
  };

  const getWaveComposition = (waveNum: number): EnemyType[] => {
    const composition: EnemyType[] = [];

    // Boss waves
    if (waveNum % 10 === 0) {
      composition.push("stormLord");
      for (let i = 0; i < 5; i++) composition.push("gull");
      return composition;
    }

    // Mini-boss waves
    if (waveNum % 5 === 0) {
      composition.push("krakenling");
      for (let i = 0; i < 3; i++) composition.push("seal");
      return composition;
    }

    // Regular waves
    const baseCount = 5 + Math.floor(waveNum / 2);

    for (let i = 0; i < baseCount; i++) {
      if (waveNum >= 8) {
        composition.push(
          Math.random() < 0.3 ? "seal" : Math.random() < 0.5 ? "crab" : "gull",
        );
      } else if (waveNum >= 5) {
        composition.push(Math.random() < 0.4 ? "crab" : "gull");
      } else if (waveNum >= 3) {
        composition.push(Math.random() < 0.3 ? "crab" : "gull");
      } else {
        composition.push("gull");
      }
    }

    // Add jelly swarms
    if (waveNum >= 4) {
      const jellyCount = Math.floor(waveNum / 3);
      for (let i = 0; i < jellyCount; i++) {
        composition.push("jelly", "jelly", "jelly");
      }
    }

    return composition;
  };

  const spawnEnemy = (type: EnemyType, waveNum: number) => {
    const data = ENEMY_DATA[type];
    const healthMultiplier = 1 + (waveNum - 1) * 0.15;
    const speedMultiplier = 1 + (waveNum - 1) * 0.05;

    const enemy: Enemy = {
      id: nextEnemyIdRef.current++,
      x: PATH[0].x,
      y: PATH[0].y,
      health: Math.floor(data.baseHealth * healthMultiplier),
      maxHealth: Math.floor(data.baseHealth * healthMultiplier),
      speed: data.baseSpeed * speedMultiplier,
      pathIndex: 0,
      type,
      reward: Math.floor(data.reward * (1 + waveNum * 0.1)),
    };

    // Special enemy abilities
    if (type === "crab") {
      enemy.burrowed = false;
      enemy.burrowTimer = 0;
    }

    if (type === "krakenling") {
      enemy.regenTimer = 0;
    }

    enemiesRef.current.push(enemy);
  };

  const isValidPlacement = (x: number, y: number): boolean => {
    // Check if on path with expanded collision area
    const onPath = PATH.some((point, index) => {
      if (index === PATH.length - 1) return false;
      const next = PATH[index + 1];
      const minX = Math.min(point.x, next.x) - 40;
      const maxX = Math.max(point.x, next.x) + 40;
      const minY = Math.min(point.y, next.y) - 40;
      const maxY = Math.max(point.y, next.y) + 40;
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    });

    if (onPath) return false;

    // Check if tower already exists
    const exists = towersRef.current.some(
      (t) => Math.abs(t.x - x) < TILE_SIZE && Math.abs(t.y - y) < TILE_SIZE,
    );

    return !exists;
  };

  const placeTower = (gridX: number, gridY: number) => {
    if (!selectedTowerType) return;

    const towerCost = TOWER_DATA[selectedTowerType].cost;
    if (fish < towerCost) {
      showAlert("Not Enough Fish Tokens!");
      return;
    }

    const x = gridX * TILE_SIZE + TILE_SIZE / 2;
    const y = gridY * TILE_SIZE + TILE_SIZE / 2;

    if (!isValidPlacement(x, y)) {
      showAlert("Cannot Place Tower Here!");
      return;
    }

    const data = TOWER_DATA[selectedTowerType];

    towersRef.current.push({
      id: nextTowerIdRef.current++,
      x,
      y,
      type: selectedTowerType,
      level: 1,
      range: data.baseRange,
      damage: data.baseDamage,
      fireRate: data.baseFireRate,
      lastFired: 0,
      upgradeCost: Math.floor(data.cost * 0.8),
      upgradeLevel: 0,
    });

    setFish((prev) => prev - towerCost);
    setPlacementMode(false);
  };

  const upgradeTower = (tower: Tower) => {
    if (fish < tower.upgradeCost) {
      showAlert("Not Enough Fish Tokens!");
      return;
    }

    const data = TOWER_DATA[tower.type];

    if (tower.upgradeLevel < data.upgrades.length) {
      tower.upgradeLevel += 1;
      tower.level += 1;
      tower.damage = Math.floor(tower.damage * 1.4);
      tower.range = Math.floor(tower.range * 1.15);
      tower.fireRate = Math.floor(tower.fireRate * 0.85);
      tower.specialEffect = data.upgrades[tower.upgradeLevel - 1];
      tower.upgradeCost = Math.floor(tower.upgradeCost * 1.6);

      setFish((prev) => prev - tower.upgradeCost);
      setSelectedTower({ ...tower });
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicked on existing tower
    const clickedTower = towersRef.current.find(
      (t) => Math.abs(t.x - x) < 32 && Math.abs(t.y - y) < 32,
    );

    if (clickedTower) {
      setSelectedTower(clickedTower);
      setPlacementMode(false);
      return;
    }

    // Otherwise, try to place tower if in placement mode
    if (placementMode && selectedTowerType) {
      const gridX = Math.floor(x / TILE_SIZE);
      const gridY = Math.floor(y / TILE_SIZE);
      placeTower(gridX, gridY);
    }

    setSelectedTower(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    mousePositionRef.current = { x, y };
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Draw clean coastal sky/water background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.5, "#B3E5FC");
    gradient.addColorStop(1, "#4FC3F7");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw path with brown/sandy color
    ctx.strokeStyle = "rgba(139, 115, 85, 0.7)";
    ctx.lineWidth = 50;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) {
      ctx.lineTo(PATH[i].x, PATH[i].y);
    }
    ctx.stroke();

    // Draw nest at end
    const nestImg = new Image();
    nestImg.src = "/assets/generated/puffin-nest-transparent.dim_96x96.png";
    ctx.drawImage(
      nestImg,
      PATH[PATH.length - 1].x - 48,
      PATH[PATH.length - 1].y - 48,
      96,
      96,
    );
  };

  const drawTopMenu = (ctx: CanvasRenderingContext2D) => {
    // Draw semi-transparent background for top menu
    ctx.fillStyle = "rgba(30, 136, 229, 0.9)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, 60);

    // Draw border
    ctx.strokeStyle = "#FF6B35";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, 60);

    // Blue fish icon for resources
    const fishIconImg = new Image();
    fishIconImg.src = "/assets/generated/resource-fish-icon.dim_32x32.png";
    ctx.drawImage(fishIconImg, 15, 14, 32, 32);

    // Draw fish tokens with better spacing
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(fish.toString(), 55, 30);

    // Draw health with clean heart icon
    const heartImg = new Image();
    heartImg.src =
      "/assets/generated/clean-heart-lives-icon-transparent.dim_24x24.png";
    ctx.drawImage(heartImg, 180, 18, 24, 24);
    ctx.fillStyle = "#FF4444";
    ctx.font = "bold 22px Arial";
    ctx.fillText(health.toString(), 210, 30);

    // Draw wave number centered
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Wave ${wave}`, CANVAS_WIDTH / 2, 30);

    // Draw score on the right
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`Score: ${score}`, CANVAS_WIDTH - 15, 30);
  };

  const drawPlacementPreview = (ctx: CanvasRenderingContext2D) => {
    if (!placementMode || !selectedTowerType) return;

    const mousePos = mousePositionRef.current;
    const gridX = Math.floor(mousePos.x / TILE_SIZE);
    const gridY = Math.floor(mousePos.y / TILE_SIZE);
    const x = gridX * TILE_SIZE + TILE_SIZE / 2;
    const y = gridY * TILE_SIZE + TILE_SIZE / 2;

    const isValid = isValidPlacement(x, y);
    const data = TOWER_DATA[selectedTowerType];

    // Highlight placement tile
    ctx.fillStyle = isValid
      ? "rgba(30, 136, 229, 0.3)"
      : "rgba(244, 67, 54, 0.4)";
    ctx.fillRect(gridX * TILE_SIZE, gridY * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    // Draw glow border
    ctx.strokeStyle = isValid
      ? "rgba(30, 136, 229, 0.6)"
      : "rgba(244, 67, 54, 0.8)";
    ctx.lineWidth = 3;
    ctx.strokeRect(gridX * TILE_SIZE, gridY * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    // Draw ghost tower
    ctx.globalAlpha = 0.6;
    const img = new Image();
    img.src = data.image;
    ctx.drawImage(img, x - 32, y - 32, 64, 64);

    // Draw range preview
    ctx.strokeStyle = isValid
      ? "rgba(30, 136, 229, 0.3)"
      : "rgba(244, 67, 54, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, data.baseRange, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 1;
  };

  const drawTower = (ctx: CanvasRenderingContext2D, tower: Tower) => {
    const data = TOWER_DATA[tower.type];
    const img = new Image();
    img.src = data.image;
    ctx.drawImage(img, tower.x - 32, tower.y - 32, 64, 64);

    // Draw level indicator
    ctx.fillStyle = "#FF6B35";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Lv${tower.level}`, tower.x, tower.y + 42);

    // Draw range if selected
    if (selectedTower?.id === tower.id) {
      ctx.strokeStyle = "rgba(30, 136, 229, 0.5)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.stroke();

      // Draw filled circle for better visibility
      ctx.fillStyle = "rgba(30, 136, 229, 0.1)";
      ctx.fill();
    }

    // Lookout tower aura
    if (tower.type === "lookout") {
      ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    const data = ENEMY_DATA[enemy.type];

    // Don't draw burrowed crabs
    if (enemy.type === "crab" && enemy.burrowed) {
      ctx.fillStyle = "rgba(139, 115, 85, 0.5)";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, data.size / 3, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const img = new Image();
    img.src = data.image;
    ctx.drawImage(
      img,
      enemy.x - data.size / 2,
      enemy.y - data.size / 2,
      data.size,
      data.size,
    );

    // Health bar with smooth animation
    const barWidth = Math.max(40, data.size);
    const barHeight = 6;
    const healthPercent = enemy.health / enemy.maxHealth;

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(
      enemy.x - barWidth / 2,
      enemy.y - data.size / 2 - 12,
      barWidth,
      barHeight,
    );

    // Health fill
    ctx.fillStyle =
      healthPercent > 0.5
        ? "#4CAF50"
        : healthPercent > 0.25
          ? "#FFC107"
          : "#F44336";
    ctx.fillRect(
      enemy.x - barWidth / 2,
      enemy.y - data.size / 2 - 12,
      barWidth * healthPercent,
      barHeight,
    );

    // Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      enemy.x - barWidth / 2,
      enemy.y - data.size / 2 - 12,
      barWidth,
      barHeight,
    );

    // Freeze indicator
    if (enemy.speed < ENEMY_DATA[enemy.type].baseSpeed * 0.7) {
      ctx.fillStyle = "rgba(100, 200, 255, 0.5)";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, data.size / 2 + 5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawProjectile = (
    ctx: CanvasRenderingContext2D,
    projectile: Projectile,
  ) => {
    if (projectile.splash) {
      ctx.fillStyle = "#1E88E5";
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (projectile.slow) {
      ctx.fillStyle = "#64B5F6";
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#FF6B35";
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawAlerts = (ctx: CanvasRenderingContext2D) => {
    const now = Date.now();
    alertsRef.current.forEach((alert, index) => {
      const age = now - alert.timestamp;
      const opacity = Math.max(0, 1 - age / 3000);

      ctx.save();
      ctx.globalAlpha = opacity;

      // Background
      ctx.fillStyle = "rgba(30, 136, 229, 0.9)";
      ctx.fillRect(CANVAS_WIDTH / 2 - 150, 80 + index * 50, 300, 40);

      // Border
      ctx.strokeStyle = "#FF6B35";
      ctx.lineWidth = 2;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 150, 80 + index * 50, 300, 40);

      // Text
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(alert.message, CANVAS_WIDTH / 2, 100 + index * 50);

      ctx.restore();
    });
  };

  const gameLoop = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate delta time with game speed
    if (lastTimestampRef.current === 0) {
      lastTimestampRef.current = timestamp;
    }
    const deltaTime = isPaused
      ? 0
      : (timestamp - lastTimestampRef.current) * gameSpeed;
    lastTimestampRef.current = timestamp;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground(ctx);

    // Spawn enemies during wave
    if (waveInProgress && !isPaused) {
      const waveComposition = getWaveComposition(wave);
      spawnTimerRef.current += deltaTime;

      if (
        spawnTimerRef.current >= 800 &&
        enemiesSpawnedRef.current < waveComposition.length
      ) {
        spawnEnemy(waveComposition[enemiesSpawnedRef.current], wave);
        enemiesSpawnedRef.current++;
        spawnTimerRef.current = 0;
      }

      // Check if wave is complete
      if (
        enemiesSpawnedRef.current >= waveComposition.length &&
        enemiesRef.current.length === 0
      ) {
        setWaveInProgress(false);
        setWave((prev) => prev + 1);
        setFish((prev) => prev + 50 + wave * 15);
        setScore((prev) => prev + wave * 50);
        showAlert("Wave Complete!");
      }
    }

    // Update enemies
    if (!isPaused) {
      enemiesRef.current = enemiesRef.current.filter((enemy) => {
        // Crab burrow mechanic
        if (enemy.type === "crab" && enemy.burrowTimer !== undefined) {
          enemy.burrowTimer += deltaTime;
          if (enemy.burrowTimer >= 3000) {
            enemy.burrowed = !enemy.burrowed;
            enemy.burrowTimer = 0;
          }
        }

        // Krakenling regeneration
        if (enemy.type === "krakenling" && enemy.regenTimer !== undefined) {
          enemy.regenTimer += deltaTime;
          if (enemy.regenTimer >= 1000) {
            enemy.health = Math.min(
              enemy.health + enemy.maxHealth * 0.02,
              enemy.maxHealth,
            );
            enemy.regenTimer = 0;
          }
        }

        if (enemy.pathIndex >= PATH.length - 1) {
          setHealth((prev) => {
            const newHealth = prev - 1;
            if (newHealth <= 0) {
              setIsGameActive(false);
              setGameOver(true);
              setShowNameInput(true);
            }
            return newHealth;
          });
          return false;
        }

        const target = PATH[enemy.pathIndex + 1];
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const moveSpeed = enemy.speed * (deltaTime / 16);

        if (distance < moveSpeed) {
          enemy.pathIndex++;
          if (enemy.pathIndex < PATH.length - 1) {
            enemy.x = PATH[enemy.pathIndex].x;
            enemy.y = PATH[enemy.pathIndex].y;
          }
        } else {
          enemy.x += (dx / distance) * moveSpeed;
          enemy.y += (dy / distance) * moveSpeed;
        }

        drawEnemy(ctx, enemy);
        return true;
      });
    }

    // Update towers and fire
    towersRef.current.forEach((tower) => {
      drawTower(ctx, tower);

      if (
        !isPaused &&
        timestamp - tower.lastFired >= tower.fireRate / gameSpeed
      ) {
        // Find target
        let target: Enemy | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        for (const enemy of enemiesRef.current) {
          // Burrowed crabs can't be targeted
          if (enemy.type === "crab" && enemy.burrowed) continue;

          const dx = enemy.x - tower.x;
          const dy = enemy.y - tower.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= tower.range && distance < closestDistance) {
            target = enemy;
            closestDistance = distance;
          }
        }

        if (target) {
          const isSplash =
            tower.type === "fishCannon" || tower.type === "wavecaller";
          const isSlow = tower.type === "iceMage";

          projectilesRef.current.push({
            id: nextProjectileIdRef.current++,
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            targetId: target.id,
            damage: tower.damage,
            splash: isSplash,
            slow: isSlow,
            speed: 6,
          });
          tower.lastFired = timestamp;
        }
      }
    });

    // Update projectiles
    if (!isPaused) {
      projectilesRef.current = projectilesRef.current.filter((projectile) => {
        const dx = projectile.targetX - projectile.x;
        const dy = projectile.targetY - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const moveSpeed = projectile.speed * (deltaTime / 16);

        if (distance < moveSpeed) {
          // Hit
          if (projectile.splash) {
            // Splash damage
            enemiesRef.current.forEach((enemy) => {
              const edx = enemy.x - projectile.targetX;
              const edy = enemy.y - projectile.targetY;
              const edist = Math.sqrt(edx * edx + edy * edy);
              if (edist < 80) {
                enemy.health -= projectile.damage * (1 - edist / 80);
                if (enemy.health <= 0) {
                  setFish((prev) => prev + enemy.reward);
                  setScore((prev) => prev + enemy.reward);
                }
              }
            });
          } else {
            const target = enemiesRef.current.find(
              (e) => e.id === projectile.targetId,
            );
            if (target) {
              target.health -= projectile.damage;

              // Slow effect
              if (projectile.slow && target.type !== "seal") {
                target.speed = Math.max(target.speed * 0.6, 0.3);
              }

              if (target.health <= 0) {
                setFish((prev) => prev + target.reward);
                setScore((prev) => prev + target.reward);
              }
            }
          }

          enemiesRef.current = enemiesRef.current.filter((e) => e.health > 0);
          return false;
        }

        projectile.x += (dx / distance) * moveSpeed;
        projectile.y += (dy / distance) * moveSpeed;

        drawProjectile(ctx, projectile);
        return true;
      });
    }

    // Draw placement preview
    drawPlacementPreview(ctx);

    // Draw top menu bar (on top of everything)
    drawTopMenu(ctx);

    // Draw alerts
    drawAlerts(ctx);

    // Draw Start Wave button overlay when not in progress
    if (isGameActive && !waveInProgress && !isPaused) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw button background
      const buttonWidth = 200;
      const buttonHeight = 60;
      const buttonX = CANVAS_WIDTH / 2 - buttonWidth / 2;
      const buttonY = CANVAS_HEIGHT / 2 - buttonHeight / 2;

      ctx.fillStyle = "rgba(30, 136, 229, 0.95)";
      ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

      ctx.strokeStyle = "#FF6B35";
      ctx.lineWidth = 3;
      ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Start Wave ${wave}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

      ctx.restore();
    }

    if (isGameActive) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  };

  const handleSubmitScore = async () => {
    if (playerName.trim() && score > 0) {
      await submitScoreMutation.mutateAsync({
        gameMode: GameMode.puffinTowerDefense,
        playerName: playerName.trim(),
        score: BigInt(score),
      });
      setShowNameInput(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  }, []);

  useEffect(() => {
    if (isGameActive) {
      lastTimestampRef.current = 0;
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [
    isGameActive,
    wave,
    waveInProgress,
    selectedTower,
    selectedRoute,
    placementMode,
    gameSpeed,
    isPaused,
  ]);

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold md:text-4xl">
              Puffin Tower Defense
            </h1>
            <p className="mt-2 text-muted-foreground">
              Build puffin towers to defend your eggs from waves of enemies!
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowInstructions(true)}
            className="shrink-0"
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>

        {/* Game Speed Controls - Positioned above canvas */}
        {isGameActive && (
          <div className="mb-4 flex justify-end">
            <div className="flex items-center gap-2 bg-background/80 p-2 rounded-lg border border-border shadow-md">
              <Button
                size="sm"
                variant={isPaused ? "default" : "outline"}
                onClick={() => setIsPaused(!isPaused)}
                className="h-8 w-8 p-0"
              >
                {isPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant={gameSpeed === 0.5 ? "default" : "outline"}
                onClick={() => setGameSpeed(0.5)}
                className="h-8 px-2"
              >
                0.5x
              </Button>
              <Button
                size="sm"
                variant={gameSpeed === 1 ? "default" : "outline"}
                onClick={() => setGameSpeed(1)}
                className="h-8 px-2"
              >
                1x
              </Button>
              <Button
                size="sm"
                variant={gameSpeed === 2 ? "default" : "outline"}
                onClick={() => setGameSpeed(2)}
                className="h-8 px-2"
              >
                <FastForward className="h-4 w-4 mr-1" />
                2x
              </Button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_200px] gap-6">
          <div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative flex justify-center bg-muted p-4">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full border-4 border-border rounded-lg shadow-lg cursor-pointer"
                    onClick={(e) => {
                      if (isGameActive && !waveInProgress && !isPaused) {
                        // Check if clicked on Start Wave button area
                        const canvas = canvasRef.current;
                        if (!canvas) return;
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvas.width / rect.width;
                        const scaleY = canvas.height / rect.height;
                        const x = (e.clientX - rect.left) * scaleX;
                        const y = (e.clientY - rect.top) * scaleY;

                        const buttonWidth = 200;
                        const buttonHeight = 60;
                        const buttonX = CANVAS_WIDTH / 2 - buttonWidth / 2;
                        const buttonY = CANVAS_HEIGHT / 2 - buttonHeight / 2;

                        if (
                          x >= buttonX &&
                          x <= buttonX + buttonWidth &&
                          y >= buttonY &&
                          y <= buttonY + buttonHeight
                        ) {
                          startWave();
                          return;
                        }
                      }
                      handleCanvasClick(e);
                    }}
                    onMouseMove={handleCanvasMouseMove}
                  />

                  {/* Start Game Button Overlay - Positioned over canvas */}
                  {!isGameActive && !gameOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <Button
                        size="lg"
                        onClick={() => setShowRouteSelect(true)}
                        className="gap-2 shadow-2xl"
                      >
                        <RotateCcw className="h-5 w-5" />
                        Start Game
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 space-y-4">
              {gameOver && showNameInput && (
                <Card>
                  <CardHeader>
                    <CardTitle>Game Over!</CardTitle>
                    <CardDescription>
                      You survived {wave - 1} waves! Final score: {score}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="playerName">Your Name</Label>
                      <Input
                        id="playerName"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Enter your name"
                        maxLength={20}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitScore}
                        disabled={
                          !playerName.trim() || submitScoreMutation.isPending
                        }
                      >
                        {submitScoreMutation.isPending
                          ? "Submitting..."
                          : "Submit Score"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowRouteSelect(true)}
                      >
                        Play Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Tower Info Panel */}
              {isGameActive && selectedTower && (
                <Card className="border-2 border-primary shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <img
                        src={TOWER_DATA[selectedTower.type].image}
                        alt=""
                        className="w-8 h-8"
                      />
                      {TOWER_DATA[selectedTower.type].name}
                    </CardTitle>
                    <CardDescription>
                      Level {selectedTower.level} •{" "}
                      {TOWER_DATA[selectedTower.type].role}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-accent/10 rounded-lg space-y-1 text-sm">
                      <div>
                        <strong>Attack Type:</strong>{" "}
                        {TOWER_DATA[selectedTower.type].attackType}
                      </div>
                      <div>
                        <strong>Special:</strong>{" "}
                        {TOWER_DATA[selectedTower.type].specialAbility}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-accent/10 rounded">
                        <div className="text-xs text-muted-foreground">
                          Damage
                        </div>
                        <div className="font-bold text-accent">
                          {selectedTower.damage}
                        </div>
                      </div>
                      <div className="p-2 bg-primary/10 rounded">
                        <div className="text-xs text-muted-foreground">
                          Range
                        </div>
                        <div className="font-bold text-primary">
                          {selectedTower.range}
                        </div>
                      </div>
                      <div className="p-2 bg-green-500/10 rounded">
                        <div className="text-xs text-muted-foreground">
                          Fire Rate
                        </div>
                        <div className="font-bold text-green-600">
                          {(1000 / selectedTower.fireRate).toFixed(1)}/s
                        </div>
                      </div>
                      <div className="p-2 bg-yellow-500/10 rounded">
                        <div className="text-xs text-muted-foreground">
                          Upgrade
                        </div>
                        <div className="font-bold text-yellow-600">
                          {selectedTower.upgradeCost} 🐟
                        </div>
                      </div>
                    </div>
                    {selectedTower.specialEffect && (
                      <div className="p-2 bg-accent/10 rounded text-xs">
                        <strong>Current Upgrade:</strong>{" "}
                        {selectedTower.specialEffect}
                      </div>
                    )}
                    {selectedTower.upgradeLevel <
                    TOWER_DATA[selectedTower.type].upgrades.length ? (
                      <>
                        <div className="p-2 bg-primary/10 rounded text-xs">
                          <strong>Next Upgrade:</strong>{" "}
                          {
                            TOWER_DATA[selectedTower.type].upgrades[
                              selectedTower.upgradeLevel
                            ]
                          }
                        </div>
                        <Button
                          onClick={() => upgradeTower(selectedTower)}
                          disabled={fish < selectedTower.upgradeCost}
                          className="w-full"
                        >
                          Upgrade Tower ({selectedTower.upgradeCost} 🐟)
                        </Button>
                      </>
                    ) : (
                      <div className="text-sm text-center text-muted-foreground font-semibold">
                        ⭐ Max Level Reached ⭐
                      </div>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setSelectedTower(null)}
                      className="w-full"
                    >
                      Close
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Tower Menu Sidebar - Right Side */}
          {isGameActive && (
            <div className="space-y-2">
              <h3 className="font-bold text-lg mb-3 text-center">Tower Menu</h3>
              {(Object.keys(TOWER_DATA) as TowerType[]).map((type) => {
                const data = TOWER_DATA[type];
                const canAfford = fish >= data.cost;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedTowerType(type);
                      setPlacementMode(true);
                      setSelectedTower(null);
                    }}
                    disabled={!canAfford}
                    className={`w-full p-2 rounded-lg border-2 transition-all ${
                      placementMode && selectedTowerType === type
                        ? "border-primary bg-primary/20 shadow-lg"
                        : canAfford
                          ? "border-border hover:border-primary/50 hover:bg-primary/5"
                          : "border-border opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={data.image}
                        alt={data.name}
                        className="w-12 h-12"
                      />
                      <div className="text-xs font-semibold text-center">
                        {data.name}
                      </div>
                      <div className="text-xs font-bold text-accent">
                        {data.cost} 🐟
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How to Play: Puffin Tower Defense</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p className="text-base">
                Build puffin towers to defend your eggs from waves of enemies.
                Earn fish tokens to upgrade your defenses!
              </p>

              <div>
                <h3 className="font-bold text-base mb-2">Gameplay:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    Game starts at 0.5x speed - use speed controls to adjust
                    gameplay pace
                  </li>
                  <li>
                    Select a tower type from the right sidebar to enter
                    placement mode
                  </li>
                  <li>
                    Click on the map to place towers (avoid the path - invalid
                    spots show in red)
                  </li>
                  <li>
                    Click on placed towers to view detailed stats and upgrade
                    them
                  </li>
                  <li>
                    Click the "Start Wave" button overlay when ready to begin
                    each wave
                  </li>
                  <li>Defeat enemies to earn fish currency</li>
                  <li>Use game speed controls to pause or speed up gameplay</li>
                  <li>Choose different enemy routes for varied challenges</li>
                  <li>Don't let enemies reach your nest!</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-base mb-2">Tower Types:</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Pebble-Launcher:</strong> Fast single-target attacks
                    for consistent DPS
                  </div>
                  <div>
                    <strong>Fish-Cannon:</strong> Splash damage projectiles hit
                    multiple enemies
                  </div>
                  <div>
                    <strong>Ice-Mage:</strong> Slows enemies with frost for
                    crowd control
                  </div>
                  <div>
                    <strong>Wavecaller:</strong> Large AOE wave attacks for
                    heavy damage
                  </div>
                  <div>
                    <strong>Lookout:</strong> Support tower that boosts nearby
                    tower stats
                  </div>
                  <div>
                    <strong>Engineer:</strong> Balanced mechanical projectiles
                    with good range
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base mb-2">Enemy Types:</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Greedy Gull:</strong> Fast but weak
                  </div>
                  <div>
                    <strong>Sneaky Crab:</strong> Can burrow to avoid attacks
                  </div>
                  <div>
                    <strong>Frost Seal:</strong> Tanky and freeze-resistant
                  </div>
                  <div>
                    <strong>Jelly Swarm:</strong> Weak groups vulnerable to
                    splash
                  </div>
                  <div>
                    <strong>Krakenling:</strong> Mini-boss with regeneration
                  </div>
                  <div>
                    <strong>Storm Gull Lord:</strong> Final boss with high
                    health
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowInstructions(false)}>Got it!</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRouteSelect} onOpenChange={setShowRouteSelect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Enemy Route</DialogTitle>
            <DialogDescription>
              Choose the path enemies will take across the island
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {(Object.keys(ROUTE_DATA) as RouteType[]).map((routeType) => {
              const routeInfo = ROUTE_DATA[routeType];
              return (
                <button
                  key={routeType}
                  onClick={() => {
                    setSelectedRoute(routeType);
                    initGame();
                  }}
                  className="w-full p-4 rounded-lg border-2 border-border hover:border-primary transition-all text-left"
                >
                  <div className="font-bold text-lg">{routeInfo.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Strategic enemy pathing
                  </div>
                </button>
              );
            })}
            <Button
              onClick={() => {
                randomizeRoute();
                initGame();
              }}
              className="w-full gap-2"
              variant="outline"
            >
              <Shuffle className="h-4 w-4" />
              Randomize Route
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
