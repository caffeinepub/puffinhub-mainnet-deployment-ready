import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import type { PuffinProfile } from "../backend";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

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

export default function ProfileSetupModal() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number>(0);

  const saveProfile = useSaveCallerUserProfile();

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }

    const profile: PuffinProfile = {
      displayName: displayName.trim(),
      bio: bio.trim(),
      avatarType: {
        __kind__: "preset",
        preset: BigInt(selectedPreset),
      },
    };

    try {
      await saveProfile.mutateAsync(profile);
      toast.success(
        "Welcome to PuffinHub! 🐧 Your profile has been created successfully!",
      );
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {/* Puffin-themed background */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none rounded-lg">
          <img
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png"
            alt=""
            className="absolute inset-0 h-full w-full animate-pulse object-cover"
            style={{ animationDuration: "6s" }}
          />
        </div>

        <DialogHeader className="relative z-10">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/generated/puffin-head-logo-transparent.dim_200x200.png"
              alt="Puffin"
              className="h-20 w-20"
            />
          </div>
          <DialogTitle className="text-center text-2xl bg-gradient-to-r from-[oklch(0.62_0.18_245)] to-accent bg-clip-text text-transparent">
            Welcome to PuffinHub! 🐧
          </DialogTitle>
          <DialogDescription className="text-center">
            Let's set up your Puffin profile to get started
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 space-y-6 py-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-sm font-semibold">
              Display Name *
            </Label>
            <Input
              id="displayName"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              className="border-2 border-primary/30 focus:border-primary/60"
            />
          </div>

          {/* Avatar Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Choose Your NFT-Style Puffin Avatar
            </Label>
            <p className="text-xs text-muted-foreground">
              Select from our exclusive collection of collectible Puffin NFT art
            </p>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedPreset(avatar.id)}
                  className={`relative aspect-square rounded-xl border-2 transition-all duration-300 hover:scale-105 overflow-hidden bg-white ${
                    selectedPreset === avatar.id
                      ? "border-primary shadow-lg shadow-primary/40 ring-2 ring-primary/30"
                      : "border-primary/30 hover:border-primary/50"
                  }`}
                  title={avatar.label}
                >
                  <img
                    src={avatar.src}
                    alt={avatar.label}
                    className="h-full w-full object-cover"
                  />
                  {selectedPreset === avatar.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-[1px]">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-[10px] font-semibold text-white text-center leading-tight">
                      {avatar.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-semibold">
              Bio / Tagline (Optional)
            </Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              className="border-2 border-primary/30 focus:border-primary/60 resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/200
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saveProfile.isPending || !displayName.trim()}
            className="w-full gap-2 bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] shadow-lg hover:shadow-xl"
          >
            {saveProfile.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Creating Profile...</span>
              </>
            ) : (
              <span>Create Profile</span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
