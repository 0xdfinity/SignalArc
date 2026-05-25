const hre = require("hardhat");
const fs = require("node:fs");

const ARC_USDC = process.env.ARC_USDC_ADDRESS ?? "0x3600000000000000000000000000000000000000";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying SignalArc contracts from ${deployer.address}`);
  const platformTreasury = process.env.PLATFORM_TREASURY_ADDRESS || deployer.address;

  const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();

  const PolicyVault = await hre.ethers.getContractFactory("PolicyVault");
  const vault = await PolicyVault.deploy(ARC_USDC, await registry.getAddress());
  await vault.waitForDeployment();

  const FeeSettlement = await hre.ethers.getContractFactory("FeeSettlement");
  const settlement = await FeeSettlement.deploy(
    await registry.getAddress(),
    await vault.getAddress(),
    platformTreasury,
  );
  await settlement.waitForDeployment();

  const AttributionRouter = await hre.ethers.getContractFactory("AttributionRouter");
  const router = await AttributionRouter.deploy(await vault.getAddress(), await settlement.getAddress());
  await router.waitForDeployment();

  await (await vault.setRouter(await router.getAddress())).wait();
  await (await vault.setSettlement(await settlement.getAddress())).wait();
  await (await settlement.setRouter(await router.getAddress())).wait();

  const deployed = {
    AgentRegistry: await registry.getAddress(),
    PolicyVault: await vault.getAddress(),
    FeeSettlement: await settlement.getAddress(),
    AttributionRouter: await router.getAddress(),
    PlatformTreasury: platformTreasury,
    USDC: ARC_USDC,
  };

  writeEnv({
    AGENT_REGISTRY_ADDRESS: deployed.AgentRegistry,
    POLICY_VAULT_ADDRESS: deployed.PolicyVault,
    FEE_SETTLEMENT_ADDRESS: deployed.FeeSettlement,
    ATTRIBUTION_ROUTER_ADDRESS: deployed.AttributionRouter,
  });

  console.log(deployed);
}

function writeEnv(values) {
  const envPath = ".env";
  const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const lines = current.split(/\r?\n/);
  const keys = new Set(Object.keys(values));
  const seen = new Set();
  const next = lines.map((line) => {
    const [key] = line.split("=");

    if (keys.has(key)) {
      seen.add(key);
      return `${key}=${values[key]}`;
    }

    return line;
  });

  for (const key of keys) {
    if (!seen.has(key)) {
      next.push(`${key}=${values[key]}`);
    }
  }

  fs.writeFileSync(envPath, next.join("\n").replace(/\n*$/, "\n"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
