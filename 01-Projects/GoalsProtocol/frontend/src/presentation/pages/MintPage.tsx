/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - MINT PAGE
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';
import { MintPlayerForm } from '../components/MintPlayerForm.tsx';

interface MintPageProps {
  readonly walletAddress: string;
}

export const MintPage: React.FC<MintPageProps> = ({ walletAddress }) => {
  const handleSuccess = (tokenId: string) => {
    alert(`Player minted successfully! Token ID: ${tokenId}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        padding: '40px 24px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <MintPlayerForm walletAddress={walletAddress} onSuccess={handleSuccess} />
    </div>
  );
};
