/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - GALLERY PAGE
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import { PlayerGrid } from '../components/PlayerGrid.tsx';
import { createPlayer } from '../../domain/entities/Player.ts';
import { Address } from '../../domain/valueObjects/Address.ts';
import { createStats } from '../../domain/valueObjects/Stats.ts';
import type { Player } from '../../domain/entities/Player.ts';

// Mock data for development
const mockPlayers: Player[] = [
  createPlayer(
    '1',
    'Lionel Messi',
    'FWD',
    'Legendary',
    createStats(85, 95, 91, 96, 35, 65),
    new Address('0x731b170EB84b20ce6C6568EdAFC1e18fcB5820c6')
  ),
  createPlayer(
    '2',
    'Cristiano Ronaldo',
    'FWD',
    'Legendary',
    createStats(88, 93, 82, 88, 35, 78),
    new Address('0x731b170EB84b20ce6C6568EdAFC1e18fcB5820c6')
  ),
  createPlayer(
    '3',
    'Kevin De Bruyne',
    'MID',
    'Epic',
    createStats(76, 86, 94, 88, 64, 78),
    new Address('0x731b170EB84b20ce6C6568EdAFC1e18fcB5820c6')
  ),
  createPlayer(
    '4',
    'Virgil van Dijk',
    'DEF',
    'Epic',
    createStats(81, 60, 71, 72, 91, 86),
    new Address('0x731b170EB84b20ce6C6568EdAFC1e18fcB5820c6')
  ),
];

export const GalleryPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setPlayers(mockPlayers);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handlePlayerClick = (player: Player) => {
    console.log('Clicked player:', player);
    // Could open modal with player details
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <div style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: 'white',
                margin: 0,
              }}
            >
              Your Player Collection
            </h2>
            <p style={{ color: '#9ca3af', margin: '8px 0 0 0' }}>
              Manage and view your soccer player NFTs
            </p>
          </div>
          <div
            style={{
              padding: '12px 20px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '12px',
              color: '#3b82f6',
              fontWeight: 600,
            }}
          >
            {players.length} Players
          </div>
        </div>
      </div>

      <PlayerGrid
        players={players}
        onPlayerClick={handlePlayerClick}
        isLoading={isLoading}
      />
    </div>
  );
};
