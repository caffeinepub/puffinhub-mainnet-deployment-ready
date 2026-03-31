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
import { useSubmitScore } from "@/hooks/useQueries";
import { ArrowLeft, Home, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Fish {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  collected: boolean;
}

interface KillerFish {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
}

interface FishFrenzyGameProps {
  onBack: () => void;
}

export default function FishFrenzyGame({ onBack }: FishFrenzyGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const puffinRef = useRef({
    x: 400,
    y: 250,
    velocityX: 0,
    velocityY: 0,
    size: 40,
  });
  const fishesRef = useRef<Fish[]>([]);
  const killerFishesRef = useRef<KillerFish[]>([]);

  const [score, setScore] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [defeatedByKiller, setDefeatedByKiller] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const submitScoreMutation = useSubmitScore();

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const INITIAL_PUFFIN_SIZE = 40;
  const MOVE_SPEED = 5;
  const SIZE_GROWTH_PER_FISH = 3;

  const initGame = () => {
    puffinRef.current = {
      x: 400,
      y: 250,
      velocityX: 0,
      velocityY: 0,
      size: INITIAL_PUFFIN_SIZE,
    };
    fishesRef.current = [];
    killerFishesRef.current = [];

    // Spawn initial fish
    for (let i = 0; i < 8; i++) {
      spawnFish();
    }

    // Spawn initial killer fish
    for (let i = 0; i < 2; i++) {
      spawnKillerFish();
    }

    setScore(0);
    setIsGameActive(true);
    setGameOver(false);
    setDefeatedByKiller(false);
    setShowNameInput(false);
    setShowInstructions(false);
  };

  const spawnFish = () => {
    fishesRef.current.push({
      x: Math.random() * (CANVAS_WIDTH - 40),
      y: Math.random() * (CANVAS_HEIGHT - 40),
      width: 40,
      height: 30,
      velocityX: (Math.random() - 0.5) * 2,
      collected: false,
    });
  };

  const spawnKillerFish = () => {
    killerFishesRef.current.push({
      x: Math.random() * (CANVAS_WIDTH - 100),
      y: Math.random() * (CANVAS_HEIGHT - 80),
      width: 100,
      height: 75,
      velocityX: (Math.random() - 0.5) * 1.5,
      velocityY: (Math.random() - 0.5) * 1.5,
    });
  };

  const checkCollision = (
    obj1: {
      x: number;
      y: number;
      size?: number;
      width?: number;
      height?: number;
    },
    obj2: { x: number; y: number; width: number; height: number },
  ) => {
    const obj1Width = obj1.size || obj1.width || 0;
    const obj1Height = obj1.size || obj1.height || 0;

    // More accurate collision with smaller hitboxes (80% of actual size)
    const margin1 = obj1Width * 0.1;
    const margin2 = obj2.width * 0.1;

    return (
      obj1.x + margin1 < obj2.x + obj2.width - margin2 &&
      obj1.x + obj1Width - margin1 > obj2.x + margin2 &&
      obj1.y + margin1 < obj2.y + obj2.height - margin2 &&
      obj1.y + obj1Height - margin1 > obj2.y + margin2
    );
  };

  const drawPuffin = (
    ctx: CanvasRenderingContext2D,
    puffin: { x: number; y: number; size: number },
  ) => {
    const scale = puffin.size / INITIAL_PUFFIN_SIZE;

    ctx.save();
    // Body
    ctx.fillStyle = "#2C3E50";
    ctx.beginPath();
    ctx.ellipse(
      puffin.x + 20 * scale,
      puffin.y + 25 * scale,
      15 * scale,
      20 * scale,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Belly
    ctx.fillStyle = "#F7F3E9";
    ctx.beginPath();
    ctx.ellipse(
      puffin.x + 20 * scale,
      puffin.y + 28 * scale,
      10 * scale,
      14 * scale,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Head
    ctx.fillStyle = "#2C3E50";
    ctx.beginPath();
    ctx.arc(
      puffin.x + 20 * scale,
      puffin.y + 12 * scale,
      12 * scale,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // White eye dot
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(
      puffin.x + 23 * scale,
      puffin.y + 10 * scale,
      2 * scale,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Beak
    ctx.fillStyle = "#FF6B35";
    ctx.beginPath();
    ctx.moveTo(puffin.x + 28 * scale, puffin.y + 12 * scale);
    ctx.lineTo(puffin.x + 38 * scale, puffin.y + 15 * scale);
    ctx.lineTo(puffin.x + 28 * scale, puffin.y + 18 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const puffin = puffinRef.current;

    // Clear canvas with underwater background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#1E88E5");
    gradient.addColorStop(1, "#0D47A1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw bubbles
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (let i = 0; i < 10; i++) {
      const x = (i * 80 + Date.now() / 20) % CANVAS_WIDTH;
      const y = (i * 50 + Date.now() / 10) % CANVAS_HEIGHT;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Handle movement
    puffin.velocityX = 0;
    puffin.velocityY = 0;

    if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a")) {
      puffin.velocityX = -MOVE_SPEED;
    }
    if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) {
      puffin.velocityX = MOVE_SPEED;
    }
    if (keysRef.current.has("ArrowUp") || keysRef.current.has("w")) {
      puffin.velocityY = -MOVE_SPEED;
    }
    if (keysRef.current.has("ArrowDown") || keysRef.current.has("s")) {
      puffin.velocityY = MOVE_SPEED;
    }

    puffin.x = Math.max(
      0,
      Math.min(CANVAS_WIDTH - puffin.size, puffin.x + puffin.velocityX),
    );
    puffin.y = Math.max(
      0,
      Math.min(CANVAS_HEIGHT - puffin.size, puffin.y + puffin.velocityY),
    );

    // Draw puffin
    drawPuffin(ctx, puffin);

    // Update and draw regular fish using new sprite
    fishesRef.current.forEach((fish) => {
      if (!fish.collected) {
        fish.x += fish.velocityX;

        if (fish.x < 0 || fish.x > CANVAS_WIDTH - fish.width) {
          fish.velocityX *= -1;
        }

        // Draw fish using new single-tooth sprite
        const fishImg = new Image();
        fishImg.src =
          "/assets/generated/fish-collectible-single-tooth-transparent.dim_64x64.png";
        ctx.drawImage(fishImg, fish.x, fish.y, fish.width, fish.height);

        // Check collision with improved detection
        if (checkCollision(puffin, fish)) {
          fish.collected = true;
          setScore((prev) => prev + 10);

          // Grow puffin indefinitely
          puffin.size += SIZE_GROWTH_PER_FISH;

          spawnFish();
        }
      }
    });

    // Remove collected fish
    fishesRef.current = fishesRef.current.filter((f) => !f.collected);

    // Update and draw killer fish using new sprite
    killerFishesRef.current.forEach((killerFish) => {
      killerFish.x += killerFish.velocityX;
      killerFish.y += killerFish.velocityY;

      // Bounce off walls
      if (killerFish.x < 0 || killerFish.x > CANVAS_WIDTH - killerFish.width) {
        killerFish.velocityX *= -1;
      }
      if (
        killerFish.y < 0 ||
        killerFish.y > CANVAS_HEIGHT - killerFish.height
      ) {
        killerFish.velocityY *= -1;
      }

      // Draw killer fish using new single-tooth sprite
      const killerFishImg = new Image();
      killerFishImg.src =
        "/assets/generated/killer-fish-single-tooth-transparent.dim_128x96.png";
      ctx.drawImage(
        killerFishImg,
        killerFish.x,
        killerFish.y,
        killerFish.width,
        killerFish.height,
      );

      // Check collision with puffin using improved detection
      if (checkCollision(puffin, killerFish)) {
        setIsGameActive(false);
        setGameOver(true);
        setDefeatedByKiller(true);
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
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keysRef.current.delete(e.key);
  };

  const handleSubmitScore = async () => {
    if (playerName.trim() && score > 0) {
      await submitScoreMutation.mutateAsync({
        gameMode: GameMode.fishFrenzy,
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

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
            <h1 className="text-3xl font-bold md:text-4xl">Fish Frenzy</h1>
            <p className="mt-2 text-muted-foreground">
              Catch fish to grow bigger, but avoid the killer fish! Use arrow
              keys or WASD to swim.
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
                <CardTitle>
                  {defeatedByKiller ? "Defeated by Killer Fish!" : "Game Over!"}
                </CardTitle>
                <CardDescription>
                  {defeatedByKiller
                    ? `You were caught by a killer fish! Your score: ${score}. Submit your score to the leaderboard!`
                    : `Your score: ${score}. Submit your score to the leaderboard!`}
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
            <DialogTitle>How to Play: Fish Frenzy</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p className="text-base">
                Use <strong>arrow keys</strong> to swim. Catch fish to grow
                bigger, but avoid the killer fish! Catch as many fish as you
                can!
              </p>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li>
                  Use <strong>↑↓←→ (Arrow Keys)</strong> or{" "}
                  <strong>WASD</strong> to swim in all directions
                </li>
                <li>
                  Swim into <strong>small orange fish</strong> to catch them and
                  earn <strong>10 points</strong> each
                </li>
                <li>
                  Each fish you catch makes you <strong>grow bigger</strong> -
                  there's no size limit!
                </li>
                <li>
                  <strong>Avoid the large red killer fish</strong> - they will
                  end your game instantly!
                </li>
                <li>New fish appear after you catch one</li>
                <li>Try to beat your high score!</li>
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
