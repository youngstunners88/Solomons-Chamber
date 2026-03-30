#!/usr/bin/env node
/**
 * 💧 ETH Faucet Bot - Automated Testnet Funding
 * 
 * Attempts to get test ETH from multiple sources:
 * 1. API-based faucets (automated)
 * 2. Twitter faucet bots
 * 3. Discord faucets
 * 4. Manual faucet links (with auto-open)
 * 
 * Usage: node scripts/eth-faucet-bot.js
 */

const { ethers } = require("ethers");
const https = require('https');
const http = require('http');
const open = require('open');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Faucet configurations
const FAUCETS = {
  // API-based (can be automated)
  alchemy: {
    name: 'Alchemy Sepolia',
    type: 'manual',
    url: 'https://sepoliafaucet.com/',
    amount: '0.5 ETH',
    requiresSignup: true,
    apiAvailable: false
  },
  infura: {
    name: 'Infura Sepolia',
    type: 'manual', 
    url: 'https://www.infura.io/faucet/sepolia',
    amount: '0.5 ETH',
    requiresSignup: true,
    apiAvailable: false
  },
  quicknode: {
    name: 'QuickNode Sepolia',
    type: 'manual',
    url: 'https://faucet.quicknode.com/ethereum/sepolia',
    amount: '0.05 ETH',
    requiresSignup: false,
    apiAvailable: false
  },
  coinbase: {
    name: 'Coinbase Base Sepolia',
    type: 'manual',
    url: 'https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet',
    amount: '0.1 ETH',
    requiresSignup: false,
    apiAvailable: false,
    priority: 1
  },
  google: {
    name: 'Google Cloud Sepolia',
    type: 'manual',
    url: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia',
    amount: '0.05 ETH',
    requiresSignup: true,
    apiAvailable: false
  },
  // Potential automated sources
  poaFaucet: {
    name: 'POA Sokol (Deprecated)',
    type: 'api',
    url: 'https://faucet.poa.network/',
    disabled: true
  },
  // Mining options
  gpuMining: {
    name: 'GPU Mining (Testnet)',
    type: 'mining',
    description: 'Mine test ETH with spare GPU',
    effort: 'High',
    reward: 'Variable'
  }
};

// Bot configuration
const CONFIG = {
  targetBalance: ethers.parseEther("0.01"),
  checkInterval: 15000, // 15 seconds
  maxWaitTime: 30 * 60 * 1000, // 30 minutes
  autoOpenFaucets: true,
  parallelRequests: false
};

