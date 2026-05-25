"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserProvider, Contract, formatUnits, parseUnits, type Eip1193Provider } from "ethers";
import { ArrowUpRight, Banknote, RefreshCw, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ERC20_USDC_ABI, POLICY_VAULT_ABI } from "@/lib/arc/contracts";
import { connectArcWallet, getActiveEthereumProvider } from "@/lib/arc/browser-wallet";

type ArcConfig = {
  chain: {
    faucetUrl: string;
    usdcDecimals: number;
  };
  contracts: {
    usdcAddress: string;
    policyVaultAddress: string;
  };
};

export function VaultFundingPanel({ accountWallet }: { accountWallet: string }) {
  const router = useRouter();
  const [connectedWallet, setConnectedWallet] = useState("");
  const [walletUsdc, setWalletUsdc] = useState<number | null>(null);
  const [nativeGas, setNativeGas] = useState<number | null>(null);
  const [vaultUsdc, setVaultUsdc] = useState<number | null>(null);
  const [amount, setAmount] = useState("25");
  const [pending, setPending] = useState<"connect" | "deposit" | "sync" | null>(null);

  const activeWallet = connectedWallet || accountWallet;

  async function loadConfig() {
    const response = await fetch("/api/arc/config");

    if (!response.ok) {
      throw new Error("Arc configuration is unavailable.");
    }

    const config = (await response.json()) as ArcConfig;

    if (!config.contracts.policyVaultAddress) {
      throw new Error("Policy vault is not configured.");
    }

    return config;
  }

  async function connect() {
    setPending("connect");

    try {
      const address = await connectArcWallet();
      setConnectedWallet(address);
      await loadWalletState(address);
      toast.success("Wallet connected on Arc testnet");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet connection failed");
    } finally {
      setPending(null);
    }
  }

  async function deposit() {
    setPending("deposit");

    try {
      const address = await connectArcWallet();
      setConnectedWallet(address);

      if (address.toLowerCase() !== accountWallet.toLowerCase()) {
        throw new Error("Connected wallet does not match this SignalArc account.");
      }

      const config = await loadConfig();
      const value = parseUnits(amount || "0", config.chain.usdcDecimals);

      if (value <= BigInt(0)) {
        throw new Error("Enter a USDC amount greater than zero.");
      }

      const injectedProvider = getActiveEthereumProvider();

      if (!injectedProvider) {
        throw new Error("No connected wallet provider was found.");
      }

      const browserProvider = new BrowserProvider(injectedProvider as Eip1193Provider);
      const signer = await browserProvider.getSigner();
      const usdc = new Contract(config.contracts.usdcAddress, ERC20_USDC_ABI, signer);
      const vault = new Contract(config.contracts.policyVaultAddress, POLICY_VAULT_ABI, signer);
      const [rawUsdc, rawGas] = await Promise.all([
        usdc.balanceOf(address) as Promise<bigint>,
        browserProvider.getBalance(address),
      ]);

      if (rawUsdc < value) {
        throw new Error(`This wallet has ${formatUnits(rawUsdc, config.chain.usdcDecimals)} Arc USDC. Fund it from the faucet before depositing.`);
      }

      if (rawGas <= BigInt(0)) {
        throw new Error("This wallet has no Arc gas balance. Fund it from the faucet first.");
      }

      const allowance = (await usdc.allowance(address, config.contracts.policyVaultAddress)) as bigint;

      if (allowance < value) {
        const approval = await usdc.approve(config.contracts.policyVaultAddress, value);
        await approval.wait();
      }

      const tx = await vault.depositUSDC(value);
      await tx.wait();
      await loadWalletState(address);
      await syncBalance(address);
      toast.success("USDC allocated to the policy vault");
      router.refresh();
    } catch (error) {
      toast.error(readableWalletError(error));
    } finally {
      setPending(null);
    }
  }

  async function syncBalance(wallet = activeWallet) {
    setPending((current) => current ?? "sync");

    try {
      const response = await fetch("/api/funding/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: wallet }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Balance sync failed");
      }

      const data = (await response.json()) as { usdcBalance: number };
      toast.success(`${data.usdcBalance.toFixed(2)} USDC synced`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Balance sync failed");
    } finally {
      setPending(null);
    }
  }

  async function loadWalletState(wallet: string) {
    const config = await loadConfig();
    const injectedProvider = getActiveEthereumProvider();

    if (!injectedProvider) {
      throw new Error("No connected wallet provider was found.");
    }

    const browserProvider = new BrowserProvider(injectedProvider as Eip1193Provider);
    const usdc = new Contract(config.contracts.usdcAddress, ERC20_USDC_ABI, browserProvider);
    const vault = new Contract(config.contracts.policyVaultAddress, POLICY_VAULT_ABI, browserProvider);
    const [rawUsdc, rawGas, rawVault] = await Promise.all([
      usdc.balanceOf(wallet) as Promise<bigint>,
      browserProvider.getBalance(wallet),
      vault.balances(wallet) as Promise<bigint>,
    ]);

    setWalletUsdc(Number(formatUnits(rawUsdc, config.chain.usdcDecimals)));
    setNativeGas(Number(formatUnits(rawGas, 18)));
    setVaultUsdc(Number(formatUnits(rawVault, config.chain.usdcDecimals)));
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 font-serif text-lg">
            <Banknote className="size-4 text-primary" />
            Allocate USDC
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Deposit Arc testnet USDC into your policy vault. Agents can only act inside the rules you approve.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={connect} disabled={pending !== null}>
            <WalletCards className="size-4" />
            {pending === "connect" ? "Connecting" : activeWallet ? "Wallet ready" : "Connect wallet"}
          </Button>
          <Button variant="outline" asChild>
            <a href="https://faucet.circle.com" target="_blank" rel="noreferrer">
              Faucet
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <BalancePill label="Wallet USDC" value={walletUsdc} />
        <BalancePill label="Gas USDC" value={nativeGas} />
        <BalancePill label="Vault USDC" value={vaultUsdc} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input
          aria-label="USDC amount"
          value={amount}
          min={1}
          step={1}
          onChange={(event) => setAmount(event.target.value)}
          type="number"
        />
        <Button onClick={deposit} disabled={!accountWallet || pending !== null}>
          {pending === "deposit" ? "Allocating" : "Deposit to vault"}
        </Button>
        <Button variant="outline" onClick={() => syncBalance()} disabled={!accountWallet || pending !== null}>
          <RefreshCw className="size-4" />
          {pending === "sync" ? "Syncing" : "Sync"}
        </Button>
      </div>
      <div className="mt-3 break-all font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        Account wallet: {accountWallet || "Create an account first"}
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Use the same browser wallet you connected during onboarding. Generated wallets must be imported into your wallet app before they can sign deposits.
      </p>
    </div>
  );
}

function BalancePill({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md border border-border bg-background/45 px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="metric-tabular mt-1 text-sm font-semibold">{value === null ? "-" : value.toFixed(4)}</div>
    </div>
  );
}

function readableWalletError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Deposit failed";
  }

  const message = error.message;

  if (message.includes("user rejected")) {
    return "Wallet request was rejected.";
  }

  if (message.includes("insufficient funds")) {
    return "Insufficient Arc USDC for gas or deposit amount.";
  }

  if (message.includes("allowance")) {
    return "USDC approval failed. Try approving again.";
  }

  if (message.includes("balance")) {
    return "Wallet balance is below the deposit amount.";
  }

  return message || "Deposit failed";
}
