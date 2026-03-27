# Secure API Key Management Guide

## The Golden Rule

> **NEVER commit API keys, private keys, or secrets to git.**

## Quick Start (Safe Formula)

### Step 1: Create .env File

```bash
# Copy the template
cp ~/skills/colosseum-trader/config/.env.example ~/skills/colosseum-trader/config/.env

# Set strict permissions (only you can read)
chmod 600 ~/skills/colosseum-trader/config/.env
```

### Step 2: Add Your Keys

```bash
# Edit the file
nano ~/skills/colosseum-trader/config/.env

# Add your keys (example):
JUPITER_API_KEY=your_actual_key_here
SOLANA_TRADING_WALLET_PRIVATE_KEY=your_private_key_here
```

### Step 3: Verify .gitignore

```bash
# Check .gitignore exists
cat ~/skills/colosseum-trader/.gitignore

# Should contain:
# config/.env
# *.key
# *.pem
# keystore/
```

### Step 4: Load in Code

```python
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv('~/skills/colosseum-trader/config/.env')

# Access keys (safe - never printed)
api_key = os.getenv('JUPITER_API_KEY')
```

## The Complete Safe Formula

```bash
# 1. Create secure .env
touch ~/skills/colosseum-trader/config/.env
chmod 600 ~/skills/colosseum-trader/config/.env

# 2. Add to .gitignore
echo "config/.env" >> ~/skills/colosseum-trader/.gitignore
echo "*.key" >> ~/skills/colosseum-trader/.gitignore
echo "keystore/" >> ~/skills/colosseum-trader/.gitignore

# 3. Never log keys
# Good:
logger.info("API request to Jupiter")
# Bad:
logger.info(f"Using API key: {api_key}")  # NEVER DO THIS

# 4. Use environment loader
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv('~/skills/colosseum-trader/config/.env')
print('JUPITER_API_KEY is set:', 'JUPITER_API_KEY' in os.environ)
"
```

## Security Levels

### Level 1: Basic (Development)

```bash
# .env file only
# Pros: Simple, fast
# Cons: Keys in plaintext on disk

# Setup:
echo "API_KEY=secret" > .env
```

### Level 2: Encrypted Keys (Recommended)

```bash
# Encrypt private keys with passphrase
# Pros: Keys encrypted at rest
# Cons: Need password to unlock

# Setup:
python3 ~/skills/colosseum-trader/scripts/encrypt_key.py \
  --input ./raw_key.txt \
  --output ./keystore/trading.enc

# Usage:
python3 ~/skills/colosseum-trader/scripts/decrypt_key.py \
  --input ./keystore/trading.enc \
  --password "$KEY_PASSWORD"
```

### Level 3: Hardware Wallet (Production)

```bash
# Use hardware wallet (Ledger, Trezor)
# Pros: Keys never leave device
# Cons: Manual approval required

# Setup:
# 1. Connect Ledger
# 2. Export public key only
# 3. Use wallet provider for signing
```

## Private Key Formats

### Solana

```bash
# Base58 encoded (64-88 characters)
5Kb8kLf9zgWQnogidDA76MzPL6TsZZY36hWXMssSzNydYXYBzKFQZrAD2LfDwJBJ9KA

# Store in .env:
SOLANA_TRADING_WALLET_PRIVATE_KEY=5Kb8kLf9zgWQnogidDA76MzPL6TsZZY36hWXMssSzNydYXYBzKFQZrAD2LfDwJBJ9KA
```

### Ethereum

```bash
# Hex encoded (64 characters, optional 0x prefix)
4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318

# Store in .env:
ETHEREUM_TRADING_WALLET_PRIVATE_KEY=0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318
```

## What NOT To Do

### ❌ NEVER Do This

```python
# Hardcoded keys
API_KEY = "sk_live_1234567890abcdef"

# Print keys in logs
print(f"Using key: {private_key}")

# Commit .env to git
git add .env && git commit -m "add config"

# Send keys over Slack/Discord
"Hey, here's my key: sk_live_..."

# Store keys in plain text files
with open('keys.txt', 'w') as f:
    f.write(private_key)
```

### ✅ ALWAYS Do This

```python
# Load from environment
import os
API_KEY = os.getenv('API_KEY')

# Log safely
logger.info("Making API request")  # No key in log

# Encrypt before storage
encrypted = encrypt(private_key, password)

# Use key management service
from aws_secretsmanager import get_secret
API_KEY = get_secret('trading-api-key')
```

## Key Rotation

### When to Rotate

- Every 90 days (scheduled)
- Immediately if:
  - Key accidentally committed to git
  - Key logged in plaintext
  - Former employee had access
  - Suspicious activity detected

### How to Rotate

```bash
# 1. Generate new key
# 2. Update .env with new key
# 3. Test new key works
# 4. Revoke old key in provider dashboard
# 5. Delete old key from all locations
# 6. Commit .env.template (never the actual .env)
```

## Emergency Response

### If Key is Leaked

```bash
# 1. REVOKE IMMEDIATELY
# Log into provider dashboard and revoke the key

# 2. Check usage logs
# Look for unauthorized transactions

# 3. Rotate all keys
# Even if only one leaked, rotate all related keys

# 4. Audit access
# Check git history: git log --all --full-history -- .env

# 5. Clean git history (if committed)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all
```

## Multi-Environment Setup

```
config/
├── .env.development      # Dev keys (testnet)
├── .env.staging          # Staging keys (testnet)
├── .env.production       # Production keys (mainnet) - encrypted
└── .env.example          # Template (committed to git)
```

### Loading Right Environment

```python
import os
from dotenv import load_dotenv

env = os.getenv('ENVIRONMENT', 'development')
env_file = f'config/.env.{env}'

load_dotenv(env_file)

# Keys are now loaded based on environment
```

## Provider-Specific Instructions

### Helius (Solana RPC)

```bash
# 1. Sign up at helius.xyz
# 2. Create API key
# 3. Add to .env:
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY_HERE
```

### Alchemy (Ethereum RPC)

```bash
# 1. Sign up at alchemy.com
# 2. Create app, get API key
# 3. Add to .env:
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY_HERE
```

### Jupiter (DEX Aggregator)

```bash
# 1. Sign up at station.jup.ag
# 2. Get API key
# 3. Add to .env:
JUPITER_API_KEY=your_key_here
```

### Dune Analytics

```bash
# 1. Sign up at dune.com
# 2. Create API key in settings
# 3. Add to .env:
DUNE_API_KEY=your_key_here
```

## Verification Checklist

Before running any trading code:

- [ ] .env exists and is in .gitignore
- [ ] .env permissions are 600 (owner read/write only)
- [ ] No keys are hardcoded in source files
- [ ] No keys are printed in logs
- [ ] Using testnet for development
- [ ] Trading wallet has minimal funds
- [ ] Emergency stop mechanism configured
- [ ] Alerts configured for large transactions

## Need Help?

If you've accidentally committed keys:

1. **Don't panic**
2. Revoke the key immediately in provider dashboard
3. Rotate to a new key
4. Clean git history if needed
5. Learn from it and implement better practices

Remember: **Everyone makes mistakes. Fast response matters more than perfection.**
