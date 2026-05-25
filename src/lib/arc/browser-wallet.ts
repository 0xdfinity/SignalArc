"use client";

import { ARC_TESTNET } from "@/lib/constants";

export type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const ARC_CHAIN_ID_HEX = `0x${ARC_TESTNET.chainId.toString(16)}`;

export async function connectArcWallet() {
  const provider = window.ethereum;

  if (!provider) {
    throw new Error("No browser wallet found. Install a wallet extension or create a SignalArc wallet.");
  }

  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts[0];

  if (!address) {
    throw new Error("No wallet account was returned.");
  }

  await ensureArcNetwork(provider);
  return address;
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
