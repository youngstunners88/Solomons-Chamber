/**
 * ═══════════════════════════════════════════════════════════════
 * $GOALS PROTOCOL FRONTEND - PUBLIC API
 * ═══════════════════════════════════════════════════════════════
 */

// Core Systems
export * from './core/effects/index.ts';
export * from './core/routing/index.ts';
export * from './core/state/index.ts';
export * from './core/abstraction/index.ts';
export * from './core/separation/index.ts';

// Domain
export * from './domain/entities/Player.ts';
export * from './domain/entities/NFT.ts';
export * from './domain/valueObjects/Address.ts';
export * from './domain/valueObjects/Stats.ts';
export * from './domain/events/DomainEvent.ts';
export * from './domain/services/ValidationService.ts';

// Application
export * from './application/dto/MintPlayerDTO.ts';
export * from './application/ports/Repository.port.ts';
export * from './application/useCases/MintPlayer.ts';
export * from './application/services/PlayerService.ts';

// Infrastructure
export { apiClient } from './infrastructure/http/ApiClient.ts';
export { localStorage } from './infrastructure/storage/LocalStorage.ts';
export { web3Provider } from './infrastructure/blockchain/Web3Provider.ts';

// Presentation
export { useStore, useSelector } from './presentation/hooks/useStore.ts';
export { ErrorBoundary } from './presentation/components/ErrorBoundary.tsx';
