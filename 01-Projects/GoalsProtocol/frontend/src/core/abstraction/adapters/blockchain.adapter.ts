/**
 * ═══════════════════════════════════════════════════════════════
 * ABSTRACTION LAYER - BLOCKCHAIN ADAPTER (Ethers.js)
 * ═══════════════════════════════════════════════════════════════
 */

import { ethers } from 'ethers';
import type {
  BlockchainPort,
  TransactionRequest,
  TransactionReceipt,
  ContractCall,
} from '../ports/blockchain.port.ts';

export class EthersBlockchainAdapter implements BlockchainPort {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connect(): Promise<string[]> {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet detected');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await this.provider.send('eth_requestAccounts', []);
    this.signer = await this.provider.getSigner();
    return accounts;
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
  }

  async getAccounts(): Promise<string[]> {
    if (!this.provider) return [];
    return this.provider.send('eth_accounts', []);
  }

  async getBalance(address: string): Promise<bigint> {
    if (!this.provider) throw new Error('Not connected');
    return this.provider.getBalance(address);
  }

  async sendTransaction(tx: TransactionRequest): Promise<TransactionReceipt> {
    if (!this.signer) throw new Error('Not connected');

    const response = await this.signer.sendTransaction({
      to: tx.to,
      value: tx.value,
      data: tx.data,
      gasLimit: tx.gasLimit,
      gasPrice: tx.gasPrice,
    });

    const receipt = await response.wait();

    return {
      hash: response.hash,
      status: receipt?.status === 1 ? 'success' : 'failure',
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed,
      effectiveGasPrice: receipt?.gasPrice,
    };
  }

  async callContract<T>(call: ContractCall): Promise<T> {
    if (!this.provider) throw new Error('Not connected');

    const contract = new ethers.Contract(
      call.contractAddress,
      call.abi as ethers.InterfaceAbi,
      this.provider
    );

    const result = await contract[call.method](...call.args);
    return result as T;
  }

  async estimateGas(tx: TransactionRequest): Promise<bigint> {
    if (!this.provider) throw new Error('Not connected');
    return this.provider.estimateGas({
      to: tx.to,
      value: tx.value,
      data: tx.data,
    });
  }

  onAccountChanged(callback: (accounts: string[]) => void): () => void {
    const handler = (accounts: string[]) => callback(accounts);
    window.ethereum?.on('accountsChanged', handler);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handler);
    };
  }

  onChainChanged(callback: (chainId: string) => void): () => void {
    const handler = (chainId: string) => callback(chainId);
    window.ethereum?.on('chainChanged', handler);
    return () => {
      window.ethereum?.removeListener('chainChanged', handler);
    };
  }

  async switchChain(chainId: string): Promise<void> {
    if (!window.ethereum) throw new Error('No Ethereum wallet detected');
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  }
}

// Type augmentation for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
