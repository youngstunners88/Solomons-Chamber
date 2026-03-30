/**
 * ═══════════════════════════════════════════════════════════════
 * APPLICATION - MINT PLAYER DTO
 * ═══════════════════════════════════════════════════════════════
 */

import type { PlayerPosition, PlayerRarity } from '../../domain/entities/Player.ts';
import type { Stats } from '../../domain/valueObjects/Stats.ts';

export interface MintPlayerDTO {
  readonly name: string;
  readonly position: PlayerPosition;
  readonly rarity: PlayerRarity;
  readonly stats: Stats;
  readonly imageURI: string;
}
