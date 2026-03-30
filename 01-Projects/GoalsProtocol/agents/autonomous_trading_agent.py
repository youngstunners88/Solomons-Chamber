"""
Soccer Souls - Autonomous Trading Agent
24/7 AI agent that manages NFT portfolio, trades player cards, and optimizes returns
Inspired by autonomous agent systems like those demonstrated by 0xwast3
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentState(Enum):
    """Agent operational states"""
    IDLE = "idle"
    ANALYZING = "analyzing"
    TRADING = "trading"
    MONITORING = "monitoring"
    EMERGENCY = "emergency"


class RiskLevel(Enum):
    """Risk assessment levels"""
    LOW = 0.1
    MEDIUM = 0.25
    HIGH = 0.5
    EXTREME = 0.75


@dataclass
class TradeDecision:
    """Autonomous trading decision"""
    action: str  # BUY, SELL, HOLD
    player_id: str
    confidence: float  # 0-1
    expected_return: float  # percentage
    risk_score: float  # 0-1
    position_size: float  # percentage of portfolio
    reasoning: List[str]
    timestamp: datetime


@dataclass
class PortfolioState:
    """Current portfolio state"""
    total_value: float
    cash_balance: float
    nft_holdings: Dict[str, Dict[str, Any]]  # player_id -> {quantity, avg_price, current_price}
    unrealized_pnl: float
    realized_pnl: float
    last_rebalanced: datetime


class AutonomousTradingAgent:
    """
    Fully autonomous AI trading agent for Soccer Souls NFTs
    
    Capabilities:
    - 24/7 market monitoring
    - Autonomous trade execution
    - Risk management
    - Portfolio rebalancing
    - Social sentiment analysis
    - On-chain data analysis
    """
    
    def __init__(
        self,
        agent_id: str,
        nft_wallet_address: str,
        initial_capital: float = 10000.0,
        risk_tolerance: RiskLevel = RiskLevel.MEDIUM,
        max_positions: int = 10
    ):
        self.agent_id = agent_id
        self.wallet_address = nft_wallet_address
        self.initial_capital = initial_capital
        self.risk_tolerance = risk_tolerance
        self.max_positions = max_positions
        
        # State
        self.state = AgentState.IDLE
        self.portfolio = PortfolioState(
            total_value=initial_capital,
            cash_balance=initial_capital,
            nft_holdings={},
            unrealized_pnl=0.0,
            realized_pnl=0.0,
            last_rebalanced=datetime.now()
        )
        
        # Configuration
        self.config = {
            'stop_loss_pct': 0.10,  # 10% stop loss
            'take_profit_pct': 0.25,  # 25% take profit
            'max_position_size': 0.20,  # 20% max per position
            'min_confidence_threshold': 0.65,
            'rebalance_interval_hours': 24,
            'scan_interval_minutes': 5
        }
        
        # Performance tracking
        self.trade_history: List[TradeDecision] = []
        self.performance_metrics = {
            'total_trades': 0,
            'winning_trades': 0,
            'losing_trades': 0,
            'avg_return': 0.0,
            'sharpe_ratio': 0.0,
            'max_drawdown': 0.0
        }
        
        logger.info(f"Agent {agent_id} initialized with {initial_capital} USDC")
    
    async def start(self):
        """Start the autonomous agent loop"""
        logger.info(f"🚀 Agent {self.agent_id} starting autonomous operations...")
        self.state = AgentState.MONITORING
        
        while True:
            try:
                await self._operation_cycle()
                await asyncio.sleep(self.config['scan_interval_minutes'] * 60)
            except Exception as e:
                logger.error(f"Agent error: {e}")
                self.state = AgentState.EMERGENCY
                await asyncio.sleep(60)  # Wait before retrying
    
    async def _operation_cycle(self):
        """Main operation cycle"""
        logger.debug(f"Agent cycle started - State: {self.state.value}")
        
        # 1. Update market data
        market_data = await self._fetch_market_data()
        
        # 2. Update portfolio valuations
        await self._update_portfolio_value(market_data)
        
        # 3. Check risk management rules
        await self._check_risk_management()
        
        # 4. Scan for opportunities
        opportunities = await self._scan_opportunities(market_data)
        
        # 5. Evaluate and execute trades
        for opp in opportunities[:3]:  # Top 3 opportunities
            decision = await self._evaluate_opportunity(opp, market_data)
            if decision and decision.confidence >= self.config['min_confidence_threshold']:
                await self._execute_trade(decision)
        
        # 6. Periodic rebalancing
        if datetime.now() - self.portfolio.last_rebalanced > timedelta(
            hours=self.config['rebalance_interval_hours']
        ):
            await self._rebalance_portfolio()
        
        # 7. Log state
        await self._log_state()
    
    async def _fetch_market_data(self) -> Dict[str, Any]:
        """Fetch real-time market data"""
        self.state = AgentState.ANALYZING
        
        # In production, this would fetch from:
        # - NFT marketplace APIs (OpenSea, Blur, etc.)
        # - On-chain data (player performance, match results)
        # - Social sentiment (Twitter, Discord)
        
        # Simulated data for demonstration
        return {
            'timestamp': datetime.now().isoformat(),
            'market_sentiment': random.choice(['bullish', 'neutral', 'bearish']),
            'market_volatility': random.uniform(0.1, 0.5),
            'top_movers': [
                {'player_id': f'player_{i}', 'change_24h': random.uniform(-20, 50)}
                for i in range(10)
            ],
            'floor_prices': {
                f'player_{i}': random.uniform(0.5, 10.0)
                for i in range(100)
            }
        }
    
    async def _update_portfolio_value(self, market_data: Dict):
        """Update portfolio valuations"""
        total_nft_value = 0.0
        unrealized_pnl = 0.0
        
        for player_id, holding in self.portfolio.nft_holdings.items():
            current_price = market_data['floor_prices'].get(player_id, holding['avg_price'])
            quantity = holding['quantity']
            avg_price = holding['avg_price']
            
            market_value = quantity * current_price
            cost_basis = quantity * avg_price
            
            total_nft_value += market_value
            unrealized_pnl += (market_value - cost_basis)
            
            # Update holding
            holding['current_price'] = current_price
        
        self.portfolio.total_value = self.portfolio.cash_balance + total_nft_value
        self.portfolio.unrealized_pnl = unrealized_pnl
    
    async def _check_risk_management(self):
        """Check and enforce risk management rules"""
        current_value = self.portfolio.total_value
        peak_value = self.initial_capital  # Simplified
        
        # Check max drawdown
        drawdown = (peak_value - current_value) / peak_value if peak_value > 0 else 0
        if drawdown > 0.30:  # 30% max drawdown
            logger.warning(f"🚨 MAX DRAWDOWN BREACH: {drawdown:.2%}")
            await self._emergency_liquidation()
            return
        
        # Check individual positions for stop loss / take profit
        for player_id, holding in list(self.portfolio.nft_holdings.items()):
            avg_price = holding['avg_price']
            current_price = holding.get('current_price', avg_price)
            
            if avg_price > 0:
                price_change = (current_price - avg_price) / avg_price
                
                if price_change <= -self.config['stop_loss_pct']:
                    logger.info(f"🛑 Stop loss triggered for {player_id}: {price_change:.2%}")
                    await self._liquidate_position(player_id, 'stop_loss')
                
                elif price_change >= self.config['take_profit_pct']:
                    logger.info(f"🎯 Take profit triggered for {player_id}: {price_change:.2%}")
                    await self._liquidate_position(player_id, 'take_profit')
    
    async def _scan_opportunities(self, market_data: Dict) -> List[Dict]:
        """Scan for trading opportunities"""
        opportunities = []
        
        for player_id, floor_price in market_data['floor_prices'].items():
            # Skip if already at max positions
            if len(self.portfolio.nft_holdings) >= self.max_positions:
                if player_id not in self.portfolio.nft_holdings:
                    continue
            
            # AI-driven opportunity scoring
            score = await self._calculate_opportunity_score(player_id, floor_price, market_data)
            
            if score > 0.6:  # Threshold for consideration
                opportunities.append({
                    'player_id': player_id,
                    'price': floor_price,
                    'score': score,
                    'sentiment': market_data['market_sentiment']
                })
        
        # Sort by score
        opportunities.sort(key=lambda x: x['score'], reverse=True)
        return opportunities
    
    async def _calculate_opportunity_score(
        self, 
        player_id: str, 
        price: float,
        market_data: Dict
    ) -> float:
        """
        AI-driven opportunity scoring
        Combines multiple factors into a single score (0-1)
        """
        scores = []
        
        # 1. Momentum score (30%)
        momentum = random.uniform(0, 1)  # In production: calculate from price history
        scores.append(('momentum', momentum, 0.30))
        
        # 2. Value score (25%)
        # Lower price = higher score (mean reversion assumption)
        value_score = 1 - min(price / 10.0, 1.0)
        scores.append(('value', value_score, 0.25))
        
        # 3. Sentiment score (20%)
        sentiment_map = {'bullish': 1.0, 'neutral': 0.5, 'bearish': 0.0}
        sentiment_score = sentiment_map.get(market_data['market_sentiment'], 0.5)
        scores.append(('sentiment', sentiment_score, 0.20))
        
        # 4. Rarity score (15%)
        # Extract rarity from player_id or metadata
        rarity = random.choice(['common', 'rare', 'epic', 'legendary'])
        rarity_scores = {'common': 0.3, 'rare': 0.5, 'epic': 0.8, 'legendary': 1.0}
        rarity_score = rarity_scores.get(rarity, 0.3)
        scores.append(('rarity', rarity_score, 0.15))
        
        # 5. Liquidity score (10%)
        # Higher volume = better liquidity
        liquidity_score = random.uniform(0.3, 1.0)
        scores.append(('liquidity', liquidity_score, 0.10))
        
        # Calculate weighted average
        total_score = sum(score * weight for _, score, weight in scores)
        
        return total_score
    
    async def _evaluate_opportunity(
        self, 
        opp: Dict, 
        market_data: Dict
    ) -> Optional[TradeDecision]:
        """Evaluate a specific opportunity and make a decision"""
        
        player_id = opp['player_id']
        current_price = opp['price']
        
        # Check if we already hold this position
        if player_id in self.portfolio.nft_holdings:
            holding = self.portfolio.nft_holdings[player_id]
            avg_price = holding['avg_price']
            
            # Evaluate if we should add or reduce
            if current_price < avg_price * 0.9:  # Price dropped 10%
                # Opportunity to average down
                return TradeDecision(
                    action='BUY',
                    player_id=player_id,
                    confidence=opp['score'],
                    expected_return=0.20,
                    risk_score=0.4,
                    position_size=0.05,
                    reasoning=[
                        f"Price dropped {(1 - current_price/avg_price)*100:.1f}% from avg",
                        f"Opportunity score: {opp['score']:.2f}",
                        f"Market sentiment: {opp['sentiment']}"
                    ],
                    timestamp=datetime.now()
                )
            else:
                return None  # Hold existing position
        
        else:
            # New position evaluation
            expected_return = opp['score'] * 0.5  # Simplified
            risk_score = 1 - opp['score']
            
            # Calculate position size based on Kelly Criterion (simplified)
            win_prob = opp['score']
            win_loss_ratio = expected_return / 0.10  # Assume 10% loss
            kelly_fraction = win_prob - ((1 - win_prob) / win_loss_ratio) if win_loss_ratio > 0 else 0
            position_size = min(
                kelly_fraction * 0.5,  # Half-Kelly for safety
                self.config['max_position_size'],
                self.portfolio.cash_balance * 0.95 / current_price if current_price > 0 else 0
            )
            
            return TradeDecision(
                action='BUY',
                player_id=player_id,
                confidence=opp['score'],
                expected_return=expected_return,
                risk_score=risk_score,
                position_size=position_size,
                reasoning=[
                    f"Opportunity score: {opp['score']:.2f}",
                    f"Expected return: {expected_return:.1%}",
                    f"Market sentiment: {opp['sentiment']}",
                    f"Risk score: {risk_score:.2f}"
                ],
                timestamp=datetime.now()
            )
    
    async def _execute_trade(self, decision: TradeDecision):
        """Execute a trade decision"""
        self.state = AgentState.TRADING
        
        logger.info(f"🔄 EXECUTING: {decision.action} {decision.player_id}")
        logger.info(f"   Confidence: {decision.confidence:.2f}")
        logger.info(f"   Position Size: {decision.position_size:.2f}")
        logger.info(f"   Reasoning: {', '.join(decision.reasoning)}")
        
        # In production, this would:
        # 1. Submit transaction to blockchain
        # 2. Wait for confirmation
        # 3. Update portfolio state
        
        # Simulate execution
        await asyncio.sleep(1)
        
        # Update portfolio (simplified)
        if decision.action == 'BUY':
            # Calculate cost
            price = 1.0  # Simplified
            cost = decision.position_size * price
            
            if cost <= self.portfolio.cash_balance:
                self.portfolio.cash_balance -= cost
                
                if decision.player_id in self.portfolio.nft_holdings:
                    # Update existing position
                    holding = self.portfolio.nft_holdings[decision.player_id]
                    total_cost = holding['quantity'] * holding['avg_price'] + cost
                    total_qty = holding['quantity'] + decision.position_size
                    holding['avg_price'] = total_cost / total_qty
                    holding['quantity'] = total_qty
                else:
                    # New position
                    self.portfolio.nft_holdings[decision.player_id] = {
                        'quantity': decision.position_size,
                        'avg_price': price,
                        'current_price': price
                    }
                
                self.trade_history.append(decision)
                self.performance_metrics['total_trades'] += 1
                logger.info(f"✅ BUY executed: {decision.player_id}")
        
        elif decision.action == 'SELL':
            # Similar logic for selling
            pass
        
        self.state = AgentState.MONITORING
    
    async def _liquidate_position(self, player_id: str, reason: str):
        """Liquidate a position"""
        if player_id not in self.portfolio.nft_holdings:
            return
        
        holding = self.portfolio.nft_holdings[player_id]
        quantity = holding['quantity']
        avg_price = holding['avg_price']
        current_price = holding.get('current_price', avg_price)
        
        proceeds = quantity * current_price
        pnl = proceeds - (quantity * avg_price)
        
        self.portfolio.cash_balance += proceeds
        del self.portfolio.nft_holdings[player_id]
        
        if pnl > 0:
            self.performance_metrics['winning_trades'] += 1
            self.portfolio.realized_pnl += pnl
        else:
            self.performance_metrics['losing_trades'] += 1
            self.portfolio.realized_pnl += pnl
        
        logger.info(f"💸 LIQUIDATED {player_id} - Reason: {reason}, PnL: {pnl:.2f}")
    
    async def _emergency_liquidation(self):
        """Emergency liquidation of all positions"""
        logger.warning("🚨 EMERGENCY LIQUIDATION INITIATED")
        
        for player_id in list(self.portfolio.nft_holdings.keys()):
            await self._liquidate_position(player_id, 'emergency')
        
        self.state = AgentState.EMERGENCY
    
    async def _rebalance_portfolio(self):
        """Rebalance portfolio to target allocations"""
        logger.info("🔄 Rebalancing portfolio...")
        
        # Target: 80% NFTs, 20% cash
        target_nft_allocation = 0.80
        current_nft_value = sum(
            h['quantity'] * h.get('current_price', h['avg_price'])
            for h in self.portfolio.nft_holdings.values()
        )
        
        current_allocation = current_nft_value / self.portfolio.total_value if self.portfolio.total_value > 0 else 0
        
        if abs(current_allocation - target_nft_allocation) > 0.10:  # 10% threshold
            logger.info(f"Allocation drift: {current_allocation:.1%} vs target {target_nft_allocation:.1%}")
            # Implement rebalancing logic
        
        self.portfolio.last_rebalanced = datetime.now()
    
    async def _log_state(self):
        """Log current agent state"""
        logger.info(f"\n📊 AGENT STATE: {self.agent_id}")
        logger.info(f"   Total Value: ${self.portfolio.total_value:,.2f}")
        logger.info(f"   Cash: ${self.portfolio.cash_balance:,.2f}")
        logger.info(f"   Unrealized PnL: ${self.portfolio.unrealized_pnl:,.2f}")
        logger.info(f"   Realized PnL: ${self.portfolio.realized_pnl:,.2f}")
        logger.info(f"   Positions: {len(self.portfolio.nft_holdings)}")
        logger.info(f"   Total Trades: {self.performance_metrics['total_trades']}")
        logger.info(f"   Win Rate: {self.performance_metrics['winning_trades'] / max(self.performance_metrics['total_trades'], 1):.1%}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        return {
            'agent_id': self.agent_id,
            'state': self.state.value,
            'portfolio': asdict(self.portfolio),
            'metrics': self.performance_metrics,
            'config': self.config
        }


class AgentSwarm:
    """
    Manage multiple autonomous trading agents
    """
    
    def __init__(self):
        self.agents: Dict[str, AutonomousTradingAgent] = {}
    
    def create_agent(
        self,
        agent_id: str,
        wallet_address: str,
        strategy: str = 'balanced'
    ) -> AutonomousTradingAgent:
        """Create a new autonomous agent"""
        
        strategies = {
            'conservative': {'risk': RiskLevel.LOW, 'capital': 5000},
            'balanced': {'risk': RiskLevel.MEDIUM, 'capital': 10000},
            'aggressive': {'risk': RiskLevel.HIGH, 'capital': 20000},
            'degen': {'risk': RiskLevel.EXTREME, 'capital': 50000}
        }
        
        config = strategies.get(strategy, strategies['balanced'])
        
        agent = AutonomousTradingAgent(
            agent_id=agent_id,
            nft_wallet_address=wallet_address,
            initial_capital=config['capital'],
            risk_tolerance=config['risk']
        )
        
        self.agents[agent_id] = agent
        logger.info(f"🤖 Agent created: {agent_id} ({strategy} strategy)")
        
        return agent
    
    async def run_all(self):
        """Run all agents in parallel"""
        tasks = [agent.start() for agent in self.agents.values()]
        await asyncio.gather(*tasks)
    
    def get_swarm_stats(self) -> Dict:
        """Get aggregate stats for all agents"""
        total_value = sum(a.portfolio.total_value for a in self.agents.values())
        total_pnl = sum(a.portfolio.realized_pnl for a in self.agents.values())
        total_trades = sum(a.performance_metrics['total_trades'] for a in self.agents.values())
        
        return {
            'agent_count': len(self.agents),
            'total_value': total_value,
            'total_realized_pnl': total_pnl,
            'total_trades': total_trades,
            'agents': {aid: agent.get_status() for aid, agent in self.agents.items()}
        }


# Example usage
if __name__ == "__main__":
    async def demo():
        # Create agent swarm
        swarm = AgentSwarm()
        
        # Create multiple agents with different strategies
        agent1 = swarm.create_agent(
            agent_id="souls_trader_001",
            wallet_address="0x1234...abcd",
            strategy="balanced"
        )
        
        agent2 = swarm.create_agent(
            agent_id="souls_trader_002", 
            wallet_address="0x5678...efgh",
            strategy="aggressive"
        )
        
        # Run for a few cycles (demo)
        logger.info("\n" + "="*50)
        logger.info("SOCCER SOULS - AUTONOMOUS TRADING AGENT DEMO")
        logger.info("="*50 + "\n")
        
        # Simulate a few trading cycles
        for i in range(3):
            logger.info(f"\n🔄 CYCLE {i+1}")
            logger.info("-" * 50)
            await agent1._operation_cycle()
            await asyncio.sleep(0.5)
        
        # Print final stats
        stats = swarm.get_swarm_stats()
        logger.info("\n" + "="*50)
        logger.info("FINAL SWARM STATISTICS")
        logger.info("="*50)
        logger.info(json.dumps(stats, indent=2, default=str))
    
    # Run demo
    asyncio.run(demo())
