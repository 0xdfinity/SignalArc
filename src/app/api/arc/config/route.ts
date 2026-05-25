import { NextResponse } from "next/server";

import { ARC_TESTNET } from "@/lib/constants";

export async function GET() {
  return NextResponse.json({
    chain: {
      name: ARC_TESTNET.name,
      chainId: ARC_TESTNET.chainId,
      chainIdHex: `0x${ARC_TESTNET.chainId.toString(16)}`,
      rpcUrl: process.env.ARC_CANTEEN_RPC_URL || process.env.ARC_TESTNET_RPC_URL || ARC_TESTNET.rpcUrl,
      explorerUrl: ARC_TESTNET.explorerUrl,
      faucetUrl: ARC_TESTNET.faucetUrl,
      usdcDecimals: ARC_TESTNET.usdcDecimals,
      nativeGasDecimals: ARC_TESTNET.nativeGasDecimals,
    },
    contracts: {
      usdcAddress: process.env.ARC_USDC_ADDRESS || ARC_TESTNET.usdcAddress,
      policyVaultAddress: process.env.POLICY_VAULT_ADDRESS || "",
      agentRegistryAddress: process.env.AGENT_REGISTRY_ADDRESS || "",
      attributionRouterAddress: process.env.ATTRIBUTION_ROUTER_ADDRESS || "",
      feeSettlementAddress: process.env.FEE_SETTLEMENT_ADDRESS || "",
    },
  });
}
