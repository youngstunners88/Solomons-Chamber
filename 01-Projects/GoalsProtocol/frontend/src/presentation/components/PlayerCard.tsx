/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - PLAYER CARD COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';
import type { Player, PlayerRarity } from '../../domain/entities/Player.ts';

const rarityColors: Record<PlayerRarity, string> = {
  Common: '#9ca3af',
  Rare: '#3b82f6',
  Epic: '#a855f7',
  Legendary: '#f59e0b',
  Mythic: '#ef4444',
};

interface PlayerCardProps {
  readonly player: Player;
  readonly onClick?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick }) => {
  const overall = player.stats.overall;
  
  const getOverallColor = (rating: number): string => {
    if (rating >= 85) return '#10b981';
    if (rating >= 75) return '#3b82f6';
    if (rating >= 65) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div
      onClick={onClick}
      style={{
        width: '280px',
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        borderRadius: '16px',
        padding: '20px',
        color: 'white',
        cursor: onClick ? 'pointer' : 'default',
        border: `2px solid ${rarityColors[player.rarity]}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: `0 4px 20px ${rarityColors[player.rarity]}40`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 8px 30px ${rarityColors[player.rarity]}60`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 4px 20px ${rarityColors[player.rarity]}40`;
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            background: rarityColors[player.rarity],
            color: 'white',
          }}
        >
          {player.rarity}
        </span>
        <span style={{ fontSize: '14px', color: '#9ca3af' }}>
          {player.position}
        </span>
      </div>

      {/* Overall Rating */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: getOverallColor(overall),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: 800,
          marginBottom: '16px',
        }}
      >
        {overall}
      </div>

      {/* Name */}
      <h3
        style={{
          fontSize: '20px',
          fontWeight: 700,
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {player.name}
      </h3>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginTop: '16px',
        }}
      >
        <Stat label="PAC" value={player.stats.pace} />
        <Stat label="SHO" value={player.stats.shooting} />
        <Stat label="PAS" value={player.stats.passing} />
        <Stat label="DRI" value={player.stats.dribbling} />
        <Stat label="DEF" value={player.stats.defense} />
        <Stat label="PHY" value={player.stats.physical} />
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#9ca3af',
        }}
      >
        <span>Matches: {player.matchesPlayed}</span>
        <span>Goals: {player.goals}</span>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div
    style={{
      textAlign: 'center',
      padding: '8px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '8px',
    }}
  >
    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>
      {label}
    </div>
    <div style={{ fontSize: '16px', fontWeight: 700 }}>{value}</div>
  </div>
);
