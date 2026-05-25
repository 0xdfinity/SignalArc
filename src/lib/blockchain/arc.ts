import { JsonRpcProvider } from "ethers";

import { ARC_TESTNET } from "@/lib/constants";

let provider: JsonRpcProvider | null = null;

function getArcRpcUrl() {
  return process.env.ARC_CANTEEN_RPC_URL || process.env.ARC_TESTNET_RPC_URL || ARC_TESTNET.rpcUrl;
}

export function getArcProvider() {
  if (!provider) {
    provider = new JsonRpcProvider(getArcRpcUrl(), {
      name: "arc-testnet",
      chainId: ARC_TESTNET.chainId,
    });
  }

  return provider;
}

export async function getArcHealth() {
  try {
    const blockNumber = await Promise.race([
      getArcProvider().getBlockNumber(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Arc RPC health check timed out.")), 2500),
      ),
    ]);
    return {
      ok: true,
      blockNumber,
      chainId: ARC_TESTNET.chainId,
      rpcUrl: getArcRpcUrl(),
      usdcAddress: ARC_TESTNET.usdcAddress,
    };
  } catch (error) {
    return {
      ok: false,
      blockNumber: null,
      chainId: ARC_TESTNET.chainId,
      rpcUrl: getArcRpcUrl(),
      usdcAddress: ARC_TESTNET.usdcAddress,
      error: error instanceof Error ? error.message : "Arc RPC health check failed.",
    };
  }
}
