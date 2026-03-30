# ⚽ $GOALS Protocol - Quick Start

## Location
`/home/teacherchris37/Solomons-Chamber/01-Projects/GoalsProtocol/`

## Run Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173/
```

## Deploy Contract (Local)
```bash
cd contracts
npx hardhat node
npm run deploy:local
```

## Deploy Contract (Testnet - Need 0.01 ETH)
```bash
cd contracts
npm run deploy
```

## Key Files
- `docs/README.md` - Project overview
- `docs/ARCHITECTURE.md` - Frontend design
- `docs/11_ROUNDS_AUDIT_COMPLETE.md` - Security audit
- `contracts/contracts/GoalsProtocolNFT.sol` - Smart contract
- `frontend/src/App.tsx` - React entry point

## Status
- ✅ Frontend: Complete
- ✅ Contract: Ready
- ⚠️ Testnet: Needs 0.01 ETH
- ✅ Security: Audited

## Get Testnet ETH
1. https://portal.cdp.coinbase.com/products/faucet (Coinbase)
2. https://faucet.quicknode.com/base/sepolia (QuickNode)
3. Ask someone with Sepolia ETH
