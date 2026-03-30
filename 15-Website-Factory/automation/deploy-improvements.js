#!/usr/bin/env node
/**
 * Website Improvement Deployment System
 * 
 * Deploys improved website versions to production
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  improvedDir: '/home/teacherchris37/Solomons-Chamber/15-Website-Factory/improved',
  deployTargets: {
    'storychain': '/home/teacherchris37/storychain-analysis/index.html',
    'ihhashi-mobile': '/home/teacherchris37/index.html'
  },
  backupDir: '/home/teacherchris37/Solomons-Chamber/15-Website-Factory/backup'
};

function backupOriginal(targetPath) {
  if (!fs.existsSync(targetPath)) {
    console.log(`⚠️  Target doesn't exist: ${targetPath}`);
    return false;
  }
  
  const backupDir = CONFIG.backupDir;
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const filename = path.basename(targetPath);
  const timestamp = new Date().toISOString().split('T')[0];
  const backupPath = path.join(backupDir, `${filename}.${timestamp}.backup`);
  
  fs.copyFileSync(targetPath, backupPath);
  console.log(`✅ Backed up to: ${backupPath}`);
  return true;
}

function deployImprovement(websiteName) {
  console.log(`\n🚀 Deploying: ${websiteName}`);
  
  const improvedPath = path.join(CONFIG.improvedDir, websiteName, 'index.html');
  const deployPath = CONFIG.deployTargets[websiteName];
  
  if (!fs.existsSync(improvedPath)) {
    console.log(`❌ Improved version not found: ${improvedPath}`);
    return false;
  }
  
  // Backup original
  if (!backupOriginal(deployPath)) {
    // If original doesn't exist, we'll create it
    console.log(`ℹ️  Creating new file at: ${deployPath}`);
  }
  
  // Copy improved version
  fs.copyFileSync(improvedPath, deployPath);
  console.log(`✅ Deployed: ${deployPath}`);
  
  return true;
}

function deployAll() {
  console.log('🚀 DEPLOYING ALL IMPROVEMENTS\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const [name, target] of Object.entries(CONFIG.deployTargets)) {
    if (deployImprovement(name)) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log(`\n📊 DEPLOYMENT SUMMARY`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`   Total: ${successCount + failCount}`);
}

// CLI
const command = process.argv[2];
const website = process.argv[3];

switch (command) {
  case '--deploy':
    if (website) {
      deployImprovement(website);
    } else {
      console.log('Usage: node deploy-improvements.js --deploy <website-name>');
      console.log('       node deploy-improvements.js --deploy-all');
    }
    break;
  case '--deploy-all':
    deployAll();
    break;
  case '--list':
    console.log('\nAvailable deployments:');
    for (const [name, target] of Object.entries(CONFIG.deployTargets)) {
      const exists = fs.existsSync(target);
      console.log(`  - ${name} → ${target} ${exists ? '✅' : '❌'}`);
    }
    break;
  default:
    console.log(`
Website Improvement Deployment System

Usage:
  node deploy-improvements.js --deploy <name>   # Deploy specific website
  node deploy-improvements.js --deploy-all      # Deploy all improvements
  node deploy-improvements.js --list            # List available deployments

Examples:
  node deploy-improvements.js --deploy storychain
  node deploy-improvements.js --deploy-all
    `);
}

module.exports = { deployImprovement, deployAll };
