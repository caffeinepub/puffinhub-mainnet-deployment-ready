import { useState, useEffect, useCallback } from 'react';
import { Principal } from '@icp-sdk/core/principal';
import { Actor, HttpAgent } from '@dfinity/agent';
import { toast } from 'sonner';
import { principalToAccountId } from '../lib/accountId';

export type WalletType = 'plug' | null;

export interface ConnectedWalletInfo {
  type: WalletType;
  principal: Principal | null;
  accountId: string | null;
  isConnected: boolean;
}

// Declare global window interfaces for Plug wallet
declare global {
  interface Window {
    ic?: {
      plug?: {
        isConnected: () => Promise<boolean>;
        createAgent: (args?: { whitelist?: string[]; host?: string }) => Promise<boolean>;
        requestConnect: (args?: { whitelist?: string[]; host?: string }) => Promise<boolean>;
        disconnect: () => Promise<void>;
        getPrincipal: () => Promise<Principal>;
        agent: HttpAgent;
        requestTransfer: (args: {
          to: string;
          amount: number;
          memo?: bigint;
        }) => Promise<{ height: bigint }>;
      };
    };
  }
}

const LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
const WHITELIST = [LEDGER_CANISTER_ID];

// Type definitions for ICP Ledger
interface Tokens {
  e8s: bigint;
}

interface AccountBalanceArgs {
  account: number[];
}

interface LedgerActor {
  account_balance: (args: AccountBalanceArgs) => Promise<Tokens>;
}

// Ledger IDL for account_balance method
const ledgerIDL = ({ IDL }: any) => {
  const AccountIdentifier = IDL.Vec(IDL.Nat8);
  const AccountBalanceArgs = IDL.Record({ account: AccountIdentifier });
  const Tokens = IDL.Record({ e8s: IDL.Nat64 });
  
  return IDL.Service({
    account_balance: IDL.Func([AccountBalanceArgs], [Tokens], ['query']),
  });
};

export function useConnectedWallet() {
  const [walletInfo, setWalletInfo] = useState<ConnectedWalletInfo>({
    type: null,
    principal: null,
    accountId: null,
    isConnected: false,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for existing Plug wallet connection on mount
  useEffect(() => {
    checkExistingConnections();
  }, []);

  const checkExistingConnections = async () => {
    try {
      if (window.ic?.plug) {
        const isConnected = await window.ic.plug.isConnected();
        if (isConnected) {
          const principal = await window.ic.plug.getPrincipal();
          setWalletInfo({
            type: 'plug',
            principal,
            accountId: principal.toString(),
            isConnected: true,
          });
          return;
        }
      }
    } catch (error) {
      console.error('[useConnectedWallet] Error checking existing connections:', error);
    }
  };

  const connectPlug = useCallback(async () => {
    setIsConnecting(true);
    try {
      if (!window.ic?.plug) {
        toast.error('Plug Wallet not detected', {
          description: 'Please install the Plug Wallet extension',
          duration: 5000,
        });
        return false;
      }

      const connected = await window.ic.plug.requestConnect({
        whitelist: WHITELIST,
        host: 'https://icp0.io',
      });

      if (!connected) {
        toast.error('Connection rejected', {
          description: 'Please approve the connection in Plug Wallet',
        });
        return false;
      }

      await window.ic.plug.createAgent({
        whitelist: WHITELIST,
        host: 'https://icp0.io',
      });

      const principal = await window.ic.plug.getPrincipal();
      
      setWalletInfo({
        type: 'plug',
        principal,
        accountId: principal.toString(),
        isConnected: true,
      });

      toast.success('Plug Wallet connected successfully! 🔌');
      return true;
    } catch (error: any) {
      console.error('[useConnectedWallet] Plug connection error:', error);
      toast.error('Failed to connect Plug Wallet', {
        description: error.message || 'Please try again',
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (walletInfo.type === 'plug' && window.ic?.plug) {
        await window.ic.plug.disconnect();
      }

      setWalletInfo({
        type: null,
        principal: null,
        accountId: null,
        isConnected: false,
      });

      toast.success('Wallet disconnected');
    } catch (error: any) {
      console.error('[useConnectedWallet] Disconnect error:', error);
      toast.error('Failed to disconnect wallet', {
        description: error.message || 'Please try again',
      });
    }
  }, [walletInfo.type]);

  const getICPBalance = useCallback(async (): Promise<bigint> => {
    if (!walletInfo.isConnected || walletInfo.type !== 'plug' || !walletInfo.principal) {
      throw new Error('Plug Wallet not connected');
    }

    try {
      if (!window.ic?.plug) {
        throw new Error('Plug Wallet not available');
      }

      console.log('[useConnectedWallet] Fetching ICP balance via ICP Ledger');
      
      // Step 1: Get Plug's agent
      const agent = window.ic.plug.agent;
      if (!agent) {
        throw new Error('Plug agent not available');
      }

      // Step 2: Get principal and convert to Account ID
      const principal = walletInfo.principal;
      const accountIdHex = principalToAccountId(principal);
      console.log('[useConnectedWallet] Principal:', principal.toString());
      console.log('[useConnectedWallet] Account ID:', accountIdHex);

      // Step 3: Convert hex Account ID to bytes array
      const accountIdBytes = new Uint8Array(
        accountIdHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );

      // Step 4: Create ledger actor with Plug's agent
      const ledger = Actor.createActor(ledgerIDL, {
        agent,
        canisterId: LEDGER_CANISTER_ID,
      }) as LedgerActor;

      // Step 5: Call account_balance
      const result: Tokens = await ledger.account_balance({
        account: Array.from(accountIdBytes),
      });

      console.log('[useConnectedWallet] Ledger response:', result);

      // Step 6: Extract e8s from result and convert to bigint
      const balanceE8s = BigInt(result.e8s.toString());
      console.log('[useConnectedWallet] ICP balance in e8s:', balanceE8s.toString());
      
      return balanceE8s;
    } catch (error: any) {
      console.error('[useConnectedWallet] Get ICP balance error:', error);
      throw new Error(error.message || 'Failed to fetch ICP balance');
    }
  }, [walletInfo]);

  const sendICP = useCallback(async (to: string, amountICP: number): Promise<{ blockIndex: bigint }> => {
    if (!walletInfo.isConnected || walletInfo.type !== 'plug') {
      throw new Error('Plug Wallet not connected');
    }

    try {
      if (!window.ic?.plug) {
        throw new Error('Plug Wallet not available');
      }

      console.log('[useConnectedWallet] Sending ICP via Plug:', { to, amountICP });
      
      // Plug expects amount in e8s (ICP * 100,000,000)
      const amountE8s = Math.floor(amountICP * 100000000);
      
      const result = await window.ic.plug.requestTransfer({
        to,
        amount: amountE8s,
      });

      console.log('[useConnectedWallet] Plug transfer successful:', result);
      return { blockIndex: result.height };
    } catch (error: any) {
      console.error('[useConnectedWallet] Send ICP error:', error);
      throw error;
    }
  }, [walletInfo]);

  return {
    walletInfo,
    isConnecting,
    connectPlug,
    disconnect,
    sendICP,
    getICPBalance,
  };
}
