/**
 * ═══════════════════════════════════════════════════════════════
 * APP ROOT COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback } from 'react';
import { Navbar } from './presentation/components/Navbar.tsx';
import { GalleryPage, MintPage, BattlePage, MarketPage } from './presentation/pages/index.ts';
import { ErrorBoundary } from './presentation/components/ErrorBoundary.tsx';

const App: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('gallery');

  const handleConnect = useCallback((address: string) => {
    setWalletAddress(address);
  }, []);

  const handleDisconnect = useCallback(() => {
    setWalletAddress(null);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'gallery':
        return <GalleryPage />;
      case 'mint':
        return walletAddress ? (
          <MintPage walletAddress={walletAddress} />
        ) : (
          <ConnectPrompt onConnect={() => setActiveTab('gallery')} />
        );
      case 'battle':
        return <BattlePage />;
      case 'market':
        return <MarketPage />;
      default:
        return <GalleryPage />;
    }
  };

  return (
    <ErrorBoundary
      fallback={
        <div style={{ padding: 40, textAlign: 'center', color: 'white' }}>
          <h2>Something went wrong</h2>
          <p>Please refresh the page</p>
        </div>
      }
    >
      <div style={{ minHeight: '100vh', background: '#0f172a' }}>
        <Navbar
          walletAddress={walletAddress}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {renderContent()}
      </div>
    </ErrorBoundary>
  );
};

const ConnectPrompt: React.FC<{ onConnect: () => void }> = ({ onConnect }) => (
  <div
    style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      textAlign: 'center',
      color: 'white',
    }}
  >
    <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚽</div>
    <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px' }}>
      Connect Your Wallet
    </h2>
    <p style={{ color: '#9ca3af', maxWidth: '400px', marginBottom: '32px' }}>
      Connect your wallet to mint new player NFTs and manage your collection.
    </p>
    <button
      onClick={onConnect}
      style={{
        padding: '16px 32px',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      Go to Gallery to Connect
    </button>
  </div>
);

export default App;
