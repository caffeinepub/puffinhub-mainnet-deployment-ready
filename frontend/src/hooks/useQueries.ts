import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { GifMetadata, ScoreEntry, GameMode, PuffinProfile, RewardHistory } from '../backend';
import { ExternalBlob } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

export function useGetAllGifs() {
  const { actor, isFetching } = useActor();

  return useQuery<GifMetadata[]>({
    queryKey: ['gifs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGifs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadGif() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      file,
      onProgress,
    }: {
      id: string;
      name: string;
      description: string;
      file: File;
      onProgress?: (percentage: number) => void;
    }) => {
      if (!actor) throw new Error('Actor not initialized');

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }

      await actor.uploadGif(id, name, description, blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifs'] });
    },
  });
}

export function useDeleteGif() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteCallerGif(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifs'] });
    },
  });
}

export function useSubmitScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gameMode,
      playerName,
      score,
    }: {
      gameMode: GameMode;
      playerName: string;
      score: bigint;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.submitScore(gameMode, playerName, score);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['personalStats'] });
      queryClient.invalidateQueries({ queryKey: ['unclaimedRewards'] });
    },
  });
}

export function useGetLeaderboard(gameMode: GameMode) {
  const { actor, isFetching } = useActor();

  return useQuery<ScoreEntry[]>({
    queryKey: ['leaderboard', gameMode],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard(gameMode);
    },
    enabled: !!actor && !isFetching,
  });
}

// User Profile Hooks
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<PuffinProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(principal: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<PuffinProfile | null>({
    queryKey: ['userProfile', principal.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: PuffinProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      
      const serializedProfile: PuffinProfile = {
        displayName: profile.displayName,
        bio: profile.bio,
        avatarType: profile.avatarType,
      };
      
      await actor.saveCallerUserProfile(serializedProfile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error) => {
      console.error('Profile save error:', error);
      throw error;
    },
  });
}

export function useUploadCustomAvatar() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ file, fileType }: { file: File; fileType: string }) => {
      if (!actor) throw new Error('Actor not initialized');

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes);

      return actor.uploadCustomAvatar(blob, fileType);
    },
  });
}

