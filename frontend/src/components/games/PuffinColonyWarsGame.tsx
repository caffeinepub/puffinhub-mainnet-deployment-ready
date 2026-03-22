import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Trophy, Swords, Home, Zap, Shield, Lock, Heart, HelpCircle, Target, Crosshair, Coins } from 'lucide-react';
import { useSubmitScore } from '@/hooks/useQueries';
import { GameMode } from '@/backend';

interface Unit {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackRange: number;
  isPlayer: boolean;
  type: string;
  era: number;
  cost: number;
  attackCooldown: number;
  targetLocked?: Unit | null;
  animationFrame: number;
  isMoving: boolean;
  isFighting: boolean;
}

interface Turret {
  level: number;
  experience: number;
  maxExperience: number;
  damage: number;
  range: number;
}

interface Base {
  health: number;
  maxHealth: number;
  x: number;
  y: number;
  turretCooldown: number;
  turret: Turret;
  attack: number;
  attackRange: number;
}

interface Ability {
  name: string;
  cooldown: number;
  maxCooldown: number;
}

interface Snowball {
  x: number;
  y: number;
  targetY: number;
  speed: number;
  damage: number;
}

interface PuffinColonyWarsGameProps {
  onBack: () => void;
}

const ERAS = [
  { name: 'Basic Era', xpRequired: 0, color: '#8B7355' },
  { name: 'Armored Era', xpRequired: 200, color: '#708090' },
  { name: 'Mechanical Era', xpRequired: 500, color: '#4A5568' },
  { name: 'Futuristic Era', xpRequired: 1000, color: '#6366F1' },
];

const UNIT_TYPES = [
  // Basic Era (0)
  { era: 0, name: 'Scout', health: 50, damage: 10, speed: 1.8, range: 25, cost: 40, color: '#8B7355', sprite: 'scout' },
  { era: 0, name: 'Warrior', health: 90, damage: 18, speed: 1.1, range: 30, cost: 70, color: '#A0826D', sprite: 'warrior' },
  { era: 0, name: 'Guard', health: 140, damage: 15, speed: 0.75, range: 28, cost: 100, color: '#6B5D52', sprite: 'guard' },
  
  // Armored Era (1)
  { era: 1, name: 'Knight', health: 170, damage: 28, speed: 0.95, range: 32, cost: 120, color: '#708090', sprite: 'knight' },
  { era: 1, name: 'Archer', health: 100, damage: 35, speed: 1.4, range: 80, cost: 140, color: '#8B9AA8', sprite: 'archer' },
  { era: 1, name: 'Tank', health: 280, damage: 22, speed: 0.55, range: 30, cost: 180, color: '#556B7A', sprite: 'tank' },
  
  // Mechanical Era (2)
  { era: 2, name: 'Mech', health: 220, damage: 45, speed: 1.2, range: 35, cost: 200, color: '#4A5568', sprite: 'mech' },
  { era: 2, name: 'Sniper', health: 130, damage: 70, speed: 1.3, range: 120, cost: 220, color: '#5D6D7E', sprite: 'sniper' },
  { era: 2, name: 'Heavy', health: 380, damage: 38, speed: 0.65, range: 32, cost: 260, color: '#34495E', sprite: 'heavy' },
  
  // Futuristic Era (3)
  { era: 3, name: 'Cyber', health: 300, damage: 60, speed: 1.5, range: 40, cost: 280, color: '#6366F1', sprite: 'cyber' },
  { era: 3, name: 'Laser', health: 200, damage: 90, speed: 1.4, range: 140, cost: 320, color: '#818CF8', sprite: 'laser' },
  { era: 3, name: 'Titan', health: 550, damage: 55, speed: 0.75, range: 35, cost: 380, color: '#4338CA', sprite: 'titan' },
];

// Turret upgrade thresholds and stats with extended range - all turrets use sniper sprite
const TURRET_LEVELS = [
  { level: 1, xpRequired: 0, damage: 12, range: 125, sprite: 'sniper', cost: 0 },
  { level: 2, xpRequired: 100, damage: 22, range: 185, sprite: 'sniper', cost: 200 },
  { level: 3, xpRequired: 250, damage: 35, range: 245, sprite: 'sniper', cost: 500 },
  { level: 4, xpRequired: 500, damage: 50, range: 305, sprite: 'sniper', cost: 1000 },
];

// Base upgrade costs - now affects all units
const BASE_HP_UPGRADE_COST = 150;
const BASE_HP_INCREASE = 300;
const BASE_ATTACK_UPGRADE_COST = 100;
const BASE_ATTACK_INCREASE = 5;
const BASE_RANGE_UPGRADE_COST = 120;
const BASE_RANGE_INCREASE = 15;

const FORMATION_DISTANCE = 45; // Distance units maintain from each other

