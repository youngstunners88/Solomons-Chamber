# 🤖 $GOALS Deployment Bots

Automated bots to streamline the Base Sepolia testnet deployment process.

## Quick Start

```bash
# Option 1: One-click monitor + auto-deploy (recommended)
npm run bot:monitor    # Opens faucets, monitors balance, alerts when ready
npm run deploy         # Deploy when funded

# Option 2: Fully automated (monitors and deploys when funded)
npm run bot:deploy

# Option 3: Both in sequence
npm run bot:fund-and-deploy
```

---

## 🚰 Faucet Monitor (`faucet-monitor.js`)

Monitors your wallet balance and helps you get test ETH from faucets.

### Features
- 🎯 Shows your wallet address for easy copying
- 🌐 Automatically opens Coinbase faucet in browser
- ⏱️ Real-time balance monitoring (updates every 10 seconds)
- 📊 Visual progress bar toward funding goal
- 🔔 Sound alert when funds arrive
- 💰 Detects balance increases automatically

### Usage

```bash
npm run bot:monitor
# or
node scripts/faucet-monitor.js
```

### What it does
1. Displays your wallet address
2. Opens the Coinbase Base Sepolia faucet
3. Monitors balance every 10 seconds
4. Shows progress bar toward 0.01 ETH minimum
5. Beeps and shows success message when funded
6. Tells you next steps

---

## 🚀 Auto-Deploy Bot (`auto-deploy-bot.js`)

Fully automated bot that monitors balance and deploys when ready.

### Features
- 🔄 Continuous balance monitoring
- ⏳ Waits for test ETH automatically
- 🚀 Auto-deploys contract when funded
- 🎨 Mints test NFTs after deployment
- 💾 Saves deployment info
- 🔔 Optional Telegram notifications
- 🔄 Retry logic on failure

### Usage

```bash
npm run bot:deploy
# or
node scripts/auto-deploy-bot.js
```

### What it does
1. Loads wallet from `.env`
2. Checks balance every 30 seconds
3. Shows faucet URLs if balance is low
4. Auto-deploys when balance >= 0.01 ETH
5. Mints 4 test NFTs (Messi, Ronaldo, Bellingham, Camavinga)
6. Saves deployment to `deployments/baseSepolia-deployment.json`
7. Shows final summary with links

### Environment Variables

Create `.env` file:
```bash
PRIVATE_KEY=your_private_key_here

# Optional: Telegram notifications
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

---

## 📋 Available Faucets

| Faucet | Amount | Cooldown | Link |
|--------|--------|----------|------|
| Coinbase | 0.1 ETH | 24 hours | [Visit](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet) |
| Alchemy | 0.5 ETH | 1 day | [Visit](https://sepoliafaucet.com/) |
| QuickNode | 0.05 ETH | 12 hours | [Visit](https://faucet.quicknode.com/ethereum/sepolia) |
| Infura | 0.5 ETH | 1 day | [Visit](https://www.infura.io/faucet/sepolia) |
| Google Cloud | 0.05 ETH | 24 hours | [Visit](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) |

---

## 🎯 Deployment Checklist

- [ ] Wallet created with private key in `.env`
- [ ] Get test ETH from Coinbase faucet
- [ ] Run `npm run bot:monitor` to verify funding
- [ ] Run `npm run deploy` to deploy contract
- [ ] Check deployment on [BaseScan](https://sepolia.basescan.org)

---

## 🔧 Troubleshooting

### "Insufficient balance"
- Wait for faucet transaction to confirm (can take 1-2 minutes)
- Try multiple faucets
- Check balance on [BaseScan](https://sepolia.basescan.org)

### "PRIVATE_KEY not configured"
- Make sure `.env` file exists in `/contracts` directory
- Verify `PRIVATE_KEY=your_key_here` format

### "Connection refused"
- Check internet connection
- Base Sepolia RPC might be down, try again

---

## 📁 Output Files

| File | Description |
|------|-------------|
| `deployments/baseSepolia-deployment.json` | Contract address, tx hash, timestamps |
| `bot-deployment.log` | Full deployment logs |

---

**⚽ Every goal tells a story!**
