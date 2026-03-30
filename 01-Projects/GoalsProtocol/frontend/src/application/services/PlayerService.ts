/**
 * ═══════════════════════════════════════════════════════════════
 * APPLICATION - PLAYER SERVICE
 * ═══════════════════════════════════════════════════════════════
 */

import type { Player } from '../../domain/entities/Player.ts';
import type { Repository } from '../ports/Repository.port.ts';

export class PlayerService {
  constructor(private playerRepository: Repository<Player>) {}

  async getPlayer(id: string): Promise<Player | null> {
    return this.playerRepository.findById(id);
  }

  async getAllPlayers(): Promise<ReadonlyArray<Player>> {
    return this.playerRepository.findAll();
  }

  async updatePlayerStats(
    id: string,
    updates: Partial<Pick<Player, 'goals' | 'assists' | 'matchesPlayed'>>
  ): Promise<void> {
    const player = await this.playerRepository.findById(id);
    if (!player) {
      throw new Error(`Player not found: ${id}`);
    }

    const updatedPlayer: Player = {
      ...player,
      ...updates,
    };

    await this.playerRepository.save(updatedPlayer);
  }
}
