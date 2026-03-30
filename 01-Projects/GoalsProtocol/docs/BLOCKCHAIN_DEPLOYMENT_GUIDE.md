# Soccer Souls - Blockchain Deployment Guide

## 🚀 Quick Start (Option B: VM-Based Agents)

### Prerequisites

```bash
# Node.js and npm
node --version  # v18+
npm --version   # v9+

# Install Hardhat globally
npm install -g hardhat

# Get Base Sepolia ETH from faucet
# https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
```

---

## 📋 Deployment Steps

### Step 1: Configure Environment

```bash
cd /home/teacherchris37/soccer-souls/contracts

# Copy environment template
cp .env.example .env

# Edit with your keys
nano .env
```

**Required:**
```
PRIVATE_KEY=your_wallet_private_key_here
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key_here
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Compile Contracts

```bash
npm run compile
```

### Step 4: Deploy to Base Sepolia

```bash
npm run deploy:testnet
```

**Expected Output:**
```
🚀 Starting Soccer Souls NFT Deployment...

📋 Deployment Account: 0x...
💰 Account Balance: 0.5 ETH

⚙️  Configuration:
  Royalty Recipient: 0x...
  Data Oracle: 0x...
  URI: https://api.soccersouls.xyz/metadata/

📄 Deploying SoccerSoulsNFT...
✅ Deployed to: 0x1234...
📊 Tx Hash: 0xabcd...
⛽ Gas: 3500000

⏳ Waiting for confirmations...
✅ Confirmed

🔍 Verifying...
✅ Verified

💾 Saved to deployments/

🎉 Deployment Complete!
```

### Step 5: Mint Test NFTs

```bash
npm run mint:test
```

### Step 6: Update Live Stats

```bash
npm run update:stats
```

---

## 🖥️ VM-Based Agent Infrastructure

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VM AGENT FLEET                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Agent VM 1 │  │  Agent VM 2 │  │  Agent VM N │         │
│  │  (Droplet)  │  │  (Droplet)  │  │  (Droplet)  │         │
│  │  $6/month   │  │  $6/month   │  │  $6/month   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                   ┌──────▼──────┐                          │
│                   │   Redis     │                          │
│                   │   Cache     │                          │
│                   └──────┬──────┘                          │
│                          │                                  │
│                   ┌──────▼──────┐                          │
│                   │  Monitor    │                          │
│                   │  Service    │                          │
│                   └─────────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Provision VMs

```bash
# Using DigitalOcean (cheapest)
cd /home/teacherchris37/soccer-souls/infrastructure

# Set API key
export DO_API_KEY=your_digitalocean_token

# Provision VM
python3 vm-agent-manager.py provision \
  --provider digitalocean \
  --region nyc1 \
  --name soccer-souls-agent-001
```

### Deploy Agent to VM

```bash
# Configure agent
python3 vm-agent-manager.py add-agent \
  --agent-id souls_agent_001 \
  --vm-ip 192.168.1.100 \
  --wallet 0x... \
  --strategy balanced

# Deploy
python3 vm-agent-manager.py deploy souls_agent_001

# Start
python3 vm-agent-manager.py start souls_agent_001
```

### Monitor Fleet

```bash
# Start monitoring service
python3 monitoring/agent-monitor.py

# View dashboard
curl http://localhost:8080/api/stats
```

---

## 📊 Contract Features

### Dynamic NFTs

```solidity
// Real-time stats update
function updateLiveStats(
    uint256 tokenId,
    LiveStats memory newStats
) external onlyAuthorizedUpdater;

// Live stats include:
// - Distance covered (meters)
// - Sprints count
// - Top speed (km/h)
// - Fatigue level (0-100)
// - Goals, assists, passes
```

### Agent Integration

```solidity
// Enable AI agent for NFT
function enableAgent(
    uint256 tokenId,
    address agentWallet
) external;

// Agent can:
// - Trade on prediction markets
// - Manage portfolio
// - Earn revenue
```

### Rarity System

| Rarity | Supply | Price | Boost |
|--------|--------|-------|-------|
| Common | 5,000 | 0.01 ETH | 1x |
| Rare | 2,000 | 0.05 ETH | 2.5x |
| Epic | 500 | 0.2 ETH | 6x |
| Legendary | 100 | 1.0 ETH | 15x |

---

## 💰 Revenue Distribution

### Smart Contract

```solidity
// 5% royalty on secondary sales
// Distributed:
// - 50% to original minter
// - 30% to platform treasury
// - 20% to staking rewards
```

### Agent Revenue

```
Prediction Arbitrage Profit:
├── 60% to NFT Holder
├── 20% to Platform
├── 15% to Staking Pool
└── 5% to Agent Operator
```

---

## 🔐 Security

### Access Control

```solidity
// Only authorized oracles can update stats
function setAuthorizedUpdater(address updater, bool authorized) 
    external onlyOwner;

// Only minters can mint
function setAuthorizedMinter(address minter, bool authorized)
    external onlyOwner;
```

### Emergency Functions

```solidity
// Pause contract in emergency
function pause() external onlyOwner;

// Unpause when safe
function unpause() external onlyOwner;
```

---

## 📈 Monitoring

### Key Metrics

| Metric | Target | Alert If |
|--------|--------|----------|
| Agent Uptime | 99.9% | < 99% |
| Trade Latency | < 500ms | > 1s |
| Daily Profit | > $10 | < $0 |
| Gas Price | < 50 gwei | > 100 gwei |

### Alert Channels

- **Telegram**: Real-time notifications
- **Webhook**: Integration with PagerDuty
- **Dashboard**: http://localhost:8080

---

## 🚀 Production Checklist

### Pre-Launch

- [ ] Contracts audited
- [ ] Testnet thoroughly tested
- [ ] VM fleet provisioned
- [ ] Monitoring configured
- [ ] Alerts tested
- [ ] Backup strategy in place

### Launch

- [ ] Deploy to Base mainnet
- [ ] Verify contracts
- [ ] Initialize oracle service
- [ ] Start agent fleet
- [ ] Open minting

### Post-Launch

- [ ] Monitor first 24h
- [ ] Check all alerts
- [ ] Verify revenue distribution
- [ ] Scale VMs if needed

---

## 💡 Next Steps

1. **Test Deployment**: Run on Base Sepolia
2. **Audit**: Get professional audit
3. **Provision VMs**: Set up agent fleet
4. **Launch**: Deploy to Base mainnet
5. **Scale**: Add more agents as needed

---

## 📞 Support

- **Contract Issues**: Check BaseScan
- **Agent Issues**: Check logs in `~/soccer-souls-agent/agent.log`
- **Monitoring**: http://vm-ip:8080/metrics

---

**Ready to deploy?** Run: `npm run deploy:testnet` ⚽🚀
