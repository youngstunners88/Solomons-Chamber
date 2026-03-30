#!/usr/bin/env node
/**
 * 🚰 Faucet Monitor Bot
 * 
 * This bot monitors your wallet balance and opens faucets automatically
 * when funds are low. It's a helper to speed up the testnet funding process.
 * 
 * Usage: node scripts/faucet-monitor.js
 */

const { ethers } = require("ethers");
const open = require('open');
const fs = require('fs');
const path = require('path');

// Faucet configuration
const FAUCETS = {
  coinbase: {
    name: 'Coinbase Base Sepolia',
    url: 'https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet',
    amount: '0.1 ETH',
    cooldown: '24 hours'
  },
  alchemy: {
    name: 'Alchemy Sepolia',
    url: 'https://sepoliafaucet.com/',
    amount: '0.5 ETH',
    cooldown: '1 day'
  },
  quicknode: {
    name: 'QuickNode Sepolia',
    url: 'https://faucet.quicknode.com/ethereum/sepolia',
    amount: '0.05 ETH',
    cooldown: '12 hours'
  },
  infura: {
    name: 'Infura Sepolia',
    url: 'https://www.infura.io/faucet/sepolia',
    amount: '0.5 ETH',
    cooldown: '1 day'
  },
  google: {
    name: 'Google Cloud Sepolia',
    url: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia',
    amount: '0.05 ETH',
    cooldown: '24 hours'
  }
};

const CONFIG = {
  minBalance: ethers.parseEther("0.01"),
  checkInterval: 10000, // 10 seconds
  autoOpen: true,
  soundAlerts: true
};

class FaucetMonitor {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.balanceHistory = [];
    this.startTime = Date.now();
    this.faucetOpened = {};
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      money: '\x1b[35m'
    };
    console.log(`${colors[type] || ''}[${timestamp}] ${message}\x1b[0m`);
  }

  beep() {
    if (CONFIG.soundAlerts) {
      process.stdout.write('\x07');
    }
  }

  async initialize() {
    this.log('🚰 Initializing Faucet Monitor...', 'info');
    
    try {
      const envPath = path.join(__dirname, '..', '.env');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const privateKeyMatch = envContent.match(/PRIVATE_KEY=(.+)/);
      
      if (!privateKeyMatch || privateKeyMatch[1] === 'your_private_key_here') {
        throw new Error('PRIVATE_KEY not configured');
      }
      
      let privateKey = privateKeyMatch[1].trim();
      if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
      }
      
      this.provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      this.log('✅ Monitor initialized', 'success');
      this.log('', 'info');
      this.log('═══════════════════════════════════════', 'money');
      this.log('  🎯 WALLET ADDRESS', 'money');
      this.log(`  ${this.wallet.address}`, 'success');
      this.log('═══════════════════════════════════════', 'money');
      this.log('', 'info');
      
      // Show QR code reference
      this.log('📱 Scan this address in Coinbase Wallet or Metamask:', 'info');
      this.log(`   ${this.wallet.address}`, 'success');
      this.log('', 'info');
      
      return true;
    } catch (error) {
      this.log(`❌ Error: ${error.message}`, 'error');
      return false;
    }
  }

  async checkBalance() {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      const balanceEth = ethers.formatEther(balance);
      
      // Add to history
      this.balanceHistory.push({
        timestamp: Date.now(),
        balance: balanceEth
      });
      
      return { balance, balanceEth };
    } catch (error) {
      this.log(`Balance check failed: ${error.message}`, 'error');
      return null;
    }
  }

  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  async openFaucet(faucetKey) {
    if (this.faucetOpened[faucetKey]) {
      return;
    }
    
    const faucet = FAUCETS[faucetKey];
    this.log(`🌐 Opening ${faucet.name}...`, 'warning');
    
    try {
      await open(faucet.url);
      this.faucetOpened[faucetKey] = true;
      this.log(`✅ ${faucet.name} opened in browser`, 'success');
    } catch (error) {
      this.log(`❌ Could not open browser: ${error.message}`, 'error');
      this.log(`   Manual URL: ${faucet.url}`, 'info');
    }
  }

  showProgress(balance, target) {
    const progress = Math.min(100, (balance / target) * 100);
    const filled = Math.floor(progress / 5);
    const empty = 20 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    this.log(`   [${bar}] ${progress.toFixed(1)}%`, 'info');
  }

  async run() {
    if (!await this.initialize()) {
      process.exit(1);
    }
    
    this.log('', 'info');
    this.log('═══════════════════════════════════════', 'money');
    this.log('  🚰 MONITORING BALANCE', 'money');
    this.log('═══════════════════════════════════════', 'money');
    this.log('', 'info');
    
    const targetEth = ethers.formatEther(CONFIG.minBalance);
    this.log(`🎯 Target: ${targetEth} ETH`, 'money');
    this.log('', 'info');
    
    // Open Coinbase faucet immediately
    await this.openFaucet('coinbase');
    
    let checks = 0;
    let lastBalance = null;
    
    while (true) {
      checks++;
      const result = await this.checkBalance();
      
      if (!result) {
        await this.sleep(CONFIG.checkInterval);
        continue;
      }
      
      const { balance, balanceEth } = result;
      const elapsed = this.formatTime(Date.now() - this.startTime);
      
      // Clear screen every 5 checks for readability
      if (checks % 5 === 0) {
        console.clear();
        this.log('═══════════════════════════════════════', 'money');
        this.log(`  🚰 BALANCE MONITOR | Elapsed: ${elapsed}`, 'money');
        this.log('═══════════════════════════════════════', 'money');
        this.log('', 'info');
      }
      
      this.log(`💰 Balance: ${balanceEth} ETH (${elapsed})`, 'money');
      this.showProgress(Number(balanceEth), Number(targetEth));
      
      // Check if balance increased
      if (lastBalance !== null && balance > lastBalance) {
        const increase = ethers.formatEther(balance - lastBalance);
        this.log('', 'success');
        this.log('🎉 BALANCE INCREASED!', 'success');
        this.log(`   Received: ${increase} ETH`, 'success');
        this.log('', 'success');
        this.beep();
      }
      
      // Check if we have enough
      if (balance >= CONFIG.minBalance) {
        this.log('', 'success');
        this.log('═══════════════════════════════════════', 'success');
        this.log('  ✅ FUNDED! Ready to deploy!', 'success');
        this.log('═══════════════════════════════════════', 'success');
        this.log('', 'success');
        this.log('Next steps:', 'info');
        this.log('  1. Run: npm run deploy', 'info');
        this.log('  2. Or: node scripts/deploy.js', 'info');
        this.log('', 'info');
        this.beep();
        this.beep();
        
        return { ready: true, balance };
      }
      
      lastBalance = balance;
      
      this.log(`⏳ Checking again in ${CONFIG.checkInterval / 1000}s...`, 'info');
      await this.sleep(CONFIG.checkInterval);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run
const monitor = new FaucetMonitor();
monitor.run().then(result => {
  if (result?.ready) {
    process.exit(0);
  }
}).catch(error => {
  console.error('Monitor crashed:', error);
  process.exit(1);
});