class ETHFaucetBot {
  constructor() {
    this.wallet = null;
    this.provider = null;
    this.attempts = [];
    this.successfulFaucets = [];
    this.startTime = Date.now();
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m'
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: this.colors.cyan,
      success: this.colors.green,
      warning: this.colors.yellow,
      error: this.colors.red,
      money: this.colors.magenta,
      bright: this.colors.bright
    };
    console.log(`${colors[type] || ''}[${timestamp}] ${message}${this.colors.reset}`);
  }

  printBanner() {
    console.clear();
    console.log(`${this.colors.magenta}`);
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║           💧 ETH FAUCET BOT - $GOALS Protocol             ║');
    console.log('║                                                            ║');
    console.log('║     Automated Testnet Funding for Base Sepolia            ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`${this.colors.reset}`);
  }

  async initialize() {
    this.printBanner();
    this.log('🤖 Initializing ETH Faucet Bot...', 'info');
    
    try {
      const envPath = path.join(__dirname, '..', '.env');
      if (!fs.existsSync(envPath)) {
        throw new Error('.env file not found');
      }
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const privateKeyMatch = envContent.match(/PRIVATE_KEY=(.+)/);
      
      if (!privateKeyMatch) {
        throw new Error('PRIVATE_KEY not found in .env');
      }
      
      let privateKey = privateKeyMatch[1].trim();
      if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
      }
      
      this.provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      this.log(`✅ Bot initialized`, 'success');
      this.log('', 'info');
      this.log('═══════════════════════════════════════════', 'money');
      this.log('  🎯 TARGET WALLET', 'money');
      this.log(`  ${this.wallet.address}`, 'bright');
      this.log('═══════════════════════════════════════════', 'money');
      
      return true;
    } catch (error) {
      this.log(`❌ Initialization failed: ${error.message}`, 'error');
      return false;
    }
  }

  async checkBalance() {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return { balance, eth: ethers.formatEther(balance) };
    } catch (error) {
      this.log(`Balance check failed: ${error.message}`, 'error');
      return null;
    }
  }

  async openFaucet(faucetKey) {
    const faucet = FAUCETS[faucetKey];
    if (!faucet || faucet.disabled) return false;
    
    this.log(`🌐 Opening ${faucet.name}...`, 'warning');
    
    try {
      await open(faucet.url);
      this.log(`✅ Opened: ${faucet.url}`, 'success');
      return true;
    } catch (error) {
      this.log(`❌ Could not open browser`, 'error');
      this.log(`   Manual URL: ${faucet.url}`, 'info');
      return false;
    }
  }

  async tryAutomatedFaucets() {
    this.log('', 'info');
    this.log('═══════════════════════════════════════════', 'info');
    this.log('  🤖 ATTEMPTING AUTOMATED FAUCETS', 'info');
    this.log('═══════════════════════════════════════════', 'info');
    this.log('', 'info');
    
    // Unfortunately, most faucets require CAPTCHA or authentication
    // We can only provide the links and instructions
    
    this.log('⚠️  No fully automated faucets available for Base Sepolia', 'warning');
    this.log('   (CAPTCHA protection prevents automation)', 'dim');
    this.log('', 'info');
    this.log('✅ Solution: Semi-automated workflow with browser opening', 'success');
    
    return false;
  }

  async runFaucetSequence() {
    this.log('', 'info');
    this.log('═══════════════════════════════════════════', 'info');
    this.log('  🚰 FAUCET SEQUENCE', 'info');
    this.log('═══════════════════════════════════════════', 'info');
    this.log('', 'info');
    
    // Priority order
    const priorityFaucets = ['coinbase', 'alchemy', 'quicknode', 'google', 'infura'];
    
    for (const key of priorityFaucets) {
      const faucet = FAUCETS[key];
      if (!faucet || faucet.disabled) continue;
      
      this.log(`📋 ${faucet.name}`, 'bright');
      this.log(`   Amount: ${faucet.amount}`, 'info');
      this.log(`   Requires: ${faucet.requiresSignup ? 'Signup' : 'Just address'}`, 'info');
      
      if (CONFIG.autoOpenFaucets) {
        await this.openFaucet(key);
        
        // Wait for user if signup required
        if (faucet.requiresSignup) {
          this.log('', 'warning');
          this.log('⚠️  This faucet requires signup/account', 'warning');
          this.log('   Complete the signup and request funds', 'info');
          this.log('', 'info');
        }
      }
      
      this.log('', 'info');
    }
  }

  async monitorUntilFunded() {
    this.log('', 'info');
    this.log('═══════════════════════════════════════════', 'info');
    this.log('  ⏳ MONITORING FOR FUNDS', 'info');
    this.log('═══════════════════════════════════════════', 'info');
    this.log('', 'info');
    
    const targetEth = ethers.formatEther(CONFIG.targetBalance);
    let lastBalance = ethers.parseEther("0");
    let checks = 0;
    
    while (true) {
      checks++;
      const result = await this.checkBalance();
      
      if (!result) {
        await this.sleep(CONFIG.checkInterval);
        continue;
      }
      
      const { balance, eth } = result;
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const progress = Math.min(100, (Number(eth) / Number(targetEth)) * 100);
      
      // Progress bar
      const filled = Math.floor(progress / 5);
      const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
      
      // Clear line and print status
      process.stdout.write('\r\x1b[K');
      process.stdout.write(
        `${this.colors.cyan}[${checks}] ${this.colors.magenta}` +
        `[${bar}] ${progress.toFixed(1)}% ` +
        `${this.colors.bright}${eth} ETH${this.colors.reset} ` +
        `${this.colors.dim}(${elapsed}s)${this.colors.reset}`
      );
      
      // Detect new funds
      if (balance > lastBalance && lastBalance > 0n) {
        const received = ethers.formatEther(balance - lastBalance);
        console.log('');
        this.log('', 'success');
        this.log('🎉🎉🎉 FUNDS RECEIVED! 🎉🎉🎉', 'success');
        this.log(`   +${received} ETH`, 'money');
        this.log('', 'success');
        
        // Beep
        process.stdout.write('\x07');
      }
      
      // Check if funded
      if (balance >= CONFIG.targetBalance) {
        console.log('');
        this.log('', 'success');
        this.log('═══════════════════════════════════════════', 'success');
        this.log('  ✅ WALLET FUNDED!', 'success');
        this.log('═══════════════════════════════════════════', 'success');
        this.log('', 'success');
        this.log(`   Balance: ${eth} ETH`, 'money');
        this.log(`   Target:  ${targetEth} ETH`, 'info');
        this.log('', 'success');
        this.log('🚀 Ready to deploy!', 'bright');
        this.log('   Run: npm run deploy', 'info');
        this.log('', 'success');
        
        process.stdout.write('\x07\x07\x07'); // Triple beep
        return true;
      }
      
      lastBalance = balance;
      
      // Check max wait time
      if (Date.now() - this.startTime > CONFIG.maxWaitTime) {
        console.log('');
        this.log('', 'warning');
        this.log('⏰ Max wait time reached (30 minutes)', 'warning');
        this.log('   Check faucets manually', 'info');
        return false;
      }
      
      await this.sleep(CONFIG.checkInterval);
    }
  }

  printAlternatives() {
    this.log('', 'info');
    this.log('═══════════════════════════════════════════', 'info');
    this.log('  💡 ALTERNATIVE FUNDING METHODS', 'info');
    this.log('═══════════════════════════════════════════', 'info');
    this.log('', 'info');
    
    this.log('1. 🐦 Twitter Faucet Bots', 'bright');
    this.log('   Tweet: @ faucet_name your_address', 'info');
    this.log('   Example: @QuickNodeFaucet 0x123...', 'info');
    this.log('', 'info');
    
    this.log('2. 💬 Discord Faucets', 'bright');
    this.log('   Join: discord.gg/ethdev', 'info');
    this.log('   Channel: #faucet-requests', 'info');
    this.log('', 'info');
    
    this.log('3. 👥 Ask a Friend', 'bright');
    this.log('   Anyone with Sepolia ETH can send you some', 'info');
    this.log('', 'info');
    
    this.log('4. ⛏️ Mine Test ETH', 'bright');
    this.log('   Use spare GPU to mine (not recommended)', 'info');
    this.log('', 'info');
  }

  async run() {
    if (!await this.initialize()) {
      process.exit(1);
    }
    
    // Check current balance
    const initial = await this.checkBalance();
    if (initial && initial.balance >= CONFIG.targetBalance) {
      this.log('', 'success');
      this.log('✅ Already funded!', 'success');
      this.log(`   Balance: ${initial.eth} ETH`, 'money');
      this.log('', 'info');
      this.log('🚀 Run: npm run deploy', 'bright');
      return;
    }
    
    // Try automated faucets (none available currently)
    await this.tryAutomatedFaucets();
    
    // Run manual faucet sequence
    await this.runFaucetSequence();
    
    // Show alternatives
    this.printAlternatives();
    
    // Monitor until funded
    await this.monitorUntilFunded();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

// Run
const bot = new ETHFaucetBot();
bot.run().catch(console.error);
