# 🎨 $GOALS Protocol Frontend Preview

> **Live Preview of the Soccer Souls NFT Interface**

---

## 🖥️ Running Instance

```
URL: http://localhost:5173/
Status: 🟢 ONLINE
Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3 (Local)
Network: Hardhat (Local)
```

---

## 📱 UI Components Preview

### 1. Navigation Bar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [⚽] $GOALS                    Gallery  Mint  Battle  Market   [Connect]   │
│         Protocol                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Logo with gradient background
- Tab navigation (Gallery | Mint Player | Battle | Market)
- Wallet connection button
- Responsive design

---

### 2. Player Gallery Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Your Player Collection                                    4 Players        │
│  Manage and view your soccer player NFTs                                    │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │    [LEGENDARY]  │  │    [LEGENDARY]  │  │     [EPIC]      │             │
│  │                 │  │                 │  │                 │             │
│  │       94        │  │       92        │  │       88        │             │
│  │                 │  │                 │  │                 │             │
│  │  Lionel Messi   │  │ Cristiano       │  │ Kevin De Bruyne │             │
│  │                 │  │    Ronaldo      │  │                 │             │
│  │  PAC SHO PAS    │  │  PAC SHO PAS    │  │  PAC SHO PAS    │             │
│  │  85  95  91     │  │  88  93  82     │  │  76  86  94     │             │
│  │  DRI DEF PHY    │  │  DRI DEF PHY    │  │  DRI DEF PHY    │             │
│  │  96  35  65     │  │  88  35  78     │  │  88  64  78     │             │
│  │                 │  │                 │  │                 │             │
│  │ Matches: 0      │  │ Matches: 0      │  │ Matches: 0      │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Card Design:**
- **Rarity Colors:** Common (gray), Rare (blue), Epic (purple), Legendary (gold), Mythic (red)
- **Overall Rating:** Large circle with color-coded rating
- **Stats Grid:** 6 stats in 2x3 grid (PAC, SHO, PAS, DRI, DEF, PHY)
- **Hover Effect:** Card lifts with enhanced shadow
- **Glow Effect:** Border glows with rarity color

---

### 3. Mint Player Form

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Mint New Player NFT                                                        │
│                                                                             │
│  Player Name                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ e.g., Lionel Messi                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Position                               Rarity                              │
│  ┌─────────────────────┐                ┌─────────────────────┐            │
│  │ Forward     ▼       │                │ Legendary   ▼       │            │
│  └─────────────────────┘                └─────────────────────┘            │
│                                                                             │
│  Player Stats                                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐                          │
│  │ Pace         [━━━]  │  │ Shooting     [━━━]  │                          │
│  │              70     │  │              70     │                          │
│  └─────────────────────┘  └─────────────────────┘                          │
│  ┌─────────────────────┐  ┌─────────────────────┐                          │
│  │ Passing      [━━━]  │  │ Dribbling    [━━━]  │                          │
│  │              70     │  │              70     │                          │
│  └─────────────────────┘  └─────────────────────┘                          │
│  ┌─────────────────────┐  ┌─────────────────────┐                          │
│  │ Defense      [━━━]  │  │ Physical     [━━━]  │                          │
│  │              70     │  │              70     │                          │
│  └─────────────────────┘  └─────────────────────┘                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Overall Rating                                                      │   │
│  │                                                                     │   │
│  │                            70                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Mint Player NFT                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Form Features:**
- Text input for player name
- Dropdowns for position and rarity
- **Interactive sliders** for all 6 stats (0-99)
- **Live overall rating** preview (updates as you adjust stats)
- Submit button with loading state
- Form validation

---

### 4. Wallet Connection Flow

**Disconnected State:**
```
┌─────────────────┐
│  Connect Wallet │
│    [Button]     │
└─────────────────┘
```

**Connected State:**
```
┌─────────────────┐
│ 0x731b...b0c6   │
│  [Green Button] │
└─────────────────┘
```

**Connection Flow:**
1. Click "Connect Wallet"
2. MetaMask popup appears
3. User approves connection
4. Button shows truncated address
5. Click again to disconnect

---

### 5. Battle Arena (Coming Soon)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              ⚔️                                             │
│                                                                             │
│                        Battle Arena                                         │
│                                                                             │
│     Pit your players against others in strategic battles.                   │
│     Win to earn rewards and increase your players' stats.                   │
│                                                                             │
│                         ┌─────────────┐                                     │
│                         │ Coming Soon │                                     │
│                         └─────────────┘                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 6. Market (Coming Soon)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              🏪                                             │
│                                                                             │
│                         Player Market                                       │
│                                                                             │
│     Buy, sell, and trade player NFTs with other collectors.                 │
│                                                                             │
│                         ┌─────────────┐                                     │
│                         │ Coming Soon │                                     │
│                         └─────────────┘                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design System

### Colors
```css
/* Background */
--bg-primary: #0f172a;      /* Deep blue */
--bg-card: #1f2937;         /* Card background */
--bg-card-gradient: linear-gradient(135deg, #1f2937 0%, #111827 100%);

/* Rarity Colors */
--rarity-common: #9ca3af;   /* Gray */
--rarity-rare: #3b82f6;     /* Blue */
--rarity-epic: #a855f7;     /* Purple */
--rarity-legendary: #f59e0b;/* Gold */
--rarity-mythic: #ef4444;   /* Red */

/* UI Colors */
--primary: #3b82f6;         /* Primary blue */
--success: #10b981;         /* Green (connected) */
--text-primary: #ffffff;    /* White text */
--text-secondary: #9ca3af;  /* Gray text */
```

### Typography
```css
--font-heading: 800 28px/1.2 system-ui;  /* Bold headings */
--font-body: 400 14px/1.5 system-ui;     /* Body text */
--font-stats: 700 16px/1 system-ui;      /* Stat numbers */
--font-small: 600 12px/1 system-ui;      /* Labels */
```

### Spacing
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 40px;
```

---

## 🔧 Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| State | Custom Store (Zustand-style) |
| Effects | Custom Effect System |
| Styling | CSS-in-JS (inline styles) |
| Web3 | Ethers.js v6 |

---

## 🚀 Running Locally

```bash
# 1. Navigate to frontend
cd goals-protocol/frontend

# 2. Start dev server
npm run dev

# 3. Open browser
open http://localhost:5173/
```

**Requirements:**
- Node.js 18+
- MetaMask (or compatible wallet)
- Local Hardhat node (optional)

---

## 📝 Integration with Smart Contract

### Contract Configuration
```typescript
// Current: Local deployment
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const NETWORK = 'hardhat';

// For testnet (when funded):
// const CONTRACT_ADDRESS = '<deployed-address>';
// const NETWORK = 'base-sepolia';
```

### Mint Function
```typescript
const mintPlayer = async (playerData: MintPlayerDTO) => {
  const result = await mintPlayerEffect.run({
    dto: playerData,
    address: walletAddress
  });
  
  if (result.data?.success) {
    showSuccess(`Minted! Token ID: ${result.data.tokenId}`);
  }
};
```

---

## 🎯 Next Steps to Complete

### To Test Minting (Local)
1. Start Hardhat node: `npx hardhat node`
2. Deploy contract: `npm run deploy:local`
3. Connect wallet to localhost:8545
4. Mint player NFT

### To Test Minting (Testnet)
1. Get 0.01+ ETH on Base Sepolia
2. Deploy: `npm run deploy`
3. Update contract address in frontend
4. Connect wallet to Base Sepolia
5. Mint player NFT

---

*Frontend built with ❤️ using Clean Architecture principles*
*Last Updated: 2026-03-29*
