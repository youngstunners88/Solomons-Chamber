// apps/web/app/(dashboard)/dao/governance/page.tsx
// DAO Governance Interface

'use client';

import React, { useState } from 'react';
import { 
  Vote, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  TrendingUp,
  Shield,
  FileText,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useGovernance, 
  Proposal, 
  ProposalStatus,
  VoteType 
} from '@/lib/dao/hooks/use-governance';
import { useICP } from '@/lib/icp/hooks/use-icp';

// ==================== GOVERNANCE PAGE ====================

export default function GovernancePage() {
  const { 
    proposals, 
    votingPower,
    participatedProposals,
    isLoading,
    vote,
    createProposal,
    refresh 
  } = useGovernance();
  
  const [activeTab, setActiveTab] = useState('active');
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [voteReason, setVoteReason] = useState('');
  
  const activeProposals = proposals.filter(p => p.status === 'active');
  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const closedProposals = proposals.filter(p => ['passed', 'rejected', 'expired'].includes(p.status));
  
  const handleVote = async (voteType: VoteType) => {
    if (!selectedProposal) return;
    
    try {
      await vote(selectedProposal.id, voteType, voteReason);
      setShowVoteDialog(false);
      setVoteReason('');
      refresh();
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };
  
  const openVoteDialog = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setVoteReason('');
    setShowVoteDialog(true);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          DAO Governance
        </h1>
        <p className="text-muted-foreground">
          Participate in platform decisions with your staked voting power
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Your Voting Power"
          value={`${votingPower.toLocaleString()}`}
          icon={<Vote className="h-5 w-5" />}
          trend="Based on staked tokens"
        />
        <StatsCard
          title="Active Proposals"
          value={activeProposals.length.toString()}
          icon={<FileText className="h-5 w-5" />}
          trend="Awaiting your vote"
        />
        <StatsCard
          title="Participation Rate"
          value={`${calculateParticipationRate(participatedProposals, activeProposals.length)}%`}
          icon={<Users className="h-5 w-5" />}
          trend="Of active proposals"
        />
        <StatsCard
          title="Total Proposals"
          value={proposals.length.toString()}
          icon={<TrendingUp className="h-5 w-5" />}
          trend="All time"
        />
      </div>
      
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeProposals.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingProposals.length})
            </TabsTrigger>
            <TabsTrigger value="closed">
              Closed ({closedProposals.length})
            </TabsTrigger>
          </TabsList>
        </TabsList>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Proposal
        </Button>
      </div>
      
      {/* Proposals List */}
      <div className="space-y-4">
        {activeTab === 'active' && activeProposals.map(proposal => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onVote={() => openVoteDialog(proposal)}
            votingPower={votingPower}
          />
        ))}
        
        {activeTab === 'pending' && pendingProposals.map(proposal => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onVote={() => {}}
            votingPower={votingPower}
            isPending
          />
        ))}
        
        {activeTab === 'closed' && closedProposals.map(proposal => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onVote={() => {}}
            votingPower={votingPower}
            isClosed
          />
        ))}
        
        {((activeTab === 'active' && activeProposals.length === 0) ||
          (activeTab === 'pending' && pendingProposals.length === 0) ||
          (activeTab === 'closed' && closedProposals.length === 0)) && (
          <EmptyState 
            message={`No ${activeTab} proposals found`}
            action={activeTab === 'active' ? 'Create the first proposal' : undefined}
            onAction={() => setShowCreateDialog(true)}
          />
        )}
      </div>
      
      {/* Vote Dialog */}
      <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cast Your Vote</DialogTitle>
            <DialogDescription>
              {selectedProposal?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Your Voting Power</p>
              <p className="text-2xl font-bold">{votingPower.toLocaleString()}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                placeholder="Share your reasoning for this vote..."
                value={voteReason}
                onChange={(e) => setVoteReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowVoteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleVote('against')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Vote Against
            </Button>
            <Button 
              onClick={() => handleVote('for')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Vote For
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Proposal Dialog */}
      <CreateProposalDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={createProposal}
        votingPower={votingPower}
      />
    </div>
  );
}

// ==================== COMPONENT COMPONENTS ====================