// Personal Stats Hook
export function useGetPersonalStats(principal: Principal | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<{
    flightAdventure?: bigint;
    fishFrenzy?: bigint;
    puffinRescue?: bigint;
    arcticSurf?: bigint;
    puffinSlide?: bigint;
    puffinCatch?: bigint;
    puffinTowerDefense?: bigint;
    puffinColonyWars?: bigint;
  } | null>({
    queryKey: ['personalStats', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      try {
        return await actor.getPersonalStats(principal);
      } catch (error) {
        console.error('Failed to fetch personal stats:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!principal,
    retry: 1,
  });
}

// Caller Principal Hook
export function useGetCallerPrincipal() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Principal>({
    queryKey: ['callerPrincipal'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        console.log('[useGetCallerPrincipal] Fetching caller principal from backend...');
        const principal = await actor.getCallerPrincipal();
        console.log('[useGetCallerPrincipal] Success - Principal:', principal.toString());
        return principal;
      } catch (error) {
        console.error('[useGetCallerPrincipal] Error fetching caller principal:', error);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
    retryDelay: 1000,
  });
}

// ICP Balance Hook - Fetches the authenticated user's live ICP balance from the ledger
export function useGetICPBalance() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<bigint>({
    queryKey: ['icpBalance'],
    queryFn: async () => {
      if (!actor) {
        console.error('[useGetICPBalance] Actor not available');
        throw new Error('Actor not available');
      }
      
      try {
        console.log('[useGetICPBalance] Fetching live ICP balance for authenticated user...');
        const balance = await actor.getICPBalance();
        console.log('[useGetICPBalance] ✅ Success - Balance:', balance.toString(), 'e8s');
        console.log('[useGetICPBalance] ✅ Balance in ICP:', (Number(balance) / 100000000).toFixed(8));
        return balance;
      } catch (error: any) {
        console.error('[useGetICPBalance] ❌ Error fetching ICP balance:', error);
        console.error('[useGetICPBalance] Error message:', error.message);
        
        // Provide more specific error messages
        if (error.message?.includes('Unauthorized')) {
          throw new Error('Authentication required to fetch balance');
        } else if (error.message?.includes('timeout')) {
          throw new Error('ICP ledger timeout - please try again');
        } else if (error.message?.includes('TemporarilyUnavailable')) {
          throw new Error('ICP ledger temporarily unavailable');
        }
        
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 3,
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * Math.pow(2, attemptIndex), 4000);
      console.log(`[useGetICPBalance] Retry attempt ${attemptIndex + 1} after ${delay}ms`);
      return delay;
    },
    staleTime: 10000, // Consider data fresh for 10 seconds
    gcTime: 60000,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always fetch fresh data on mount
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetching: query.isFetching || actorFetching,
  };
}

// Recent Recipients Hook
export function useGetRecentRecipients() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['recentRecipients'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        console.log('[useGetRecentRecipients] Fetching recent recipients...');
        const recipients = await actor.getRecentRecipients();
        console.log('[useGetRecentRecipients] Success - Found', recipients.length, 'recipients');
        return recipients;
      } catch (error) {
        console.error('[useGetRecentRecipients] Error fetching recent recipients:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60000,
  });
}

// Helper function to create a promise with timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

// Helper function to detect recipient format type
export function detectRecipientFormat(recipient: string): 'principal' | 'account' | 'invalid' {
  if (!recipient || recipient.trim().length === 0) {
    return 'invalid';
  }

  const trimmed = recipient.trim();

  // Check for 64-character hexadecimal Account ID
  if (trimmed.length === 64 && /^[0-9a-fA-F]{64}$/.test(trimmed)) {
    console.log('[detectRecipientFormat] Detected Account ID format');
    return 'account';
  }

  // Check for Principal ID format (contains hyphens, lowercase letters and numbers)
  if (trimmed.includes('-') && /^[a-z0-9-]+$/.test(trimmed)) {
    console.log('[detectRecipientFormat] Detected Principal ID format');
    return 'principal';
  }

  console.log('[detectRecipientFormat] Invalid format detected');
  return 'invalid';
}

// ICP Transfer Fee constant (10,000 e8s = 0.0001 ICP)
export const ICP_TRANSFER_FEE = 10000n;

// Helper function to validate ICP transaction amount against balance
export function validateICPTransaction(amountICP: string, balanceE8s: bigint | undefined): {
  valid: boolean;
  error?: string;
  amountE8s?: bigint;
  maxTransferable?: string;
} {
  if (!balanceE8s) {
    return { valid: false, error: 'Balance not available' };
  }

  const amount = parseFloat(amountICP);
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  // Convert ICP to e8s
  const amountE8s = BigInt(Math.floor(amount * 100000000));

  // Check if amount + fee exceeds balance
  const totalRequired = amountE8s + ICP_TRANSFER_FEE;
  
  if (totalRequired > balanceE8s) {
    // Calculate maximum transferable amount
    const maxTransferableE8s = balanceE8s >= ICP_TRANSFER_FEE ? balanceE8s - ICP_TRANSFER_FEE : 0n;
    const maxTransferableICP = (Number(maxTransferableE8s) / 100000000).toFixed(8);
    
    return {
      valid: false,
      error: `Insufficient balance. Amount + fee (0.0001 ICP) exceeds your balance. Maximum transferable: ${maxTransferableICP} ICP`,
      maxTransferable: maxTransferableICP,
    };
  }

  return { valid: true, amountE8s };
}

// Send ICP tokens with dual format support
export function useSendICP() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ to, amount }: { to: string; amount: bigint }) => {
      console.log('[useSendICP] Mutation started:', { to, amount: amount.toString() });
      
      if (!actor) {
        console.error('[useSendICP] Actor not initialized');
        throw new Error('Actor not initialized');
      }
      
      const format = detectRecipientFormat(to);
      console.log('[useSendICP] Detected recipient format:', format);
      
      if (format === 'invalid') {
        console.error('[useSendICP] Invalid recipient format:', to);
        throw new Error('Invalid recipient format: Must be either a Principal ID (with hyphens) or a 64-character hexadecimal Account ID');
      }
      
      try {
        console.log('[useSendICP] Calling backend sendICPTryAccountId...');
        const blockIndex = await withTimeout(
          actor.sendICPTryAccountId(to, amount),
          60000,
          'Transaction timeout: The ledger is taking too long to respond. Please try again.'
        );
        
        console.log('[useSendICP] Transaction successful, block index:', blockIndex.toString());
        return { 
          blockIndex, 
          recipientType: format 
        };
      } catch (error: any) {
        console.error('[useSendICP] Transaction error:', error);
        console.error('[useSendICP] Error message:', error.message);
        
        if (error.message?.includes('timeout')) {
          throw new Error('Transaction timeout: Please check your connection and try again.');
        } else if (error.message?.includes('Insufficient')) {
          throw new Error(error.message);
        } else if (error.message?.includes('Invalid recipient')) {
          throw new Error('Invalid recipient: Please check the address format.');
        } else if (error.message?.includes('Invalid Principal ID format')) {
          throw new Error('Invalid Principal ID: Please verify the principal address.');
        } else if (error.message?.includes('Invalid Account ID format')) {
          throw new Error('Invalid Account ID: Please verify the account identifier.');
        } else if (error.message?.includes('TemporarilyUnavailable')) {
          throw new Error('Ledger temporarily unavailable: Please try again in a moment.');
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[useSendICP] Mutation onSuccess callback, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['icpBalance'] });
      queryClient.invalidateQueries({ queryKey: ['recentRecipients'] });
    },
    onError: (error) => {
      console.error('[useSendICP] Mutation onError callback:', error);
    },
  });
}

