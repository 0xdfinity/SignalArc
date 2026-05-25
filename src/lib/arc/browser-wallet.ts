"use client";

import { ARC_TESTNET } from "@/lib/constants";

export type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  isRabby?: boolean;
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    rabby?: EthereumProvider;
  }
}

export const ARC_CHAIN_ID_HEX = `0x${ARC_TESTNET.chainId.toString(16)}`;

type Eip6963ProviderInfo = {
  uuid: string;
  name: string;
  icon?: string;
  rdns?: string;
};

type Eip6963ProviderDetail = {
  info: Eip6963ProviderInfo;
  provider: EthereumProvider;
};

export type WalletProviderOption = {
  id: string;
  name: string;
  rdns?: string;
  icon?: string;
  provider: EthereumProvider;
};

let selectedProvider: EthereumProvider | null = null;

export async function connectArcWallet(preferredProvider?: EthereumProvider) {
  const provider = preferredProvider ?? selectedProvider ?? (await getPreferredInjectedProvider());

  if (!provider) {
    throw new Error("No browser wallet found. Install Rabby, MetaMask, or another EVM wallet extension, then allow this site to access it.");
  }

  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts[0];

  if (!address) {
    throw new Error("No wallet account was returned.");
  }

  await ensureArcNetwork(provider);
  selectedProvider = provider;
  return address;
}

export function getActiveEthereumProvider() {
  return selectedProvider ?? window.ethereum ?? window.rabby;
}

export async function discoverWalletProviders(timeoutMs = 500): Promise<WalletProviderOption[]> {
  if (typeof window === "undefined") {
    return [];
  }

  const discovered = new Map<string, WalletProviderOption>();
  const addProvider = (option: WalletProviderOption) => {
    const key = option.rdns || option.id || option.name;

    if (!discovered.has(key)) {
      discovered.set(key, option);
    }
  };

  const handleAnnouncement = (event: Event) => {
    const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;

    if (!detail?.provider || !detail.info?.uuid) {
      return;
    }

    addProvider({
      id: detail.info.uuid,
      name: detail.info.name,
      rdns: detail.info.rdns,
      icon: detail.info.icon,
      provider: detail.provider,
    });
  };

  window.addEventListener("eip6963:announceProvider", handleAnnouncement as EventListener);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  await new Promise((resolve) => setTimeout(resolve, timeoutMs));
  window.removeEventListener("eip6963:announceProvider", handleAnnouncement as EventListener);

  const injectedProviders = window.ethereum?.providers;

  if (Array.isArray(injectedProviders)) {
    for (const provider of injectedProviders) {
      addProvider({
        id: providerName(provider),
        name: providerName(provider),
        provider,
      });
    }
  }

  if (window.rabby) {
    addProvider({ id: "rabby", name: "Rabby", rdns: "io.rabby", provider: window.rabby });
  }

  if (window.ethereum) {
    addProvider({ id: providerName(window.ethereum), name: providerName(window.ethereum), provider: window.ethereum });
  }

  return [...discovered.values()].sort((a, b) => walletPriority(a) - walletPriority(b));
}

async function getPreferredInjectedProvider() {
  const [provider] = await discoverWalletProviders();
  return provider?.provider ?? null;
}

export async function ensureArcNetwork(provider: EthereumProvider) {
  const currentChain = (await provider.request({ method: "eth_chainId" })) as string;

  if (currentChain.toLowerCase() === ARC_CHAIN_ID_HEX.toLowerCase()) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_CHAIN_ID_HEX }],
    });
  } catch (error) {
    if (isUnknownChainError(error)) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ARC_CHAIN_ID_HEX,
            chainName: ARC_TESTNET.name,
            nativeCurrency: {
              name: "USDC",
              symbol: "USDC",
              decimals: ARC_TESTNET.nativeGasDecimals,
            },
            rpcUrls: [ARC_TESTNET.rpcUrl],
            blockExplorerUrls: [ARC_TESTNET.explorerUrl],
          },
        ],
      });
      return;
    }

    throw error;
  }
}

function isUnknownChainError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && Number((error as { code?: unknown }).code) === 4902;
}

function providerName(provider: EthereumProvider) {
  if (provider.isRabby) {
    return "Rabby";
  }

  if (provider.isMetaMask) {
    return "MetaMask";
  }

  return "Browser wallet";
}

function walletPriority(option: WalletProviderOption) {
  const name = option.name.toLowerCase();
  const rdns = option.rdns?.toLowerCase() ?? "";

  if (name.includes("rabby") || rdns.includes("rabby") || option.provider.isRabby) {
    return 0;
  }

  if (name.includes("metamask") || rdns.includes("metamask") || option.provider.isMetaMask) {
    return 1;
  }

  return 2;
}
