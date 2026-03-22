import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEffect } from 'react';
import { Key, Coins } from 'lucide-react';

interface TransactionSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenType: 'ICP' | 'PUFFIN';
  recipient: string;
  recipientType: 'principal' | 'account';
  amount: string;
  blockIndex?: bigint;
  autoCloseDuration?: number;
}

export default function TransactionSuccessDialog({
  open,
  onOpenChange,
  tokenType,
  recipient,
  recipientType,
  amount,
  blockIndex,
  autoCloseDuration = 4000,
}: TransactionSuccessDialogProps) {
  // Log modal state changes for debugging
  useEffect(() => {
    console.log('[TransactionSuccessDialog] Modal state changed:', { 
      open, 
      tokenType, 
      blockIndex: blockIndex?.toString(),
      autoCloseDuration 
    });
  }, [open, tokenType, blockIndex, autoCloseDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[TransactionSuccessDialog] Component unmounting');
    };
  }, []);

  // Auto-dismiss after specified duration
  useEffect(() => {
    if (open && autoCloseDuration > 0) {
      console.log('[TransactionSuccessDialog] Setting auto-close timer for', autoCloseDuration, 'ms');
      const timer = setTimeout(() => {
        console.log('[TransactionSuccessDialog] Auto-closing dialog');
        onOpenChange(false);
      }, autoCloseDuration);
      return () => {
        console.log('[TransactionSuccessDialog] Clearing auto-close timer');
        clearTimeout(timer);
      };
    }
  }, [open, autoCloseDuration, onOpenChange]);

  const handleOpenChange = (newOpen: boolean) => {
    console.log('[TransactionSuccessDialog] Open state change requested:', newOpen);
    onOpenChange(newOpen);
  };

  const recipientTypeLabel = recipientType === 'principal' ? 'Principal ID' : 'Account ID';
  const RecipientIcon = recipientType === 'principal' ? Key : Coins;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-2 border-primary/30">
        {/* Puffin-themed wave background with proper opacity */}
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none rounded-lg">
          <img 
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
            alt="" 
            className="absolute left-0 top-0 h-full w-full object-cover animate-pulse"
            style={{ animationDuration: '6s' }}
          />
        </div>

        {/* Floating feathers */}
        <div className="absolute right-4 top-4 opacity-30 pointer-events-none animate-bounce" style={{ animationDuration: '3s' }}>
          <img 
            src="/assets/generated/floating-feathers-transparent.dim_32x32.png" 
            alt="" 
            className="h-8 w-8"
          />
        </div>
        <div className="absolute left-6 bottom-6 opacity-20 pointer-events-none animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <img 
            src="/assets/generated/floating-feathers-transparent.dim_32x32.png" 
            alt="" 
            className="h-6 w-6"
          />
        </div>

        <DialogHeader className="relative z-10 space-y-4">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <img 
                  src="/assets/generated/transaction-success-icon-transparent.dim_32x32.png" 
                  alt="Success" 
                  className="h-10 w-10"
                />
              </div>
            </div>
          </div>

          <DialogTitle className="text-center text-2xl font-bold text-green-600 dark:text-green-400">
            Transaction Successful! 🎉
          </DialogTitle>
          
          <DialogDescription className="text-center text-base text-slate-700 dark:text-slate-300">
            Your {tokenType} tokens have been sent successfully
          </DialogDescription>
        </DialogHeader>

        {/* Transaction Details */}
        <div className="relative z-10 space-y-3 py-4">
          <div className="rounded-lg border-2 border-primary/20 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Amount Sent:</span>
              <span className="text-sm font-bold text-primary">{amount} {tokenType}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Recipient:</span>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10">
                  <RecipientIcon className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold text-primary">{recipientTypeLabel}</span>
                </div>
              </div>
              <span className="text-xs font-mono text-primary break-all bg-primary/5 p-2 rounded border border-primary/20">
                {recipient}
              </span>
            </div>

            {blockIndex !== undefined && (
              <div className="flex justify-between items-center pt-2 border-t border-primary/10">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Block Index:</span>
                <span className="text-xs font-mono text-accent">{blockIndex.toString()}</span>
              </div>
            )}
          </div>

          {/* Auto-close notice */}
          <p className="text-center text-xs text-slate-600 dark:text-slate-400">
            This dialog will close automatically in a few seconds
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
