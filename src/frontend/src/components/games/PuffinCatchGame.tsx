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
import { ArrowLeft, Info, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface FallingItem {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  type: "fish" | "trash";
  caught: boolean;
}

interface PuffinCatchGameProps {
  onBack: () => void;
}

export default function PuffinCatchGame({ onBack }: PuffinCatchGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const puffinRef = useRef({ x: 400, y: 400, velocityX: 0, velocityY: 0 });
  const itemsRef = useRef<FallingItem[]>([]);
  const spawnTimerRef = useRef(0);
  const gameTimeRef = useRef(0);
  const difficultyTimerRef = useRef(0);

  const [score, setScore] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const submitScoreMutation = useSubmitScore();

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const PUFFIN_SIZE = 40;
  const MOVE_SPEED = 6;

  const initGame = () => {
    puffinRef.current = { x: 400, y: 400, velocityX: 0, velocityY: 0 };
    itemsRef.current = [];
    spawnTimerRef.current = 0;
    gameTimeRef.current = 0;
    difficultyTimerRef.current = 0;

    setScore(0);
    setIsGameActive(true);
    setGameOver(false);
    setShowNameInput(false);
  };

  const spawnItem = () => {
    // Increase trash spawn rate over time
    const trashChance = 0.3 + Math.min(gameTimeRef.current / 60000, 0.3); // Increases up to 60% over time
    const type = Math.random() > trashChance ? "fish" : "trash";
    const x = 50 + Math.random() * (CANVAS_WIDTH - 100);

    // Increase fall speed over time
    const baseSpeed = 2 + Math.random() * 2;
    const speedMultiplier = 1 + Math.min(gameTimeRef.current / 30000, 1); // Up to 2x speed

    itemsRef.current.push({
      x,
      y: -50,
      width: type === "fish" ? 40 : 35,
      height: type === "fish" ? 30 : 35,
      velocityY: baseSpeed * speedMultiplier,
      type,
      caught: false,
    });
  };

  const checkCollision = (
    puffin: { x: number; y: number },
    item: FallingItem,
  ) => {
    return (
      puffin.x < item.x + item.width &&
      puffin.x + PUFFIN_SIZE > item.x &&
      puffin.y < item.y + item.height &&
      puffin.y + PUFFIN_SIZE > item.y
    );
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const puffin = puffinRef.current;

    // Update game time
    gameTimeRef.current += 16; // Approximate frame time
    difficultyTimerRef.current += 16;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw sky background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E3F2FD");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    for (let i = 0; i < 3; i++) {
      const x = (i * 300 + Date.now() / 50) % CANVAS_WIDTH;
      ctx.beginPath();
      ctx.arc(x, 80 + i * 40, 30, 0, Math.PI * 2);
      ctx.arc(x + 25, 80 + i * 40, 35, 0, Math.PI * 2);
      ctx.arc(x + 50, 80 + i * 40, 30, 0, Math.PI * 2);
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
      Math.min(CANVAS_WIDTH - PUFFIN_SIZE, puffin.x + puffin.velocityX),
    );
    puffin.y = Math.max(
      0,
      Math.min(CANVAS_HEIGHT - PUFFIN_SIZE, puffin.y + puffin.velocityY),
    );

    // Draw puffin with white eye dot
    ctx.save();
    ctx.fillStyle = "#2C3E50";
    ctx.beginPath();
    ctx.ellipse(puffin.x + 20, puffin.y + 25, 15, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F7F3E9";
    ctx.beginPath();
    ctx.ellipse(puffin.x + 20, puffin.y + 28, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2C3E50";
    ctx.beginPath();
    ctx.arc(puffin.x + 20, puffin.y + 12, 12, 0, Math.PI * 2);
    ctx.fill();

    // White eye dot
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(puffin.x + 23, puffin.y + 10, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FF6B35";
    ctx.beginPath();
    ctx.moveTo(puffin.x + 28, puffin.y + 12);
    ctx.lineTo(puffin.x + 38, puffin.y + 15);
    ctx.lineTo(puffin.x + 28, puffin.y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Spawn items - increase frequency every 5 seconds
    const spawnRate = Math.max(
      30,
      60 - Math.floor(difficultyTimerRef.current / 5000) * 5,
    );
    spawnTimerRef.current++;
    if (spawnTimerRef.current % spawnRate === 0) {
      spawnItem();
    }

    // Update and draw items
    itemsRef.current = itemsRef.current.filter((item) => {
      if (!item.caught) {
        item.y += item.velocityY;

        if (item.y > CANVAS_HEIGHT) {
          return false;
        }

        // Draw item
        ctx.save();
        if (item.type === "fish") {
          ctx.fillStyle = "#FF6B35";
          ctx.beginPath();
          ctx.ellipse(item.x + 20, item.y + 15, 15, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(item.x + 5, item.y + 15);
          ctx.lineTo(item.x, item.y + 10);
          ctx.lineTo(item.x, item.y + 20);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(item.x + 28, item.y + 13, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw red cross hazard
          ctx.fillStyle = "#D32F2F";
          ctx.fillRect(item.x, item.y, item.width, item.height);
          ctx.strokeStyle = "#B71C1C";
          ctx.lineWidth = 2;
          ctx.strokeRect(item.x, item.y, item.width, item.height);

          // Draw X
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(item.x + 8, item.y + 8);
          ctx.lineTo(item.x + item.width - 8, item.y + item.height - 8);
          ctx.moveTo(item.x + item.width - 8, item.y + 8);
          ctx.lineTo(item.x + 8, item.y + item.height - 8);
          ctx.stroke();
        }
        ctx.restore();

        // Check collision
        if (checkCollision(puffin, item)) {
          item.caught = true;

          if (item.type === "fish") {
            setScore((prev) => prev + 10);
          } else {
            // Single life - game over on first trash hit
            setIsGameActive(false);
            setGameOver(true);
            setShowNameInput(true);
            return false;
          }

          return false;
        }
      }

      return !item.caught;
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
        gameMode: GameMode.puffinCatch,
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
          <div className="flex-1">
            <h1 className="text-3xl font-bold md:text-4xl">Puffin Catch</h1>
            <p className="mt-2 text-muted-foreground">
              Catch falling fish while avoiding trash! One hit and you're out!
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

              {/* Start Game Button Overlay - Positioned over canvas */}
              {!isGameActive && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                  <Button
                    size="lg"
                    onClick={initGame}
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

        <div className="mt-6 text-center space-y-4">
          {gameOver && showNameInput && (
            <Card>
              <CardHeader>
                <CardTitle>Game Over!</CardTitle>
                <CardDescription>
                  You hit trash! Your score: {score}
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
            <DialogTitle>How to Play: Puffin Catch</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p className="text-base">
                Use <strong>arrow keys</strong> to fly and catch falling fish.
                Avoid trash items - one hit and you're out!
              </p>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li>
                  Use <strong>↑↓←→ (Arrow Keys)</strong> or{" "}
                  <strong>WASD</strong> to fly in all directions
                </li>
                <li>
                  Catch <strong>orange fish</strong> to earn{" "}
                  <strong>10 points</strong> each
                </li>
                <li>
                  <strong>Avoid red cross hazard boxes</strong> - one hit ends
                  the game!
                </li>
                <li>
                  The game gets harder over time with more hazards and faster
                  falling items!
                </li>
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
