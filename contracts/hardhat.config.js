require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = (process.env.PRIVATE_KEY || "").replace(/^0x/, "");
const accounts = PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: false,
    },
  },
  networks: {
    hardhat: {},
    litvmTestnet: {
      url: process.env.LITVM_RPC_URL || "https://liteforge.rpc.caldera.xyz/http",
      chainId: 4441,
      accounts,
    },
  },
  etherscan: {
    // LitVM uses a Blockscout-compatible explorer (Caldera). Verification UX
    // may differ; left unconfigured by default.
    apiKey: {},
  },
  sourcify: {
    enabled: false,
  },
};
