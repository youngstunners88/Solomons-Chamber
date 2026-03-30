/**
 * ═══════════════════════════════════════════════════════════════
 * DOMAIN - PLAYER ENTITY
 * ═══════════════════════════════════════════════════════════════
 */

import type { Address } from '../valueObjects/Address.ts';
import type { Stats } from '../valueObjects/Stats.ts';

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';
export type PlayerRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface Player {
  readonly id: string;
  readonly name: string;
  readonly position: PlayerPosition;
  readonly rarity: PlayerRarity;
  readonly stats: Stats;
  readonly owner: Address;
  readonly mintedAt: Date;
  readonly matchesPlayed: number;
  readonly goals: number;
  readonly assists: number;
}

export const createPlayer = (
  id: string,
  name: string,
  position: PlayerPosition,
  rarity: PlayerRarity,
  stats: Stats,
  owner: Address
): Player => ({
  id,
  name,
  position,
  rarity,
  stats,
  owner,
  mintedAt: new Date(),
  matchesPlayed: 0,
  goals: 0,
  assists: 0,
});
