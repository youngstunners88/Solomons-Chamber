---
name: colosseum-trader
description: Trading automation and blockchain code generation for Solana, Ethereum, and DeFi protocols. Use when Kimi needs to create trading bots, smart contracts, wallet integrations, or analyze on-chain data. Supports Solana (Rust/Anchor), Ethereum (Solidity/Foundry), and Python trading frameworks.
---

# Colosseum Trader Skill

Blockchain trading automation and smart contract development.

## Purpose

Build production-ready trading systems and blockchain code:
- Trading bots for DEXs (Jupiter, Uniswap, Raydium)
- Smart contracts (Solana/Rust, Ethereum/Solidity)
- Wallet integrations and transaction automation
- On-chain data analysis and monitoring
- MEV strategies and arbitrage bots

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    COLOSSEUM TRADER                         │
├─────────────────────────────────────────────────────────────┤
│  Trading Layer          │  Blockchain Layer                 │
│  ├── Jupiter (Solana)   │  ├── Solana (Rust/Anchor)         │
│  ├── Raydium (Solana)   │  ├── Ethereum (Solidity)          │
│  ├── Uniswap (EVM)      │  ├── Cross-chain bridges          │
│  └── Python backtesting │  └── Wallet management            │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Set Up Environment

```bash
# Copy environment template
cp ~/skills/colosseum-trader/config/.env.example ~/skills/colosseum-trader/config/.env

# Edit with your API keys
nano ~/skills/colosseum-trader/config/.env
```

### 2. Generate Trading Bot

```bash
# Solana Jupiter arbitrage bot
python3 ~/skills/colosseum-trader/scripts/generate_bot.py \
  --chain solana \
  --strategy arbitrage \
  --dex jupiter \
  --output ./my_bot/

# Ethereum MEV bot
python3 ~/skills/colosseum-trader/scripts/generate_bot.py \
  --chain ethereum \
  --strategy mev \
  --output ./mev_bot/
```

### 3. Generate Smart Contract

```bash
# Solana Anchor program
python3 ~/skills/colosseum-trader/scripts/generate_contract.py \
  --chain solana \
  --type token \
  --name MyToken \
  --output ./contracts/

# Ethereum Solidity contract
python3 ~/skills/colosseum-trader/scripts/generate_contract.py \
  --chain ethereum \
  --type defi \
  --name LendingPool \
  --output ./contracts/
```

## Supported Chains

| Chain | Language | Primary DEX | Best For |
|-------|----------|-------------|----------|
| **Solana** | Rust/Anchor | Jupiter, Raydium | High throughput, low fees |
| **Ethereum** | Solidity/Foundry | Uniswap, Curve | Deep liquidity, MEV |
| **Base** | Solidity | Aerodrome | L2 scaling, Coinbase |
| **Arbitrum** | Solidity | Camelot | L2 DeFi, gaming |
| **BNB Chain** | Solidity | PancakeSwap | Asian markets, volume |

## Trading Strategies

### Implemented Templates

| Strategy | Description | Risk Level |
|----------|-------------|------------|
| **Arbitrage** | Cross-DEX price arbitrage | Low |
| **MEV** | Sandwich, frontrun protection | High |
| **Grid Trading** | Range-bound buy/sell | Medium |
| **TWAP** | Time-weighted average price | Low |
| **Copy Trading** | Mirror whale wallets | Variable |
| **Liquidity Mining** | Yield farming automation | Medium |

### Generate Strategy

```bash
python3 ~/skills/colosseum-trader/scripts/generate_strategy.py \
  --name "MyArbStrategy" \
  --type arbitrage \
  --pairs "SOL/USDC,USDC/USDT" \
  --min-profit 0.1 \
  --output ./strategies/
```

## Smart Contract Templates

### Solana (Anchor)

```bash
# Generate Anchor program
python3 ~/skills/colosseum-trader/scripts/generate_anchor.py \
  --type token          # token | nft | defi | dao | escrow \
  --name MyProgram \
  --features "mint,burn,transfer" \
  --output ./anchor-project/
```

### Ethereum (Foundry)

```bash
# Generate Foundry project
python3 ~/skills/colosseum-trader/scripts/generate_foundry.py \
  --type defi           # token | nft | defi | dao | vesting \
  --name MyContract \
  --erc "20,721"        # ERC standards to implement \
  --output ./foundry-project/
```

## Wallet Integration

### Key Management (Secure)

```python
from skills.colosseum_trader.wallet import SecureWallet

# Load from environment (NEVER hardcode)
wallet = SecureWallet.from_env("TRADING_WALLET_PRIVATE_KEY")

# Or from encrypted keystore
wallet = SecureWallet.from_keystore("./keys/trading.json", password)
```

