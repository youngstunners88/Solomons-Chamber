/**
 * ═══════════════════════════════════════════════════════════════
 * DOMAIN - NFT ENTITY
 * ═══════════════════════════════════════════════════════════════
 */

import type { Address } from '../valueObjects/Address.ts';

export interface NFTMetadata {
  readonly name: string;
  readonly description: string;
  readonly image: string;
  readonly attributes: ReadonlyArray<{
    readonly trait_type: string;
    readonly value: string | number;
  }>;
}

export interface NFT {
  readonly tokenId: string;
  readonly contractAddress: Address;
  readonly owner: Address;
  readonly metadata: NFTMetadata;
  readonly mintedAt: Date;
}

export const createNFT = (
  tokenId: string,
  contractAddress: Address,
  owner: Address,
  metadata: NFTMetadata
): NFT => ({
  tokenId,
  contractAddress,
  owner,
  metadata,
  mintedAt: new Date(),
});
