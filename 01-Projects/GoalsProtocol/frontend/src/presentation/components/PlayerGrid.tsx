/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - PLAYER GRID COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';
import { PlayerCard } from './PlayerCard.tsx';
import type { Player } from '../../domain/entities/Player.ts';

interface PlayerGridProps {
  readonly players: ReadonlyArray<Player>;
  readonly onPlayerClick?: (player: Player) => void;
  readonly isLoading?: boolean;
}

export const PlayerGrid: React.FC<PlayerGridProps> = ({
  players,
  onPlayerClick,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          padding: '24px',
        }}
      >
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div
        style={{
          padding: '60px 24px',
          textAlign: 'center',
          color: '#9ca3af',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚽</div>
        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: 'white' }}>
          No Players Found
        </h3>
        <p>Mint your first player NFT to get started!</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
        padding: '24px',
      }}
    >
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          onClick={() => onPlayerClick?.(player)}
        />
      ))}
    </div>
  );
};

const SkeletonCard: React.FC = () => (
  <div
    style={{
      width: '280px',
      height: '380px',
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      borderRadius: '16px',
      padding: '20px',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    }}
  >
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `}</style>
    <div style={{ height: '24px', background: '#374151', borderRadius: '4px', marginBottom: '16px' }} />
    <div style={{ width: '80px', height: '80px', background: '#374151', borderRadius: '50%', marginBottom: '16px' }} />
    <div style={{ height: '24px', background: '#374151', borderRadius: '4px', marginBottom: '16px' }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ height: '50px', background: '#374151', borderRadius: '8px' }} />
      ))}
    </div>
  </div>
);
