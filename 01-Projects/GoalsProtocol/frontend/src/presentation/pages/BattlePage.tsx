/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - BATTLE PAGE (Placeholder)
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';

export const BattlePage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        padding: '60px 24px',
        textAlign: 'center',
        color: 'white',
      }}
    >
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚔️</div>
      <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>
        Battle Arena
      </h2>
      <p style={{ color: '#9ca3af', maxWidth: '500px', margin: '0 auto' }}>
        Pit your players against others in strategic battles. 
        Win to earn rewards and increase your players' stats.
      </p>
      <div
        style={{
          marginTop: '40px',
          padding: '20px 40px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '12px',
          display: 'inline-block',
          color: '#3b82f6',
          fontWeight: 600,
        }}
      >
        Coming Soon
      </div>
    </div>
  );
};
