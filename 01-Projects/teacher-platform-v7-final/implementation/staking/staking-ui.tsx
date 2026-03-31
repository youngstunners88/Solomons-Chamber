// apps/web/app/(dashboard)/dao/staking/page.tsx
// Teacher Token Staking Interface

'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Lock, 
  Unlock, 
  Clock, 
  Award,
  AlertCircle,
  Info,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { 
  useStaking, 
  StakingPool, 
  StakePosition,
  StakingTier 
} from '@/lib/dao/hooks/use-staking';
import { useICP } from '@/lib/icp/hooks/use-icp';

// ==================== STAKING PAGE ====================

export default function StakingPage() {
  const { 
    balance, 
    pools, 
    positions, 
    currentTier,
    isLoading,
    error,
    stake,
    unstake,
    claimRewards,
    refresh 
  } = useStaking();
  
  const [activeTab, setActiveTab] = useState('pools');
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showStakeDialog, setShowStakeDialog] = useState(false);
  const [showUnstakeDialog, setShowUnstakeDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<StakePosition | null>(null);
  
  const totalStaked = positions.reduce((sum, pos) => sum + pos.amount, 0);
  const totalRewards = positions.reduce((sum, pos) => sum + pos.pendingRewards, 0);
  
  const handleStake = async () => {
    if (!selectedPool || !stakeAmount) return;
    
    try {
      await stake(selectedPool.id, parseFloat(stakeAmount));
      setShowStakeDialog(false);
      setStakeAmount('');
      refresh();
    } catch (err) {
      console.error('Stake failed:', err);
    }
  };
  
  const handleUnstake = async () => {
    if (!selectedPosition) return;
    
    try {
      await unstake(selectedPosition.id);
      setShowUnstakeDialog(false);
      refresh();
    } catch (err) {
      console.error('Unstake failed:', err);
    }
  };
  
  const openStakeDialog = (pool: StakingPool) => {
    setSelectedPool(pool);
    setStakeAmount('');
    setShowStakeDialog(true);
  };
  
  const openUnstakeDialog = (position: StakePosition) => {
    setSelectedPosition(position);
    setShowUnstakeDialog(true);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          Teacher Token Staking
        </h1>
        <p className="text-muted-foreground">
          Stake your TCC tokens to earn rewards and gain governance voting power
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Wallet Balance"
          value={`${balance.toLocaleString()} TCC`}
          icon={<Wallet className="h-5 w-5" />}
          trend="Available to stake"
        />
        <StatsCard
          title="Total Staked"
          value={`${totalStaked.toLocaleString()} TCC`}
          icon={<Lock className="h-5 w-5" />}
          trend="Earning rewards"
        />
        <StatsCard
          title="Pending Rewards"
          value={`${totalRewards.toLocaleString()} TCC`}
          icon={<Award className="h-5 w-5" />}
          trend="Ready to claim"
          highlight
        />
        <StatsCard
          title="Your Tier"
          value={currentTier?.name || 'Bronze'}
          icon={<Award className="h-5 w-5" />}
          trend={`${currentTier?.votingPower}x voting power`}
        />
      </div>
      
      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pools">Staking Pools</TabsTrigger>
          <TabsTrigger value="positions">My Positions ({positions.length})</TabsTrigger>
          <TabsTrigger value="tiers">Tier Benefits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pools">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pools.map((pool) => (
              <StakingPoolCard
                key={pool.id}
                pool={pool}
                onStake={() => openStakeDialog(pool)}
                userBalance={balance}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="positions">
          {positions.length === 0 ? (
            <EmptyState
              title="No Active Stakes"
              description="Start staking to earn rewards and gain voting power"
              action={{
                label: "View Pools",
                onClick: () => setActiveTab('pools')
              }}
            />
          ) : (
            <div className="space-y-4">
              {positions.map((position) => (
                <StakePositionCard
                  key={position.id}
                  position={position}
                  onClaim={() => claimRewards(position.id)}
                  onUnstake={() => openUnstakeDialog(position)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="tiers">
          <TierBenefits tiers={STAKING_TIERS} currentTier={currentTier} />
        </TabsContent>
      </Tabs>
      
      {/* Stake Dialog */}
      <Dialog open={showStakeDialog} onOpenChange={setShowStakeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stake TCC Tokens</DialogTitle>
            <DialogDescription>
              Stake in {selectedPool?.name} for {selectedPool?.apy}% APY
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available Balance</span>
              <span className="font-medium">{balance.toLocaleString()} TCC</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount to Stake</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => setStakeAmount(balance.toString())}
                >
                  Max
                </Button>
              </div>
            </div>
            
            {selectedPool && (
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lock Period</span>
                  <span>{selectedPool.lockPeriodDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Early Unstake Fee</span>
                  <span>{selectedPool.earlyUnstakeFee}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Daily Rewards</span>
                  <span>
                    {calculateDailyRewards(parseFloat(stakeAmount) || 0, selectedPool.apy).toFixed(2)} TCC
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStakeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStake}
              disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > balance}
            >
              Confirm Stake
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Unstake Dialog */}
      <Dialog open={showUnstakeDialog} onOpenChange={setShowUnstakeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unstake TCC Tokens</DialogTitle>
            <DialogDescription>
              {selectedPosition && isEarlyUnstake(selectedPosition) ? (
                <span className="text-destructive">
                  Early unstake will incur a {selectedPosition.earlyUnstakeFee}% fee
                </span>
              ) : (
                'Your stake period has completed. No fees apply.'
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPosition && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Staked Amount</span>
                  <span className="font-medium">{selectedPosition.amount.toLocaleString()} TCC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending Rewards</span>
                  <span className="font-medium text-primary">
                    {selectedPosition.pendingRewards.toLocaleString()} TCC
                  </span>
                </div>
                {isEarlyUnstake(selectedPosition) && (
                  <div className="flex justify-between text-destructive">
                    <span>Early Unstake Fee</span>
                    <span>
                      -{(selectedPosition.amount * selectedPosition.earlyUnstakeFee / 100).toFixed(2)} TCC
                    </span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>You Receive</span>
                  <span>
                    {calculateUnstakeAmount(selectedPosition).toLocaleString()} TCC
                  </span>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Rewards Auto-Claimed</AlertTitle>
                <AlertDescription>
                  Your pending rewards will be automatically claimed when you unstake.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnstakeDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnstake}>
              {selectedPosition && isEarlyUnstake(selectedPosition) ? 'Unstake (Early)' : 'Unstake'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== COMPONENT COMPONENTS ====================

function StatsCard({ 
  title, 
  value, 
  icon, 
  trend,
  highlight = false 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  trend: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-primary/50' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${highlight ? 'bg-primary/10' : 'bg-muted'}`}>
            {icon}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${highlight ? 'text-primary' : ''}`}>{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StakingPoolCard({ 
  pool, 
  onStake,
  userBalance 
}: { 
  pool: StakingPool; 
  onStake: () => void;
  userBalance: number;
}) {
  const utilizationRate = (pool.totalStaked / pool.maxCapacity) * 100;
  const isFull = utilizationRate >= 100;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {pool.name}
              {pool.isNew && (
                <Badge variant="secondary">New</Badge>
              )}
            </CardTitle>
            <CardDescription>{pool.description}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{pool.apy}%</p>
            <p className="text-xs text-muted-foreground">APY</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Lock Period</p>
            <p className="font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {pool.lockPeriodDays} days
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Early Unstake</p>
            <p className="font-medium">{pool.earlyUnstakeFee}% fee</p>
          </div>
          <div>
            <p className="text-muted-foreground">Min Stake</p>
            <p className="font-medium">{pool.minStake.toLocaleString()} TCC</p>
          </div>
          <div>
            <p className="text-muted-foreground">Max Stake</p>
            <p className="font-medium">{pool.maxStake.toLocaleString()} TCC</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pool Capacity</span>
            <span>{utilizationRate.toFixed(1)}%</span>
          </div>
          <Progress value={utilizationRate} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {pool.totalStaked.toLocaleString()} / {pool.maxCapacity.toLocaleString()} TCC staked
          </p>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={onStake}
          disabled={isFull || userBalance < pool.minStake}
        >
          {isFull ? 'Pool Full' : userBalance < pool.minStake ? 'Insufficient Balance' : 'Stake Now'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function StakePositionCard({ 
  position, 
  onClaim, 
  onUnstake 
}: { 
  position: StakePosition; 
  onClaim: () => void;
  onUnstake: () => void;
}) {
  const daysRemaining = Math.max(0, Math.ceil(
    (position.lockEndTime - Date.now()) / (1000 * 60 * 60 * 24)
  ));
  const isLocked = daysRemaining > 0;
  const progress = Math.min(100, ((position.lockPeriodDays - daysRemaining) / position.lockPeriodDays) * 100);
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{position.poolName}</h3>
              <Badge variant={isLocked ? 'secondary' : 'default'}>
                {isLocked ? `${daysRemaining} days left` : 'Unlocked'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Staked</p>
                <p className="font-medium">{position.amount.toLocaleString()} TCC</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">APY</p>
                <p className="font-medium text-primary">{position.apy}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rewards</p>
                <p className="font-medium text-primary">
                  {position.pendingRewards.toFixed(2)} TCC
                </p>
              </div>
            </div>
            
            {isLocked && (
              <div className="mt-4">
                <Progress value={progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">
                  {position.lockPeriodDays - daysRemaining} / {position.lockPeriodDays} days completed
                </p>
              </div>
            )}
          </div>
          
          <div className="flex flex-row md:flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClaim}
              disabled={position.pendingRewards <= 0}
            >
              <Award className="h-4 w-4 mr-1" />
              Claim
            </Button>
            <Button 
              variant={isLocked ? 'outline' : 'default'}
              size="sm"
              onClick={onUnstake}
            >
              {isLocked ? (
                <>
                  <Unlock className="h-4 w-4 mr-1" />
                  Early Unstake
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-1" />
                  Unstake
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TierBenefits({ 
  tiers, 
  currentTier 
}: { 
  tiers: StakingTier[]; 
  currentTier: StakingTier | null;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiers.map((tier, index) => {
        const isCurrentTier = currentTier?.id === tier.id;
        const isLocked = currentTier ? index > currentTier.level : index > 0;
        
        return (
          <Card 
            key={tier.id} 
            className={`relative ${isCurrentTier ? 'border-primary' : ''} ${isLocked ? 'opacity-60' : ''}`}
          >
            {isCurrentTier && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>Current Tier</Badge>
              </div>
            )}
            
            <CardHeader>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                isCurrentTier ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <tier.icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">{tier.name}</CardTitle>
              <CardDescription>
                Stake {tier.minStake.toLocaleString()}+ TCC
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-2 text-sm">
                {tier.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            {isLocked && (
              <CardFooter>
                <p className="text-xs text-muted-foreground w-full text-center">
                  Stake {tier.minStake.toLocaleString()} TCC to unlock
                </p>
              </CardFooter>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function EmptyState({ 
  title, 
  description, 
  action 
}: { 
  title: string; 
  description: string;
  action: { label: string; onClick: () => void };
}) {
  return (
    <Card className="p-12 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <TrendingUp className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Button onClick={action.onClick}>
        {action.label}
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </Card>
  );
}

// ==================== HELPERS ====================

function calculateDailyRewards(amount: number, apy: number): number {
  return (amount * (apy / 100)) / 365;
}

function isEarlyUnstake(position: StakePosition): boolean {
  return Date.now() < position.lockEndTime;
}

function calculateUnstakeAmount(position: StakePosition): number {
  let amount = position.amount;
  
  // Add pending rewards
  amount += position.pendingRewards;
  
  // Deduct early unstake fee if applicable
  if (isEarlyUnstake(position)) {
    amount -= (position.amount * position.earlyUnstakeFee / 100);
  }
  
  return Math.max(0, amount);
}

// ==================== MOCK DATA ====================

const STAKING_TIERS: StakingTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    level: 0,
    minStake: 0,
    votingPower: 1,
    icon: Award,
    benefits: [
      'Basic governance voting',
      'Standard reward rates',
      'Community access',
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    level: 1,
    minStake: 1000,
    votingPower: 1.5,
    icon: Award,
    benefits: [
      '1.5x voting power',
      '5% reward boost',
      'Priority support',
      'Exclusive content access',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    level: 2,
    minStake: 5000,
    votingPower: 2,
    icon: Award,
    benefits: [
      '2x voting power',
      '10% reward boost',
      'Early feature access',
      'Governance proposals',
      'Direct team contact',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    level: 3,
    minStake: 20000,
    votingPower: 3,
    icon: Award,
    benefits: [
      '3x voting power',
      '20% reward boost',
      'VIP events access',
      'Council nomination',
      'White-glove support',
    ],
  },
];
