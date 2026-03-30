const { ethers } = require("hardhat");
async function main() {
  console.log("Starting deploy...");
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  console.log("Loading factory...");
  const GoalsProtocolNFT = await ethers.getContractFactory("GoalsProtocolNFT");
  console.log("Factory loaded");
  
  console.log("Deploying...");
  const nft = await GoalsProtocolNFT.deploy(
    deployer.address,
    deployer.address,
    deployer.address,
    "https://api.goalsprotocol.xyz/metadata/"
  );
  console.log("Deploy tx sent:", nft.deploymentTransaction().hash);
  
  console.log("Waiting for deployment...");
  await nft.waitForDeployment();
  console.log("Deployed to:", await nft.getAddress());
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
