require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Helper to get valid private key
function getPrivateKeys() {
  const key = process.env.PRIVATE_KEY;
  // Check if key exists and is valid (64 characters without 0x, or 66 with 0x)
  if (key && key !== "your_private_key_here" && key.length >= 64) {
    return [key.startsWith("0x") ? key : `0x${key}`];
  }
  return []; // Return empty for local testing
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts: getPrivateKeys(),
      chainId: 84532,
      gasPrice: 1000000000 // 1 gwei
    },
    baseMainnet: {
      url: process.env.BASE_MAINNET_RPC || "https://mainnet.base.org",
      accounts: getPrivateKeys(),
      chainId: 8453
    }
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      baseMainnet: process.env.BASESCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
