#!/usr/bin/env node
/**
 * 🤖 $GOALS Auto-Deploy Bot
 * Automated deployment assistant for Base Sepolia
 * 
 * Features:
 * - Monitors wallet balance
 * - Alerts when funds needed
 * - Auto-deploys when ready
 * - Retries on failure
 * - Status monitoring
 * - Telegram notifications (optional)
 */

const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Bot configuration
const CONFIG = {
  // Check interval (30 seconds)
  checkInterval: 30000,
  
  // Minimum balance required (0.01 ETH)
  minBalance: ethers.parseEther("0.01"),
  
  // Deployment retry attempts
  maxRetries: 3,
  
  // Retry delay (10 seconds)
  retryDelay: 10000,
  
  // Faucet URLs for manual reference
  faucets: [
    {
      name: "Coinbase Faucet",
      url: "https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet",
      amount: "0.1 ETH"
    },
    {
      name: "Alchemy Faucet", 
      url: "https://sepoliafaucet.com/",
      amount: "0.5 ETH"
    }
  ],
  
  // Telegram bot config (optional)
  telegram: {
    enabled: false,
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
  }
};

class DeployBot {
  constructor() {
    this.state = {
      walletAddress: null,
      balance: null,
      isDeploying: false,
      deploymentComplete: false,
      retryCount: 0,
      logs: [],
      startTime: Date.now()
    };
    
    this.provider = null;
    this.wallet = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    
    this.state.logs.push(logEntry);
    
    // Color coding
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      deploy: '\x1b[35m'   // Magenta
    };
    
    console.log(`${colors[type] || ''}${logEntry}\x1b[0m`);
    
