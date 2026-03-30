# 🤖 AGENT_LEARNINGS.md

> **Continuous improvement through self-reflection and pattern recognition.**
> 
> *This document is updated whenever mistakes are made, patterns emerge, or better approaches are discovered.*

---

## 📅 Recent Learnings

### 2026-03-29: Faucet Automation Challenges

**Mistake:**
Assumed that browser automation could bypass modern CAPTCHA systems (reCAPTCHA, Cloudflare Turnstile) without human intervention or existing authenticated sessions.

**What Happened:**
- Built a sophisticated Playwright-based agent
- Discovered all major faucets require:
  - Coinbase: Account login + wallet connection
  - QuickNode: Mainnet ETH balance proof (anti-sybil)
  - Alchemy/Infura: Signup + reCAPTCHA
  - Google Cloud: Google account + reCAPTCHA

**Lesson:**
Modern anti-bot protections are specifically designed to block automation. Faucet automation requires either:
1. Existing authenticated browser session (CDP/profile)
2. CAPTCHA-solving service integration (2captcha, Anti-Captcha)
3. Alternative funding strategies (bridging, PoW mining)

**Better Approach:**
- Check for authenticated sessions first via CDP
- Implement human-in-the-loop for CAPTCHA challenges
- Document manual fallback procedures clearly
- Consider testnet bridging as alternative to faucets

---

### 2026-03-29: Hardhat Dependency Hell

**Mistake:**
Didn't verify dependency compatibility before running deployment scripts. Spent time debugging cryptic errors when the real issue was version mismatches.

**What Happened:**
- `hardhat-toolbox` required specific versions of peer dependencies
- `@nomicfoundation/hardhat-chai-matchers@latest` broke with Hardhat 2.x
- Missing `@nomicfoundation/hardhat-ethers` caused runtime errors
- ESM vs CommonJS conflicts in package.json

**Lesson:**
Always check peer dependency requirements before installing. The error messages in the Node.js ecosystem are often misleading.

**Better Approach:**
```bash
# Check before installing
npm ls --depth=0
npm audit

# Install compatible versions
npm install --legacy-peer-deps

# Verify compilation before deployment
npx hardhat compile
```

---

### 2026-03-29: Browser Binary Dependencies

**Mistake:**
Assumed Playwright installation would handle all system dependencies automatically.

**What Happened:**
- `playwright install chromium` downloaded browser
- Missing system libraries: `libnspr4.so`, `libnss3`, etc.
- Had to run `playwright install-deps chromium` separately

**Lesson:**
Playwright has two-step installation: browser binaries + system dependencies. Headless environments (CI/CD, containers) often need explicit dependency installation.

**Better Approach:**
```bash
# Full installation for Ubuntu/Debian
playwright install chromium
playwright install-deps chromium

# Or use Docker image with deps pre-installed
mcr.microsoft.com/playwright:v1.40.0-jammy
```

---

## 🔴 Anti-Patterns to Avoid

### 1. Assuming Web Services Have Public APIs

**Don't:** Try to reverse-engineer APIs that don't exist
**Do:** Check for official APIs first, then use browser automation with proper expectations

### 2. Ignoring Dependency Warnings

**Don't:** Skip over peer dependency warnings
**Do:** Treat them as errors until resolved

### 3. Long-Running Operations Without Cancellation

**Don't:** Fire-and-forget async operations
**Do:** Always provide cancellation mechanisms (AbortSignal, timeouts)

### 4. Hardcoding Configuration

**Don't:** Embed RPC URLs, contract addresses, or API keys in code
**Do:** Use environment variables with sensible defaults

### 5. Over-Engineering Solutions

**Don't:** Build complex systems when simple solutions exist
**Do:** Start with manual processes, automate incrementally

---

## ✅ Better Approaches

### Effect System for Async Operations

**Instead of:**
```typescript
const data = await fetchData(); // No cancellation, no retry
```

**Use:**
```typescript
const fetchEffect = createEffect('fetchData', async (params, { abortSignal }) => {
  return await fetchData(params, { signal: abortSignal });
}, { retries: 3, timeoutMs: 10000 });
```

### Clean Architecture Layer Enforcement

**Instead of:** Allowing any imports anywhere

**Use:** Automated checking with `npm run arch:check`

### Dependency Injection Over Global State

**Instead of:**
```typescript
import { api } from './api';
```

**Use:**
```typescript
const api = container.resolve<HttpPort>('http');
```

---

## 🧠 Mental Models

### The "Swiss Cheese" Security Model

Security measures (CAPTCHAs, rate limits, proof-of-humanity) are like slices of Swiss cheese — they have holes, but when layered together, they block most automated attacks. Don't expect to punch through multiple layers easily.

### The "Dependency Iceberg"

What you see (package.json) is just the tip. Below the surface: peer dependencies, transitive dependencies, binary dependencies, system libraries. Always budget time for dependency troubleshooting.

### The "Faucet Paradox"

Testnet ETH is free but valuable. Services protect it aggressively because:
- It's used for airdrop farming
- It's used to spam/test attack vectors
- It has scarcity (rate limits)

Treat testnet funding as a potential blocker, not a given.

---

## 🛠️ Tool-Specific Learnings

### Playwright
- Use `--headed` for debugging, headless for production
- Screenshots are invaluable for understanding failures
- `waitForSelector` is more reliable than arbitrary delays
- CDP connection preserves cookies/authentication

### Hardhat
- `viaIR: true` in config for gas optimization
- Always test locally before testnet
- Keep deployment scripts idempotent
- Use `verify` task for contract verification

### Vite
- Proxy configuration for API calls during dev
- `optimizeDeps` for large libraries
- TypeScript path mapping needs `tsconfig.json` + `vite.config.ts` sync

---

## 📚 Patterns That Work

### Pattern: Progressive Enhancement

1. Build working manual process
2. Add automation for the easy parts
3. Keep human-in-the-loop for complex parts
4. Gradually automate more as patterns emerge

### Pattern: Defensive Programming

```typescript
const result = await operation().catch(err => {
  logger.error('Operation failed', { error: err.message });
  return fallbackValue;
});
```

### Pattern: Observable State

```typescript
effect.subscribe(result => {
  if (result.status === 'failure') {
    notifyUser(result.error);
  }
});
```

---

## 🎯 Goals for Improvement

1. **Faster Debugging** - Improve error message parsing and root cause identification
2. **Better Tool Integration** - Learn to leverage existing tools more effectively
3. **Documentation Hygiene** - Keep ARCHITECTURE.md and LEARNINGS.md in sync
4. **Test Coverage** - Add more unit tests for core systems
5. **Performance** - Profile and optimize hot paths

---

*Last Updated: 2026-03-29*
*Agent: Kimi Code CLI*
*Project: $GOALS Protocol*
