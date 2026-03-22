import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUnifiedIdentity } from '../hooks/useUnifiedIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useGetPersonalStats } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Loader2, Trophy } from 'lucide-react';
import type { PuffinProfile } from '../backend';

const PRESET_AVATARS = [
  { id: 0, src: '/assets/generated/nft-puffin-captain-white-bg.dim_200x200.png', label: 'Captain Puffin' },
  { id: 1, src: '/assets/generated/nft-puffin-cool-white-bg.dim_200x200.png', label: 'Cool Puffin' },
  { id: 2, src: '/assets/generated/nft-puffin-royal-white-bg.dim_200x200.png', label: 'Royal Puffin' },
  { id: 3, src: '/assets/generated/nft-puffin-pirate-white-bg.dim_200x200.png', label: 'Pirate Puffin' },
  { id: 4, src: '/assets/generated/nft-puffin-rainbow-white-bg.dim_200x200.png', label: 'Rainbow Puffin' },
  { id: 5, src: '/assets/generated/nft-puffin-wizard-white-bg.dim_200x200.png', label: 'Wizard Puffin' },
];

const GAME_NAMES = {
  flightAdventure: 'Flight Adventure',
  fishFrenzy: 'Fish Frenzy',
  puffinRescue: 'Puffin Rescue',
  arcticSurf: 'Arctic Surf',
  puffinCatch: 'Puffin Catch',
  puffinTowerDefense: 'Tower Defense',
  puffinColonyWars: 'Colony Wars',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { identity } = useUnifiedIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const { data: personalStats } = useGetPersonalStats(identity?.getPrincipal());

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState(0);

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!isAuthenticated && !profileLoading) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, profileLoading, navigate]);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setBio(userProfile.bio);
      if (userProfile.avatarType.__kind__ === 'preset') {
        setSelectedAvatarId(Number(userProfile.avatarType.preset));
      }
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a display name');
      return;
    }

    const profile: PuffinProfile = {
      displayName: displayName.trim(),
      bio: bio.trim(),
      avatarType: {
        __kind__: 'preset',
        preset: BigInt(selectedAvatarId),
      },
    };

    try {
      await saveProfile.mutateAsync(profile);
      toast.success('Profile saved successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-12">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to manage your profile</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background py-12">
      {/* Wave background */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <img 
          src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
          alt="" 
          className="absolute left-0 top-0 h-full w-full object-cover"
        />
      </div>

      {/* Floating feathers */}
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
        <img 
          src="/assets/generated/floating-feathers-transparent.dim_32x32.png" 
          alt="" 
          className="absolute left-[10%] top-[20%] h-8 w-8 animate-bounce"
          style={{ animationDuration: '4s' }}
        />
        <img 
          src="/assets/generated/floating-feathers-transparent.dim_32x32.png" 
          alt="" 
          className="absolute right-[15%] top-[40%] h-6 w-6 animate-bounce"
          style={{ animationDuration: '5s', animationDelay: '1s' }}
        />
      </div>

      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl space-y-8">
          <Card className="border-2 border-primary/30 bg-white/95 dark:bg-slate-900/95 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Puffin Profile
              </CardTitle>
              <CardDescription>Customize your profile and view your game stats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Selection */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Choose Your Puffin Avatar</Label>
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                  {PRESET_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatarId(avatar.id)}
                      className={`group relative overflow-hidden rounded-xl border-4 transition-all hover:scale-105 ${
                        selectedAvatarId === avatar.id
                          ? 'border-primary shadow-lg'
                          : 'border-primary/20 hover:border-primary/40'
                      }`}
                    >
                      <img
                        src={avatar.src}
                        alt={avatar.label}
                        className="h-full w-full object-cover"
                      />
                      {selectedAvatarId === avatar.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-base font-semibold">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="border-2 border-primary/30 focus:border-primary"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-base font-semibold">Bio / Tagline</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="border-2 border-primary/30 focus:border-primary resize-none"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saveProfile.isPending}
                className="w-full rounded-full bg-gradient-to-r from-primary to-accent py-6 text-lg font-bold shadow-lg transition-all hover:shadow-xl"
              >
                {saveProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Personal Stats */}
          {personalStats && (
            <Card className="border-2 border-primary/30 bg-white/95 dark:bg-slate-900/95 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                  <Trophy className="h-6 w-6 text-accent" />
                  Personal Best Scores
                </CardTitle>
                <CardDescription>Your highest scores across all Puffin games</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(GAME_NAMES).map(([key, name]) => {
                    const score = personalStats[key as keyof typeof personalStats];
                    return (
                      <div
                        key={key}
                        className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4"
                      >
                        <div className="text-sm font-medium text-foreground/70">{name}</div>
                        <div className="mt-1 text-2xl font-bold text-primary">
                          {score ? Number(score).toLocaleString() : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
