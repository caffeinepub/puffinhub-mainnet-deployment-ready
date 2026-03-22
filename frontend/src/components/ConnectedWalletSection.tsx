import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Send, AlertCircle, Check, Copy, Unplug, Coins, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useConnectedWallet } from '../hooks/useConnectedWallet';
import { useState } from 'react';
import { toast } from 'sonner';
import { detectRecipientFormat } from '../hooks/useQueries';
import { principalToAccountId } from '../lib/accountId';
import TransactionConfirmDialog from './TransactionConfirmDialog';

export default function ConnectedWalletSection() {
  const { walletInfo, isConnecting, connectPlug, disconnect, sendICP, getICPBalance } = useConnectedWallet();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Balance state - no automatic fetching
  const [icpBalance, setIcpBalance] = useState<bigint | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<{
    recipient: string;
    amount: string;
    recipientType: 'principal' | 'account';
  } | null>(null);

  // Derive Account ID from connected wallet principal
  const accountId = walletInfo.principal ? principalToAccountId(walletInfo.principal) : '';

  // Manual balance check function
  const handleCheckBalance = async () => {
    if (!getICPBalance) return;
    
    setIsLoadingBalance(true);
    setBalanceError(null);
    try {
      const balance = await getICPBalance();
      setIcpBalance(balance);
      toast.success('Balance updated successfully! 💰');
    } catch (error: any) {
      console.error('[ConnectedWalletSection] Balance fetch error:', error);
      setBalanceError(error.message || 'Failed to fetch balance');
      toast.error('Failed to load balance', {
        description: error.message || 'Please try again',
        duration: 4000,
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const formatICPBalance = (balance: bigint | null): string => {
    if (balance === null) return '--';
    try {
      const icpAmount = Number(balance) / 100000000;
      return icpAmount.toFixed(8);
    } catch {
      return '--';
    }
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

  const handleSendClick = () => {
    const recipientValidation = detectRecipientFormat(recipient);
    
    if (recipientValidation === 'invalid') {
      toast.error('Invalid recipient format', {
        description: 'Must be either a Principal ID (with hyphens) or a 64-character hexadecimal Account ID',
        duration: 5000,
      });
      return;
    }
    
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error('Invalid amount. Must be greater than 0');
      return;
    }

    setPendingTransaction({
      recipient,
      amount,
      recipientType: recipientValidation as 'principal' | 'account',
    });
    setShowConfirmDialog(true);
  };

  const handleConfirmTransaction = async () => {
    if (!pendingTransaction) return;

    setIsSending(true);
    try {
      const amountICP = parseFloat(pendingTransaction.amount);
      const result = await sendICP(pendingTransaction.recipient, amountICP);
      
      setShowConfirmDialog(false);
      setPendingTransaction(null);
      
      toast.success('Transaction successful! 🎉', {
        description: `Sent ${pendingTransaction.amount} ICP. Block: ${result.blockIndex.toString()}`,
        duration: 6000,
      });
      
      // Clear form and refresh balance
      setRecipient('');
      setAmount('');
      // Auto-refresh balance after successful transaction
      handleCheckBalance();
    } catch (error: any) {
      console.error('[ConnectedWalletSection] Transaction error:', error);
      
      setShowConfirmDialog(false);
      setPendingTransaction(null);
      
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled', {
          description: 'You rejected the transaction in your wallet',
        });
      } else if (error.message?.includes('Insufficient')) {
        toast.error('Insufficient balance', {
          description: error.message,
          duration: 6000,
        });
      } else {
        toast.error('Transaction failed', {
          description: error.message || 'Please try again',
          duration: 5000,
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelTransaction = () => {
    setShowConfirmDialog(false);
    setPendingTransaction(null);
  };

  return (
    <TooltipProvider>
      <Card className="relative overflow-hidden border-2 border-primary/30 bg-white dark:bg-slate-950">
        {/* Puffin-themed background */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
          <img 
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
            alt="" 
            className="absolute left-0 top-0 h-full w-full object-cover animate-pulse"
            style={{ animationDuration: '8s' }}
          />
        </div>

        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Wallet className="h-5 w-5 text-primary" />
            Connected Wallet
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 space-y-5">
          {!walletInfo.isConnected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Plug Wallet to send ICP directly without backend deployment
              </p>
              
              <div className="grid gap-3">
                {/* Plug Wallet - Text Only */}
                <Button
                  onClick={connectPlug}
                  disabled={isConnecting}
                  className="w-full h-12 gap-3 bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] hover:shadow-lg transition-all"
                >
                  <span>Connect Plug Wallet</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected Wallet Info */}
              <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/20">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Connected Wallet</p>
                      <p className="text-sm font-bold text-primary capitalize">Plug</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={disconnect}
                    className="h-8 gap-2 text-xs"
                  >
                    <Unplug className="h-3.5 w-3.5" />
                    Disconnect
                  </Button>
                </div>

                {/* Principal Display */}
                {walletInfo.principal && (
                  <div className="flex items-start gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Principal ID</p>
                      <p className="text-xs font-mono text-primary/90 break-all bg-white dark:bg-slate-900 rounded px-2 py-1.5">
                        {walletInfo.principal.toString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(walletInfo.principal!.toString(), 'Principal ID')}
                      className="h-7 w-7 flex-shrink-0 mt-5"
                    >
                      {copiedField === 'Principal ID' ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                )}

                {/* Account ID Display */}
                {accountId && (
                  <div className="flex items-start gap-2 pt-3 border-t border-primary/10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-medium text-muted-foreground">Account ID</p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">For deposits and withdrawals with exchanges</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs font-mono text-accent/90 break-all bg-accent/5 rounded px-2 py-1.5">
                        {accountId}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(accountId, 'Account ID')}
                      className="h-7 w-7 flex-shrink-0 mt-5"
                    >
                      {copiedField === 'Account ID' ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Token Balances Section - Side by Side */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Token Balances</h4>
                </div>

                {/* Side-by-Side Balance Display - Text Only */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* ICP Balance Card */}
                  <div className="rounded-lg border-2 border-primary/20 bg-white dark:bg-slate-900 p-3 shadow-sm">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">ICP Balance</p>
                      {isLoadingBalance ? (
                        <div className="h-6 w-32 animate-pulse rounded bg-primary/10" />
                      ) : balanceError ? (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-destructive">Error</p>
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-primary">
                          {formatICPBalance(icpBalance)}
                        </p>
                      )}
                      <Button
                        onClick={handleCheckBalance}
                        disabled={isLoadingBalance}
                        className="w-full h-8 gap-2 bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] text-xs shadow-md hover:shadow-lg transition-all"
                      >
                        {isLoadingBalance ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span>Checking...</span>
                          </>
                        ) : (
                          <span>Check ICP Balance</span>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Puffin Token Balance Card */}
                  <div className="rounded-lg border-2 border-accent/20 bg-white dark:bg-slate-900 p-3 shadow-sm">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">PUFFIN Balance</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-accent">Bonding Phase</p>
                        <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium text-accent">
                          Soon
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Send ICP Form */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Send ICP</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="wallet-recipient" className="text-xs font-medium">
                    Recipient (Principal ID recommended)
                  </Label>
                  <Input
                    id="wallet-recipient"
                    placeholder="Principal ID (e.g., xxxxx-xxxxx-xxxxx-cai)"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="h-9 text-xs border-primary/30 focus:border-primary font-mono"
                    disabled={isSending}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    ✅ Principal ID (with hyphens) or 64-char hex Account ID
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet-amount" className="text-xs font-medium">
                    Amount (ICP)
                  </Label>
                  <Input
                    id="wallet-amount"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00000000"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      const num = parseFloat(e.target.value);
                      if (e.target.value && (isNaN(num) || num <= 0)) {
                        setValidationError('Amount must be greater than 0');
                      } else {
                        setValidationError(null);
                      }
                    }}
                    className={`h-9 text-xs border-primary/30 focus:border-primary ${validationError ? 'border-destructive' : ''}`}
                    disabled={isSending}
                  />
                  {validationError && (
                    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2">
                      <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-destructive leading-relaxed">{validationError}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    ⚠️ Your wallet will handle the transfer fee
                  </p>
                </div>

                <Button
                  onClick={handleSendClick}
                  disabled={!recipient || !amount || !!validationError || isSending}
                  className="w-full h-9 gap-2 bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send ICP via Plug</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
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
          tokenType="ICP"
          recipient={pendingTransaction.recipient}
          recipientType={pendingTransaction.recipientType}
          amount={pendingTransaction.amount}
          onConfirm={handleConfirmTransaction}
          isLoading={isSending}
        />
      )}
    </TooltipProvider>
  );
}
