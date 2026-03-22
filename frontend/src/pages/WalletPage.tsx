import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wallet } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import ConnectedWalletSection from '../components/ConnectedWalletSection';
import { Card, CardContent } from '@/components/ui/card';

export default function WalletPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  // Redirect if not authenticated
  if (!identity) {
    return (
      <div className="container py-16">
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Please log in to view your wallet.</p>
            <Button onClick={() => navigate({ to: '/' })} className="mt-4">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Puffin-themed background */}
      <div className="absolute inset-0 overflow-hidden opacity-15">
        <img 
          src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
          alt="" 
          className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
          style={{ animationDuration: '7s' }}
        />
      </div>

      {/* Floating puffin mascots */}
      <div className="absolute inset-0 overflow-hidden opacity-8 pointer-events-none">
        <img 
          src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
          alt="" 
          className="absolute left-[10%] top-[20%] h-24 w-24 animate-bounce"
          style={{ animationDuration: '5s' }}
        />
        <img 
          src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
          alt="" 
          className="absolute right-[15%] bottom-[25%] h-28 w-28 animate-bounce"
          style={{ animationDuration: '6s', animationDelay: '1s' }}
        />
      </div>

      <div className="container relative z-10 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/' })}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>

          {/* Page Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Wallet className="h-10 w-10 text-primary" />
              <h1 className="bg-gradient-to-r from-[oklch(0.62_0.18_245)] to-accent bg-clip-text text-4xl font-bold text-transparent">
                My Puffin Wallet
              </h1>
            </div>
            <p className="text-muted-foreground">
              Manage your ICP and Puffin tokens 🐧
            </p>
          </div>

          <div className="space-y-6">
            {/* Connected Wallet Section - Plug Wallet Only */}
            <ConnectedWalletSection />
          </div>
        </div>
      </div>
    </div>
  );
}
