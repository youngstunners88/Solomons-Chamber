# StoryChain Web3 Architecture — Research Notes

**Date:** 2026-03-27

## The Core Idea

StoryChain is not just a storytelling platform — it's a **decentralized creative IP economy**. Stories are on-chain assets with fractional ownership. Agents are staked economic actors with skin in the game. Readers and investors are DAO members with governance rights.

Think: **Wattpad × Mirror.xyz × Fetch.ai**

---

## Chain Selection

### Solana
- High throughput, sub-cent fees
- Best for: frequent micro-transactions (per-segment votes, NFT mints, royalty distributions)
- NFT standard: Metaplex (compressed NFTs for scale)
- Wallet: Phantom

### Celo
- Mobile-first EVM chain, stable fees
- Best for: staking mechanics, DAO governance, agent economic layer
- EVM-compatible (Solidity smart contracts)
- Wallet: Valora, MetaMask

---

## Token / Economic Model Sketch

**$STORY token (Celo)** — governance + staking
- Writers and agents stake $STORY to participate
- Quality gate score feeds staking health
- DAO votes weighted by $STORY holdings

**Story NFTs (Solana)** — fractional IP ownership
- Minted on story completion (Metaplex)
- Fractions distributed to contributors weighted by: (quality score × segment count) / total story quality
- Cover art from Pollinations.ai as NFT metadata image
- Secondary market royalties → split between all fraction holders

**Revenue flows:**
- Reader buys Library story → payment distributed to NFT holders
- Story licensed (future) → smart contract splits revenue automatically
- Agent earns staking rewards for consistent quality
- Editor earns escrow release on completion

---

## DAO Structure

**Story-level DAO:** NFT holders of a specific story vote on:
- Branching direction (which path does the story take?)
- Accepting new contributors
- Completing vs continuing

**Platform-level DAO:** $STORY holders vote on:
- Agent policies (quality thresholds, slash rates)
- Editorial standards
- New genre introductions
- Platform fee rates

---

## Voting → Already Built

The segment upvote/downvote feature (Phase 8) is the **UI layer for DAO voting**. When chain integration arrives:
- Each vote is signed by the user's wallet
- Weight = token holdings + NFT fraction
- Recorded on-chain via lightweight Solana program

This means Phase 8 can be built as pure frontend/DB (optimistic, off-chain) and then the chain layer is dropped in underneath — no UI rebuild needed.

---

## Key Insight

The quality gate scoring system already running is the **oracle** the staking smart contract will read from. Every quality score logged to `agent_errors` and the heartbeat is building the on-chain reputation dataset. Start clean, migrate to chain.

---

## References / Further Research

- Metaplex compressed NFTs (cNFTs) for cheap per-segment minting
- Mirror.xyz crowdfund model (reader investment in stories)
- Fetch.ai agent staking model (uAgents economic layer)
- Ocean Protocol (data/IP marketplace — comparable architecture)
- Zora protocol (creator royalties on-chain)
