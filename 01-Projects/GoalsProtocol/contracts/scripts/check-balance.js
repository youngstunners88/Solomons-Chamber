const { ethers } = require("hardhat");

async function main() {
  console.log("💰 $GOALS Protocol - Balance Check\n");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("📋 Address:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  console.log();
  
  const minRequired = ethers.parseEther("0.01");
  
  if (balance < minRequired) {
    console.log("⚠️  WARNING: Low balance!");
    console.log("   Required: 0.01 ETH");
    console.log("   Current:", ethers.formatEther(balance), "ETH");
    console.log();
    console.log("Get free test ETH:");
    console.log("  https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    console.log();
    process.exit(1);
  } else {
    console.log("✅ Balance sufficient for deployment!");
    console.log("   Can deploy ~" + Math.floor(Number(balance) / Number(ethers.parseEther("0.005"))) + " contracts");
    console.log();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
