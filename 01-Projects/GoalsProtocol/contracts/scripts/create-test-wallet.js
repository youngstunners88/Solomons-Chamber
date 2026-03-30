const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔑 Creating Test Wallet for Base Sepolia Deployment\n");
  
  // Create random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log("✅ New Wallet Created!");
  console.log("");
  console.log("📋 Wallet Details:");
  console.log("  Address:", wallet.address);
  console.log("  Private Key:", wallet.privateKey);
  console.log("");
  console.log("⚠️  IMPORTANT: Save this information!");
  console.log("");
  console.log("📝 Next Steps:");
  console.log("  1. Copy the private key (without 0x prefix)");
  console.log("  2. Add it to your .env file:");
  console.log(`     PRIVATE_KEY=${wallet.privateKey.replace('0x', '')}`);
  console.log("");
  console.log("  3. Get test ETH from:");
  console.log("     https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
  console.log("");
  console.log("  4. Deploy with:");
  console.log("     ./QUICKSTART.sh");
  console.log("");
  
  // Save to file for reference
  const walletInfo = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || "N/A",
    created: new Date().toISOString(),
    note: "This is a test wallet for Base Sepolia. Keep private key secret!"
  };
  
  fs.writeFileSync(
    '.test-wallet.json',
    JSON.stringify(walletInfo, null, 2)
  );
  
  console.log("💾 Wallet info saved to: .test-wallet.json");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
