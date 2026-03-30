/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - MARKET PAGE (Placeholder)
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';

export const MarketPage: React.FC = () => {
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
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏪</div>
      <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>
        Player Market
      </h2>
      <p style={{ color: '#9ca3af', maxWidth: '500px', margin: '0 auto' }}>
        Buy, sell, and trade player NFTs with other collectors. 
        Discover rare and legendary players to strengthen your squad.
      </p>
      <div
        style={{
          marginTop: '40px',
          padding: '20px 40px',
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '12px',
          display: 'inline-block',
          color: '#8b5cf6',
          fontWeight: 600,
        }}
      >
        Coming Soon
      </div>
    </div>
  );
};
