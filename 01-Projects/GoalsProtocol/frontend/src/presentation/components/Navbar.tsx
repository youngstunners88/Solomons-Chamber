/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - NAVBAR COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';
import { WalletButton } from './WalletButton.tsx';

interface NavbarProps {
  readonly walletAddress: string | null;
  readonly onConnect: (address: string) => void;
  readonly onDisconnect: () => void;
  readonly activeTab: string;
  readonly onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'gallery', label: 'Gallery', icon: '🖼️' },
  { id: 'mint', label: 'Mint Player', icon: '⚽' },
  { id: 'battle', label: 'Battle', icon: '⚔️' },
  { id: 'market', label: 'Market', icon: '🏪' },
];

export const Navbar: React.FC<NavbarProps> = ({
  walletAddress,
  onConnect,
  onDisconnect,
  activeTab,
  onTabChange,
}) => {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: '#111827',
        borderBottom: '1px solid #374151',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}
        >
          ⚽
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: 0 }}>
            $GOALS
          </h1>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Protocol</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '10px 16px',
              background: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = '#1f2937';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Wallet Button */}
      <WalletButton
        address={walletAddress}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
    </nav>
  );
};
