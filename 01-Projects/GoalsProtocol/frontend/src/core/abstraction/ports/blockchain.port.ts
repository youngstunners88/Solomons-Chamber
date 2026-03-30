/**
 * ═══════════════════════════════════════════════════════════════
 * ABSTRACTION LAYER - BLOCKCHAIN PORT
 * ═══════════════════════════════════════════════════════════════
 */

export interface TransactionRequest {
  readonly to: string;
  readonly from?: string;
  readonly value?: bigint;
  readonly data?: string;
  readonly gasLimit?: bigint;
  readonly gasPrice?: bigint;
}

export interface TransactionReceipt {
  readonly hash: string;
  readonly status: 'success' | 'failure' | 'pending';
  readonly blockNumber?: bigint;
  readonly gasUsed?: bigint;
  readonly effectiveGasPrice?: bigint;
}

export interface ContractCall {
  readonly contractAddress: string;
  readonly method: string;
  readonly args: unknown[];
  readonly abi: unknown[];
}

export interface BlockchainPort {
  readonly connect: () => Promise<string[]>;
  readonly disconnect: () => Promise<void>;
  readonly getAccounts: () => Promise<string[]>;
  readonly getBalance: (address: string) => Promise<bigint>;
  readonly sendTransaction: (tx: TransactionRequest) => Promise<TransactionReceipt>;
  readonly callContract: <T>(call: ContractCall) => Promise<T>;
  readonly estimateGas: (tx: TransactionRequest) => Promise<bigint>;
  readonly onAccountChanged: (callback: (accounts: string[]) => void) => () => void;
  readonly onChainChanged: (callback: (chainId: string) => void) => () => void;
  readonly switchChain: (chainId: string) => Promise<void>;
}
