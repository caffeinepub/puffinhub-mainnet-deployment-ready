import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RotateCcw, ArrowLeft, Trophy } from 'lucide-react';
import { useSubmitScore } from '@/hooks/useQueries';
import { GameMode } from '@/backend';

interface Chick {
  x: number;
  y: number;
  width: number;
  height: number;
  rescued: boolean;
}

interface Predator {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  animationFrame: number;
}

interface PuffinRescueGameProps {
  onBack: () => void;
}

export default function PuffinRescueGame({ onBack }: PuffinRescueGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  
  const puffinRef = useRef({ x: 100, y: 400, velocityX: 0, velocityY: 0 });
  const chicksRef = useRef<Chick[]>([]);
  const predatorsRef = useRef<Predator[]>([]);
  const rescuedCountRef = useRef(0);
  const currentLevelRef = useRef(1);

  const [score, setScore] = useState(0);
  const [rescued, setRescued] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showLevelTransition, setShowLevelTransition] = useState(false);

  const submitScoreMutation = useSubmitScore();

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const PUFFIN_SIZE = 40;
  const MOVE_SPEED = 4;
  const MAX_LEVEL = 5;

  // Load animated evil puffin obstacle sprite
  const evilPuffinSpriteRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const evilPuffinImg = new Image();
    evilPuffinImg.src = '/assets/generated/evil-puffin-obstacle-animated-transparent.dim_48x48.png';
    evilPuffinSpriteRef.current = evilPuffinImg;
  }, []);

  const getLevelConfig = (level: number) => {
    return {
      chicksToRescue: 5 + level * 2,
      predatorCount: 2 + level,
      predatorSpeed: 1 + level * 0.3,
      pointsPerChick: 50 + level * 10,
    };
  };

  const initGame = () => {
    currentLevelRef.current = 1;
    setCurrentLevel(1);
    rescuedCountRef.current = 0;
    setRescued(0);
    setScore(0);
    startLevel(1);
    setIsGameActive(true);
    setGameOver(false);
    setShowNameInput(false);
    setShowInstructions(false);
    setShowLevelTransition(false);
  };

  const startLevel = (level: number) => {
    const config = getLevelConfig(level);
    
    puffinRef.current = { x: 100, y: 400, velocityX: 0, velocityY: 0 };
    chicksRef.current = [];
    predatorsRef.current = [];
    
    // Spawn chicks with special positioning for level 5
    if (level === 5) {
      // Level 5: Ensure all chicks are reachable by spreading them across the map
      const totalChicks = config.chicksToRescue;
      const rows = 3;
      const cols = Math.ceil(totalChicks / rows);
      
      for (let i = 0; i < totalChicks; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = 150 + col * (CANVAS_WIDTH - 300) / (cols - 1);
        const y = 80 + row * (CANVAS_HEIGHT - 200) / (rows - 1);
        
        chicksRef.current.push({
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 40,
          width: 30,
          height: 30,
          rescued: false,
        });
      }
    } else {
      // Other levels: random positioning
      for (let i = 0; i < config.chicksToRescue; i++) {
        chicksRef.current.push({
          x: 150 + Math.random() * 600,
          y: 50 + Math.random() * 350,
          width: 30,
          height: 30,
          rescued: false,
        });
      }
    }
    
    // Spawn predators (animated evil puffins) with omnidirectional movement
    // Ensure they never start too close to the player (minimum 250px distance)
    const MIN_DISTANCE_FROM_PLAYER = 250;
    for (let i = 0; i < config.predatorCount; i++) {
      let x, y;
      let attempts = 0;
      do {
        x = 200 + Math.random() * 500;
        y = 100 + Math.random() * 300;
        const distanceFromPlayer = Math.sqrt(
          Math.pow(x - puffinRef.current.x, 2) + Math.pow(y - puffinRef.current.y, 2)
        );
        attempts++;
        if (distanceFromPlayer >= MIN_DISTANCE_FROM_PLAYER || attempts > 30) break;
      } while (true);
      
      const angle = Math.random() * Math.PI * 2;
      predatorsRef.current.push({
        x,
        y,
        width: 48,
        height: 48,
        velocityX: Math.cos(angle) * config.predatorSpeed,
        velocityY: Math.sin(angle) * config.predatorSpeed,
        animationFrame: 0,
      });
    }
  };

  const checkCollision = (obj1: { x: number; y: number; width?: number; height?: number }, obj2: { x: number; y: number; width: number; height: number }) => {
    const w1 = obj1.width || PUFFIN_SIZE;
    const h1 = obj1.height || PUFFIN_SIZE;
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + w1 > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + h1 > obj2.y
    );
  };

  const drawPuffin = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    // Body
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath();
    ctx.ellipse(x + 20, y + 25, 15, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = '#F7F3E9';
    ctx.beginPath();
    ctx.ellipse(x + 20, y + 28, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath();
    ctx.arc(x + 20, y + 12, 12, 0, Math.PI * 2);
    ctx.fill();

    // White eye dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x + 23, y + 10, 2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath();
    ctx.moveTo(x + 28, y + 12);
    ctx.lineTo(x + 38, y + 15);
    ctx.lineTo(x + 28, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawEvilPuffin = (ctx: CanvasRenderingContext2D, predator: Predator) => {
    const evilPuffinSprite = evilPuffinSpriteRef.current;
    
    if (evilPuffinSprite && evilPuffinSprite.complete) {
      // Draw animated evil puffin sprite with smooth animation
      ctx.save();
      // Flip sprite based on movement direction
      if (predator.velocityX < 0) {
        ctx.translate(predator.x + predator.width, predator.y);
        ctx.scale(-1, 1);
        ctx.drawImage(evilPuffinSprite, 0, 0, predator.width, predator.height);
      } else {
        ctx.drawImage(evilPuffinSprite, predator.x, predator.y, predator.width, predator.height);
      }
      ctx.restore();
    } else {
      // Fallback: draw evil puffin shape with red eyes
      ctx.save();
      const centerX = predator.x + predator.width / 2;
      const centerY = predator.y + predator.height / 2;
      
      // Body - darker puffin
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 5, 15, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Belly - dark gray
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 7, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Head
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(centerX, centerY - 8, 11, 0, Math.PI * 2);
      ctx.fill();
      
      // Red eyes (menacing)
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(centerX - 4, centerY - 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + 4, centerY - 10, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Dark beak
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(centerX + 8, centerY - 8);
      ctx.lineTo(centerX + 16, centerY - 6);
      ctx.lineTo(centerX + 8, centerY - 4);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const puffin = puffinRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw arctic terrain background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#B8E6F5');
    gradient.addColorStop(1, '#E8F5F7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ice patches
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(i * 180 + 50, 450, 80, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Handle movement
    puffin.velocityX = 0;
    puffin.velocityY = 0;

    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
      puffin.velocityX = -MOVE_SPEED;
    }
    if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
      puffin.velocityX = MOVE_SPEED;
    }
    if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
      puffin.velocityY = -MOVE_SPEED;
    }
    if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) {
      puffin.velocityY = MOVE_SPEED;
    }

    puffin.x = Math.max(0, Math.min(CANVAS_WIDTH - PUFFIN_SIZE, puffin.x + puffin.velocityX));
    puffin.y = Math.max(0, Math.min(CANVAS_HEIGHT - PUFFIN_SIZE, puffin.y + puffin.velocityY));

    // Draw puffin
    drawPuffin(ctx, puffin.x, puffin.y);

    // Update and draw chicks
    const config = getLevelConfig(currentLevelRef.current);
    chicksRef.current.forEach((chick) => {
      if (!chick.rescued) {
        // Draw chick
        ctx.save();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(chick.x + 15, chick.y + 15, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(chick.x + 22, chick.y + 15);
        ctx.lineTo(chick.x + 28, chick.y + 17);
        ctx.lineTo(chick.x + 22, chick.y + 19);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(chick.x + 18, chick.y + 13, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Check collision with puffin
        if (checkCollision(puffin, chick)) {
          chick.rescued = true;
          rescuedCountRef.current++;
          setRescued(rescuedCountRef.current);
          setScore((prev) => prev + config.pointsPerChick);

          // Check if level complete
          if (chicksRef.current.every(c => c.rescued)) {
            if (currentLevelRef.current < MAX_LEVEL) {
              currentLevelRef.current++;
              setCurrentLevel(currentLevelRef.current);
              setShowLevelTransition(true);
              setIsGameActive(false);
              
              setTimeout(() => {
                setShowLevelTransition(false);
                startLevel(currentLevelRef.current);
                setIsGameActive(true);
              }, 2000);
            } else {
              // Game complete!
              setIsGameActive(false);
              setGameOver(true);
              setShowNameInput(true);
              return;
            }
          }
        }
      }
    });

    // Update and draw predators (animated evil puffins) with omnidirectional movement
    predatorsRef.current.forEach((predator) => {
      predator.x += predator.velocityX;
      predator.y += predator.velocityY;

      // Bounce off walls
      if (predator.x < 0 || predator.x > CANVAS_WIDTH - predator.width) {
        predator.velocityX *= -1;
        predator.x = Math.max(0, Math.min(CANVAS_WIDTH - predator.width, predator.x));
      }
      if (predator.y < 0 || predator.y > CANVAS_HEIGHT - predator.height) {
        predator.velocityY *= -1;
        predator.y = Math.max(0, Math.min(CANVAS_HEIGHT - predator.height, predator.y));
      }

      // Update animation frame for smooth animation
      predator.animationFrame = (predator.animationFrame + 0.1) % 1;

      // Draw animated evil puffin
      drawEvilPuffin(ctx, predator);

      // Check collision with puffin
      if (checkCollision(puffin, predator)) {
        setIsGameActive(false);
        setGameOver(true);
        setShowNameInput(true);
        return;
      }
    });

    if (isGameActive) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    keysRef.current.add(e.key);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keysRef.current.delete(e.key);
  };

  const handleSubmitScore = async () => {
    if (playerName.trim() && score > 0) {
      await submitScoreMutation.mutateAsync({
        gameMode: GameMode.puffinRescue,
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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
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

  const config = getLevelConfig(currentLevel);

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Puffin Rescue</h1>
            <p className="mt-2 text-muted-foreground">
              Rescue puffin chicks and bring them to safety! Use arrow keys or WASD to move.
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                Score: {score}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Level: {currentLevel} / {MAX_LEVEL}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Chicks: {rescued} / {config.chicksToRescue}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative flex justify-center bg-muted p-4">
              <canvas
                ref={canvasRef}
                className="max-w-full border-4 border-border rounded-lg shadow-lg"
                tabIndex={0}
              />
              {showLevelTransition && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="bg-background border-4 border-primary rounded-lg p-8 text-center shadow-2xl">
                    <h2 className="text-3xl font-bold mb-2 text-primary">Level {currentLevel} Complete!</h2>
                    <p className="text-xl">Get ready for Level {currentLevel}...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center space-y-4">
          {!isGameActive && !gameOver && !showLevelTransition && (
            <Button size="lg" onClick={initGame} className="gap-2">
              <RotateCcw className="h-5 w-5" />
              Start Game
            </Button>
          )}
          
          {gameOver && showNameInput && (
            <Card>
              <CardHeader>
                <CardTitle>{currentLevel === MAX_LEVEL && rescued === config.chicksToRescue ? 'All Levels Complete!' : 'Game Over!'}</CardTitle>
                <CardDescription>
                  {currentLevel === MAX_LEVEL && rescued === config.chicksToRescue
                    ? `Amazing! You completed all ${MAX_LEVEL} levels! Score: ${score}` 
                    : `You reached level ${currentLevel} and rescued ${rescued} chicks. Score: ${score}`}
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
                  <Button onClick={handleSubmitScore} disabled={!playerName.trim() || submitScoreMutation.isPending}>
                    {submitScoreMutation.isPending ? 'Submitting...' : 'Submit Score'}
                  </Button>
                  <Button variant="outline" onClick={initGame}>
                    Play Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How to Play: Puffin Rescue</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p className="text-base">
                Use <strong>arrow keys</strong> to move. Rescue puffin chicks and bring them to safety while avoiding evil puffins!
              </p>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li>Use <strong>↑↓←→ (Arrow Keys)</strong> or <strong>WASD</strong> to move in all directions</li>
                <li>Touch <strong>golden chicks</strong> to rescue them</li>
                <li><strong>Avoid evil puffins</strong> with red eyes - they will end your game!</li>
                <li>Progress through <strong>{MAX_LEVEL} levels</strong> of increasing difficulty</li>
                <li>Each level has more chicks, more evil puffins, and faster enemies</li>
                <li>Complete all levels to win!</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowInstructions(false)}>Got it!</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
