require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");
require("dotenv/config");

const arcAccounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];
const arcRpcUrl =
  process.env.ARC_CANTEEN_RPC_URL || process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network";

/** @type {import("hardhat/config").HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arcTestnet: {
      url: arcRpcUrl,
      chainId: 5042002,
      accounts: arcAccounts,
    },
  },
};
