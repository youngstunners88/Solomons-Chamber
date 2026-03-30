const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Checking Wallet Balance\n");
  
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("📋 Wallet Address:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  console.log("");
  
  const minRequired = ethers.parseEther("0.01");
  
  if (balance < minRequired) {
    console.log("⚠️  INSUFFICIENT BALANCE!");
    console.log("");
    console.log("You need test ETH to deploy.");
    console.log("");
    console.log("📍 Options to get test ETH:");
    console.log("");
    console.log("1. Coinbase Faucet (Recommended):");
    console.log("   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    console.log("   - Connect wallet with address:", deployer.address);
    console.log("   - Request 0.1 ETH (free)");
    console.log("");
    console.log("2. Other Faucets:");
    console.log("   https://docs.base.org/tools/network-faucets/");
    console.log("");
    console.log("3. Alchemy Faucet:");
    console.log("   https://sepoliafaucet.com/");
    console.log("");
    process.exit(1);
  } else {
    console.log("✅ Balance sufficient for deployment!");
    console.log("   Can deploy ~" + Math.floor(Number(balance) / Number(ethers.parseEther("0.005"))) + " contracts");
    console.log("");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