function StatsCard({ 
  title, 
  value, 
  icon, 
  trend 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  trend: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-muted">
            {icon}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProposalCard({ 
  proposal, 
  onVote, 
  votingPower,
  isPending = false,
  isClosed = false
}: { 
  proposal: Proposal; 
  onVote: () => void;
  votingPower: number;
  isPending?: boolean;
  isClosed?: boolean;
}) {
  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
  const quorumPercentage = (totalVotes / proposal.quorumRequired) * 100;
  const hasVoted = proposal.userVote !== null;
  const timeRemaining = proposal.endTime - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
  
  return (
    <Card className={hasVoted ? 'border-primary/30' : ''}>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          {/* Left: Proposal Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getStatusVariant(proposal.status)}>
                    {proposal.status}
                  </Badge>
                  <Badge variant="outline">{proposal.category}</Badge>
                  {hasVoted && (
                    <Badge variant="secondary">
                      You voted {proposal.userVote}
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold">{proposal.title}</h3>
              </div>
            </div>
            
            <p className="text-muted-foreground mt-2 line-clamp-2">
              {proposal.description}
            </p>
            
            {/* Voting Progress */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">
                  For: {proposal.votesFor.toLocaleString()} ({forPercentage.toFixed(1)}%)
                </span>
                <span className="text-red-600">
                  Against: {proposal.votesAgainst.toLocaleString()} ({(100 - forPercentage).toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                <div 
                  className="bg-green-500 transition-all"
                  style={{ width: `${forPercentage}%` }}
                />
                <div 
                  className="bg-red-500 transition-all"
                  style={{ width: `${100 - forPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Quorum: {quorumPercentage.toFixed(1)}%</span>
                <span>Required: {proposal.quorumRequired.toLocaleString()}</span>
              </div>
            </div>
            
            {/* Author & Meta */}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{proposal.author.name[0]}</AvatarFallback>
                </Avatar>
                <span>{proposal.author.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{proposal.commentCount} comments</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {isClosed ? (
                  <span>Ended {formatDate(proposal.endTime)}</span>
                ) : (
                  <span>{daysRemaining} days left</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Right: Action */}
          {!isClosed && !isPending && !hasVoted && (
            <div className="flex lg:flex-col gap-2">
              <Button onClick={onVote} className="w-full lg:w-auto">
                Vote Now
              </Button>
            </div>
          )}
          
          {isPending && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              Awaiting quorum
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateProposalDialog({ 
  open, 
  onOpenChange,
  onSubmit,
  votingPower
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSubmit: (proposal: Partial<Proposal>) => Promise<void>;
  votingPower: number;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const MIN_VOTING_POWER = 1000;
  const canCreate = votingPower >= MIN_VOTING_POWER;
  
  const handleSubmit = async () => {
    if (!title || !description || !category) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        category,
      });
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setCategory('');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Proposal</DialogTitle>
          <DialogDescription>
            Submit a proposal for the community to vote on
          </DialogDescription>
        </DialogHeader>
        
        {!canCreate ? (
          <div className="py-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Insufficient Voting Power</p>
            <p className="text-muted-foreground mt-2">
              You need at least {MIN_VOTING_POWER.toLocaleString()} voting power to create proposals.
              Current: {votingPower.toLocaleString()}
            </p>
            <Button className="mt-4" variant="outline" asChild>
              <a href="/dao/staking">Stake to Increase Power</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Enter proposal title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="parameter">Parameter Change</SelectItem>
                  <SelectItem value="treasury">Treasury</SelectItem>
                  <SelectItem value="governance">Governance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your proposal in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>
          </div>
        )}
        
        {canCreate && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!title || !description || !category || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ 
  message,
  action,
  onAction
}: { 
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="p-12 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground mb-4">{message}</p>
      {action && onAction && (
        <Button onClick={onAction}>
          {action}
          <Plus className="h-4 w-4 ml-1" />
        </Button>
      )}
    </Card>
  );
}

// ==================== HELPERS ====================

function getStatusVariant(status: ProposalStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'passed':
      return 'default';
    case 'rejected':
      return 'destructive';
    case 'expired':
      return 'outline';
    default:
      return 'secondary';
  }
}

function calculateParticipationRate(participated: string[], total: number): number {
  if (total === 0) return 100;
  return Math.round((participated.length / total) * 100);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
