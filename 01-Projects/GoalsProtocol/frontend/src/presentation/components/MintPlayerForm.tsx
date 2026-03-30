/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - MINT PLAYER FORM COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback } from 'react';
import { createEffect } from '../../core/effects';
import { MintPlayerUseCase } from '../../application/useCases/MintPlayer.ts';
import { createStats } from '../../domain/valueObjects/Stats.ts';
import { EthersBlockchainAdapter } from '../../core/abstraction/adapters/blockchain.adapter.ts';
import { ConsoleLoggerAdapter } from '../../core/abstraction/adapters/logger.adapter.ts';
import type { PlayerPosition, PlayerRarity } from '../../domain/entities/Player.ts';
import type { MintPlayerDTO } from '../../application/dto/MintPlayerDTO.ts';

const logger = new ConsoleLoggerAdapter({ component: 'MintPlayerForm' });
const blockchain = new EthersBlockchainAdapter();

const mintPlayerEffect = createEffect(
  'mintPlayer',
  async (payload: { dto: MintPlayerDTO; address: string }) => {
    // In production, this would use the real contract address
    const useCase = new MintPlayerUseCase(
      blockchain,
      logger,
      '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Local deployment address
    );
    return useCase.execute(payload.dto, payload.address);
  },
  { retries: 1 }
);

interface MintPlayerFormProps {
  readonly walletAddress: string;
  readonly onSuccess?: (tokenId: string) => void;
}

export const MintPlayerForm: React.FC<MintPlayerFormProps> = ({
  walletAddress,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('FWD');
  const [rarity, setRarity] = useState<PlayerRarity>('Common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats
  const [pace, setPace] = useState(70);
  const [shooting, setShooting] = useState(70);
  const [passing, setPassing] = useState(70);
  const [dribbling, setDribbling] = useState(70);
  const [defense, setDefense] = useState(70);
  const [physical, setPhysical] = useState(70);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      const stats = createStats(pace, shooting, passing, dribbling, defense, physical);
      const dto: MintPlayerDTO = {
        name,
        position,
        rarity,
        stats,
        imageURI: `ipfs://player-${Date.now()}`,
      };

      logger.info('Minting player', { name, position, rarity });

      const result = await mintPlayerEffect.run({ dto, address: walletAddress });

      if (result.data?.success && result.data.tokenId) {
        logger.info('Player minted successfully', { tokenId: result.data.tokenId });
        onSuccess?.(result.data.tokenId);
        // Reset form
        setName('');
      } else {
        logger.error('Failed to mint player', { errors: result.data?.errors });
        alert(`Failed to mint: ${result.data?.errors?.join(', ')}`);
      }

      setIsSubmitting(false);
    },
    [name, position, rarity, pace, shooting, passing, dribbling, defense, physical, walletAddress, onSuccess]
  );

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: '600px',
        padding: '24px',
        background: '#1f2937',
        borderRadius: '16px',
        color: 'white',
      }}
    >
      <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>
        Mint New Player NFT
      </h2>

      {/* Name */}
      <FormField label="Player Name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Lionel Messi"
          required
          style={inputStyle}
        />
      </FormField>

      {/* Position */}
      <FormField label="Position">
        <select value={position} onChange={(e) => setPosition(e.target.value as PlayerPosition)} style={inputStyle}>
          <option value="GK">Goalkeeper</option>
          <option value="DEF">Defender</option>
          <option value="MID">Midfielder</option>
          <option value="FWD">Forward</option>
        </select>
      </FormField>

      {/* Rarity */}
      <FormField label="Rarity">
        <select value={rarity} onChange={(e) => setRarity(e.target.value as PlayerRarity)} style={inputStyle}>
          <option value="Common">Common</option>
          <option value="Rare">Rare</option>
          <option value="Epic">Epic</option>
          <option value="Legendary">Legendary</option>
          <option value="Mythic">Mythic</option>
        </select>
      </FormField>

      {/* Stats */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>
          Player Stats
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <StatSlider label="Pace" value={pace} onChange={setPace} />
          <StatSlider label="Shooting" value={shooting} onChange={setShooting} />
          <StatSlider label="Passing" value={passing} onChange={setPassing} />
          <StatSlider label="Dribbling" value={dribbling} onChange={setDribbling} />
          <StatSlider label="Defense" value={defense} onChange={setDefense} />
          <StatSlider label="Physical" value={physical} onChange={setPhysical} />
        </div>
      </div>

      {/* Overall Preview */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          marginBottom: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
          Overall Rating
        </div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#3b82f6' }}>
          {Math.round((pace + shooting + passing + dribbling + defense + physical) / 6)}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !name.trim()}
        style={{
          width: '100%',
          padding: '16px',
          background: isSubmitting || !name.trim() ? '#4b5563' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: isSubmitting || !name.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {isSubmitting ? 'Minting...' : 'Mint Player NFT'}
      </button>
    </form>
  );
};

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>{label}</label>
    {children}
  </div>
);

const StatSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontSize: '12px', color: '#9ca3af' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 600 }}>{value}</span>
    </div>
    <input
      type="range"
      min={0}
      max={99}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      style={{ width: '100%' }}
    />
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: '#374151',
  border: '1px solid #4b5563',
  borderRadius: '8px',
  color: 'white',
  fontSize: '14px',
};
