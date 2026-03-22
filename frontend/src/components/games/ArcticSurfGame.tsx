import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RotateCcw, ArrowLeft, Trophy, Home } from 'lucide-react';
import { useSubmitScore } from '@/hooks/useQueries';
import { GameMode } from '@/backend';

interface IceFloe {
  x: number;
  y: number;
  width: number;
  height: number;
  hasObstacle?: boolean;
  obstacleType?: 'seal' | 'rock';
  obstacleX?: number;
}

interface ArcticSurfGameProps {
  onBack: () => void;
}

export default function ArcticSurfGame({ onBack }: ArcticSurfGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  
  const puffinRef = useRef({ x: 100, y: 300, velocityY: 0, isJumping: false, onIce: false });
  const iceFloesRef = useRef<IceFloe[]>([]);
  const scrollSpeedRef = useRef(3);
  const distanceRef = useRef(0);

  const [score, setScore] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const submitScoreMutation = useSubmitScore();

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const PUFFIN_SIZE = 40;
  const GRAVITY = 0.6;
  const JUMP_FORCE = -12;
  const WATER_LEVEL = 400;

  const initGame = () => {
    puffinRef.current = { x: 100, y: 300, velocityY: 0, isJumping: false, onIce: true };
    iceFloesRef.current = [];
    scrollSpeedRef.current = 3;
    distanceRef.current = 0;
    
    // Spawn initial ice floes with varied lengths and better positioning
    for (let i = 0; i < 5; i++) {
      const isLong = Math.random() > 0.4;
      iceFloesRef.current.push({
        x: i * 200,
        y: WATER_LEVEL - 20,
        width: isLong ? 220 : 160,
        height: 20,
      });
    }
    
    setScore(0);
    setIsGameActive(true);
    setGameOver(false);
    setShowNameInput(false);
    setShowInstructions(false);
  };

  const spawnIceFloe = () => {
    const lastFloe = iceFloesRef.current[iceFloesRef.current.length - 1];
    const gap = 60 + Math.random() * 50; // Reduced gap for easier gameplay
    const isLong = Math.random() > 0.3; // 70% chance of longer ice
    const width = isLong ? 200 + Math.random() * 80 : 140 + Math.random() * 60;
    
    // Add obstacles on some ice floes - positioned better
    const hasObstacle = Math.random() > 0.65 && distanceRef.current > 500;
    const obstacleType = Math.random() > 0.5 ? 'seal' : 'rock';
    // Position obstacles more toward the center of ice floes
    const obstacleX = hasObstacle ? width * 0.3 + Math.random() * (width * 0.4) : 0;
    
    iceFloesRef.current.push({
      x: lastFloe.x + lastFloe.width + gap,
      y: WATER_LEVEL - 20,
      width,
      height: 20,
      hasObstacle,
      obstacleType,
      obstacleX,
    });
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

  const drawObstacle = (ctx: CanvasRenderingContext2D, floe: IceFloe) => {
    if (!floe.hasObstacle || !floe.obstacleX) return;

    const obstacleX = floe.x + floe.obstacleX;
    const obstacleY = floe.y - 40;

    ctx.save();
    if (floe.obstacleType === 'seal') {
      // Draw seal
      ctx.fillStyle = '#5D4037';
      ctx.beginPath();
      ctx.ellipse(obstacleX, obstacleY + 20, 35, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3E2723';
      ctx.beginPath();
      ctx.arc(obstacleX - 10, obstacleY + 15, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(obstacleX - 12, obstacleY + 14, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw rock
      ctx.fillStyle = '#546E7A';
      ctx.beginPath();
      ctx.moveTo(obstacleX, obstacleY);
      ctx.lineTo(obstacleX + 25, obstacleY + 10);
      ctx.lineTo(obstacleX + 20, obstacleY + 35);
      ctx.lineTo(obstacleX - 20, obstacleY + 35);
      ctx.lineTo(obstacleX - 25, obstacleY + 10);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#37474F';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  };

  const checkObstacleCollision = (puffin: { x: number; y: number }, floe: IceFloe): boolean => {
    if (!floe.hasObstacle || !floe.obstacleX) return false;

    const obstacleX = floe.x + floe.obstacleX;
    const obstacleY = floe.y - 40;
    const obstacleWidth = floe.obstacleType === 'seal' ? 70 : 50;
    const obstacleHeight = 40;

    return (
      puffin.x + PUFFIN_SIZE > obstacleX - obstacleWidth / 2 &&
      puffin.x < obstacleX + obstacleWidth / 2 &&
      puffin.y + PUFFIN_SIZE > obstacleY &&
      puffin.y < obstacleY + obstacleHeight
    );
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const puffin = puffinRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw arctic waters background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#4A90E2');
    gradient.addColorStop(1, '#1E5A8E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw water
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(0, WATER_LEVEL, CANVAS_WIDTH, CANVAS_HEIGHT - WATER_LEVEL);

    // Draw waves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let x = 0; x < CANVAS_WIDTH; x += 20) {
        const y = WATER_LEVEL + Math.sin((x + distanceRef.current * 2 + i * 50) / 30) * 5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Handle jump
    if ((keysRef.current.has(' ') || keysRef.current.has('ArrowUp')) && puffin.onIce && !puffin.isJumping) {
      puffin.velocityY = JUMP_FORCE;
      puffin.isJumping = true;
      puffin.onIce = false;
    }

    // Apply gravity
    puffin.velocityY += GRAVITY;
    puffin.y += puffin.velocityY;

    // Check if puffin fell in water
    if (puffin.y > WATER_LEVEL) {
      setIsGameActive(false);
      setGameOver(true);
      setShowNameInput(true);
      return;
    }

    // Update ice floes
    puffin.onIce = false;
    distanceRef.current += scrollSpeedRef.current;

    iceFloesRef.current = iceFloesRef.current.filter((floe) => {
      floe.x -= scrollSpeedRef.current;

      if (floe.x + floe.width < 0) {
        return false;
      }

      // Draw ice floe
      ctx.fillStyle = '#E0F7FA';
      ctx.fillRect(floe.x, floe.y, floe.width, floe.height);
      ctx.strokeStyle = '#B2EBF2';
      ctx.lineWidth = 2;
      ctx.strokeRect(floe.x, floe.y, floe.width, floe.height);

      // Draw obstacle
      drawObstacle(ctx, floe);

      // Check collision with puffin
      if (
        puffin.x + PUFFIN_SIZE > floe.x &&
        puffin.x < floe.x + floe.width &&
        puffin.y + PUFFIN_SIZE >= floe.y &&
        puffin.y + PUFFIN_SIZE <= floe.y + floe.height + 10 &&
        puffin.velocityY >= 0
      ) {
        puffin.y = floe.y - PUFFIN_SIZE;
        puffin.velocityY = 0;
        puffin.onIce = true;
        puffin.isJumping = false;
      }

      // Check obstacle collision
      if (puffin.onIce && checkObstacleCollision(puffin, floe)) {
        setIsGameActive(false);
        setGameOver(true);
        setShowNameInput(true);
      }

      return true;
    });

    // Spawn new ice floes
    if (iceFloesRef.current.length < 6) {
      spawnIceFloe();
    }

    // Gradually increase difficulty
    if (distanceRef.current % 500 === 0 && distanceRef.current > 0) {
      scrollSpeedRef.current += 0.2;
    }

    // Draw puffin
    drawPuffin(ctx, puffin.x, puffin.y);

    // Update score
    setScore(Math.floor(distanceRef.current / 10));

    if (isGameActive) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    keysRef.current.add(e.key);
    if ([' ', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keysRef.current.delete(e.key);
  };

  const handleSubmitScore = async () => {
    if (playerName.trim() && score > 0) {
      await submitScoreMutation.mutateAsync({
        gameMode: GameMode.arcticSurf,
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

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Arctic Surf</h1>
            <p className="mt-2 text-muted-foreground">
              Ride ice floes across arctic waters! Press spacebar or up arrow to jump.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                Score: {score}
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
              
              {/* Start Game Button - centered over canvas */}
              {!isGameActive && !gameOver && (
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
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center space-y-4">
          {gameOver && showNameInput && (
            <Card>
              <CardHeader>
                <CardTitle>Game Over!</CardTitle>
                <CardDescription>You fell into the water! Your score: {score}</CardDescription>
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
            <DialogTitle>How to Play: Arctic Surf</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p className="text-base">
                Use <strong>arrow keys</strong> to surf and <strong>spacebar</strong> to jump between ice floes. Ride as far as you can without falling into the water!
              </p>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li>Press <strong>Spacebar</strong> or <strong>↑ (Up Arrow)</strong> to jump between ice floes</li>
                <li>Land on the <strong>light blue ice floes</strong> to stay safe</li>
                <li><strong>Avoid obstacles</strong> like seals and rocks on the ice!</li>
                <li><strong>Don't fall into the water</strong> - it ends your game!</li>
                <li>The game gets faster as you progress</li>
                <li>Your score increases the farther you travel</li>
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
