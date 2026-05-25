const { expect } = require("chai");
const hre = require("hardhat");

describe("SignalArc protocol", function () {
  async function deployFixture() {
    const [deployer, user, agentOwner, venue, platformTreasury] = await hre.ethers.getSigners();

    const TestUSDC = await hre.ethers.getContractFactory("TestUSDC");
    const usdc = await TestUSDC.deploy();

    const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
    const registry = await AgentRegistry.deploy();

    const PolicyVault = await hre.ethers.getContractFactory("PolicyVault");
    const vault = await PolicyVault.deploy(await usdc.getAddress(), await registry.getAddress());

    const FeeSettlement = await hre.ethers.getContractFactory("FeeSettlement");
    const settlement = await FeeSettlement.deploy(
      await registry.getAddress(),
      await vault.getAddress(),
      platformTreasury.address,
    );

    const AttributionRouter = await hre.ethers.getContractFactory("AttributionRouter");
    const router = await AttributionRouter.deploy(await vault.getAddress(), await settlement.getAddress());

    await vault.setRouter(await router.getAddress());
    await vault.setSettlement(await settlement.getAddress());
    await settlement.setRouter(await router.getAddress());
    await router.setExecutor(deployer.address, true);

    await usdc.mint(user.address, 10_000_000_000n);
    await usdc.connect(user).approve(await vault.getAddress(), 2_000_000_000n);
    await vault.connect(user).depositUSDC(2_000_000_000n);

    const tx = await registry.connect(agentOwner).registerAgent("ipfs://alpha", "Prediction", 750);
    const receipt = await tx.wait();
    const event = receipt.logs
      .map((log) => {
        try {
          return registry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "AgentRegistered");
    const agentId = event?.args?.agentId ?? 1n;

    const categoryHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Prediction"));
    await vault
      .connect(user)
      .createPolicy(agentId, 1_000_000_000n, 400_000_000n, 200_000_000n, categoryHash, 800, 4_102_444_800, false);
    await vault.connect(user).subscribeAgent(agentId);

    return { router, vault, usdc, user, agentOwner, venue, platformTreasury, agentId, categoryHash };
  }

  it("routes a policy-approved action and pays agent and platform treasury", async function () {
    const { router, vault, usdc, user, agentOwner, venue, platformTreasury, agentId, categoryHash } =
      await deployFixture();
    const actionHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("BUY"));

    const publish = await router.publishAction(
      agentId,
      "BTC-ARC-001",
      venue.address,
      categoryHash,
      actionHash,
      100_000_000n,
      8600,
      "ipfs://rationale",
      4_102_444_800,
      "0x1234",
    );
    const receipt = await publish.wait();
    const event = receipt.logs
      .map((log) => {
        try {
          return router.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "ActionPublished");
    const actionId = event?.args?.actionId;

    await expect(router.executeAction(actionId, user.address)).to.emit(router, "ActionExecuted");
    expect(await vault.balances(user.address)).to.equal(1_900_000_000n);
    expect(await usdc.balanceOf(agentOwner.address)).to.equal(5_625_000n);
    expect(await usdc.balanceOf(platformTreasury.address)).to.equal(1_875_000n);
  });
});