export default function PuffinColonyWarsGame({ onBack }: PuffinColonyWarsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  
  const playerUnitsRef = useRef<Unit[]>([]);
  const enemyUnitsRef = useRef<Unit[]>([]);
  const snowballsRef = useRef<Snowball[]>([]);
  
  const playerBaseRef = useRef<Base>({ 
    health: 1000, 
    maxHealth: 1000, 
    x: 100, 
    y: 275,
    turretCooldown: 0,
    turret: {
      level: 1,
      experience: 0,
      maxExperience: 100,
      damage: 12,
      range: 125,
    },
    attack: 10,
    attackRange: 85,
  });
  const enemyBaseRef = useRef<Base>({ 
    health: 1000, 
    maxHealth: 1000, 
    x: 900, 
    y: 275,
    turretCooldown: 0,
    turret: {
      level: 1,
      experience: 0,
      maxExperience: 100,
      damage: 8,
      range: 100,
    },
    attack: 8,
    attackRange: 70,
  });
  
  // Global unit bonuses that affect all units
  const [globalAttackBonus, setGlobalAttackBonus] = useState(0);
  const globalAttackBonusRef = useRef(0);
  const [globalRangeBonus, setGlobalRangeBonus] = useState(0);
  const globalRangeBonusRef = useRef(0);
  
  const [resources, setResources] = useState(25);
  const resourcesRef = useRef(25);
  const [experience, setExperience] = useState(0);
  const experienceRef = useRef(0);
  const [era, setEra] = useState(0);
  const eraRef = useRef(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [resourceGainRate, setResourceGainRate] = useState(2.0);
  const resourceGainRateRef = useRef(2.0);

  const [abilities, setAbilities] = useState<Ability[]>([
    { name: 'Snowball Storm', cooldown: 0, maxCooldown: 30000 },
  ]);
  const abilitiesRef = useRef(abilities);

  // Pop-up states
  const [showNewEraPopup, setShowNewEraPopup] = useState(false);
  const [newEraName, setNewEraName] = useState('');
  const [showVictoryPopup, setShowVictoryPopup] = useState(false);
  const [showGameOverScreen, setShowGameOverScreen] = useState(false);
  const [showRewardNotification, setShowRewardNotification] = useState(false);

  const submitScoreMutation = useSubmitScore();

  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 550;
  const LANE_Y = 275;
  const BASE_RESOURCE_GAIN = 1;

  const lastResourceGainRef = useRef(Date.now());
  const lastEnemySpawnRef = useRef(Date.now());
  const enemySpawnIntervalRef = useRef(5500);
  const lastAbilityUpdateRef = useRef(Date.now());
  const animationFrameCounterRef = useRef(0);

  // Load puffin-themed sprite images
  const unitSpritesRef = useRef<{ [key: string]: HTMLImageElement }>({});
  const baseSpriteRef = useRef<HTMLImageElement | null>(null);
  const turretSpriteRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Load specific puffin unit sprites for each unit type
    const unitImages = [
      { key: 'scout', src: '/assets/generated/puffin-scout-unit-transparent.dim_48x48.png' },
      { key: 'warrior', src: '/assets/generated/puffin-warrior-unit-transparent.dim_48x48.png' },
      { key: 'guard', src: '/assets/generated/puffin-guard-unit-transparent.dim_48x48.png' },
      { key: 'knight', src: '/assets/generated/puffin-knight-unit-transparent.dim_48x48.png' },
      { key: 'archer', src: '/assets/generated/puffin-archer-unit-transparent.dim_48x48.png' },
      { key: 'tank', src: '/assets/generated/puffin-tank-unit-transparent.dim_48x48.png' },
      { key: 'mech', src: '/assets/generated/puffin-mech-unit-transparent.dim_48x48.png' },
      { key: 'sniper', src: '/assets/generated/puffin-sniper-unit-transparent.dim_48x48.png' },
      { key: 'heavy', src: '/assets/generated/puffin-heavy-unit-transparent.dim_48x48.png' },
      { key: 'cyber', src: '/assets/generated/puffin-cyber-unit-transparent.dim_48x48.png' },
      { key: 'laser', src: '/assets/generated/puffin-laser-unit-transparent.dim_48x48.png' },
      { key: 'titan', src: '/assets/generated/puffin-titan-unit-transparent.dim_48x48.png' },
    ];

    unitImages.forEach(({ key, src }) => {
      const img = new Image();
      img.src = src;
      unitSpritesRef.current[key] = img;
    });

    // Load cropped transparent puffin colony base sprite
    const baseImg = new Image();
    baseImg.src = '/assets/generated/puffin-colony-base-cropped-transparent.dim_96x96.png';
    baseSpriteRef.current = baseImg;

    // Load sniper sprite for all turret levels
    const turretImg = new Image();
    turretImg.src = '/assets/generated/puffin-sniper-unit-transparent.dim_48x48.png';
    turretSpriteRef.current = turretImg;
  }, []);

  // Sync state with refs for game loop access
  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

  useEffect(() => {
    experienceRef.current = experience;
  }, [experience]);

  useEffect(() => {
    eraRef.current = era;
  }, [era]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    resourceGainRateRef.current = resourceGainRate;
  }, [resourceGainRate]);

  useEffect(() => {
    abilitiesRef.current = abilities;
  }, [abilities]);

  useEffect(() => {
    globalAttackBonusRef.current = globalAttackBonus;
  }, [globalAttackBonus]);

  useEffect(() => {
    globalRangeBonusRef.current = globalRangeBonus;
  }, [globalRangeBonus]);

  // Auto-hide New Era popup after 3 seconds
  useEffect(() => {
    if (showNewEraPopup) {
      const timer = setTimeout(() => {
        setShowNewEraPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNewEraPopup]);

  // Auto-hide Victory popup after 4 seconds, then show reward notification
  useEffect(() => {
    if (showVictoryPopup) {
      const timer = setTimeout(() => {
        setShowVictoryPopup(false);
        setShowRewardNotification(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showVictoryPopup]);

  // Auto-hide Reward notification after 5 seconds, then show name input
  useEffect(() => {
    if (showRewardNotification) {
      const timer = setTimeout(() => {
        setShowRewardNotification(false);
        setShowNameInput(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showRewardNotification]);

  const upgradeTurret = (base: Base) => {
    const currentLevel = base.turret.level;
    const nextLevelData = TURRET_LEVELS.find(t => t.level === currentLevel + 1);
    
    if (nextLevelData && base.turret.experience >= nextLevelData.xpRequired) {
      base.turret.level = nextLevelData.level;
      base.turret.damage = nextLevelData.damage;
      base.turret.range = nextLevelData.range;
      base.turret.experience = 0;
      
      // Set new max experience for next level
      const nextNextLevel = TURRET_LEVELS.find(t => t.level === currentLevel + 2);
      if (nextNextLevel) {
        base.turret.maxExperience = nextNextLevel.xpRequired;
      } else {
        base.turret.maxExperience = 999999; // Max level reached
      }
    }
  };

  const handleManualTurretUpgrade = () => {
    const currentLevel = playerBaseRef.current.turret.level;
    const nextLevelData = TURRET_LEVELS.find(t => t.level === currentLevel + 1);
    
    if (!nextLevelData || !isGameActive || currentLevel >= 4) return;
    
    const upgradeCost = nextLevelData.cost;
    
    if (resourcesRef.current >= upgradeCost) {
      setResources((prev) => prev - upgradeCost);
      resourcesRef.current -= upgradeCost;
      
      playerBaseRef.current.turret.level = nextLevelData.level;
      playerBaseRef.current.turret.damage = nextLevelData.damage;
      playerBaseRef.current.turret.range = nextLevelData.range;
      playerBaseRef.current.turret.experience = 0;
      
      const nextNextLevel = TURRET_LEVELS.find(t => t.level === currentLevel + 2);
      if (nextNextLevel) {
        playerBaseRef.current.turret.maxExperience = nextNextLevel.xpRequired;
      } else {
        playerBaseRef.current.turret.maxExperience = 999999;
      }
    }
  };

  const handleBaseHPUpgrade = () => {
    if (!isGameActive || resourcesRef.current < BASE_HP_UPGRADE_COST) return;
    
    setResources((prev) => prev - BASE_HP_UPGRADE_COST);
    resourcesRef.current -= BASE_HP_UPGRADE_COST;
    
    playerBaseRef.current.maxHealth += BASE_HP_INCREASE;
    playerBaseRef.current.health += BASE_HP_INCREASE;
  };

  const handleBaseAttackUpgrade = () => {
    if (!isGameActive || resourcesRef.current < BASE_ATTACK_UPGRADE_COST) return;
    
    setResources((prev) => prev - BASE_ATTACK_UPGRADE_COST);
    resourcesRef.current -= BASE_ATTACK_UPGRADE_COST;
    
    // Increase base attack
    playerBaseRef.current.attack += BASE_ATTACK_INCREASE;
    
    // Increase global attack bonus for all units
    setGlobalAttackBonus((prev) => prev + BASE_ATTACK_INCREASE);
    globalAttackBonusRef.current += BASE_ATTACK_INCREASE;
    
    // Apply bonus to all existing player units
    playerUnitsRef.current.forEach(unit => {
      unit.damage += BASE_ATTACK_INCREASE;
    });
  };

  const handleBaseRangeUpgrade = () => {
    if (!isGameActive || resourcesRef.current < BASE_RANGE_UPGRADE_COST) return;
    
    setResources((prev) => prev - BASE_RANGE_UPGRADE_COST);
    resourcesRef.current -= BASE_RANGE_UPGRADE_COST;
    
    // Increase base range
    playerBaseRef.current.attackRange += BASE_RANGE_INCREASE;
    
    // Increase global range bonus for all units
    setGlobalRangeBonus((prev) => prev + BASE_RANGE_INCREASE);
    globalRangeBonusRef.current += BASE_RANGE_INCREASE;
    
    // Apply bonus to all existing player units
    playerUnitsRef.current.forEach(unit => {
      unit.attackRange += BASE_RANGE_INCREASE;
    });
  };

  const initGame = () => {
    playerUnitsRef.current = [];
    enemyUnitsRef.current = [];
    snowballsRef.current = [];
    playerBaseRef.current = { 
      health: 1000, 
      maxHealth: 1000, 
      x: 100, 
      y: 275,
      turretCooldown: 0,
      turret: {
        level: 1,
        experience: 0,
        maxExperience: 100,
        damage: 12,
        range: 125,
      },
      attack: 10,
      attackRange: 85,
    };
    enemyBaseRef.current = { 
      health: 1000, 
      maxHealth: 1000, 
      x: 900, 
      y: 275,
      turretCooldown: 0,
      turret: {
        level: 1,
        experience: 0,
        maxExperience: 100,
        damage: 8,
        range: 100,
      },
      attack: 8,
      attackRange: 70,
    };
    setResources(25);
    resourcesRef.current = 25;
    setExperience(0);
    experienceRef.current = 0;
    setEra(0);
    eraRef.current = 0;
    setScore(0);
    scoreRef.current = 0;
    setResourceGainRate(2.0);
    resourceGainRateRef.current = 2.0;
    setGlobalAttackBonus(0);
    globalAttackBonusRef.current = 0;
    setGlobalRangeBonus(0);
    globalRangeBonusRef.current = 0;
    setAbilities([
      { name: 'Snowball Storm', cooldown: 0, maxCooldown: 30000 },
    ]);
    setIsGameActive(true);
    setGameOver(false);
    setVictory(false);
    setShowNameInput(false);
    setShowInstructions(false);
    setShowNewEraPopup(false);
    setShowVictoryPopup(false);
    setShowGameOverScreen(false);
    setShowRewardNotification(false);
    setShowStartButton(false);
    lastResourceGainRef.current = Date.now();
    lastEnemySpawnRef.current = Date.now();
    lastAbilityUpdateRef.current = Date.now();
    enemySpawnIntervalRef.current = 5500;
    animationFrameCounterRef.current = 0;
  };

  const spawnUnit = (unitTypeIndex: number, isPlayer: boolean) => {
    const unitType = UNIT_TYPES[unitTypeIndex];
    if (!unitType) return;

    const unit: Unit = {
      x: isPlayer ? 150 : 850,
      y: LANE_Y,
      health: unitType.health,
      maxHealth: unitType.health,
      // Apply global bonuses to damage and range for player units
      damage: unitType.damage + (isPlayer ? globalAttackBonusRef.current : 0),
      speed: unitType.speed,
      attackRange: unitType.range + (isPlayer ? globalRangeBonusRef.current : 0),
      isPlayer,
      type: unitType.name,
      era: unitType.era,
      cost: unitType.cost,
      attackCooldown: 0,
      targetLocked: null,
      animationFrame: 0,
      isMoving: false,
      isFighting: false,
    };

    if (isPlayer) {
      playerUnitsRef.current.push(unit);
    } else {
      enemyUnitsRef.current.push(unit);
    }
  };

  const handleSpawnUnit = (unitTypeIndex: number) => {
    const unitType = UNIT_TYPES[unitTypeIndex];
    if (!unitType || unitType.era > eraRef.current) return;
    
    const cost = unitType.cost;
    if (resourcesRef.current >= cost && isGameActive) {
      setResources((prev) => prev - cost);
      resourcesRef.current -= cost;
      spawnUnit(unitTypeIndex, true);
    }
  };

  const activateAbility = (abilityIndex: number) => {
    const ability = abilitiesRef.current[abilityIndex];
    if (!ability || ability.cooldown > 0 || !isGameActive) return;

    // Snowball Storm - spawn snowballs that fall and damage enemies
    for (let i = 0; i < 18; i++) {
      snowballsRef.current.push({
        x: 250 + Math.random() * 500,
        y: -20 - Math.random() * 60,
        targetY: LANE_Y + (Math.random() - 0.5) * 90,
        speed: 3 + Math.random() * 2.5,
        damage: 35,
      });
    }

    setAbilities(prev => {
      const newAbilities = [...prev];
      newAbilities[abilityIndex] = { ...newAbilities[abilityIndex], cooldown: newAbilities[abilityIndex].maxCooldown };
      return newAbilities;
    });
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Clean sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#5AB9EA');
    gradient.addColorStop(0.7, '#4ECDC4');
    gradient.addColorStop(1, '#2C8C8C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle wave overlay
    const time = Date.now() / 2000;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let x = 0; x <= CANVAS_WIDTH; x += 10) {
        const y = CANVAS_HEIGHT * 0.7 + Math.sin(x * 0.02 + time + i * 2) * 15;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.lineTo(0, CANVAS_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }

    // Clean battlefield lane
    const laneGradient = ctx.createLinearGradient(0, LANE_Y - 50, 0, LANE_Y + 50);
    laneGradient.addColorStop(0, 'rgba(139, 115, 85, 0.3)');
    laneGradient.addColorStop(0.5, 'rgba(139, 115, 85, 0.5)');
    laneGradient.addColorStop(1, 'rgba(139, 115, 85, 0.3)');
    ctx.fillStyle = laneGradient;
    ctx.fillRect(0, LANE_Y - 50, CANVAS_WIDTH, 100);
    
    // Lane borders
    ctx.strokeStyle = 'rgba(101, 67, 33, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, LANE_Y - 50);
    ctx.lineTo(CANVAS_WIDTH, LANE_Y - 50);
    ctx.moveTo(0, LANE_Y + 50);
    ctx.lineTo(CANVAS_WIDTH, LANE_Y + 50);
    ctx.stroke();

    // Floating feathers
    const featherTime = Date.now() / 1000;
    for (let i = 0; i < 8; i++) {
      const x = (i * 150 + featherTime * 25) % CANVAS_WIDTH;
      const y = 50 + Math.sin(featherTime * 0.8 + i * 1.2) * 30;
      const rotation = Math.sin(featherTime * 1.5 + i) * 0.6;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const drawTopHUD = (ctx: CanvasRenderingContext2D) => {
    // Draw semi-transparent HUD background
    const hudHeight = 50;
    const gradient = ctx.createLinearGradient(0, 0, 0, hudHeight);
    gradient.addColorStop(0, 'rgba(30, 136, 229, 0.85)');
    gradient.addColorStop(1, 'rgba(30, 136, 229, 0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, hudHeight);
    
    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, hudHeight);

    // HUD text styling
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const hudY = hudHeight / 2;
    const spacing = CANVAS_WIDTH / 6;
    let currentX = 20;

    // Score
    ctx.fillText(`Score: ${scoreRef.current}`, currentX, hudY);
    currentX += spacing;

    // Resources
    ctx.fillText(`Resources: ${Math.floor(resourcesRef.current)}`, currentX, hudY);
    currentX += spacing;

    // Era
    ctx.fillText(`Era: ${ERAS[eraRef.current].name}`, currentX, hudY);
    currentX += spacing;

    // Base HP
    const baseHP = Math.max(0, Math.floor(playerBaseRef.current.health));
    ctx.fillText(`Base HP: ${baseHP}`, currentX, hudY);
    currentX += spacing;

    // XP needed for next era
    const currentEra = eraRef.current;
    if (currentEra < ERAS.length - 1) {
      const nextEra = ERAS[currentEra + 1];
      const xpNeeded = nextEra.xpRequired - experienceRef.current;
      ctx.fillText(`Next Era: ${Math.max(0, xpNeeded)} XP`, currentX, hudY);
    } else {
      ctx.fillText(`Max Era Reached!`, currentX, hudY);
    }
  };

  const drawBase = (ctx: CanvasRenderingContext2D, base: Base, isPlayer: boolean) => {
    const sprite = baseSpriteRef.current;

    const width = 80;
    const height = 60;
    const x = base.x - width / 2;
    const y = base.y - height / 2;

    // Draw base sprite FIRST (behind the turret)
    if (sprite && sprite.complete) {
      ctx.save();
      if (!isPlayer) {
        ctx.translate(base.x, base.y);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
      } else {
        ctx.drawImage(sprite, x, y, width, height);
      }
      ctx.restore();
    } else {
      // Simplified fallback
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(x, y, width, height);
      
      ctx.strokeStyle = '#2C3E50';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    }

    // Draw turret AFTER base (on top, positioned behind the base) - using sniper sprite
    const turretSprite = turretSpriteRef.current;
    const turretSize = 28 + (base.turret.level - 1) * 2;
    // Position turret behind the base (further back in Y direction)
    const turretX = base.x - turretSize / 2;
    const turretY = y - turretSize * 0.3; // Positioned behind/above the base center

    if (turretSprite && turretSprite.complete) {
      ctx.save();
      if (!isPlayer) {
        ctx.translate(base.x, turretY + turretSize / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(turretSprite, -turretSize / 2, -turretSize / 2, turretSize, turretSize);
      } else {
        ctx.drawImage(turretSprite, turretX, turretY, turretSize, turretSize);
      }
      ctx.restore();
    }

    // Health bar - positioned above base
    const healthBarWidth = 80;
    const healthBarHeight = 9;
    const healthBarY = y - 18;
    const healthPercent = base.health / base.maxHealth;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(base.x - healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    
    const healthColor = healthPercent > 0.6 ? '#4CAF50' : healthPercent > 0.3 ? '#FFC107' : '#F44336';
    ctx.fillStyle = healthColor;
    ctx.fillRect(base.x - healthBarWidth / 2, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(base.x - healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    
    // Health text above health bar
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, Math.floor(base.health))}`, base.x, healthBarY - 4);
  };

  const drawUnit = (ctx: CanvasRenderingContext2D, unit: Unit) => {
    const unitTypeData = UNIT_TYPES.find(u => u.name === unit.type && u.era === unit.era);
    const spriteKey = unitTypeData?.sprite || 'warrior';
    const sprite = unitSpritesRef.current[spriteKey];

    const size = 30 + unit.era * 2;

    // Update animation frame only when moving or fighting
    if (unit.isMoving || unit.isFighting) {
      unit.animationFrame = (unit.animationFrame + 0.12) % 1;
    }

    if (sprite && sprite.complete) {
      ctx.save();
      ctx.translate(unit.x, unit.y);
      if (!unit.isPlayer) {
        ctx.scale(-1, 1);
      }
      // No bobbing when idle - only draw sprite at base position
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      ctx.restore();
    } else {
      // Simplified fallback with distinct colors per unit type
      const unitColor = unitTypeData?.color || '#1E88E5';

      ctx.fillStyle = unitColor;
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Simple indicator for unit class
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, size / 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Health bar - positioned higher to prevent overlap
    const healthBarWidth = size + 6;
    const healthBarHeight = 5;
    const healthBarY = unit.y - size / 2 - 14;
    const healthPercent = unit.health / unit.maxHealth;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(unit.x - healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    
    const healthColor = healthPercent > 0.6 ? '#4CAF50' : healthPercent > 0.3 ? '#FFC107' : '#F44336';
    ctx.fillStyle = healthColor;
    ctx.fillRect(unit.x - healthBarWidth / 2, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
  };

  const drawProjectile = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
  };

  const drawSnowball = (ctx: CanvasRenderingContext2D, snowball: Snowball) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(snowball.x, snowball.y, 7, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#B0E0E6';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    animationFrameCounterRef.current++;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawBackground(ctx);

    drawBase(ctx, playerBaseRef.current, true);
    drawBase(ctx, enemyBaseRef.current, false);

    // Base turret attacks with kill rewards and experience gain (contributes to era XP)
    // Turret projectiles originate from turret position
    if (playerBaseRef.current.turretCooldown <= 0) {
      const nearestEnemy = enemyUnitsRef.current.find(u => 
        Math.abs(u.x - playerBaseRef.current.x) < playerBaseRef.current.turret.range
      );
      if (nearestEnemy) {
        nearestEnemy.health -= playerBaseRef.current.turret.damage;
        playerBaseRef.current.turretCooldown = 35;
        // Projectile originates from turret position (behind/above base)
        const turretY = playerBaseRef.current.y - 30 - 18; // Adjusted to turret position
        drawProjectile(ctx, playerBaseRef.current.x, turretY, nearestEnemy.x, nearestEnemy.y, '#1E88E5');
        
        if (nearestEnemy.health <= 0) {
          const reward = Math.floor(nearestEnemy.cost / 2);
          setResources((prev) => prev + reward);
          resourcesRef.current += reward;
          
          // Turret gains experience and contributes to era progression
          const xpGain = 8 + nearestEnemy.era * 4;
          playerBaseRef.current.turret.experience += xpGain;
          
          // Turret XP also contributes to overall era progression
          setExperience((prev) => prev + xpGain);
          experienceRef.current += xpGain;
          
          // Check for turret upgrade
          upgradeTurret(playerBaseRef.current);
        }
      }
    } else {
      playerBaseRef.current.turretCooldown--;
    }

    if (enemyBaseRef.current.turretCooldown <= 0) {
      const nearestPlayer = playerUnitsRef.current.find(u => 
        Math.abs(u.x - enemyBaseRef.current.x) < enemyBaseRef.current.turret.range
      );
      if (nearestPlayer) {
        nearestPlayer.health -= enemyBaseRef.current.turret.damage;
        enemyBaseRef.current.turretCooldown = 40;
        // Projectile originates from turret position (behind/above base)
        const turretY = enemyBaseRef.current.y - 30 - 18; // Adjusted to turret position
        drawProjectile(ctx, enemyBaseRef.current.x, turretY, nearestPlayer.x, nearestPlayer.y, '#E53935');
      }
    } else {
      enemyBaseRef.current.turretCooldown--;
    }

    // Update and draw snowballs
    snowballsRef.current = snowballsRef.current.filter((snowball) => {
      snowball.y += snowball.speed;

      if (snowball.y >= snowball.targetY) {
        enemyUnitsRef.current.forEach(unit => {
          const dist = Math.sqrt(Math.pow(unit.x - snowball.x, 2) + Math.pow(unit.y - snowball.y, 2));
          if (dist < 40) {
            unit.health -= snowball.damage;
          }
        });
        return false;
      }

      drawSnowball(ctx, snowball);
      return true;
    });

    // Update and draw player units with new formation logic
    playerUnitsRef.current = playerUnitsRef.current.filter((unit) => {
      if (unit.health <= 0) return false;

      let attacked = false;
      let shouldMove = true;
      unit.isMoving = false;
      unit.isFighting = false;

      // Find target
      if (!unit.targetLocked || unit.targetLocked.health <= 0) {
        let nearestEnemy: Unit | null = null;
        let nearestDist = Infinity;
        
        for (const enemy of enemyUnitsRef.current) {
          const dist = Math.abs(unit.x - enemy.x);
          if (dist < nearestDist && dist <= unit.attackRange) {
            nearestEnemy = enemy;
            nearestDist = dist;
          }
        }
        
        unit.targetLocked = nearestEnemy;
      }

      // Check if there's a friendly unit ahead within formation distance
      const friendlyAhead = playerUnitsRef.current.find(u => 
        u !== unit && u.x > unit.x && u.x - unit.x < FORMATION_DISTANCE
      );

      // Attack logic
      if (unit.targetLocked && enemyUnitsRef.current.includes(unit.targetLocked)) {
        const distance = Math.abs(unit.x - unit.targetLocked.x);
        if (distance <= unit.attackRange) {
          if (unit.attackCooldown <= 0) {
            unit.targetLocked.health -= unit.damage;
            unit.attackCooldown = 45;
            unit.isFighting = true;
            
            if (unit.attackRange > 50) {
              drawProjectile(ctx, unit.x, unit.y, unit.targetLocked.x, unit.targetLocked.y, '#FFD700');
            }
            
            if (unit.targetLocked.health <= 0) {
              const reward = Math.floor(unit.targetLocked.cost / 2);
              setResources((prev) => prev + reward);
              resourcesRef.current += reward;
              
              const xpGain = 6 + unit.targetLocked.era * 6;
              setExperience((prev) => prev + xpGain);
              experienceRef.current += xpGain;
              setScore((prev) => prev + xpGain * 2);
              scoreRef.current += xpGain * 2;
              unit.targetLocked = null;
            }
          }
          attacked = true;
          
          // Ranged units stop behind allies when in range
          if (unit.attackRange > 50) {
            shouldMove = false;
          }
        }
      }

      // Base attack
      if (unit.x >= enemyBaseRef.current.x - 70) {
        if (unit.attackCooldown <= 0) {
          enemyBaseRef.current.health -= unit.damage;
          unit.attackCooldown = 45;
          unit.isFighting = true;
          if (enemyBaseRef.current.health <= 0) {
            setIsGameActive(false);
            setGameOver(true);
            setVictory(true);
            setShowVictoryPopup(true);
          }
        }
        attacked = true;
        shouldMove = false;
      }

      // Movement logic: stop if friendly ahead or if ranged and in attack range
      if (!attacked && shouldMove && !friendlyAhead) {
        unit.x += unit.speed;
        unit.isMoving = true;
      }

      if (unit.attackCooldown > 0) {
        unit.attackCooldown--;
      }

      drawUnit(ctx, unit);
      return true;
    });

    // Update and draw enemy units with new formation logic
    enemyUnitsRef.current = enemyUnitsRef.current.filter((unit) => {
      if (unit.health <= 0) return false;

      let attacked = false;
      let shouldMove = true;
      unit.isMoving = false;
      unit.isFighting = false;

      // Find target
      if (!unit.targetLocked || unit.targetLocked.health <= 0) {
        let nearestPlayer: Unit | null = null;
        let nearestDist = Infinity;
        
        for (const player of playerUnitsRef.current) {
          const dist = Math.abs(unit.x - player.x);
          if (dist < nearestDist && dist <= unit.attackRange) {
            nearestPlayer = player;
            nearestDist = dist;
          }
        }
        
        unit.targetLocked = nearestPlayer;
      }

      // Check if there's a friendly unit ahead within formation distance
      const friendlyAhead = enemyUnitsRef.current.find(u => 
        u !== unit && u.x < unit.x && unit.x - u.x < FORMATION_DISTANCE
      );

      // Attack logic
      if (unit.targetLocked && playerUnitsRef.current.includes(unit.targetLocked)) {
        const distance = Math.abs(unit.x - unit.targetLocked.x);
        if (distance <= unit.attackRange) {
          if (unit.attackCooldown <= 0) {
            unit.targetLocked.health -= unit.damage;
            unit.attackCooldown = 45;
            unit.isFighting = true;
            
            if (unit.attackRange > 50) {
              drawProjectile(ctx, unit.x, unit.y, unit.targetLocked.x, unit.targetLocked.y, '#FF6B35');
            }
            
            if (unit.targetLocked.health <= 0) {
              unit.targetLocked = null;
            }
          }
          attacked = true;
          
          // Ranged units stop behind allies when in range
          if (unit.attackRange > 50) {
            shouldMove = false;
          }
        }
      }

      // Base attack
      if (unit.x <= playerBaseRef.current.x + 70) {
        if (unit.attackCooldown <= 0) {
          playerBaseRef.current.health -= unit.damage;
          unit.attackCooldown = 45;
          unit.isFighting = true;
          if (playerBaseRef.current.health <= 0) {
            setIsGameActive(false);
            setGameOver(true);
            setVictory(false);
            setShowGameOverScreen(true);
          }
        }
        attacked = true;
        shouldMove = false;
      }

      // Movement logic: stop if friendly ahead or if ranged and in attack range
      if (!attacked && shouldMove && !friendlyAhead) {
        unit.x -= unit.speed;
        unit.isMoving = true;
      }

      if (unit.attackCooldown > 0) {
        unit.attackCooldown--;
      }

      drawUnit(ctx, unit);
      return true;
    });

    // Resource generation
    const now = Date.now();
    if (now - lastResourceGainRef.current > 1000) {
      const gain = BASE_RESOURCE_GAIN * resourceGainRateRef.current;
      setResources((prev) => prev + gain);
      resourcesRef.current += gain;
      lastResourceGainRef.current = now;
    }

    // Enemy spawning
    const spawnInterval = Math.max(3500, enemySpawnIntervalRef.current - eraRef.current * 250);
    if (now - lastEnemySpawnRef.current > spawnInterval) {
      const enemyEra = Math.min(eraRef.current, 3);
      const possibleUnits = UNIT_TYPES
        .map((u, i) => ({ ...u, index: i }))
        .filter(u => u.era === enemyEra);
      
      if (possibleUnits.length > 0) {
        const randomUnit = possibleUnits[Math.floor(Math.random() * possibleUnits.length)];
        spawnUnit(randomUnit.index, false);
      }
      
      lastEnemySpawnRef.current = now;
    }

    // Era progression
    const currentEra = eraRef.current;
    if (currentEra < ERAS.length - 1) {
      const nextEra = ERAS[currentEra + 1];
      if (experienceRef.current >= nextEra.xpRequired) {
        setEra(currentEra + 1);
        eraRef.current = currentEra + 1;
        
        playerBaseRef.current.maxHealth += 500;
        playerBaseRef.current.health = playerBaseRef.current.maxHealth;
        
        setResourceGainRate(prev => prev + 0.6);
        resourceGainRateRef.current += 0.6;
        
        setResources(prev => prev + 250);
        resourcesRef.current += 250;

        // Show New Era popup
        setNewEraName(nextEra.name);
        setShowNewEraPopup(true);
      }
    }

    // Update ability cooldowns
    if (now - lastAbilityUpdateRef.current > 100) {
      setAbilities(prev => prev.map(ability => ({
        ...ability,
        cooldown: Math.max(0, ability.cooldown - 100)
      })));
      lastAbilityUpdateRef.current = now;
    }

    // Draw top HUD last (on top of everything)
    drawTopHUD(ctx);

    if (isGameActive) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  };

  const handleSubmitScore = async () => {
    if (playerName.trim() && score > 0) {
      await submitScoreMutation.mutateAsync({
        gameMode: GameMode.puffinColonyWars,
        playerName: playerName.trim(),
        score: BigInt(score),
      });
      setShowNameInput(false);
      setPlayerName('');
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isGameActive) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isGameActive]);

  const getAllUnits = () => {
    return UNIT_TYPES;
  };

  const getAvailableUnits = () => {
    return UNIT_TYPES.filter(u => u.era <= era);
  };

  const getTurretUpgradeCost = () => {
    const currentLevel = playerBaseRef.current.turret.level;
    const nextLevelData = TURRET_LEVELS.find(t => t.level === currentLevel + 1);
    return nextLevelData?.cost || 0;
  };

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Puffin Colony Wars</h1>
            <p className="mt-2 text-muted-foreground">
              Build your puffin army and destroy the enemy colony!
            </p>
          </div>
        </div>

        <Card className="overflow-hidden mb-6">
          <CardContent className="p-0">
            <div className="relative flex justify-center bg-muted p-4">
              <canvas
                ref={canvasRef}
                className="max-w-full border-4 border-border rounded-lg shadow-lg"
              />
              
              {/* Start Game Button - centered over canvas */}
              {showStartButton && !isGameActive && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                  <Button
                    onClick={initGame}
                    size="lg"
                    className="h-auto py-6 px-10 text-2xl font-bold bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-2xl border-4 border-white/30 backdrop-blur-sm"
                  >
                    <Home className="h-8 w-8 mr-3" />
                    Start Game
                  </Button>
                </div>
              )}

              {isGameActive && (
                <>
                  {/* Instructions button - small and unobtrusive in top-right */}
                  <Button
                    onClick={() => setShowInstructions(true)}
                    size="sm"
                    variant="outline"
                    className="absolute top-16 right-6 z-40 h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>

                  {/* Turret and Base upgrade buttons - positioned in top-left below HUD, inside canvas */}
                  <div className="absolute top-[70px] left-6 flex flex-col gap-2 z-30">
                    <Button
                      onClick={handleManualTurretUpgrade}
                      disabled={resources < getTurretUpgradeCost() || playerBaseRef.current.turret.level >= 4}
                      size="sm"
                      className={`h-auto flex-col gap-1 py-2 px-3 text-xs font-bold backdrop-blur-sm shadow-lg transition-all border-2 ${
                        resources >= getTurretUpgradeCost() && playerBaseRef.current.turret.level < 4
                          ? 'bg-blue-600/95 hover:bg-blue-600 hover:scale-105 border-blue-300/50' 
                          : 'bg-gray-500/70 cursor-not-allowed border-gray-400/30'
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                      <span className="font-bold text-[11px]">Turret Lv.{playerBaseRef.current.turret.level}</span>
                      <span className="text-[10px] font-semibold">
                        {playerBaseRef.current.turret.level >= 4 ? 'MAX' : `${getTurretUpgradeCost()} 💰`}
                      </span>
                    </Button>
                    
                    <Button
                      onClick={handleBaseHPUpgrade}
                      disabled={resources < BASE_HP_UPGRADE_COST}
                      size="sm"
                      className={`h-auto flex-col gap-1 py-2 px-3 text-xs font-bold backdrop-blur-sm shadow-lg transition-all border-2 ${
                        resources >= BASE_HP_UPGRADE_COST
                          ? 'bg-green-600/95 hover:bg-green-600 hover:scale-105 border-green-300/50' 
                          : 'bg-gray-500/70 cursor-not-allowed border-gray-400/30'
                      }`}
                    >
                      <Heart className="h-4 w-4" />
                      <span className="font-bold text-[11px]">Base HP</span>
                      <span className="text-[10px] font-semibold">+{BASE_HP_INCREASE}</span>
                      <span className="text-[9px] font-semibold">{BASE_HP_UPGRADE_COST} 💰</span>
                    </Button>

                    <Button
                      onClick={handleBaseAttackUpgrade}
                      disabled={resources < BASE_ATTACK_UPGRADE_COST}
                      size="sm"
                      className={`h-auto flex-col gap-1 py-2 px-3 text-xs font-bold backdrop-blur-sm shadow-lg transition-all border-2 ${
                        resources >= BASE_ATTACK_UPGRADE_COST
                          ? 'bg-red-600/95 hover:bg-red-600 hover:scale-105 border-red-300/50' 
                          : 'bg-gray-500/70 cursor-not-allowed border-gray-400/30'
                      }`}
                    >
                      <Target className="h-4 w-4" />
                      <span className="font-bold text-[11px]">All Attack</span>
                      <span className="text-[10px] font-semibold">+{BASE_ATTACK_INCREASE}</span>
                      <span className="text-[9px] font-semibold">{BASE_ATTACK_UPGRADE_COST} 💰</span>
                    </Button>

                    <Button
                      onClick={handleBaseRangeUpgrade}
                      disabled={resources < BASE_RANGE_UPGRADE_COST}
                      size="sm"
                      className={`h-auto flex-col gap-1 py-2 px-3 text-xs font-bold backdrop-blur-sm shadow-lg transition-all border-2 ${
                        resources >= BASE_RANGE_UPGRADE_COST
                          ? 'bg-purple-600/95 hover:bg-purple-600 hover:scale-105 border-purple-300/50' 
                          : 'bg-gray-500/70 cursor-not-allowed border-gray-400/30'
                      }`}
                    >
                      <Crosshair className="h-4 w-4" />
                      <span className="font-bold text-[11px]">All Range</span>
                      <span className="text-[10px] font-semibold">+{BASE_RANGE_INCREASE}</span>
                      <span className="text-[9px] font-semibold">{BASE_RANGE_UPGRADE_COST} 💰</span>
                    </Button>
                  </div>

                  {/* Unit bar and ability button - positioned at bottom center with improved layout */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[96%] max-w-[960px]">
                    <div className="bg-gradient-to-br from-blue-500/90 to-blue-600/90 backdrop-blur-md rounded-xl shadow-2xl border-2 border-white/30 p-3">
                      <div className="flex flex-wrap gap-2 justify-center items-center">
                        {/* Unit buttons */}
                        {getAllUnits().map((unitType) => {
                          const unitIndex = UNIT_TYPES.findIndex(u => u === unitType);
                          const isUnlocked = unitType.era <= era;
                          const canAfford = resources >= unitType.cost && isUnlocked;
                          return (
                            <Button
                              key={unitIndex}
                              onClick={() => isUnlocked && handleSpawnUnit(unitIndex)}
                              disabled={!canAfford}
                              size="sm"
                              className={`h-auto flex-col gap-0.5 py-1.5 px-2.5 text-xs font-bold shadow-md transition-all relative flex-shrink-0 border-2 ${
                                canAfford 
                                  ? 'bg-white/95 hover:bg-white hover:scale-105 text-blue-700 border-blue-200' 
                                  : isUnlocked
                                  ? 'bg-gray-400/60 cursor-not-allowed text-gray-700 border-gray-300/50'
                                  : 'bg-gray-600/70 cursor-not-allowed opacity-50 text-gray-300 border-gray-500/50'
                              }`}
                            >
                              {!isUnlocked && (
                                <Lock className="h-3 w-3 absolute top-0.5 right-0.5 text-gray-200" />
                              )}
                              <span className="font-bold text-[10px] leading-tight">{unitType.name}</span>
                              <span className="text-[9px] font-semibold leading-tight">{unitType.cost} 💰</span>
                            </Button>
                          );
                        })}
                        
                        {/* Divider */}
                        <div className="h-12 w-px bg-white/40 mx-1" />
                        
                        {/* Ability button */}
                        {abilities.map((ability, index) => {
                          const isReady = ability.cooldown === 0;
                          return (
                            <Button
                              key={`ability-${index}`}
                              onClick={() => activateAbility(index)}
                              disabled={!isReady}
                              size="sm"
                              className={`h-auto flex-col gap-1 py-2 px-3 text-xs font-bold shadow-md transition-all flex-shrink-0 border-2 ${
                                isReady 
                                  ? 'bg-yellow-400/95 hover:bg-yellow-400 hover:scale-105 text-yellow-900 border-yellow-200' 
                                  : 'bg-gray-400/60 cursor-not-allowed text-gray-700 border-gray-300/50'
                              }`}
                            >
                              <Zap className="h-4 w-4" />
                              <span className="font-bold text-[9px] leading-tight">
                                {isReady ? 'Storm!' : `${Math.ceil(ability.cooldown / 1000)}s`}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* New Era Popup */}
              {showNewEraPopup && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-500">
                  <div className="bg-gradient-to-br from-blue-500/95 to-purple-600/95 backdrop-blur-md rounded-2xl shadow-2xl border-4 border-white/30 p-8 text-center min-w-[320px]">
                    <div className="mb-4">
                      <div className="inline-block p-4 bg-white/20 rounded-full mb-3">
                        <Trophy className="h-12 w-12 text-yellow-300" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">New Era Reached!</h2>
                    <p className="text-xl font-semibold text-yellow-200">{newEraName}</p>
                    <div className="mt-4 flex justify-center gap-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 bg-white/60 rounded-full animate-pulse"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Victory Popup */}
              {showVictoryPopup && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-500">
                  <div className="bg-gradient-to-br from-green-500/95 to-emerald-600/95 backdrop-blur-md rounded-2xl shadow-2xl border-4 border-white/30 p-8 text-center min-w-[360px]">
                    <div className="mb-4">
                      <div className="inline-block p-4 bg-white/20 rounded-full mb-3">
                        <Trophy className="h-16 w-16 text-yellow-300" />
                      </div>
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-3">🎉 Congratulations! 🎉</h2>
                    <p className="text-2xl font-semibold text-yellow-200 mb-2">You Won!</p>
                    <p className="text-lg text-white/90">Enemy colony destroyed!</p>
                    <div className="mt-6 flex justify-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 bg-yellow-300 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reward Notification Popup - appears after victory popup */}
              {showRewardNotification && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-500">
                  <div className="bg-gradient-to-br from-amber-500/95 to-orange-600/95 backdrop-blur-md rounded-2xl shadow-2xl border-4 border-white/30 p-8 text-center min-w-[360px]">
                    <div className="mb-4">
                      <div className="inline-block p-4 bg-white/20 rounded-full mb-3">
                        <Coins className="h-16 w-16 text-yellow-200" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-3">🎁 Reward Earned! 🎁</h2>
                    <p className="text-2xl font-semibold text-yellow-100 mb-2">You earned 0.001 ICP</p>
                    <p className="text-lg text-white/90">for your victory!</p>
                    <div className="mt-4 p-3 bg-white/10 rounded-lg">
                      <p className="text-sm text-white/80">
                        Visit the Rewards page to claim your ICP
                      </p>
                    </div>
                    <div className="mt-6 flex justify-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 bg-yellow-200 rounded-full animate-pulse"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Game Over Screen - appears when base is destroyed */}
              {showGameOverScreen && !victory && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-500">
                  <div className="bg-gradient-to-br from-red-600/95 to-red-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-4 border-white/30 p-8 text-center min-w-[360px]">
                    <div className="mb-4">
                      <div className="inline-block p-4 bg-white/20 rounded-full mb-3">
                        <Swords className="h-16 w-16 text-white" />
                      </div>
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-3">💥 Base Destroyed! 💥</h2>
                    <p className="text-2xl font-semibold text-yellow-200 mb-2">Game Over</p>
                    <p className="text-lg text-white/90">Your colony has fallen!</p>
                    <p className="text-md text-white/80 mt-2">Final Score: {score}</p>
                    <div className="mt-6 flex justify-center gap-2">
                      <Button 
                        onClick={() => {
                          setShowGameOverScreen(false);
                          setShowNameInput(true);
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Name and Score Section - appears after reward notification or game over */}
              {showNameInput && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-300">
                  <div className="bg-gradient-to-br from-blue-500/95 to-blue-600/95 backdrop-blur-md rounded-2xl shadow-2xl border-4 border-white/30 p-6 text-center min-w-[340px]">
                    <div className="mb-4">
                      <Trophy className="h-12 w-12 text-yellow-300 mx-auto mb-2" />
                      <h3 className="text-2xl font-bold text-white mb-1">{victory ? 'Victory!' : 'Game Over'}</h3>
                      <p className="text-lg text-yellow-200">Final Score: {score}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="text-left">
                        <Label htmlFor="playerName" className="text-white font-semibold mb-1 block">
                          Your Name
                        </Label>
                        <Input
                          id="playerName"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="Enter your name"
                          maxLength={20}
                          className="bg-white/90 border-white/30"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && playerName.trim()) {
                              handleSubmitScore();
                            }
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleSubmitScore} 
                          disabled={!playerName.trim() || submitScoreMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {submitScoreMutation.isPending ? 'Submitting...' : 'Submit Score'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowNameInput(false);
                            setShowStartButton(true);
                          }}
                          className="flex-1 bg-white/90 hover:bg-white"
                        >
                          Skip
                        </Button>
                      </div>
                      <Button 
                        variant="secondary" 
                        onClick={initGame}
                        className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        Play Again
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Spawn Units</CardTitle>
              <CardDescription>Click to spawn puffin warriors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-2">
                {getAvailableUnits().map((unitType) => {
                  const unitIndex = UNIT_TYPES.findIndex(u => u === unitType);
                  // Calculate effective stats with bonuses
                  const effectiveDamage = unitType.damage + globalAttackBonus;
                  const effectiveRange = unitType.range + globalRangeBonus;
                  return (
                    <Button
                      key={unitIndex}
                      onClick={() => handleSpawnUnit(unitIndex)}
                      disabled={!isGameActive || resources < unitType.cost}
                      className="h-auto flex-col gap-1 py-3 text-xs"
                      variant={unitType.era === era ? "default" : "outline"}
                    >
                      <span className="font-bold">{unitType.name}</span>
                      <span className="text-xs">Cost: {unitType.cost}</span>
                      <span className="text-xs opacity-70">
                        HP:{unitType.health} DMG:{effectiveDamage} RNG:{effectiveRange}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Upgrades
              </CardTitle>
              <CardDescription>Improve your defenses and army</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Turret Upgrade
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Level: {playerBaseRef.current.turret.level} / 4 | Range: {playerBaseRef.current.turret.range} | Damage: {playerBaseRef.current.turret.damage}
                  </p>
                  <Button
                    onClick={handleManualTurretUpgrade}
                    disabled={!isGameActive || resources < getTurretUpgradeCost() || playerBaseRef.current.turret.level >= 4}
                    className="w-full"
                    size="sm"
                  >
                    {playerBaseRef.current.turret.level >= 4 ? 'Max Level' : `Upgrade Turret (${getTurretUpgradeCost()} 💰)`}
                  </Button>
                </div>

                <div className="pt-3 border-t">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-green-500" />
                    Base HP Upgrade
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Max HP: {playerBaseRef.current.maxHealth} | +{BASE_HP_INCREASE} HP per upgrade
                  </p>
                  <Button
                    onClick={handleBaseHPUpgrade}
                    disabled={!isGameActive || resources < BASE_HP_UPGRADE_COST}
                    className="w-full"
                    size="sm"
                    variant="secondary"
                  >
                    Upgrade Base HP ({BASE_HP_UPGRADE_COST} 💰)
                  </Button>
                </div>

                <div className="pt-3 border-t">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-red-500" />
                    Army Attack Upgrade
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Base Attack: {playerBaseRef.current.attack} | All Units: +{globalAttackBonus} damage
                  </p>
                  <p className="text-xs text-muted-foreground mb-2 italic">
                    Increases damage for ALL units (existing and new)
                  </p>
                  <Button
                    onClick={handleBaseAttackUpgrade}
                    disabled={!isGameActive || resources < BASE_ATTACK_UPGRADE_COST}
                    className="w-full"
                    size="sm"
                    variant="secondary"
                  >
                    Upgrade Attack (+{BASE_ATTACK_INCREASE} to all) ({BASE_ATTACK_UPGRADE_COST} 💰)
                  </Button>
                </div>

                <div className="pt-3 border-t">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Crosshair className="h-4 w-4 text-purple-500" />
                    Army Range Upgrade
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Base Range: {playerBaseRef.current.attackRange} | All Units: +{globalRangeBonus} range
                  </p>
                  <p className="text-xs text-muted-foreground mb-2 italic">
                    Increases range for ALL units (existing and new)
                  </p>
                  <Button
                    onClick={handleBaseRangeUpgrade}
                    disabled={!isGameActive || resources < BASE_RANGE_UPGRADE_COST}
                    className="w-full"
                    size="sm"
                    variant="secondary"
                  >
                    Upgrade Range (+{BASE_RANGE_INCREASE} to all) ({BASE_RANGE_UPGRADE_COST} 💰)
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Special Ability
                </h4>
                {abilities.map((ability, index) => {
                  const isReady = ability.cooldown === 0;
                  const cooldownPercent = (ability.cooldown / ability.maxCooldown) * 100;
                  
                  return (
                    <div key={index}>
                      <Button
                        onClick={() => activateAbility(index)}
                        disabled={!isGameActive || !isReady}
                        className="w-full h-auto flex-col gap-1 py-3"
                        variant={isReady ? "default" : "outline"}
                      >
                        <span className="font-bold">{ability.name}</span>
                        <span className="text-xs">Drops snowballs on enemies</span>
                        {!isReady && (
                          <span className="text-xs">
                            Cooldown: {Math.ceil(ability.cooldown / 1000)}s
                          </span>
                        )}
                      </Button>
                      {!isReady && (
                        <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-100"
                            style={{ width: `${100 - cooldownPercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">How to Play: Puffin Colony Wars</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p className="text-base font-semibold text-foreground">
                Build your puffin army and destroy the enemy colony before they destroy yours!
              </p>
              <div className="space-y-3 text-base">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground">
                    🎯 Objective
                  </h4>
                  <p className="text-sm">Destroy the enemy nest while defending your own!</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground">
                    💰 Resources
                  </h4>
                  <p className="text-sm">Start with 25 resources and earn 2 per second automatically. Gain more by defeating enemy units (half their cost). Your base turret also earns resources when it kills enemies!</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground">
                    ⚔️ Combat & Formation
                  </h4>
                  <p className="text-sm">Units automatically march and form battle lines. Melee units fight at the front, while ranged units attack from behind their allies. When a front unit dies, the unit behind advances to fill the gap.</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground">
                    📈 Progression
                  </h4>
                  <p className="text-sm">Defeat enemies to gain experience. Reach XP thresholds to advance through 4 eras, unlocking stronger puffin warriors! Turret kills also contribute to your overall XP. Check the HUD to see how much XP you need for the next era!</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground">
                    🏰 Defense & Upgrades
                  </h4>
                  <p className="text-sm">Your nest has turrets that automatically attack nearby enemies and earn resources from kills. Manually upgrade turrets for 200 (level 2), 500 (level 3), or 1000 (level 4) resources. Each upgrade extends turret range and improves damage! You can also upgrade your base HP (150 resources, +300 HP), army attack (100 resources, +5 damage to ALL units), and army range (120 resources, +15 range to ALL units). Attack and range upgrades affect your entire army!</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground">
                    ❄️ Snowball Storm
                  </h4>
                  <p className="text-sm">Free special ability with 30-second cooldown. Drops snowballs that damage all enemies in the area!</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground">
                    🎮 Controls
                  </h4>
                  <p className="text-sm">Click unit buttons at the bottom of the screen to spawn warriors. Use the upgrade buttons on the left to improve your defenses and strengthen your entire army. Click the special ability button when ready to unleash the Snowball Storm!</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowInstructions(false)} size="lg">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

