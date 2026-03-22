import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Coins, Copy, Check, Send, Info, HelpCircle, AlertCircle, Download, ArrowDownToLine } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGetICPBalance, useGetCallerPrincipal, useSendICP, useSendPuffin, validateICPTransaction } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { principalToAccountId } from '../lib/accountId';
import TransactionConfirmDialog from './TransactionConfirmDialog';
import TransactionSuccessDialog from './TransactionSuccessDialog';

export default function TokenBalanceCard() {
  const { data: icpBalance, isLoading: balanceLoading, isError: balanceError, refetch: refetchBalance } = useGetICPBalance();
  const { data: callerPrincipal, isLoading: principalLoading } = useGetCallerPrincipal();
  const sendICP = useSendICP();
  const sendPuffin = useSendPuffin();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Transaction form state
  const [icpRecipient, setIcpRecipient] = useState('');
  const [icpAmount, setIcpAmount] = useState('');
  const [puffinRecipient, setPuffinRecipient] = useState('');
  const [puffinAmount, setPuffinAmount] = useState('');

  // Validation state
  const [icpValidationError, setIcpValidationError] = useState<string | null>(null);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<{
    type: 'ICP' | 'PUFFIN';
    recipient: string;
    amount: string;
    recipientType: 'principal' | 'account';
  } | null>(null);

  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successTransaction, setSuccessTransaction] = useState<{
    type: 'ICP' | 'PUFFIN';
    recipient: string;
    amount: string;
    blockIndex?: bigint;
    recipientType: 'principal' | 'account';
  } | null>(null);

  // Use callerPrincipal from backend (which uses the authenticated identity from official provider)
  // Fall back to identity from context only if callerPrincipal is not yet loaded
  const principalId = callerPrincipal?.toString() || identity?.getPrincipal().toString() || '';
  
  // Derive Account ID from Principal
  const accountId = principalId && callerPrincipal ? principalToAccountId(callerPrincipal) : '';

  // Show toast notification when balance loading fails
  useEffect(() => {
    if (balanceError) {
      toast.error('Failed to load ICP balance. Retrying...', {
        duration: 4000,
      });
    }
  }, [balanceError]);

  // Validate ICP amount whenever it changes
  useEffect(() => {
    if (icpAmount) {
      const validation = validateICPTransaction(icpAmount, icpBalance);
      if (!validation.valid) {
        setIcpValidationError(validation.error || 'Invalid amount');
      } else {
        setIcpValidationError(null);
      }
    } else {
      setIcpValidationError(null);
    }
  }, [icpAmount, icpBalance]);

  // Log transaction state changes for debugging
  useEffect(() => {
    console.log('[TokenBalanceCard] Transaction state:', {
      showConfirmDialog,
      showSuccessDialog,
      isTransactionPending: sendICP.isPending || sendPuffin.isPending,
      hasPendingTransaction: !!pendingTransaction,
      hasSuccessTransaction: !!successTransaction,
    });
  }, [showConfirmDialog, showSuccessDialog, sendICP.isPending, sendPuffin.isPending, pendingTransaction, successTransaction]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['icpBalance'] });
    queryClient.invalidateQueries({ queryKey: ['callerPrincipal'] });
    refetchBalance();
    toast.info('Refreshing wallet data...');
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatICPBalance = (balance: bigint | undefined): string => {
    if (balance === undefined) return '0.00000000';
    try {
      // ICP uses 8 decimal places (e8s format)
      // Convert from e8s to ICP by dividing by 100,000,000
      const icpAmount = Number(balance) / 100000000;
      return icpAmount.toFixed(8);
    } catch {
      return '0.00000000';
    }
  };

  const validateRecipient = (recipient: string): { valid: boolean; type: 'account' | 'invalid' } => {
    // Only validate Account ID format (64-character hexadecimal)
    const isHexString = /^[0-9a-fA-F]{64}$/.test(recipient);
    return {
      valid: isHexString,
      type: isHexString ? 'account' : 'invalid',
    };
  };

  const validateAmount = (amount: string): boolean => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  };

  const handleSendICPClick = () => {
    console.log('[TokenBalanceCard] Send ICP button clicked');
    const recipientValidation = validateRecipient(icpRecipient);
    
    if (!recipientValidation.valid) {
      toast.error('Invalid recipient format', {
        description: 'Must be a 64-character hexadecimal Account ID',
        duration: 5000,
      });
      return;
    }
    
    if (!validateAmount(icpAmount)) {
      toast.error('Invalid amount. Must be greater than 0');
      return;
    }

    // Validate against balance including fee
    const validation = validateICPTransaction(icpAmount, icpBalance);
    if (!validation.valid) {
      toast.error('Insufficient balance', {
        description: validation.error,
        duration: 6000,
      });
      return;
    }

    console.log('[TokenBalanceCard] Opening confirmation dialog for ICP transaction');
    setPendingTransaction({
      type: 'ICP',
      recipient: icpRecipient,
      amount: icpAmount,
      recipientType: 'account',
    });
    setShowConfirmDialog(true);
  };

  const handleSendPuffinClick = () => {
    console.log('[TokenBalanceCard] Send Puffin button clicked');
    const recipientValidation = validateRecipient(puffinRecipient);
    
    if (!recipientValidation.valid) {
      toast.error('Invalid recipient format', {
        description: 'Must be a 64-character hexadecimal Account ID',
        duration: 5000,
      });
      return;
    }
    
    if (!validateAmount(puffinAmount)) {
      toast.error('Invalid amount. Must be greater than 0');
      return;
    }

    console.log('[TokenBalanceCard] Opening confirmation dialog for Puffin transaction');
    setPendingTransaction({
      type: 'PUFFIN',
      recipient: puffinRecipient,
      amount: puffinAmount,
      recipientType: 'account',
    });
    setShowConfirmDialog(true);
  };

  const handleConfirmTransaction = async () => {
    if (!pendingTransaction) {
      console.warn('[TokenBalanceCard] No pending transaction to confirm');
      return;
    }

    console.log('[TokenBalanceCard] Starting transaction confirmation:', pendingTransaction);

    try {
      if (pendingTransaction.type === 'ICP') {
        const amountE8s = BigInt(Math.floor(parseFloat(pendingTransaction.amount) * 100000000));
        
        console.log('[TokenBalanceCard] Sending ICP transaction...');
        const result = await sendICP.mutateAsync({ to: pendingTransaction.recipient, amount: amountE8s });
        console.log('[TokenBalanceCard] ICP transaction completed:', result);
        
        // Close confirmation dialog immediately
        console.log('[TokenBalanceCard] Closing confirmation dialog');
        setShowConfirmDialog(false);
        setPendingTransaction(null);
        
        // Show success dialog immediately after confirmation
        console.log('[TokenBalanceCard] Opening success dialog');
        setSuccessTransaction({
          type: 'ICP',
          recipient: pendingTransaction.recipient,
          amount: pendingTransaction.amount,
          blockIndex: result.blockIndex,
          recipientType: result.recipientType,
        });
        setShowSuccessDialog(true);
        
        // Clear form
        setIcpRecipient('');
        setIcpAmount('');
        
        // Refresh balance
        queryClient.invalidateQueries({ queryKey: ['icpBalance'] });
        queryClient.invalidateQueries({ queryKey: ['recentRecipients'] });
      } else {
        const amountTokens = BigInt(Math.floor(parseFloat(pendingTransaction.amount) * 100000000));
        
        console.log('[TokenBalanceCard] Sending Puffin transaction...');
        const result = await sendPuffin.mutateAsync({ to: pendingTransaction.recipient, amount: amountTokens });
        console.log('[TokenBalanceCard] Puffin transaction completed:', result);
        
        // Close confirmation dialog immediately
        console.log('[TokenBalanceCard] Closing confirmation dialog');
        setShowConfirmDialog(false);
        setPendingTransaction(null);
        
        // Show success dialog immediately after confirmation
        console.log('[TokenBalanceCard] Opening success dialog');
        setSuccessTransaction({
          type: 'PUFFIN',
          recipient: pendingTransaction.recipient,
          amount: pendingTransaction.amount,
          blockIndex: result.blockIndex,
          recipientType: result.recipientType,
        });
        setShowSuccessDialog(true);
        
        // Clear form
        setPuffinRecipient('');
        setPuffinAmount('');
      }
    } catch (error: any) {
      console.error('[TokenBalanceCard] Transaction error:', error);
      
      // Close confirmation dialog on error immediately
      console.log('[TokenBalanceCard] Closing confirmation dialog due to error');
      setShowConfirmDialog(false);
      setPendingTransaction(null);
      
      // Display user-friendly error messages
      if (error.message?.includes('Bonding Phase')) {
        toast.error('Puffin tokens not yet available', {
          description: 'Token transfers will be enabled after the bonding phase',
          duration: 5000,
        });
      } else if (error.message?.includes('Insufficient')) {
        toast.error('Insufficient balance', {
          description: error.message,
          duration: 6000,
        });
      } else if (error.message?.includes('timeout')) {
        toast.error('Transaction timeout', {
          description: 'The transaction took too long. Please check your connection and try again.',
          duration: 6000,
        });
      } else if (error.message?.includes('TemporarilyUnavailable')) {
        toast.error('Ledger temporarily unavailable', {
          description: 'Please try again in a moment',
          duration: 5000,
        });
      } else if (error.message?.includes('Invalid')) {
        toast.error('Invalid recipient', {
          description: error.message,
          duration: 5000,
        });
      } else {
        toast.error('Transaction failed', {
          description: error.message || 'Please try again',
          duration: 5000,
        });
      }
    }
  };

  const handleCancelTransaction = () => {
    console.log('[TokenBalanceCard] Transaction cancelled by user');
    setShowConfirmDialog(false);
    setPendingTransaction(null);
  };

  const handleSuccessDialogClose = (open: boolean) => {
    console.log('[TokenBalanceCard] Success dialog close requested:', open);
    setShowSuccessDialog(open);
    if (!open) {
      console.log('[TokenBalanceCard] Clearing success transaction state');
      setSuccessTransaction(null);
    }
  };

  const isLoading = principalLoading || balanceLoading;
  const isTransactionPending = sendICP.isPending || sendPuffin.isPending;

  return (
    <TooltipProvider>
      <Card className="relative overflow-hidden border-2 border-primary/30 bg-white dark:bg-slate-950">
        {/* Puffin-themed background elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
          <img 
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
            alt="" 
            className="absolute left-0 top-0 h-full w-full object-cover animate-pulse"
            style={{ animationDuration: '8s' }}
          />
        </div>

        {/* Floating feathers */}
        <div className="absolute right-4 top-4 opacity-20 pointer-events-none">
          <img 
            src="/assets/generated/floating-feathers-transparent.dim_32x32.png" 
            alt="" 
            className="h-8 w-8 animate-bounce"
            style={{ animationDuration: '4s' }}
          />
        </div>

        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <img 
                src="/assets/generated/account-wallet-icon-transparent.dim_24x24.png" 
                alt="" 
                className="h-6 w-6"
              />
              Puffin Wallet
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
              title="Refresh Balance"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-5">
          {/* FAQ Info Box */}
          <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/20 flex-shrink-0">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-sm font-bold text-primary">When to Use Account ID</h3>
                <div className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                  <div className="flex items-start gap-2">
                    <Coins className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground mb-1">Account ID</p>
                      <p>Use when transferring ICP to or from exchanges like <span className="font-medium text-primary">ICPSwap</span>, <span className="font-medium text-primary">NNS</span>, or other platforms that require the hex account identifier format.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account ID Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Your Account ID</h4>
            </div>
            
            {accountId ? (
              <div className="rounded-lg border-2 border-primary/20 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 flex-shrink-0">
                    <img 
                      src="/assets/generated/account-id-info-icon.dim_24x24.png" 
                      alt="" 
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-foreground">Account ID</p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">For deposits and withdrawals with exchanges</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(accountId, 'Account ID')}
                        className="h-7 w-7 flex-shrink-0"
                        title="Copy Account ID"
                      >
                        {copiedField === 'Account ID' ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs font-mono text-accent/90 break-all leading-relaxed bg-accent/5 rounded px-2 py-1.5">
                      {accountId}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-primary/20 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-primary/10 rounded animate-pulse" />
                    <div className="h-3 w-full bg-primary/10 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ICP Deposit Instructions Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">How to Receive ICP</h4>
            </div>

            <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-white to-accent/5 dark:from-primary/10 dark:via-slate-900 dark:to-accent/10 p-4 shadow-sm">
              <div className="space-y-4">
                {/* Instructions Header */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/20 flex-shrink-0">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-primary mb-1">Deposit ICP to Your Wallet</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      To receive ICP tokens, share your <strong className="text-foreground">Account ID</strong> with the sender or exchange.
                    </p>
                  </div>
                </div>

                {/* Deposit Address Section */}
                {accountId ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-primary/20 bg-white dark:bg-slate-900 p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-foreground">Your Deposit Address (Account ID)</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">Send ICP to this Account ID to deposit funds into your wallet</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(accountId, 'Deposit Address')}
                          className="h-7 w-7 flex-shrink-0"
                          title="Copy Deposit Address"
                        >
                          {copiedField === 'Deposit Address' ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs font-mono text-accent/90 break-all leading-relaxed bg-accent/5 rounded px-2 py-1.5">
                        {accountId}
                      </p>
                    </div>

                    {/* Zero Balance Notice */}
                    {icpBalance !== undefined && Number(icpBalance) === 0 && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                              Your balance is currently 0 ICP
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                              Send ICP to your <strong>Account ID</strong> above to deposit funds. Your balance will update automatically once the transaction is confirmed.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Tips */}
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-xs font-semibold text-foreground mb-2">💡 Quick Tips:</p>
                      <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                        <li className="flex items-start gap-2">
                          <span className="text-primary font-bold">•</span>
                          <span>Use your <strong className="text-foreground">Account ID</strong> when receiving ICP from exchanges</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary font-bold">•</span>
                          <span>Your balance updates automatically after deposits are confirmed</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-primary/20 bg-white dark:bg-slate-900 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 bg-primary/10 rounded animate-pulse" />
                        <div className="h-3 w-full bg-primary/10 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Token Balances Section - Side by Side */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Token Balances</h4>
            </div>

            {/* Side-by-Side Balance Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ICP Balance Card */}
              <div className="rounded-lg border-2 border-primary/20 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                      <img 
                        src="/assets/generated/icp-balance-icon.dim_32x32.png" 
                        alt="ICP" 
                        className="h-5 w-5"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">ICP</p>
                      {balanceLoading ? (
                        <div className="mt-0.5 h-5 w-24 animate-pulse rounded bg-primary/10" />
                      ) : balanceError ? (
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-destructive">Error</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            className="h-5 px-1 text-[10px]"
                          >
                            Retry
                          </Button>
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-primary">
                          {formatICPBalance(icpBalance)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ICP Transaction Form */}
                <div className="space-y-2.5 pt-2 border-t border-primary/10">
                  <div className="space-y-1.5">
                    <Label htmlFor="icp-recipient" className="text-[11px] font-medium">
                      Recipient (Account ID)
                    </Label>
                    <Input
                      id="icp-recipient"
                      placeholder="64-character hexadecimal Account ID"
                      value={icpRecipient}
                      onChange={(e) => setIcpRecipient(e.target.value)}
                      className="h-8 text-xs border-primary/30 focus:border-primary font-mono"
                      disabled={isTransactionPending}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="icp-amount" className="text-[11px] font-medium">
                      Amount
                    </Label>
                    <Input
                      id="icp-amount"
                      type="number"
                      step="0.00000001"
                      placeholder="0.00000000"
                      value={icpAmount}
                      onChange={(e) => setIcpAmount(e.target.value)}
                      className={`h-8 text-xs border-primary/30 focus:border-primary ${icpValidationError ? 'border-destructive' : ''}`}
                      disabled={isTransactionPending}
                    />
                    {icpValidationError && (
                      <div className="flex items-start gap-1.5 rounded bg-destructive/10 p-1.5">
                        <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-destructive leading-tight">{icpValidationError}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      Fee: 0.0001 ICP
                    </p>
                  </div>
                  <Button
                    onClick={handleSendICPClick}
                    disabled={!icpRecipient || !icpAmount || !!icpValidationError || isTransactionPending}
                    className="w-full h-8 gap-1.5 bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {sendICP.isPending ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3" />
                        <span>Send ICP</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Puffin Token Balance Card */}
              <div className="rounded-lg border-2 border-accent/20 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/10">
                      <img 
                        src="/assets/generated/puffin-token-placeholder.dim_32x32.png" 
                        alt="Puffin" 
                        className="h-5 w-5"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">PUFFIN</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-sm font-semibold text-accent">Bonding Phase</p>
                        <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium text-accent">
                          Soon
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Puffin Transaction Form */}
                <div className="space-y-2.5 pt-2 border-t border-accent/10">
                  <div className="space-y-1.5">
                    <Label htmlFor="puffin-recipient" className="text-[11px] font-medium">
                      Recipient (Account ID)
                    </Label>
                    <Input
                      id="puffin-recipient"
                      placeholder="64-character hexadecimal Account ID"
                      value={puffinRecipient}
                      onChange={(e) => setPuffinRecipient(e.target.value)}
                      className="h-8 text-xs border-accent/30 focus:border-accent font-mono"
                      disabled={isTransactionPending}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="puffin-amount" className="text-[11px] font-medium">
                      Amount
                    </Label>
                    <Input
                      id="puffin-amount"
                      type="number"
                      step="0.00000001"
                      placeholder="0.00000000"
                      value={puffinAmount}
                      onChange={(e) => setPuffinAmount(e.target.value)}
                      className="h-8 text-xs border-accent/30 focus:border-accent"
                      disabled={isTransactionPending}
                    />
                  </div>
                  <Button
                    onClick={handleSendPuffinClick}
                    disabled={!puffinRecipient || !puffinAmount || isTransactionPending}
                    className="w-full h-8 gap-1.5 bg-gradient-to-r from-accent to-[oklch(0.75_0.15_35)] text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {sendPuffin.isPending ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3" />
                        <span>Send Puffin</span>
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center leading-tight">
                    Available after bonding
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Confirmation Dialog */}
      {pendingTransaction && (
        <TransactionConfirmDialog
          open={showConfirmDialog}
          onOpenChange={(open) => {
            if (!open) {
              handleCancelTransaction();
            }
          }}
          tokenType={pendingTransaction.type}
          recipient={pendingTransaction.recipient}
          recipientType={pendingTransaction.recipientType}
          amount={pendingTransaction.amount}
          onConfirm={handleConfirmTransaction}
          isLoading={isTransactionPending}
        />
      )}

      {/* Transaction Success Dialog */}
      {successTransaction && (
        <TransactionSuccessDialog
          open={showSuccessDialog}
          onOpenChange={handleSuccessDialogClose}
          tokenType={successTransaction.type}
          recipient={successTransaction.recipient}
          recipientType={successTransaction.recipientType}
          amount={successTransaction.amount}
          blockIndex={successTransaction.blockIndex}
          autoCloseDuration={4000}
        />
      )}
    </TooltipProvider>
  );
}
