import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Coins, Key } from "lucide-react";
import { useEffect } from "react";

interface TransactionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenType: "ICP" | "PUFFIN";
  recipient: string;
  recipientType: "principal" | "account";
  amount: string;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export default function TransactionConfirmDialog({
  open,
  onOpenChange,
  tokenType,
  recipient,
  recipientType,
  amount,
  onConfirm,
  isLoading,
}: TransactionConfirmDialogProps) {
  // Log modal state changes for debugging
  useEffect(() => {
    console.log("[TransactionConfirmDialog] Modal state changed:", {
      open,
      isLoading,
      tokenType,
    });
  }, [open, isLoading, tokenType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("[TransactionConfirmDialog] Component unmounting");
    };
  }, []);

  const handleConfirm = async () => {
    console.log(
      "[TransactionConfirmDialog] Confirm button clicked - starting transaction",
    );
    try {
      await onConfirm();
      console.log(
        "[TransactionConfirmDialog] onConfirm completed successfully",
      );
    } catch (error) {
      console.error("[TransactionConfirmDialog] onConfirm error:", error);
    }
  };

  const handleCancel = () => {
    console.log("[TransactionConfirmDialog] Cancel button clicked");
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    console.log(
      "[TransactionConfirmDialog] Open state change requested:",
      newOpen,
    );
    // Prevent closing during loading
    if (!isLoading) {
      onOpenChange(newOpen);
    } else {
      console.log("[TransactionConfirmDialog] Prevented close during loading");
    }
  };

  const recipientTypeLabel =
    recipientType === "principal" ? "Principal ID" : "Account ID";
  const RecipientIcon = recipientType === "principal" ? Key : Coins;
  const transferFee = tokenType === "ICP" ? "0.0001 ICP" : "TBD";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border-2 border-primary/30">
        {/* Puffin-themed background with proper opacity */}
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none rounded-lg">
          <img
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png"
            alt=""
            className="absolute left-0 top-0 h-full w-full object-cover animate-pulse"
            style={{ animationDuration: "6s" }}
          />
        </div>

        {/* Floating feathers */}
        <div className="absolute right-4 top-4 opacity-30 pointer-events-none">
          <img
            src="/assets/generated/floating-feathers-transparent.dim_32x32.png"
            alt=""
            className="h-6 w-6 animate-bounce"
            style={{ animationDuration: "3s" }}
          />
        </div>

        <AlertDialogHeader className="relative z-10">
          <AlertDialogTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-white">
            <AlertCircle className="h-5 w-5 text-primary" />
            Confirm Transaction
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-slate-700 dark:text-slate-300">
            Please review the transaction details before confirming.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="relative z-10 space-y-4 py-4">
          {/* Transaction Details */}
          <div className="rounded-lg border-2 border-primary/20 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Token Type:
              </span>
              <span className="text-sm font-bold text-primary">
                {tokenType}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Amount:
              </span>
              <span className="text-sm font-bold text-primary">
                {amount} {tokenType}
              </span>
            </div>
            {tokenType === "ICP" && (
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Transfer Fee:
                </span>
                <span className="text-sm font-medium text-accent">
                  {transferFee}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Recipient:
                </span>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10">
                  <RecipientIcon className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold text-primary">
                    {recipientTypeLabel}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-primary break-all bg-primary/5 p-2 rounded border border-primary/20">
                {recipient}
              </span>
            </div>
          </div>

          {/* Warning Message */}
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">
                ⚠️ Important:
              </strong>{" "}
              This transaction cannot be reversed. Please verify the recipient
              address and amount before confirming.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="relative z-10">
          <AlertDialogCancel
            onClick={handleCancel}
            disabled={isLoading}
            className="border-primary/30"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                <span>Processing...</span>
              </>
            ) : (
              "Confirm & Send"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
