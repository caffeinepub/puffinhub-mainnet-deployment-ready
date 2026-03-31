import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Principal } from "@icp-sdk/core/principal";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Trophy } from "lucide-react";
import { useMemo } from "react";
import { useGetPersonalStats, useGetUserProfile } from "../hooks/useQueries";

const PRESET_AVATARS = [
  {
    id: 0,
    src: "/assets/generated/nft-puffin-captain-white-bg.dim_200x200.png",
    label: "Captain Puffin",
  },
  {
    id: 1,
    src: "/assets/generated/nft-puffin-cool-white-bg.dim_200x200.png",
    label: "Cool Puffin",
  },
  {
    id: 2,
    src: "/assets/generated/nft-puffin-royal-white-bg.dim_200x200.png",
    label: "Royal Puffin",
  },
  {
    id: 3,
    src: "/assets/generated/nft-puffin-pirate-white-bg.dim_200x200.png",
    label: "Pirate Puffin",
  },
  {
    id: 4,
    src: "/assets/generated/nft-puffin-rainbow-white-bg.dim_200x200.png",
    label: "Rainbow Puffin",
  },
  {
    id: 5,
    src: "/assets/generated/nft-puffin-wizard-white-bg.dim_200x200.png",
    label: "Wizard Puffin",
  },
];

const GAME_NAMES = {
  flightAdventure: "Flight Adventure",
  fishFrenzy: "Fish Frenzy",
  puffinRescue: "Puffin Rescue",
  arcticSurf: "Arctic Surf",
  puffinSlide: "Puffin Slide",
  puffinCatch: "Puffin Catch",
  puffinTowerDefense: "Tower Defense",
  puffinColonyWars: "Colony Wars",
};

export default function PublicProfilePage() {
  const navigate = useNavigate();
  const { principalId } = useParams({ strict: false }) as {
    principalId: string;
  };

  // Parse principal before any hooks
  const principal = useMemo(() => {
    try {
      return Principal.fromText(principalId);
    } catch (_error) {
      return null;
    }
  }, [principalId]);

  // Always call hooks at the top level
  const { data: userProfile, isLoading: profileLoading } = useGetUserProfile(
    principal || Principal.anonymous(),
  );
  const { data: personalStats, isLoading: statsLoading } = useGetPersonalStats(
    principal || Principal.anonymous(),
  );

  // Now handle invalid principal after hooks are called
  if (!principal) {
    return (
      <div className="container py-16">
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Invalid profile ID.</p>
            <Button onClick={() => navigate({ to: "/game" })} className="mt-4">
              Back to Games
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileLoading || statsLoading) {
    return (
      <div className="container py-16">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container py-16">
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Profile not found.</p>
            <Button onClick={() => navigate({ to: "/game" })} className="mt-4">
              Back to Games
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAvatarUrl = () => {
    if (userProfile.avatarType.__kind__ === "custom") {
      return userProfile.avatarType.custom.blob.getDirectURL();
    }
    const presetId = Number(userProfile.avatarType.preset);
    const presetAvatar = PRESET_AVATARS.find((a) => a.id === presetId);
    return presetAvatar?.src || PRESET_AVATARS[0].src;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Puffin-themed background */}
      <div className="absolute inset-0 overflow-hidden opacity-15">
        <img
          src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png"
          alt=""
          className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
          style={{ animationDuration: "7s" }}
        />
      </div>

      {/* Floating puffin mascots */}
      <div className="absolute inset-0 overflow-hidden opacity-8 pointer-events-none">
        <img
          src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png"
          alt=""
          className="absolute left-[10%] top-[20%] h-24 w-24 animate-bounce"
          style={{ animationDuration: "5s" }}
        />
        <img
          src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png"
          alt=""
          className="absolute right-[15%] bottom-[25%] h-28 w-28 animate-bounce"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
      </div>

      <div className="container relative z-10 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/game" })}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Games
          </Button>

          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 bg-gradient-to-r from-[oklch(0.62_0.18_245)] to-accent bg-clip-text text-4xl font-bold text-transparent">
              Puffin Profile
            </h1>
            <p className="text-muted-foreground">
              View player stats and achievements 🐧
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Profile Card */}
            <Card className="md:col-span-1 border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-background">
              <CardHeader>
                <CardTitle className="text-center">Player Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32 border-4 border-primary/40 shadow-lg bg-white">
                    <AvatarImage
                      src={getAvatarUrl()}
                      alt={userProfile.displayName}
                    />
                    <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">
                      {userProfile.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="text-xl font-bold">
                      {userProfile.displayName}
                    </h3>
                    {userProfile.bio && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {userProfile.bio}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Stats */}
            <Card className="md:col-span-2 border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-accent" />
                  Personal Best Scores
                </CardTitle>
                <CardDescription>
                  Top scores across all Puffin games
                </CardDescription>
              </CardHeader>
              <CardContent>
                {personalStats ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(personalStats).map(([game, score]) => {
                      if (!score) return null;
                      return (
                        <div
                          key={game}
                          className="flex justify-between items-center p-3 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent"
                        >
                          <span className="text-sm font-medium">
                            {GAME_NAMES[game as keyof typeof GAME_NAMES]}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {Number(score)}
                          </span>
                        </div>
                      );
                    })}
                    {Object.values(personalStats).every((v) => !v) && (
                      <div className="col-span-2 text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          No scores yet. This player hasn't played any games!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No stats available for this player.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
