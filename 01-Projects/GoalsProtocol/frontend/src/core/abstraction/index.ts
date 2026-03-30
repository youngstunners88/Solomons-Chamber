/**
 * ═══════════════════════════════════════════════════════════════
 * ABSTRACTION LAYER - PUBLIC API
 * ═══════════════════════════════════════════════════════════════
 */

// Ports
export type {
  HttpPort,
  HttpRequestConfig,
  HttpResponse,
} from './ports/http.port.ts';
export type { StoragePort } from './ports/storage.port.ts';
export type {
  LoggerPort,
  LogLevel,
  LogContext,
} from './ports/logger.port.ts';
export type {
  BlockchainPort,
  TransactionRequest,
  TransactionReceipt,
  ContractCall,
} from './ports/blockchain.port.ts';

// Adapters
export { AxiosHttpAdapter } from './adapters/http.adapter.ts';
export {
  LocalStorageAdapter,
  MemoryStorageAdapter,
} from './adapters/storage.adapter.ts';
export { ConsoleLoggerAdapter } from './adapters/logger.adapter.ts';
export { EthersBlockchainAdapter } from './adapters/blockchain.adapter.ts';

// DI Container
export { container, injectable } from './container.ts';
export { ObjectFactory, createFactory } from './factory.ts';