### Transaction Builder

```python
from skills.colosseum_trader.transaction import TransactionBuilder

# Build Solana transaction
tx = TransactionBuilder.solana(
    instructions=[swap_ix],
    payer=wallet.public_key,
    priority_fee=10000  # microLamports
)

# Build Ethereum transaction
tx = TransactionBuilder.ethereum(
    to=contract_address,
    data=calldata,
    gas_limit=300000,
    max_fee_per_gas=50  # gwei
)
```

## API Integrations

### Required Environment Variables

```bash
# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
JUPITER_API_KEY=your_key_here

# Ethereum
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=your_key_here

# Trading
COINMARKETCAP_API_KEY=your_key_here
COINGECKO_API_KEY=your_key_here

# Data
THE_GRAPH_API_KEY=your_key_here
DUNE_API_KEY=your_key_here
```

### Load Securely

```python
from skills.colosseum_trader.config import load_config

config = load_config()
# Keys are never logged or displayed
jupiter_api = config.jupiter_api_key
```

## On-Chain Data Analysis

### Account Monitoring

```bash
# Monitor whale wallets
python3 ~/skills/colosseum-trader/scripts/monitor_wallets.py \
  --wallets "7nY7H..." \
  --threshold 10000 \
  --callback ./alert.sh

# Track token flows
python3 ~/skills/colosseum-trader/scripts/analyze_flows.py \
  --token EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --hours 24
```

### Market Data

```python
from skills.colosseum_trader.data import MarketData

# Fetch orderbook
orderbook = MarketData.jupiter_orderbook("SOL-USDC")

# Get historical prices
prices = MarketData.ohlcv(
    pair="SOL/USDC",
    timeframe="1h",
    limit=1000
)
```

## Security Best Practices

### 1. Never Commit Keys

```bash
# .gitignore
colosseum-trader/config/.env
*.key
*.pem
keystore/
```

### 2. Use Environment Variables

```python
import os

# Good
api_key = os.getenv("JUPITER_API_KEY")

# Bad (never do this)
api_key = "hardcoded-secret-key"
```

### 3. Encrypt Private Keys

```bash
# Encrypt wallet key
python3 ~/skills/colosseum-trader/scripts/encrypt_key.py \
  --input ./raw_key.txt \
  --output ./keystore/trading.enc

# Load encrypted key
python3 ~/skills/colosseum-trader/scripts/decrypt_key.py \
  --input ./keystore/trading.enc
```

### 4. Simulate Before Execute

```bash
# Dry run transaction
python3 ~/skills/colosseum-trader/scripts/simulate_tx.py \
  --tx ./transaction.json \
  --network devnet

# Only then execute
python3 ~/skills/colosseum-trader/scripts/execute_tx.py \
  --tx ./transaction.json \
  --network mainnet
```

## Testing

### Local Testing

```bash
# Start local validator
solana-test-validator

# Deploy test contracts
anchor deploy --provider.cluster localnet

# Run tests
anchor test
```

### Fork Testing

```bash
# Test against mainnet fork
python3 ~/skills/colosseum-trader/scripts/fork_test.py \
  --strategy ./my_strategy.py \
  --block 150000000 \
  --duration 1000
```

## Deployment

### Solana

```bash
# Build
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Verify on SolanaFM
python3 ~/skills/colosseum-trader/scripts/verify_solana.py \
  --program YourProgramID
```

### Ethereum

```bash
# Build
forge build

# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url goerli --broadcast

# Verify on Etherscan
forge verify-contract --chain goerli YourContractAddress MyContract
```

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `generate_bot.py` | Create trading bot | `--chain solana --strategy arbitrage` |
| `generate_contract.py` | Create smart contract | `--chain ethereum --type defi` |
| `generate_strategy.py` | Create strategy template | `--type grid --pairs SOL/USDC` |
| `monitor_wallets.py` | Track whale wallets | `--wallets addr1,addr2` |
| `analyze_flows.py` | Token flow analysis | `--token MINT --hours 24` |
| `simulate_tx.py` | Dry run transactions | `--tx file.json` |
| `encrypt_key.py` | Encrypt private keys | `--input raw --output enc` |
| `fork_test.py` | Test on mainnet fork | `--strategy file.py` |

## Resources

- Solana Anchor: https://book.anchor-lang.com/
- Ethereum Foundry: https://book.getfoundry.sh/
- Jupiter Docs: https://station.jup.ag/
- Uniswap V3: https://docs.uniswap.org/
- OpenZeppelin: https://docs.openzeppelin.com/

## License

MIT - Use at your own risk. Trading involves significant financial risk.
