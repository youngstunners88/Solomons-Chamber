#!/bin/bash

# $GOALS Protocol - Base Sepolia Deployment Script
# This script helps you deploy to Base Sepolia testnet

set -e

echo "⚽ $GOALS Protocol - Base Sepolia Deployment"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    echo ""
    echo "Please create a .env file with the following:"
    echo ""
    echo "PRIVATE_KEY=your_private_key_here_without_0x"
    echo "BASESCAN_API_KEY=your_basescan_api_key"
    echo ""
    echo "To get these:"
    echo "1. Private Key: Export from MetaMask (Base Sepolia network)"
    echo "2. BaseScan API Key: https://basescan.org/myapikey"
    echo ""
    exit 1
fi

# Load environment variables
source .env

# Validate private key
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "your_private_key_here" ]; then
    print_error "PRIVATE_KEY not set in .env file!"
    echo ""
    echo "Please set your private key:"
    echo "  1. Open MetaMask"
    echo "  2. Switch to Base Sepolia network"
    echo "  3. Go to Account Details → Export Private Key"
    echo "  4. Copy the key (without 0x prefix)"
    echo "  5. Paste in .env file: PRIVATE_KEY=your_key_here"
    echo ""
    exit 1
fi

# Check private key format
if [ ${#PRIVATE_KEY} -lt 64 ]; then
    print_error "Private key seems too short!"
    echo "Expected: 64 characters (or 66 with 0x prefix)"
    echo "Got: ${#PRIVATE_KEY} characters"
    exit 1
fi

print_status "Environment configured ✓"
echo ""

# Check balance
print_status "Checking wallet balance..."
echo ""

# Create temporary script to check balance
cat > /tmp/check-balance.js << 'EOF'
const { ethers } = require("hardhat");
async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Address:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.01")) {
    console.log("\n⚠️  WARNING: Low balance!");
    console.log("Get test ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    process.exit(1);
  }
}
main();
EOF

npx hardhat run /tmp/check-balance.js --network baseSepolia 2>/dev/null || {
    print_error "Failed to check balance. Make sure you have test ETH."
    echo ""
    echo "Get free test ETH:"
    echo "  https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
    echo ""
    exit 1
}

echo ""

# Ask for confirmation
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Deployment cancelled."
    exit 0
fi

echo ""
print_status "Starting deployment..."
echo ""

# Deploy
npx hardhat run scripts/deploy.js --network baseSepolia

echo ""
print_status "Deployment complete! 🎉"
echo ""

# Show deployment info
if [ -f "deployments/baseSepolia-deployment.json" ]; then
    echo "Deployment Info:"
    cat deployments/baseSepolia-deployment.json | grep -E '"contractAddress"|"deployerAddress"|"deploymentTime"' | sed 's/,$//'
    echo ""
    
    CONTRACT_ADDRESS=$(cat deployments/baseSepolia-deployment.json | grep '"contractAddress"' | cut -d'"' -f4)
    
    echo "View on BaseScan:"
    echo "  https://sepolia.basescan.org/address/$CONTRACT_ADDRESS"
    echo ""
    
    # Verify if API key is set
    if [ ! -z "$BASESCAN_API_KEY" ] && [ "$BASESCAN_API_KEY" != "your_basescan_api_key_here" ]; then
        print_status "Verifying contract on BaseScan..."
        echo ""
        npx hardhat verify --network baseSepolia "$CONTRACT_ADDRESS" \
            "0x$(cat deployments/baseSepolia-deployment.json | grep '"deployerAddress"' | cut -d'"' -f4)" \
            "0x$(cat deployments/baseSepolia-deployment.json | grep '"deployerAddress"' | cut -d'"' -f4)" \
            "0x$(cat deployments/baseSepolia-deployment.json | grep '"deployerAddress"' | cut -d'"' -f4)" \
            "https://api.goalsprotocol.xyz/metadata/" 2>&1 || {
            print_warning "Verification may have failed or already done."
        }
    else
        print_warning "BASESCAN_API_KEY not set. Skipping verification."
        echo "To verify later, run:"
        echo "  npx hardhat verify --network baseSepolia $CONTRACT_ADDRESS"
    fi
fi

echo ""
print_status "Next steps:"
echo "  1. Mint test NFTs: npm run mint:test"
echo "  2. Update stats: npm run update:stats"
echo "  3. View contract: https://sepolia.basescan.org"
echo ""