    // Send Telegram notification if enabled
    if (CONFIG.telegram.enabled && type !== 'info') {
      this.sendTelegram(message);
    }
  }

  async sendTelegram(message) {
    if (!CONFIG.telegram.botToken || !CONFIG.telegram.chatId) return;
    
    try {
      const url = `https://api.telegram.org/bot${CONFIG.telegram.botToken}/sendMessage`;
      const data = JSON.stringify({
        chat_id: CONFIG.telegram.chatId,
        text: `🤖 $GOALS Bot: ${message}`,
        parse_mode: 'Markdown'
      });
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      await new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
          res.on('data', () => {});
          res.on('end', resolve);
        });
        req.on('error', reject);
        req.write(data);
        req.end();
      });
    } catch (error) {
      this.log(`Telegram error: ${error.message}`, 'error');
    }
  }

  async initialize() {
    this.log('🤖 Initializing $GOALS Auto-Deploy Bot...', 'info');
    
    try {
      // Load wallet from .env
      const envPath = path.join(__dirname, '..', '.env');
      if (!fs.existsSync(envPath)) {
        throw new Error('.env file not found. Please create it with PRIVATE_KEY');
      }
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const privateKeyMatch = envContent.match(/PRIVATE_KEY=(.+)/);
      
      if (!privateKeyMatch || privateKeyMatch[1] === 'your_private_key_here') {
        throw new Error('PRIVATE_KEY not configured in .env file');
      }
      
      let privateKey = privateKeyMatch[1].trim();
      if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
      }
      
      // Connect to Base Sepolia
      this.provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      this.state.walletAddress = this.wallet.address;
      
      this.log(`✅ Bot initialized`, 'success');
      this.log(`📋 Wallet: ${this.state.walletAddress}`, 'info');
      this.log('', 'info');
      
      return true;
    } catch (error) {
      this.log(`Initialization failed: ${error.message}`, 'error');
      return false;
    }
  }

  async checkBalance() {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      this.state.balance = balance;
      
      const balanceEth = ethers.formatEther(balance);
      const minEth = ethers.formatEther(CONFIG.minBalance);
      
      if (balance >= CONFIG.minBalance) {
        this.log(`✅ Balance sufficient: ${balanceEth} ETH`, 'success');
        return { sufficient: true, balance };
      } else {
        this.log(`⚠️  Insufficient balance: ${balanceEth} ETH (need ${minEth} ETH)`, 'warning');
        return { sufficient: false, balance };
      }
    } catch (error) {
      this.log(`Balance check failed: ${error.message}`, 'error');
      return { sufficient: false, balance: null };
    }
  }

  showFaucetInfo() {
    this.log('', 'info');
    this.log('═══════════════════════════════════════════', 'info');
    this.log('💧 GET TEST ETH FROM FAUCETS:', 'warning');
    this.log('═══════════════════════════════════════════', 'info');
    
    CONFIG.faucets.forEach((faucet, index) => {
      this.log(`${index + 1}. ${faucet.name}`, 'info');
      this.log(`   Amount: ${faucet.amount}`, 'info');
      this.log(`   URL: ${faucet.url}`, 'info');
      this.log('', 'info');
    });
    
    this.log('📋 Your wallet address:', 'warning');
    this.log(`   ${this.state.walletAddress}`, 'success');
    this.log('', 'info');
    this.log('⏳ Waiting for funds...', 'info');
    this.log('═══════════════════════════════════════════', 'info');
    this.log('', 'info');
  }

  async deployContract() {
    if (this.state.isDeploying) {
      this.log('Deployment already in progress...', 'warning');
      return false;
    }
    
    this.state.isDeploying = true;
    this.log('🚀 Starting deployment...', 'deploy');
    
    try {
      // Load contract factory
      const GoalsProtocolNFT = await ethers.getContractFactory("GoalsProtocolNFT", this.wallet);
      
      this.log('📄 Deploying GoalsProtocolNFT...', 'deploy');
      
      // Deploy
      const contract = await GoalsProtocolNFT.deploy(
        this.wallet.address,  // royalty recipient
        this.wallet.address,  // data oracle
        this.wallet.address,  // agent regulator
        "https://api.goalsprotocol.xyz/metadata/"
      );
      
      this.log('⏳ Waiting for deployment confirmation...', 'deploy');
      await contract.waitForDeployment();
      
      const contractAddress = await contract.getAddress();
      const txHash = contract.deploymentTransaction().hash;
      
      this.log(`✅ Contract deployed!`, 'success');
      this.log(`   Address: ${contractAddress}`, 'success');
      this.log(`   Tx Hash: ${txHash}`, 'success');
      
      // Save deployment info
      const deploymentInfo = {
        network: 'baseSepolia',
        chainId: 84532,
        contractAddress: contractAddress,
        deployerAddress: this.wallet.address,
        deploymentTime: new Date().toISOString(),
        txHash: txHash
      };
      
      const deploymentPath = path.join(__dirname, '..', 'deployments', 'baseSepolia-deployment.json');
      if (!fs.existsSync(path.dirname(deploymentPath))) {
        fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
      }
      
      fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
      this.log(`💾 Deployment saved to: deployments/baseSepolia-deployment.json`, 'success');
      
      this.state.deploymentComplete = true;
      this.state.isDeploying = false;
      
      return deploymentInfo;
      
    } catch (error) {
      this.state.isDeploying = false;
      this.log(`Deployment failed: ${error.message}`, 'error');
      
      if (this.state.retryCount < CONFIG.maxRetries) {
        this.state.retryCount++;
        this.log(`🔄 Retrying... (${this.state.retryCount}/${CONFIG.maxRetries})`, 'warning');
        await this.sleep(CONFIG.retryDelay);
        return this.deployContract();
      }
      
      return null;
    }
  }

  async mintTestNFTs() {
    this.log('', 'info');
    this.log('🎨 Minting test NFTs...', 'deploy');
    
    try {
      const deploymentPath = path.join(__dirname, '..', 'deployments', 'baseSepolia-deployment.json');
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      
      const GoalsProtocolNFT = await ethers.getContractFactory("GoalsProtocolNFT", this.wallet);
      const nft = GoalsProtocolNFT.attach(deployment.contractAddress);
      
      const testPlayers = [
        { name: "Lionel Messi", rarity: 3, price: "1.0" },
        { name: "Cristiano Ronaldo", rarity: 3, price: "1.0" },
        { name: "Jude Bellingham", rarity: 2, price: "0.2" },
        { name: "Eduardo Camavinga", rarity: 1, price: "0.05" }
      ];
      
      const playerStats = {
        pace: 85, shooting: 95, passing: 91, dribbling: 96,
        defense: 35, physical: 65, overall: 94,
        lastUpdate: Math.floor(Date.now() / 1000)
      };
      
      for (const player of testPlayers) {
        this.log(`  Minting ${player.name}...`, 'info');
        
        const tx = await nft.mintPlayer(
          player.name,
          3, // FWD
          player.rarity,
          playerStats,
          "ipfs://test",
          { value: ethers.parseEther(player.price) }
        );
        
        await tx.wait();
        this.log(`  ✅ ${player.name} minted!`, 'success');
      }
      
      this.log('🎉 All test NFTs minted!', 'success');
      return true;
      
    } catch (error) {
      this.log(`Minting failed: ${error.message}`, 'error');
      return false;
    }
  }

  async verifyContract(deploymentInfo) {
    this.log('', 'info');
    this.log('🔍 Attempting to verify contract...', 'info');
    
    try {
      // Note: This would need BASESCAN_API_KEY to work
      // For now, we just provide the command
      this.log('To verify manually, run:', 'info');
      this.log(`  npx hardhat verify --network baseSepolia ${deploymentInfo.contractAddress} "${this.wallet.address}" "${this.wallet.address}" "${this.wallet.address}" "https://api.goalsprotocol.xyz/metadata/"`, 'info');
      
      return true;
    } catch (error) {
      this.log(`Verification skipped: ${error.message}`, 'warning');
      return false;
    }
  }

  async showFinalSummary(deploymentInfo) {
    const duration = ((Date.now() - this.state.startTime) / 1000).toFixed(2);
    
    this.log('', 'info');
    this.log('═══════════════════════════════════════════', 'success');
    this.log('🎉 DEPLOYMENT COMPLETE!', 'success');
    this.log('═══════════════════════════════════════════', 'success');
    this.log('', 'info');
    this.log(`⏱️  Duration: ${duration}s`, 'info');
    this.log('', 'info');
    this.log('📋 Contract Details:', 'info');
    this.log(`   Address: ${deploymentInfo.contractAddress}`, 'success');
    this.log(`   Network: Base Sepolia`, 'info');
    this.log(`   Chain ID: 84532`, 'info');
    this.log('', 'info');
    this.log('🔗 Links:', 'info');
    this.log(`   BaseScan: https://sepolia.basescan.org/address/${deploymentInfo.contractAddress}`, 'info');
    this.log('', 'info');
    this.log('📁 Files:', 'info');
    this.log('   - Deployment: deployments/baseSepolia-deployment.json', 'info');
    this.log('   - Logs: bot-deployment.log', 'info');
    this.log('', 'info');
    this.log('⚽ Every goal tells a story!', 'success');
    this.log('═══════════════════════════════════════════', 'success');
    this.log('', 'info');
    
    // Save logs
    fs.writeFileSync('bot-deployment.log', this.state.logs.join('\n'));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    // Initialize
    if (!await this.initialize()) {
      process.exit(1);
    }
    
    this.log('', 'info');
    this.log('═══════════════════════════════════════════', 'info');
    this.log('🤖 $GOALS AUTO-DEPLOY BOT', 'info');
    this.log('═══════════════════════════════════════════', 'info');
    this.log('', 'info');
    
    // Main loop
    while (!this.state.deploymentComplete) {
      // Check balance
      const { sufficient, balance } = await this.checkBalance();
      
      if (sufficient) {
        // Deploy
        const deploymentInfo = await this.deployContract();
        
        if (deploymentInfo) {
          // Mint test NFTs
          await this.mintTestNFTs();
          
          // Verify
          await this.verifyContract(deploymentInfo);
          
          // Show summary
          await this.showFinalSummary(deploymentInfo);
          
          break;
        }
      } else {
        // Show faucet info (only once)
        if (this.state.logs.filter(l => l.includes('GET TEST ETH')).length === 0) {
          this.showFaucetInfo();
        }
        
        this.log(`💤 Checking again in ${CONFIG.checkInterval / 1000}s...`, 'info');
        await this.sleep(CONFIG.checkInterval);
      }
    }
    
    this.log('👋 Bot shutting down. Goodbye!', 'info');
    process.exit(0);
  }
}

// Run bot
const bot = new DeployBot();
bot.run().catch(error => {
  console.error('Bot crashed:', error);
  process.exit(1);
});
