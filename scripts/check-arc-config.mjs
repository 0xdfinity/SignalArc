import "dotenv/config";

const ARC_CHAIN_ID = 5042002;
const DEFAULT_RPC = "https://rpc.testnet.arc.network";
const USDC = "0x3600000000000000000000000000000000000000";

const rpcUrl = process.env.ARC_CANTEEN_RPC_URL || process.env.ARC_TESTNET_RPC_URL || DEFAULT_RPC;

function ok(label, detail) {
  console.log(`ok    ${label}${detail ? ` ${detail}` : ""}`);
}

function warn(label, detail) {
  console.log(`warn  ${label}${detail ? ` ${detail}` : ""}`);
}

function fail(label, detail) {
  console.log(`fail  ${label}${detail ? ` ${detail}` : ""}`);
  process.exitCode = 1;
}

async function rpc(method, params = []) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  if (!response.ok) {
    throw new Error(`RPC HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message);
  }

  return payload.result;
}

async function main() {
  console.log("SignalArc Arc configuration check");

  if (!process.env.SIGNALARC_SECRET_KEY) {
    warn("SIGNALARC_SECRET_KEY", "missing; local dev fallback will be used outside production");
  } else {
    ok("SIGNALARC_SECRET_KEY", "set");
  }

  if (!process.env.PRIVATE_KEY) {
    warn("PRIVATE_KEY", "missing; contract deployment will be disabled");
  } else {
    ok("PRIVATE_KEY", "set");
  }

  if (!process.env.PLATFORM_TREASURY_ADDRESS) {
    warn("PLATFORM_TREASURY_ADDRESS", "missing; deployer wallet will receive platform revenue");
  } else {
    ok("PLATFORM_TREASURY_ADDRESS", process.env.PLATFORM_TREASURY_ADDRESS);
  }

  const configuredUsdc = process.env.ARC_USDC_ADDRESS || USDC;
  if (configuredUsdc.toLowerCase() !== USDC.toLowerCase()) {
    warn("ARC_USDC_ADDRESS", `${configuredUsdc} differs from Arc testnet USDC ${USDC}`);
  } else {
    ok("ARC_USDC_ADDRESS", configuredUsdc);
  }

  try {
    const chainIdHex = await rpc("eth_chainId");
    const chainId = Number.parseInt(chainIdHex, 16);

    if (chainId !== ARC_CHAIN_ID) {
      fail("Arc RPC", `returned chain ${chainId}; expected ${ARC_CHAIN_ID}`);
      return;
    }

    const blockNumber = Number.parseInt(await rpc("eth_blockNumber"), 16);
    ok("Arc RPC", `${rpcUrl}`);
    ok("Arc chain", `${chainId}`);
    ok("Latest block", `${blockNumber}`);
  } catch (error) {
    fail("Arc RPC", error instanceof Error ? error.message : "unreachable");
  }
}

await main();
