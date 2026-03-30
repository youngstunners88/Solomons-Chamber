/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - WALLET BUTTON COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback } from 'react';
import { createEffect } from '../../core/effects';
import { EthersBlockchainAdapter } from '../../core/abstraction/adapters/blockchain.adapter.ts';
import { ConsoleLoggerAdapter } from '../../core/abstraction/adapters/logger.adapter.ts';

const logger = new ConsoleLoggerAdapter({ component: 'WalletButton' });
const blockchain = new EthersBlockchainAdapter();

const connectWalletEffect = createEffect(
  'connectWallet',
  async () => {
    const accounts = await blockchain.connect();
    return accounts[0] || null;
  },
  { retries: 1 }
);

interface WalletButtonProps {
  readonly address: string | null;
  readonly onConnect: (address: string) => void;
  readonly onDisconnect: () => void;
}

export const WalletButton: React.FC<WalletButtonProps> = ({
  address,
  onConnect,
  onDisconnect,
}) => {
  const handleConnect = useCallback(async () => {
    logger.info('Connecting wallet...');
    const result = await connectWalletEffect.run(undefined);
    
    if (result.data) {
      logger.info('Wallet connected', { address: result.data });
      onConnect(result.data);
    } else if (result.error) {
      logger.error('Failed to connect wallet', { error: result.error.message });
      alert(`Failed to connect: ${result.error.message}`);
    }
  }, [onConnect]);

  const handleDisconnect = useCallback(() => {
    blockchain.disconnect().then(() => {
      logger.info('Wallet disconnected');
      onDisconnect();
    });
  }, [onDisconnect]);

  if (address) {
    return (
      <button
        onClick={handleDisconnect}
        style={{
          padding: '10px 20px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      style={{
        padding: '10px 20px',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 600,
      }}
    >
      Connect Wallet
    </button>
  );
};
