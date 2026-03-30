const { ethers, run, network } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 $GOALS Protocol - Deployment\n");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("📋 Deployment Account:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");

  const config = {
    royaltyRecipient: deployer.address,
    dataOracle: deployer.address,
    baseURI: "https://api.goalsprotocol.xyz/metadata/",
  };

  console.log("⚙️  Configuration:");
  console.log("  Royalty:", config.royaltyRecipient);
  console.log("  Oracle:", config.dataOracle);
  console.log("  URI:", config.baseURI);
  console.log();

  console.log("📄 Deploying GoalsProtocolNFT...\n");
  
  const GoalsProtocolNFT = await ethers.getContractFactory("GoalsProtocolNFT");
  const nft = await GoalsProtocolNFT.deploy(
    config.royaltyRecipient,
    config.dataOracle,
    config.royaltyRecipient,  // agent regulator (same as royalty for now)
    config.baseURI
  );

  await nft.waitForDeployment();
  
  const contractAddress = await nft.getAddress();
  
  console.log("✅ Deployed to:", contractAddress);
  console.log("📊 Tx Hash:", nft.deploymentTransaction().hash);
  console.log("⛽ Gas:", nft.deploymentTransaction().gasLimit.toString());
  console.log();

  console.log("⏳ Waiting for confirmations...");
  if (network.name === "hardhat") {
    await nft.deploymentTransaction().wait(1);
  } else {
    await nft.deploymentTransaction().wait(5);
  }
  console.log("✅ Confirmed\n");

  if (network.name !== "hardhat") {
    console.log("🔍 Verifying...");
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [
          config.royaltyRecipient,
          config.dataOracle,
          config.royaltyRecipient,
          config.baseURI
        ]
      });
      console.log("✅ Verified\n");
    } catch (error) {
      console.log("⚠️  Verification skipped\n");
    }
  }

  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
    config: config,
    abi: JSON.parse(nft.interface.formatJson())
  };

  const deploymentPath = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentPath, `${network.name}-deployment.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("💾 Saved to deployments/");
  console.log("\n🎉 Deployment Complete!");
  console.log("\n📋 Next:");
  console.log("  1. npx hardhat run scripts/mint-test.js --network", network.name);
  console.log("  2. npx hardhat run scripts/update-stats.js --network", network.name);

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
