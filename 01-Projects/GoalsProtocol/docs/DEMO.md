# 🎮 Interactive Demo

## Current Status

```
┌────────────────────────────────────────────────────────────────┐
│  🟢 Frontend Running: http://localhost:5173/                   │
│  🟡 Contract: Local Only (0x5FbD...aa3)                        │
│  🔴 Testnet: Needs 0.01 ETH (have 0.0005 ETH)                 │
└────────────────────────────────────────────────────────────────┘
```

## What You Can Do Now

### 1. View the UI
Open your browser to: **http://localhost:5173/**

You'll see:
- ✅ Responsive navigation with wallet connect
- ✅ Player gallery with mock data
- ✅ Mint form (disabled without wallet)
- ✅ Battle & Market placeholders

### 2. Connect Wallet (Local Mode)
```bash
# 1. Start Hardhat node in terminal 1
cd contracts && npx hardhat node

# 2. Import test account to MetaMask
# Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# 3. Connect to localhost:8545 in MetaMask
# Chain ID: 31337

# 4. Refresh frontend and connect wallet
```

### 3. Mint a Player (Local)
Once wallet is connected:
1. Click "Mint Player" tab
2. Fill in player name (e.g., "Test Player")
3. Select position and rarity
4. Adjust stats with sliders
5. Click "Mint Player NFT"
6. Confirm transaction in MetaMask

### 4. See Your Player
1. Go back to "Gallery" tab
2. Your newly minted player appears!
3. Click on card to see details

## Screenshots Available

See `FRONTEND_PREVIEW.md` for ASCII art of all UI components.

## To Deploy to Testnet

Need **0.01 ETH** on Base Sepolia:

```bash
# Once funded, run:
cd contracts
npm run deploy

# Then update frontend/src/App.tsx with new contract address
```

