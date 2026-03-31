import {
  AuthClient,
  type AuthClientCreateOptions,
  type AuthClientLoginOptions,
} from "@dfinity/auth-client";
import type { Identity } from "@icp-sdk/core/agent";
import { DelegationIdentity, isDelegationValid } from "@icp-sdk/core/identity";
import {
  type PropsWithChildren,
  type ReactNode,
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadConfig } from "../config";

export type Status =
  | "initializing"
  | "idle"
  | "logging-in"
  | "success"
  | "loginError";

export type IdentityProvider = "ic" | "ai";

export type UnifiedIdentityContext = {
  identity?: Identity;
  login: (provider: IdentityProvider) => void;
  clear: () => void;
  loginStatus: Status;
  isInitializing: boolean;
  isLoginIdle: boolean;
  isLoggingIn: boolean;
  isLoginSuccess: boolean;
  isLoginError: boolean;
  loginError?: Error;
  currentProvider?: IdentityProvider;
};

const ONE_HOUR_IN_NANOSECONDS = BigInt(3_600_000_000_000);

const IDENTITY_PROVIDERS = {
  ic: "https://identity.ic0.app/#authorize",
  ai: "https://id.ai",
};

type ProviderValue = UnifiedIdentityContext;
const UnifiedIdentityReactContext = createContext<ProviderValue | undefined>(
  undefined,
);

async function createAuthClient(
  createOptions?: AuthClientCreateOptions,
): Promise<AuthClient> {
  const config = await loadConfig();
  const options: AuthClientCreateOptions = {
    idleOptions: {
      disableDefaultIdleCallback: true,
      disableIdle: true,
      ...createOptions?.idleOptions,
    },
    loginOptions: {
      derivationOrigin: config.ii_derivation_origin,
    },
    ...createOptions,
  };
  const authClient = await AuthClient.create(options);
  return authClient;
}

function assertProviderPresent(
  context: ProviderValue | undefined,
): asserts context is ProviderValue {
  if (!context) {
    throw new Error(
      "UnifiedIdentityProvider is not present. Wrap your component tree with it.",
    );
  }
}

export const useUnifiedIdentity = (): UnifiedIdentityContext => {
  const context = useContext(UnifiedIdentityReactContext);
  assertProviderPresent(context);
  return context;
};

export function UnifiedIdentityProvider({
  children,
  createOptions,
}: PropsWithChildren<{
  children: ReactNode;
  createOptions?: AuthClientCreateOptions;
}>) {
  const [authClient, setAuthClient] = useState<AuthClient | undefined>(
    undefined,
  );
  const [identity, setIdentity] = useState<Identity | undefined>(undefined);
  const [loginStatus, setStatus] = useState<Status>("initializing");
  const [loginError, setError] = useState<Error | undefined>(undefined);
  const [currentProvider, setCurrentProvider] = useState<
    IdentityProvider | undefined
  >(undefined);

  const setErrorMessage = useCallback((message: string) => {
    setStatus("loginError");
    setError(new Error(message));
  }, []);

  const handleLoginSuccess = useCallback(() => {
    const latestIdentity = authClient?.getIdentity();
    if (!latestIdentity) {
      setErrorMessage("Identity not found after successful login");
      return;
    }
    setIdentity(latestIdentity);
    setStatus("success");
  }, [authClient, setErrorMessage]);

  const handleLoginError = useCallback(
    (maybeError?: string) => {
      setErrorMessage(maybeError ?? "Login failed");
    },
    [setErrorMessage],
  );

  const login = useCallback(
    (provider: IdentityProvider) => {
      if (!authClient) {
        setErrorMessage(
          "AuthClient is not initialized yet, make sure to call `login` on user interaction e.g. click.",
        );
        return;
      }

      const currentIdentity = authClient.getIdentity();
      if (
        !currentIdentity.getPrincipal().isAnonymous() &&
        currentIdentity instanceof DelegationIdentity &&
        isDelegationValid(currentIdentity.getDelegation())
      ) {
        setErrorMessage("User is already authenticated");
        return;
      }

      const identityProvider = IDENTITY_PROVIDERS[provider];
      const options: AuthClientLoginOptions = {
        identityProvider,
        onSuccess: () => {
          setCurrentProvider(provider);
          handleLoginSuccess();
        },
        onError: handleLoginError,
        maxTimeToLive: ONE_HOUR_IN_NANOSECONDS * BigInt(24 * 30),
      };

      setStatus("logging-in");
      void authClient.login(options);
    },
    [authClient, handleLoginError, handleLoginSuccess, setErrorMessage],
  );

  const clear = useCallback(() => {
    if (!authClient) {
      setErrorMessage("Auth client not initialized");
      return;
    }

    void authClient
      .logout()
      .then(() => {
        setIdentity(undefined);
        setStatus("idle");
        setError(undefined);
        setCurrentProvider(undefined);
      })
      .catch((unknownError: unknown) => {
        setStatus("loginError");
        setError(
          unknownError instanceof Error
            ? unknownError
            : new Error("Logout failed"),
        );
      });
  }, [authClient, setErrorMessage]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setStatus("initializing");
        let existingClient = authClient;
        if (!existingClient) {
          existingClient = await createAuthClient(createOptions);
          if (cancelled) return;
          setAuthClient(existingClient);
        }
        const isAuthenticated = await existingClient.isAuthenticated();
        if (cancelled) return;
        if (isAuthenticated) {
          const loadedIdentity = existingClient.getIdentity();
          setIdentity(loadedIdentity);
        }
      } catch (unknownError) {
        setStatus("loginError");
        setError(
          unknownError instanceof Error
            ? unknownError
            : new Error("Initialization failed"),
        );
      } finally {
        if (!cancelled) setStatus("idle");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [createOptions]);

  const value = useMemo<ProviderValue>(
    () => ({
      identity,
      login,
      clear,
      loginStatus,
      isInitializing: loginStatus === "initializing",
      isLoginIdle: loginStatus === "idle",
      isLoggingIn: loginStatus === "logging-in",
      isLoginSuccess: loginStatus === "success",
      isLoginError: loginStatus === "loginError",
      loginError,
      currentProvider,
    }),
    [identity, login, clear, loginStatus, loginError, currentProvider],
  );

  return createElement(UnifiedIdentityReactContext.Provider, {
    value,
    children,
  });
}