// Send Puffin tokens (placeholder for bonding phase)
export function useSendPuffin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ to, amount }: { to: string; amount: bigint }) => {
      console.log('[useSendPuffin] Mutation started:', { to, amount: amount.toString() });
      
      if (!actor) {
        console.error('[useSendPuffin] Actor not initialized');
        throw new Error('Actor not initialized');
      }
      
      const format = detectRecipientFormat(to);
      console.log('[useSendPuffin] Detected recipient format:', format);
      
      if (format === 'invalid') {
        console.error('[useSendPuffin] Invalid recipient format:', to);
        throw new Error('Invalid recipient format: Must be either a Principal ID (with hyphens) or a 64-character hexadecimal Account ID');
      }
      
      try {
        console.log('[useSendPuffin] Calling backend sendPuffin...');
        const blockIndex = await withTimeout(
          actor.sendPuffin(
            { toText: () => to } as any as Principal,
            amount
          ),
          60000,
          'Transaction timeout: The ledger is taking too long to respond. Please try again.'
        );
        
        console.log('[useSendPuffin] Transaction successful, block index:', blockIndex.toString());
        return { 
          blockIndex, 
          recipientType: format 
        };
      } catch (error: any) {
        console.error('[useSendPuffin] Transaction error:', error);
        console.error('[useSendPuffin] Error message:', error.message);
        
        if (error.message?.includes('timeout')) {
          throw new Error('Transaction timeout: Please check your connection and try again.');
        } else if (error.message?.includes('Bonding Phase')) {
          throw new Error('Bonding Phase: Puffin token transfers not yet available');
        } else if (error.message?.includes('Insufficient')) {
          throw new Error('Insufficient funds: You do not have enough Puffin tokens for this transaction.');
        } else if (error.message?.includes('Invalid recipient')) {
          throw new Error('Invalid recipient: Please check the address format.');
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[useSendPuffin] Mutation onSuccess callback, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['puffinBalance'] });
    },
    onError: (error) => {
      console.error('[useSendPuffin] Mutation onError callback:', error);
    },
  });
}

// Rewards System Hooks
export function useGetUnclaimedRewards() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['unclaimedRewards'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        console.log('[useGetUnclaimedRewards] Fetching unclaimed rewards...');
        const rewards = await actor.getUnclaimedRewards();
        console.log('[useGetUnclaimedRewards] Success - Rewards:', rewards.toString(), 'e8s');
        return rewards;
      } catch (error) {
        console.error('[useGetUnclaimedRewards] Error fetching unclaimed rewards:', error);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useGetRewardHistory() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<RewardHistory[]>({
    queryKey: ['rewardHistory'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        console.log('[useGetRewardHistory] Fetching reward history...');
        const history = await actor.getRewardHistory();
        console.log('[useGetRewardHistory] Success - Found', history.length, 'claims');
        return history;
      } catch (error) {
        console.error('[useGetRewardHistory] Error fetching reward history:', error);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 60000,
  });
}

export function useClaimRewards() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('[useClaimRewards] Mutation started');
      
      if (!actor) {
        console.error('[useClaimRewards] Actor not initialized');
        throw new Error('Actor not initialized');
      }
      
      try {
        console.log('[useClaimRewards] Calling backend claimRewards...');
        const result = await withTimeout(
          actor.claimRewards(),
          60000,
          'Claim timeout: The transaction is taking too long. Please try again.'
        );
        
        console.log('[useClaimRewards] Claim successful:', result);
        return result;
      } catch (error: any) {
        console.error('[useClaimRewards] Claim error:', error);
        console.error('[useClaimRewards] Error message:', error.message);
        
        // Handle daily limit errors specifically
        if (error.message?.includes('Daily reward limit reached')) {
          throw new Error('Daily reward limit reached. Please try again tomorrow.');
        } else if (error.message?.includes('timeout')) {
          throw new Error('Claim timeout: Please check your connection and try again.');
        } else if (error.message?.includes('No rewards available')) {
          throw new Error('No rewards available to claim.');
        } else if (error.message?.includes('Unauthorized')) {
          throw new Error('Authentication required to claim rewards.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useClaimRewards] Mutation onSuccess callback, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['unclaimedRewards'] });
      queryClient.invalidateQueries({ queryKey: ['rewardHistory'] });
      queryClient.invalidateQueries({ queryKey: ['icpBalance'] });
    },
    onError: (error) => {
      console.error('[useClaimRewards] Mutation onError callback:', error);
    },
  });
}
