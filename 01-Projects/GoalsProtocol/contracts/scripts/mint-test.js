const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🎨 $GOALS Protocol - Minting Test NFTs\n");

  const [deployer] = await ethers.getSigners();
  
  // Load deployment info
  const network = hre.network.name;
  const deploymentPath = path.join(__dirname, '..', 'deployments', `${network}-deployment.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment not found. Run deploy.js first.");
    console.error("   npx hardhat run scripts/deploy.js --network", network);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contractAddress = deployment.contractAddress;

  console.log("📄 Contract Address:", contractAddress);
  console.log("🌐 Network:", network);
  console.log("👤 Deployer:", deployer.address);
  console.log();

  // Get contract instance
  const GoalsProtocolNFT = await ethers.getContractFactory("GoalsProtocolNFT");
  const nft = GoalsProtocolNFT.attach(contractAddress);

  // Test players
  const testPlayers = [
    {
      name: "Lionel Messi",
      position: 3, // FWD
      rarity: 3,   // LEGENDARY
      stats: {
        pace: 85,
        shooting: 95,
        passing: 91,
        dribbling: 96,
        defense: 35,
        physical: 65,
        overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      },
      imageURI: "ipfs://QmXxxx/messi.json",
      price: ethers.parseEther("1.0")
    },
    {
      name: "Cristiano Ronaldo",
      position: 3, // FWD
      rarity: 3,   // LEGENDARY
      stats: {
        pace: 82,
        shooting: 94,
        passing: 82,
        dribbling: 86,
        defense: 35,
        physical: 78,
        overall: 92,
        lastUpdate: Math.floor(Date.now() / 1000)
      },
      imageURI: "ipfs://QmXxxx/ronaldo.json",
      price: ethers.parseEther("1.0")
    },
    {
      name: "Jude Bellingham",
      position: 2, // MID
      rarity: 2,   // EPIC
      stats: {
        pace: 78,
        shooting: 80,
        passing: 85,
        dribbling: 84,
        defense: 80,
        physical: 85,
        overall: 88,
        lastUpdate: Math.floor(Date.now() / 1000)
      },
      imageURI: "ipfs://QmXxxx/bellingham.json",
      price: ethers.parseEther("0.2")
    },
    {
      name: "Eduardo Camavinga",
      position: 2, // MID
      rarity: 1,   // RARE
      stats: {
        pace: 75,
        shooting: 65,
        passing: 82,
        dribbling: 85,
        defense: 78,
        physical: 75,
        overall: 82,
        lastUpdate: Math.floor(Date.now() / 1000)
      },
      imageURI: "ipfs://QmXxxx/camavinga.json",
      price: ethers.parseEther("0.05")
    }
  ];

  console.log(`🎮 Minting ${testPlayers.length} test players...\n`);

  for (const player of testPlayers) {
    console.log(`⚽ Minting ${player.name} (${['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'][player.rarity]})...`);
    
    try {
      const tx = await nft.mintPlayer(
        player.name,
        player.position,
        player.rarity,
        player.stats,
        player.imageURI,
        { value: player.price }
      );

      const receipt = await tx.wait();
      
      // Get token ID from events
      const event = receipt.logs.find(
        log => {
          try {
            const parsed = nft.interface.parseLog(log);
            return parsed && parsed.name === 'PlayerMinted';
          } catch {
            return false;
          }
        }
      );
      
      let tokenId = "?";
      if (event) {
        const parsed = nft.interface.parseLog(event);
        tokenId = parsed.args.tokenId.toString();
      }
      
      console.log(`  ✅ Token ID: ${tokenId}`);
      console.log(`  💰 Price: ${ethers.formatEther(player.price)} ETH`);
      console.log(`  ⛽ Gas Used: ${receipt.gasUsed.toString()}`);
      console.log();
      
    } catch (error) {
      console.error(`  ❌ Failed to mint ${player.name}:`, error.message);
    }
  }

  // Get all tokens owned by deployer
  console.log("📊 Your Collection:");
  try {
    const myTokens = await nft.getTokensByOwner(deployer.address);
    console.log(`  Total NFTs: ${myTokens.length}`);
    
    for (const tokenId of myTokens) {
      const data = await nft.getTokenData(tokenId);
      const rarityNames = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];
      console.log(`  #${tokenId}: ${data.playerName} (${rarityNames[data.rarity]}) - Health: ${['HEALTHY', 'DEGRADED', 'CRITICAL', 'RECOVERING'][data.agentHealth]}`);
    }
  } catch (error) {
    console.log(`  Could not fetch collection: ${error.message}`);
  }

  console.log("\n🎉 Test minting complete!");
  
  if (network !== "hardhat") {
    console.log(`\n🔗 View on BaseScan:`);
    console.log(`  https://sepolia.basescan.org/address/${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Minting failed:", error);
    process.exit(1);
  });
