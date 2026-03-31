import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import {
  type IdentityProvider,
  useUnifiedIdentity,
} from "../hooks/useUnifiedIdentity";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { login, loginStatus } = useUnifiedIdentity();
  const [_selectedProvider, setSelectedProvider] =
    useState<IdentityProvider | null>(null);

  const handleProviderSelect = (provider: IdentityProvider) => {
    setSelectedProvider(provider);
    login(provider);
    onOpenChange(false);
  };

  const isLoggingIn = loginStatus === "logging-in";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-2 border-primary/30">
        {/* Wave background overlay */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none rounded-lg">
          <img
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png"
            alt=""
            className="absolute left-0 top-0 h-full w-full object-cover"
          />
        </div>

        {/* Floating feathers */}
        <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none rounded-lg">
          <img
            src="/assets/generated/floating-feathers-transparent.dim_32x32.png"
            alt=""
            className="absolute left-[10%] top-[15%] h-6 w-6 animate-bounce"
            style={{ animationDuration: "4s" }}
          />
          <img
            src="/assets/generated/floating-feathers-transparent.dim_32x32.png"
            alt=""
            className="absolute right-[15%] bottom-[20%] h-5 w-5 animate-bounce"
            style={{ animationDuration: "5s", animationDelay: "1s" }}
          />
        </div>

        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Choose Identity Provider
          </DialogTitle>
          <DialogDescription className="text-center text-foreground/70">
            Select your preferred identity provider to log in
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 flex flex-col gap-4 py-4">
          {/* Official Internet Identity */}
          <button
            onClick={() => handleProviderSelect("ic")}
            disabled={isLoggingIn}
            className="group relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6 transition-all hover:border-primary/50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">
                  Official Internet Identity
                </h3>
                <p className="text-sm text-foreground/70 mt-1">
                  identity.ic0.app
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>

          {/* AI Identity */}
          <button
            onClick={() => handleProviderSelect("ai")}
            disabled={isLoggingIn}
            className="group relative overflow-hidden rounded-xl border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 p-6 transition-all hover:border-accent/50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">
                  AI Identity
                </h3>
                <p className="text-sm text-foreground/70 mt-1">id.ai</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/10 to-accent/0 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>

        {isLoggingIn && (
          <div className="relative z-10 text-center">
            <p className="text-sm text-foreground/70">
              Connecting to identity provider...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
