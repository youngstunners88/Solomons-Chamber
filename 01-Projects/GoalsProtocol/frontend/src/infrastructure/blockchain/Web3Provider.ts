/**
 * ═══════════════════════════════════════════════════════════════
 * INFRASTRUCTURE - WEB3 PROVIDER
 * ═══════════════════════════════════════════════════════════════
 */

import { EthersBlockchainAdapter } from '../../core/abstraction/adapters/blockchain.adapter.ts';

export const web3Provider = new EthersBlockchainAdapter();
