import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, ArrowLeft } from 'lucide-react';
import FlightAdventureGame from '@/components/games/FlightAdventureGame';
import FishFrenzyGame from '@/components/games/FishFrenzyGame';
import PuffinRescueGame from '@/components/games/PuffinRescueGame';
import ArcticSurfGame from '@/components/games/ArcticSurfGame';
import PuffinCatchGame from '@/components/games/PuffinCatchGame';
import PuffinTowerDefenseGame from '@/components/games/PuffinTowerDefenseGame';
import PuffinColonyWarsGame from '@/components/games/PuffinColonyWarsGame';
import Leaderboard from '@/components/games/Leaderboard';

type GameMode = 'menu' | 'flightAdventure' | 'fishFrenzy' | 'puffinRescue' | 'arcticSurf' | 'puffinCatch' | 'puffinTowerDefense' | 'puffinColonyWars' | 'leaderboard';

export default function GamePage() {
  const [currentMode, setCurrentMode] = useState<GameMode>('menu');

  const renderGameContent = () => {
    switch (currentMode) {
      case 'flightAdventure':
        return <FlightAdventureGame onBack={() => setCurrentMode('menu')} />;
      case 'fishFrenzy':
        return <FishFrenzyGame onBack={() => setCurrentMode('menu')} />;
      case 'puffinRescue':
        return <PuffinRescueGame onBack={() => setCurrentMode('menu')} />;
      case 'arcticSurf':
        return <ArcticSurfGame onBack={() => setCurrentMode('menu')} />;
      case 'puffinCatch':
        return <PuffinCatchGame onBack={() => setCurrentMode('menu')} />;
      case 'puffinTowerDefense':
        return <PuffinTowerDefenseGame onBack={() => setCurrentMode('menu')} />;
      case 'puffinColonyWars':
        return <PuffinColonyWarsGame onBack={() => setCurrentMode('menu')} />;
      case 'leaderboard':
        return (
          <div className="relative min-h-screen overflow-hidden">
            {/* Animated wave motion background */}
            <div className="fixed inset-0 overflow-hidden opacity-15 pointer-events-none">
              <img 
                src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                alt="" 
                className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
                style={{ animationDuration: '7s' }}
              />
            </div>

            {/* Floating puffin mascots */}
            <div className="fixed inset-0 overflow-hidden opacity-8 pointer-events-none">
              <img 
                src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                alt="" 
                className="absolute left-[10%] top-[20%] h-20 w-20 animate-bounce"
                style={{ animationDuration: '6s' }}
              />
              <img 
                src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                alt="" 
                className="absolute right-[15%] bottom-[25%] h-24 w-24 animate-bounce"
                style={{ animationDuration: '7s', animationDelay: '1.5s' }}
              />
            </div>

            <div className="container relative z-10 py-12">
              <div className="mx-auto max-w-4xl">
                <div className="mb-8 flex items-center gap-4">
                  <Button variant="outline" onClick={() => setCurrentMode('menu')} className="border-2 border-primary/40 transition-all duration-300 hover:border-primary/60">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Menu
                  </Button>
                  <h1 className="bg-gradient-to-r from-[oklch(0.62_0.18_245)] via-[oklch(0.70_0.15_210)] to-accent bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                    Leaderboards
                  </h1>
                </div>
                <Leaderboard />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="relative min-h-screen overflow-hidden">
            {/* Animated wave motion background */}
            <div className="fixed inset-0 overflow-hidden opacity-15 pointer-events-none">
              <img 
                src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                alt="" 
                className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
                style={{ animationDuration: '7s' }}
              />
              <img 
                src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                alt="" 
                className="absolute right-0 bottom-0 h-full w-full animate-pulse object-cover opacity-50"
                style={{ animationDuration: '9s', animationDelay: '2s' }}
              />
            </div>

            {/* Floating puffin mascots */}
            <div className="fixed inset-0 overflow-hidden opacity-8 pointer-events-none">
              <img 
                src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                alt="" 
                className="absolute left-[8%] top-[15%] h-20 w-20 animate-bounce"
                style={{ animationDuration: '6s' }}
              />
              <img 
                src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                alt="" 
                className="absolute right-[12%] top-[25%] h-24 w-24 animate-bounce"
                style={{ animationDuration: '7s', animationDelay: '1s' }}
              />
              <img 
                src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                alt="" 
                className="absolute left-[15%] bottom-[20%] h-22 w-22 animate-bounce"
                style={{ animationDuration: '8s', animationDelay: '2s' }}
              />
            </div>

            {/* Soft gradient orbs */}
            <div className="fixed inset-0 overflow-hidden opacity-20 pointer-events-none">
              <div className="absolute left-[10%] top-[20%] h-64 w-64 animate-pulse rounded-full bg-[oklch(0.75_0.15_200)] blur-3xl"></div>
              <div className="absolute right-[15%] bottom-[25%] h-72 w-72 animate-pulse rounded-full bg-accent/20 blur-3xl" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="container relative z-10 py-12">
              <div className="mx-auto max-w-6xl">
                <div className="mb-12 text-center">
                  <h1 className="bg-gradient-to-r from-[oklch(0.62_0.18_245)] via-[oklch(0.70_0.15_210)] to-accent bg-clip-text text-4xl font-bold text-transparent md:text-5xl mb-4">
                    🎮 Puffin Arcade
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Choose your adventure and help Puffin on exciting challenges!
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                  <Card className="group relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-background transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 cursor-pointer" onClick={() => setCurrentMode('flightAdventure')}>
                    <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <img 
                        src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                        alt="" 
                        className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-30"
                        style={{ animationDuration: '3s' }}
                      />
                    </div>
                    <CardHeader className="relative">
                      <div className="mb-4 w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent rounded-lg overflow-hidden">
                        <img 
                          src="/assets/generated/puffin-flight-logo-style-thumbnail.dim_200x150.png" 
                          alt="Flight Adventure - Puffin flying through clear skies" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <CardTitle className="text-center">Flight Adventure</CardTitle>
                      <CardDescription className="text-center">
                        Navigate through clear skies and cliffs in this side-scrolling challenge
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                      <Button className="group/btn relative w-full overflow-hidden bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/50" size="lg">
                        <span className="relative z-10">Play Now</span>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full"></div>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="group relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-background transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 cursor-pointer" onClick={() => setCurrentMode('fishFrenzy')}>
                    <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <img 
                        src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                        alt="" 
                        className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-30"
                        style={{ animationDuration: '3s', animationDelay: '0.3s' }}
                      />
                    </div>
                    <CardHeader className="relative">
                      <div className="mb-4 w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent rounded-lg overflow-hidden">
                        <img 
                          src="/assets/generated/fish-frenzy-logo-style-thumbnail.dim_200x150.png" 
                          alt="Fish Frenzy - Puffin diving underwater" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <CardTitle className="text-center">Fish Frenzy</CardTitle>
                      <CardDescription className="text-center">
                        Dive underwater and catch fish while avoiding killer fish
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                      <Button className="group/btn relative w-full overflow-hidden bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/50" size="lg">
                        <span className="relative z-10">Play Now</span>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full"></div>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="group relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-background transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 cursor-pointer" onClick={() => setCurrentMode('puffinRescue')}>
                    <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <img 
                        src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                        alt="" 
                        className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-30"
                        style={{ animationDuration: '3s', animationDelay: '0.6s' }}
                      />
                    </div>
                    <CardHeader className="relative">
                      <div className="mb-4 w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent rounded-lg overflow-hidden">
                        <img 
                          src="/assets/generated/puffin-rescue-logo-style-thumbnail.dim_200x150.png" 
                          alt="Puffin Rescue - Puffin rescuing chicks" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <CardTitle className="text-center">Puffin Rescue</CardTitle>
                      <CardDescription className="text-center">
                        Navigate arctic terrain to rescue lost puffin chicks across 5 levels
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                      <Button className="group/btn relative w-full overflow-hidden bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/50" size="lg">
                        <span className="relative z-10">Play Now</span>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full"></div>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="group relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-background transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 cursor-pointer" onClick={() => setCurrentMode('arcticSurf')}>
                    <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <img 
                        src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                        alt="" 
                        className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-30"
                        style={{ animationDuration: '3s', animationDelay: '0.9s' }}
                      />
                    </div>
                    <CardHeader className="relative">
                      <div className="mb-4 w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent rounded-lg overflow-hidden">
                        <img 
                          src="/assets/generated/arctic-surf-logo-style-thumbnail.dim_200x150.png" 
                          alt="Arctic Surf - Puffin surfing on ice floes" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <CardTitle className="text-center">Arctic Surf</CardTitle>
                      <CardDescription className="text-center">
                        Ride ice floes across arctic waters and jump between floating ice
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                      <Button className="group/btn relative w-full overflow-hidden bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/50" size="lg">
                        <span className="relative z-10">Play Now</span>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full"></div>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="group relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-background transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 cursor-pointer" onClick={() => setCurrentMode('puffinCatch')}>
                    <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <img 
                        src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                        alt="" 
                        className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-30"
                        style={{ animationDuration: '3s', animationDelay: '1.2s' }}
                      />
                    </div>
                    <CardHeader className="relative">
                      <div className="mb-4 w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent rounded-lg overflow-hidden">
                        <img 
                          src="/assets/generated/puffin-catch-logo-style-thumbnail.dim_200x150.png" 
                          alt="Puffin Catch - Puffin catching falling fish" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <CardTitle className="text-center">Puffin Catch</CardTitle>
                      <CardDescription className="text-center">
                        Catch falling fish mid-air while avoiding trash items
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                      <Button className="group/btn relative w-full overflow-hidden bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/50" size="lg">
                        <span className="relative z-10">Play Now</span>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full"></div>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="group relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-background transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 cursor-pointer" onClick={() => setCurrentMode('puffinTowerDefense')}>
                    <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <img 
                        src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                        alt="" 
                        className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-30"
                        style={{ animationDuration: '3s', animationDelay: '1.5s' }}
                      />
                    </div>
                    <CardHeader className="relative">
                      <div className="mb-4 w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent rounded-lg overflow-hidden">
                        <img 
                          src="/assets/generated/tower-defense-logo-style-thumbnail.dim_200x150.png" 
                          alt="Puffin Tower Defense - Puffin defending eggs" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <CardTitle className="text-center">Puffin Tower Defense</CardTitle>
                      <CardDescription className="text-center">
                        Build puffin towers to defend your eggs from waves of enemies
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                      <Button className="group/btn relative w-full overflow-hidden bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/50" size="lg">
                        <span className="relative z-10">Play Now</span>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full"></div>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="group relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-background transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 cursor-pointer" onClick={() => setCurrentMode('puffinColonyWars')}>
                    <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <img 
                        src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                        alt="" 
                        className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-30"
                        style={{ animationDuration: '3s', animationDelay: '1.8s' }}
                      />
                    </div>
                    <CardHeader className="relative">
                      <div className="mb-4 w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent rounded-lg overflow-hidden">
                        <img 
                          src="/assets/generated/puffin-colony-wars-logo-style-thumbnail.dim_200x150.png" 
                          alt="Puffin Colony Wars - Strategy battle game" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <CardTitle className="text-center">Puffin Colony Wars</CardTitle>
                      <CardDescription className="text-center">
                        Build your puffin army and destroy the enemy colony in this strategy game
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                      <Button className="group/btn relative w-full overflow-hidden bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/50" size="lg">
                        <span className="relative z-10">Play Now</span>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full"></div>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center">
                  <Button variant="outline" size="lg" onClick={() => setCurrentMode('leaderboard')} className="gap-2 border-2 border-primary/40 transition-all duration-300 hover:border-primary/60 hover:shadow-lg">
                    <Trophy className="h-5 w-5" />
                    View Leaderboards
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderGameContent();
}
