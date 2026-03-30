/**
 * ═══════════════════════════════════════════════════════════════
 * APPLICATION - MINT PLAYER USE CASE
 * ═══════════════════════════════════════════════════════════════
 */

import { createPlayer } from '../../domain/entities/Player.ts';
import { Address } from '../../domain/valueObjects/Address.ts';
import { eventBus } from '../../domain/events/DomainEvent.ts';
import {
  validatePlayerName,
  combineValidations,
  validateStat,
} from '../../domain/services/ValidationService.ts';
import type { MintPlayerDTO } from '../dto/MintPlayerDTO.ts';
import type { BlockchainPort } from '../../core/abstraction/ports/blockchain.port.ts';
import type { LoggerPort } from '../../core/abstraction/ports/logger.port.ts';

export interface MintPlayerResult {
  readonly success: boolean;
  readonly tokenId?: string;
  readonly transactionHash?: string;
  readonly errors?: string[];
}

export class MintPlayerUseCase {
  constructor(
    private blockchain: BlockchainPort,
    private logger: LoggerPort,
    private contractAddress: string
  ) {}

  async execute(dto: MintPlayerDTO, ownerAddress: string): Promise<MintPlayerResult> {
    this.logger.info('Executing MintPlayer use case', { name: dto.name, owner: ownerAddress });

    // Validation
    const validation = combineValidations(
      validatePlayerName(dto.name),
      validateStat('Pace', dto.stats.pace),
      validateStat('Shooting', dto.stats.shooting),
      validateStat('Passing', dto.stats.passing),
      validateStat('Dribbling', dto.stats.dribbling),
      validateStat('Defense', dto.stats.defense),
      validateStat('Physical', dto.stats.physical)
    );

    if (!validation.isValid) {
      this.logger.warn('MintPlayer validation failed', { errors: validation.errors });
      return { success: false, errors: validation.errors as string[] };
    }

    try {
      const owner = new Address(ownerAddress);
      const player = createPlayer(
        'pending',
        dto.name,
        dto.position,
        dto.rarity,
        dto.stats,
        owner
      );

      // In a real implementation, this would call the smart contract
      // For now, we simulate the blockchain interaction
      const accounts = await this.blockchain.getAccounts();
      if (accounts.length === 0) {
        return { success: false, errors: ['No connected wallet'] };
      }

      // Emit domain event
      eventBus.publish({
        type: 'PLAYER_MINTED',
        payload: { player, dto },
        occurredAt: new Date(),
        aggregateId: player.id,
      });

      this.logger.info('MintPlayer succeeded', { playerId: player.id });

      return {
        success: true,
        tokenId: player.id,
        transactionHash: '0x' + Math.random().toString(16).slice(2),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('MintPlayer failed', { error: message });
      return { success: false, errors: [message] };
    }
  }
}
