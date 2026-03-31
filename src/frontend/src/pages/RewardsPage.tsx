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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FlaskConical,
  Gift,
  Loader2,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useClaimRewards,
  useGetRewardHistory,
  useGetUnclaimedRewards,
} from "../hooks/useQueries";
import { useUnifiedIdentity } from "../hooks/useUnifiedIdentity";

export default function RewardsPage() {
  const navigate = useNavigate();
  const { identity } = useUnifiedIdentity();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [claimResult, setClaimResult] = useState<{
    blockIndex: bigint;
    amount: bigint;
  } | null>(null);

  const {
    data: unclaimedRewards,
    isLoading: loadingRewards,
    refetch: refetchRewards,
  } = useGetUnclaimedRewards();
  const {
    data: rewardHistory,
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = useGetRewardHistory();
  const claimMutation = useClaimRewards();

  const isAuthenticated = !!identity;

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    navigate({ to: "/" });
    return null;
  }

  const unclaimedICP = unclaimedRewards
    ? Number(unclaimedRewards) / 100000000
    : 0;
  const hasUnclaimedRewards = unclaimedICP > 0;

  const handleClaimClick = () => {
    if (hasUnclaimedRewards) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmClaim = async () => {
    setShowConfirmDialog(false);

    try {
      const result = await claimMutation.mutateAsync();
      setClaimResult(result);
      setShowSuccessDialog(true);

      // Refetch rewards data
      await refetchRewards();
      await refetchHistory();

      toast.success("Rewards claimed successfully!");
    } catch (error: any) {
      console.error("Claim rewards error:", error);

      // Check for daily limit errors
      if (error.message?.includes("Daily reward limit reached")) {
        toast.error("Daily reward limit reached. Please try again tomorrow.", {
          duration: 5000,
        });
      } else {
        toast.error(
          error.message || "Failed to claim rewards. Please try again.",
        );
      }
    }
  };

  const handleCancelClaim = () => {
    setShowConfirmDialog(false);
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    setClaimResult(null);
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[oklch(0.95_0.02_245)] to-[oklch(0.98_0.01_245)] dark:from-[oklch(0.20_0.02_245)] dark:to-[oklch(0.15_0.01_245)]">
      {/* Wave motion background */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <img
          src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png"
          alt=""
          className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
          style={{ animationDuration: "8s" }}
        />
      </div>

      {/* Floating feathers */}
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
        <img
          src="/assets/generated/floating-feathers-transparent.dim_32x32.png"
          alt=""
          className="absolute left-[10%] top-[15%] h-8 w-8 animate-bounce"
          style={{ animationDuration: "4s" }}
        />
        <img
          src="/assets/generated/floating-feathers-transparent.dim_32x32.png"
          alt=""
          className="absolute right-[15%] top-[25%] h-6 w-6 animate-bounce"
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        />
        <img
          src="/assets/generated/floating-feathers-transparent.dim_32x32.png"
          alt=""
          className="absolute left-[20%] bottom-[20%] h-7 w-7 animate-bounce"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        />
      </div>

      <div className="container relative z-10 py-12">
        {/* Header with Beta Badge */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-4 relative">
              <Trophy className="h-12 w-12 text-primary" />
              {/* Beta Testing Badge - positioned in top-right corner */}
              <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 border-2 border-white dark:border-slate-900">
                <FlaskConical className="h-3 w-3" />
                <span>BETA</span>
              </div>
            </div>
          </div>
          <h1 className="mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-4xl font-bold text-transparent">
            Colony Wars Rewards
          </h1>
          <p className="text-lg text-muted-foreground">
            Claim your ICP rewards for winning Puffin Colony Wars battles
          </p>
          {/* Beta Testing Notice */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 dark:bg-amber-950/30 dark:text-amber-100 border border-amber-200 dark:border-amber-800">
            <FlaskConical className="h-4 w-4" />
            <span>This feature is currently in beta testing</span>
          </div>
        </div>

        <div className="mx-auto max-w-4xl space-y-6">
          {/* Daily Limits Info Card */}
          <Card className="border-2 border-blue-200 bg-blue-50/80 shadow-lg backdrop-blur-sm dark:border-blue-800 dark:bg-blue-950/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Daily Reward Limits
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    To ensure fair distribution, there are daily limits on
                    reward claims:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                      <span>
                        <strong>Global limit:</strong> 50 total rewards per day
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                      <span>
                        <strong>Personal limit:</strong> 5 rewards per player
                        per day
                      </span>
                    </li>
                  </ul>
                  <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                    Limits reset daily at midnight UTC. If you reach your limit,
                    try again tomorrow!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unclaimed Rewards Card */}
          <Card className="border-2 border-primary/20 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-slate-900/80">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Unclaimed Rewards</CardTitle>
                  <CardDescription>
                    Your pending ICP rewards from Colony Wars victories
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRewards ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center">
                    <div className="mb-2 text-sm font-medium text-muted-foreground">
                      Available to Claim
                    </div>
                    <div className="mb-1 text-5xl font-bold text-primary">
                      {unclaimedICP.toFixed(4)}
                    </div>
                    <div className="text-lg font-medium text-muted-foreground">
                      ICP
                    </div>
                  </div>

                  {hasUnclaimedRewards ? (
                    <Button
                      onClick={handleClaimClick}
                      disabled={claimMutation.isPending}
                      className="w-full rounded-full bg-gradient-to-r from-primary to-accent py-6 text-lg font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                    >
                      {claimMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Claiming Rewards...
                        </>
                      ) : (
                        <>
                          <Gift className="mr-2 h-5 w-5" />
                          Claim Rewards
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
                      <AlertCircle className="mx-auto mb-2 h-8 w-8 text-primary/60" />
                      <p className="text-sm font-medium text-muted-foreground">
                        No unclaimed rewards available. Win more Colony Wars
                        battles to earn rewards!
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>How it works:</strong> Earn 0.001 ICP for each
                      verified Colony Wars victory. Rewards are automatically
                      tracked and can be claimed at any time, subject to daily
                      limits.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reward History Card */}
          <Card className="border-2 border-primary/20 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-slate-900/80">
            <CardHeader>
              <CardTitle className="text-2xl">Claim History</CardTitle>
              <CardDescription>Your past reward claims</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : rewardHistory && rewardHistory.length > 0 ? (
                <div className="space-y-3">
                  {rewardHistory.map((claim, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-semibold">
                            {(Number(claim.amount) / 100000000).toFixed(4)} ICP
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(claim.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          Block Index
                        </div>
                        <div className="font-mono text-sm">
                          {claim.blockIndex.toString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
                  <Trophy className="mx-auto mb-2 h-8 w-8 text-primary/60" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No claim history yet. Your claimed rewards will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Claim Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-white dark:bg-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Confirm Reward Claim
            </DialogTitle>
            <DialogDescription>
              You are about to claim your Colony Wars rewards
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-4 text-center">
              <div className="mb-1 text-sm font-medium text-muted-foreground">
                Amount to Claim
              </div>
              <div className="text-3xl font-bold text-primary">
                {unclaimedICP.toFixed(4)} ICP
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
              <p className="text-xs text-amber-900 dark:text-amber-100">
                <strong>Note:</strong> Daily limits apply (5 rewards per player,
                50 total per day). If limits are reached, you can claim again
                tomorrow.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              The rewards will be transferred to your wallet. A small ledger fee
              (0.0001 ICP) will be deducted from the treasury.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancelClaim}
              disabled={claimMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmClaim}
              disabled={claimMutation.isPending}
              className="bg-gradient-to-r from-primary to-accent"
            >
              {claimMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                "Confirm Claim"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-white dark:bg-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Rewards Claimed Successfully!
            </DialogTitle>
            <DialogDescription>
              Your Colony Wars rewards have been transferred to your wallet
            </DialogDescription>
          </DialogHeader>
          {claimResult && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 dark:from-green-950/30 dark:to-green-900/30">
                <div className="mb-3 text-center">
                  <div className="mb-1 text-sm font-medium text-muted-foreground">
                    Claimed Amount
                  </div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {(Number(claimResult.amount) / 100000000).toFixed(4)} ICP
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Block Index:</span>
                    <span className="font-mono font-semibold">
                      {claimResult.blockIndex.toString()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                The ICP has been transferred to your wallet. Check your balance
                to confirm!
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={handleSuccessClose}
              className="w-full bg-gradient-to-r from-primary to-accent"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
