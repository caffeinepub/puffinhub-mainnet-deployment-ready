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
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "cliff";
}

interface FlightAdventureGameProps {
  onBack: () => void;
}

export default function FlightAdventureGame({
  onBack,
}: FlightAdventureGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const puffinRef = useRef({ x: 100, y: 250, velocityY: 0 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const scrollSpeedRef = useRef(1.5);
  const distanceRef = useRef(0);

  const [score, setScore] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showPreGameOverlay, setShowPreGameOverlay] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const submitScoreMutation = useSubmitScore();

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const PUFFIN_SIZE = 40;
  const GRAVITY = 0.25; // Reduced from 0.4 for slower descent
  const FLAP_FORCE = -6.5;
  const INITIAL_SCROLL_SPEED = 1.5;
  const SPEED_INCREMENT = 0.15;
  const SPEED_INCREMENT_INTERVAL = 500;

  const initGame = () => {
    puffinRef.current = { x: 100, y: 250, velocityY: 0 };
    obstaclesRef.current = [];
    scrollSpeedRef.current = INITIAL_SCROLL_SPEED;
    distanceRef.current = 0;
    setScore(0);
    setIsGameActive(false);
    setGameOver(false);
    setShowNameInput(false);
    setShowInstructions(false);
    setShowPreGameOverlay(true);
    setGameStarted(false);

    // Draw initial state
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawInitialState(ctx);
      }
    }
  };

  const drawPuffin = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    // Body
    ctx.fillStyle = "#2C3E50";
    ctx.beginPath();
    ctx.ellipse(x + 20, y + 25, 15, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = "#F7F3E9";
    ctx.beginPath();
    ctx.ellipse(x + 20, y + 28, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#2C3E50";
    ctx.beginPath();
    ctx.arc(x + 20, y + 12, 12, 0, Math.PI * 2);
    ctx.fill();

    // White eye dot
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x + 23, y + 10, 2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = "#FF6B35";
    ctx.beginPath();
    ctx.moveTo(x + 28, y + 12);
    ctx.lineTo(x + 38, y + 15);
    ctx.lineTo(x + 28, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawInitialState = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw clear sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, "#87CEEB");
    skyGradient.addColorStop(1, "#5DD9D1");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw puffin at starting position
    const puffin = puffinRef.current;
    drawPuffin(ctx, puffin.x, puffin.y);
  };

  const spawnObstacle = () => {
    const height = 100 + Math.random() * 150;
    // Wider gap at the beginning, normal gap later
    const gap = distanceRef.current < 300 ? 250 : 200;

    // Top cliff
    obstaclesRef.current.push({
      x: CANVAS_WIDTH,
      y: 0,
      width: 60,
      height: height,
      type: "cliff",
    });
    // Bottom cliff
    obstaclesRef.current.push({
      x: CANVAS_WIDTH,
      y: height + gap,
      width: 60,
      height: CANVAS_HEIGHT - (height + gap),
      type: "cliff",
    });
  };

  const checkCollision = (
    puffin: { x: number; y: number },
    obstacle: Obstacle,
  ) => {
    return (
      puffin.x < obstacle.x + obstacle.width &&
      puffin.x + PUFFIN_SIZE > obstacle.x &&
      puffin.y < obstacle.y + obstacle.height &&
      puffin.y + PUFFIN_SIZE > obstacle.y
    );
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const puffin = puffinRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw clear sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, "#87CEEB");
    skyGradient.addColorStop(1, "#5DD9D1");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Handle input
    if (
      keysRef.current.has("ArrowUp") ||
      keysRef.current.has("w") ||
      keysRef.current.has(" ")
    ) {
      puffin.velocityY = FLAP_FORCE;
    }

    // Apply gravity
    puffin.velocityY += GRAVITY;
    puffin.y += puffin.velocityY;

    // Boundary check
    if (puffin.y < 0) {
      puffin.y = 0;
      puffin.velocityY = 0;
    }
    if (puffin.y > CANVAS_HEIGHT - PUFFIN_SIZE) {
      setIsGameActive(false);
      setGameOver(true);
      setShowNameInput(true);
      return;
    }

    // Draw puffin
    drawPuffin(ctx, puffin.x, puffin.y);

    // Update and draw obstacles
    distanceRef.current += scrollSpeedRef.current;
    if (distanceRef.current % 150 === 0) {
      spawnObstacle();
    }

    // Gradually increase difficulty
    if (
      distanceRef.current % SPEED_INCREMENT_INTERVAL === 0 &&
      distanceRef.current > 0
    ) {
      scrollSpeedRef.current += SPEED_INCREMENT;
    }

    obstaclesRef.current = obstaclesRef.current.filter((obstacle) => {
      obstacle.x -= scrollSpeedRef.current;

      if (obstacle.x + obstacle.width < 0) {
        return false;
      }

      // Draw cliff obstacle
      ctx.fillStyle = "#8B7355";
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.strokeStyle = "#654321";
      ctx.lineWidth = 2;
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

      // Check collision
      if (checkCollision(puffin, obstacle)) {
        setIsGameActive(false);
        setGameOver(true);
        setShowNameInput(true);
        return true;
      }

      return true;
    });

    // Update score
    setScore(Math.floor(distanceRef.current / 10));

    if (isGameActive) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;
    keysRef.current.add(key);

    // Start game on first control key press
    if (
      !gameStarted &&
      showPreGameOverlay &&
      (key === "ArrowUp" || key === "w" || key === " ")
    ) {
      setShowPreGameOverlay(false);
      setGameStarted(true);
      setIsGameActive(true);
    }

    if (["ArrowUp", "ArrowDown", " "].includes(key)) {
      e.preventDefault();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keysRef.current.delete(e.key);
  };

  const handleSubmitScore = async () => {
    if (playerName.trim() && score > 0) {
      await submitScoreMutation.mutateAsync({
        gameMode: GameMode.flightAdventure,
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
  }, [showPreGameOverlay, gameStarted]);

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
            <h1 className="text-3xl font-bold md:text-4xl">
              Puffin Flight Adventure
            </h1>
            <p className="mt-2 text-muted-foreground">
              Fly through clear skies and cliffs! Use arrow keys, W, or spacebar
              to fly up.
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
              {showPreGameOverlay && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="bg-background border-4 border-primary rounded-lg p-8 max-w-md text-center shadow-2xl">
                    <h2 className="text-2xl font-bold mb-4 text-primary">
                      Ready to Fly?
                    </h2>
                    <p className="text-lg mb-2">
                      Press{" "}
                      <strong className="text-accent">↑ (Up Arrow)</strong>,{" "}
                      <strong className="text-accent">W</strong>, or{" "}
                      <strong className="text-accent">Spacebar</strong>
                    </p>
                    <p className="text-lg">to flap and fly upward.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center space-y-4">
          {!isGameActive && !gameOver && !showPreGameOverlay && (
            <Button size="lg" onClick={initGame} className="gap-2">
              <RotateCcw className="h-5 w-5" />
              Start Game
            </Button>
          )}

          {gameOver && showNameInput && (
            <Card>
              <CardHeader>
                <CardTitle>Game Over!</CardTitle>
                <CardDescription>
                  Your score: {score}. Submit your score to the leaderboard!
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
            <DialogTitle>How to Play: Flight Adventure</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p className="text-base">
                Use <strong>arrow keys</strong> to fly. Avoid obstacles and stay
                in the air as long as possible to earn points.
              </p>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li>
                  Press <strong>↑ (Up Arrow)</strong>, <strong>W</strong>, or{" "}
                  <strong>Spacebar</strong> to flap and fly upward
                </li>
                <li>
                  Avoid hitting <strong>cliffs</strong>
                </li>
                <li>Don't fly too high or too low - stay within the screen</li>
                <li>The game gets faster as you progress</li>
                <li>Your score increases the longer you survive</li>
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
