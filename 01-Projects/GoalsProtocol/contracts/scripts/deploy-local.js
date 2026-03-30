const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 $GOALS Protocol - Local Deployment\n");

  const [deployer] = await ethers.getSigners();
  
  console.log("📋 Deployment Account:", deployer.address);
  
  // Check balance (ethers v6 syntax)
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");

  console.log("📄 Deploying GoalsProtocolNFT...\n");
  
  const GoalsProtocolNFT = await ethers.getContractFactory("GoalsProtocolNFT");
  const nft = await GoalsProtocolNFT.deploy(
    deployer.address,  // royalty recipient
    deployer.address,  // data oracle
    deployer.address,  // agent regulator
    "https://api.goalsprotocol.xyz/metadata/"
  );

  await nft.waitForDeployment();
  
  const contractAddress = await nft.getAddress();
  
  console.log("✅ Contract deployed!");
  console.log("📍 Address:", contractAddress);
  console.log("📊 Tx Hash:", nft.deploymentTransaction().hash);
  console.log("⛽ Gas Used:", nft.deploymentTransaction().gasLimit.toString());
  console.log();

  // Test minting
  console.log("🎨 Minting test NFTs...\n");
  
  const tx = await nft.mintPlayer(
    "Lionel Messi",
    3, // FWD
    3, // LEGENDARY
    {
      pace: 85,
      shooting: 95,
      passing: 91,
      dribbling: 96,
      defense: 35,
      physical: 65,
      overall: 94,
      lastUpdate: Math.floor(Date.now() / 1000)
    },
    "ipfs://QmTest/messi.json",
    { value: ethers.parseEther("1.0") }
  );
  
  await tx.wait();
  console.log("✅ Minted Messi (Legendary)!");
  
  // Get token data
  const tokenData = await nft.getTokenData(0);
  console.log("\n📊 Token #0 Data:");
  console.log("  Name:", tokenData.playerName);
  console.log("  Rarity:", ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'][tokenData.rarity]);
  console.log("  Position:", ['GK', 'DEF', 'MID', 'FWD'][tokenData.position]);
  console.log("  Agent Enabled:", tokenData.agentEnabled);
  console.log("  Health:", ['HEALTHY', 'DEGRADED', 'CRITICAL', 'RECOVERING'][tokenData.agentHealth]);
  
  console.log("\n🎉 Local deployment complete!");
  console.log("\n📋 Contract Address:", contractAddress);
  console.log("\n📋 For Base Sepolia deployment:");
  console.log("  1. Get test ETH from https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
  console.log("  2. Set PRIVATE_KEY in .env file");
  console.log("  3. Run: npx hardhat run scripts/deploy.js --network baseSepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
