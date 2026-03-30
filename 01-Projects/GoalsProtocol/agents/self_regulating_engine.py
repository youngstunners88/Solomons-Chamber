#!/usr/bin/env python3
"""
$GOALS Protocol - Self-Regulating & Self-Debugging Engine
Inspired by SAvoice - Autonomous agent health management
"""

import asyncio
import json
import logging
import traceback
import time
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import psutil
import redis
import sqlite3
from collections import deque

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HealthStatus(Enum):
    """Agent health states"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    CRITICAL = "critical"
    RECOVERING = "recovering"
    OFFLINE = "offline"


class IssueType(Enum):
    """Types of issues that can occur"""
    MEMORY_LEAK = "memory_leak"
    HIGH_CPU = "high_cpu"
    STALE_DATA = "stale_data"
    CONNECTION_LOST = "connection_lost"
    TRADE_FAILURE = "trade_failure"
    API_ERROR = "api_error"
    LATENCY_SPIKE = "latency_spike"
    STRATEGY_DEGRADATION = "strategy_degradation"


@dataclass
class HealthMetrics:
    """Current health metrics"""
    timestamp: datetime
    cpu_percent: float
    memory_mb: float
    memory_percent: float
    latency_ms: float
    trades_per_minute: float
    error_rate: float
    uptime_seconds: int
    last_trade_time: Optional[datetime]
    last_data_update: Optional[datetime]


@dataclass
class Issue:
    """Detected issue"""
    issue_type: IssueType
    severity: str  # 'low', 'medium', 'high', 'critical'
    description: str
    detected_at: datetime
    auto_resolvable: bool
    suggested_action: str


@dataclass
class RemediationAction:
    """Remediation that was taken"""
    action_type: str
    description: str
    taken_at: datetime
    success: bool
    result: str


class SelfRegulatingEngine:
    """
    Self-regulating engine for $GOALS agents
    Monitors health, detects issues, auto-remediates
    """
    
    def __init__(self, agent_id: str, config: Dict):
        self.agent_id = agent_id
        self.config = config
        
        # State
        self.health_status = HealthStatus.HEALTHY
        self.metrics_history: deque = deque(maxlen=1000)
        self.issues: List[Issue] = []
        self.remediations: List[RemediationAction] = []
        self.consecutive_errors = 0
        self.start_time = datetime.now()
        
        # Thresholds
        self.thresholds = {
            'max_memory_mb': config.get('max_memory_mb', 1024),
            'max_cpu_percent': config.get('max_cpu_percent', 80),
            'max_latency_ms': config.get('max_latency_ms', 1000),
            'max_error_rate': config.get('max_error_rate', 0.1),
            'stale_data_minutes': config.get('stale_data_minutes', 10),
            'max_consecutive_errors': config.get('max_consecutive_errors', 5),
        }
        
        # Redis for state sharing
        self.redis = redis.Redis(
            host=config.get('redis_host', 'localhost'),
            port=config.get('redis_port', 6379),
            decode_responses=True
        )
        
        # SQLite for persistent diagnostics
        self.db_path = f"data/agents/{agent_id}_diagnostics.db"
        self._init_database()
        
        # Callbacks
        self.on_health_change: Optional[Callable] = None
        self.on_critical: Optional[Callable] = None
        self.on_remediation: Optional[Callable] = None
        
        logger.info(f"🩺 SelfRegulatingEngine initialized for {agent_id}")
    
    def _init_database(self):
        """Initialize diagnostics database"""
        import os
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS health_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                cpu_percent REAL,
                memory_mb REAL,
                memory_percent REAL,
                latency_ms REAL,
                trades_per_minute REAL,
                error_rate REAL,
                uptime_seconds INTEGER,
                health_status TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS issues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                issue_type TEXT,
                severity TEXT,
                description TEXT,
                auto_resolvable BOOLEAN,
                auto_resolved BOOLEAN DEFAULT FALSE,
                resolution TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS remediations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                action_type TEXT,
                description TEXT,
                success BOOLEAN,
                result TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
    
    async def start_monitoring(self):
        """Start continuous health monitoring"""
        logger.info(f"🔍 {self.agent_id}: Starting health monitoring...")
        
        while True:
            try:
                # Collect metrics
                metrics = await self._collect_metrics()
                self.metrics_history.append(metrics)
                
                # Store metrics
                self._store_metrics(metrics)
                
                # Publish to Redis
                self._publish_metrics(metrics)
                
                # Check health
                await self._check_health(metrics)
                
                # Wait before next check
                await asyncio.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                logger.error(f"Monitoring error: {e}")
                await asyncio.sleep(30)
    
    async def _collect_metrics(self) -> HealthMetrics:
        """Collect current system metrics"""
        process = psutil.Process()
        
        # CPU and Memory
        cpu_percent = process.cpu_percent(interval=1)
        memory_info = process.memory_info()
        memory_mb = memory_info.rss / 1024 / 1024
        memory_percent = process.memory_percent()
        
        # Calculate latency (last operation)
        latency_ms = self._get_last_operation_latency()
        
        # Calculate trades per minute
        trades_per_minute = self._calculate_trade_rate()
        
        # Calculate error rate
        error_rate = self._calculate_error_rate()
        
        # Uptime
        uptime_seconds = int((datetime.now() - self.start_time).total_seconds())
        
        return HealthMetrics(
            timestamp=datetime.now(),
            cpu_percent=cpu_percent,
            memory_mb=memory_mb,
            memory_percent=memory_percent,
            latency_ms=latency_ms,
            trades_per_minute=trades_per_minute,
            error_rate=error_rate,
            uptime_seconds=uptime_seconds,
            last_trade_time=self._get_last_trade_time(),
            last_data_update=self._get_last_data_update()
        )
    
    def _get_last_operation_latency(self) -> float:
        """Get latency of last operation from Redis"""
        latency = self.redis.get(f"agent:{self.agent_id}:last_latency_ms")
        return float(latency) if latency else 0.0
    
    def _get_last_trade_time(self) -> Optional[datetime]:
        """Get timestamp of last trade"""
        trade_time = self.redis.get(f"agent:{self.agent_id}:last_trade_time")
        if trade_time:
            return datetime.fromisoformat(trade_time)
        return None
    
    def _get_last_data_update(self) -> Optional[datetime]:
        """Get timestamp of last data update"""
        update_time = self.redis.get(f"agent:{self.agent_id}:last_data_update")
        if update_time:
            return datetime.fromisoformat(update_time)
        return None
    
    def _calculate_trade_rate(self) -> float:
        """Calculate trades per minute"""
        # Get trade count from last 5 minutes
        five_mins_ago = datetime.now() - timedelta(minutes=5)
        count = sum(1 for m in self.metrics_history 
                   if m.timestamp > five_mins_ago and m.trades_per_minute > 0)
        return count / 5.0
    
    def _calculate_error_rate(self) -> float:
        """Calculate error rate from recent history"""
        if len(self.metrics_history) < 10:
            return 0.0
        
        recent = list(self.metrics_history)[-10:]
        errors = sum(1 for m in recent if m.error_rate > 0)
        return errors / len(recent)
    
    def _store_metrics(self, metrics: HealthMetrics):
        """Store metrics in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO health_metrics 
            (timestamp, cpu_percent, memory_mb, memory_percent, latency_ms, 
             trades_per_minute, error_rate, uptime_seconds, health_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            metrics.timestamp.isoformat(),
            metrics.cpu_percent,
            metrics.memory_mb,
            metrics.memory_percent,
            metrics.latency_ms,
            metrics.trades_per_minute,
            metrics.error_rate,
            metrics.uptime_seconds,
            self.health_status.value
        ))
        
        conn.commit()
        conn.close()
    
    def _publish_metrics(self, metrics: HealthMetrics):
        """Publish metrics to Redis"""
        self.redis.hset(f"agent:{self.agent_id}:health", mapping={
            'timestamp': metrics.timestamp.isoformat(),
            'cpu_percent': metrics.cpu_percent,
            'memory_mb': metrics.memory_mb,
            'memory_percent': metrics.memory_percent,
            'latency_ms': metrics.latency_ms,
            'trades_per_minute': metrics.trades_per_minute,
            'error_rate': metrics.error_rate,
            'uptime_seconds': metrics.uptime_seconds,
            'health_status': self.health_status.value
        })
        
        # Set expiry (if no updates for 5 minutes, agent considered dead)
        self.redis.expire(f"agent:{self.agent_id}:health", 300)
    
    async def _check_health(self, metrics: HealthMetrics):
        """Check health and detect issues"""
        issues_detected = []
        
        # Check 1: Memory usage
        if metrics.memory_mb > self.thresholds['max_memory_mb']:
            issues_detected.append(Issue(
                issue_type=IssueType.MEMORY_LEAK,
                severity='high',
                description=f"Memory usage: {metrics.memory_mb:.1f}MB (limit: {self.thresholds['max_memory_mb']}MB)",
                detected_at=datetime.now(),
                auto_resolvable=True,
                suggested_action="restart_agent"
            ))
        
        # Check 2: CPU usage
        if metrics.cpu_percent > self.thresholds['max_cpu_percent']:
            issues_detected.append(Issue(
                issue_type=IssueType.HIGH_CPU,
                severity='medium',
                description=f"CPU usage: {metrics.cpu_percent:.1f}%",
                detected_at=datetime.now(),
                auto_resolvable=True,
                suggested_action="throttle_operations"
            ))
        
        # Check 3: Stale data
        if metrics.last_data_update:
            minutes_since_update = (datetime.now() - metrics.last_data_update).total_seconds() / 60
            if minutes_since_update > self.thresholds['stale_data_minutes']:
                issues_detected.append(Issue(
                    issue_type=IssueType.STALE_DATA,
                    severity='high',
                    description=f"No data update for {minutes_since_update:.1f} minutes",
                    detected_at=datetime.now(),
                    auto_resolvable=True,
                    suggested_action="reconnect_data_stream"
                ))
        
        # Check 4: High latency
        if metrics.latency_ms > self.thresholds['max_latency_ms']:
            issues_detected.append(Issue(
                issue_type=IssueType.LATENCY_SPIKE,
                severity='medium',
                description=f"Latency: {metrics.latency_ms:.0f}ms (limit: {self.thresholds['max_latency_ms']}ms)",
                detected_at=datetime.now(),
                auto_resolvable=True,
                suggested_action="reduce_load"
            ))
        
        # Check 5: High error rate
        if metrics.error_rate > self.thresholds['max_error_rate']:
            issues_detected.append(Issue(
                issue_type=IssueType.API_ERROR,
                severity='critical',
                description=f"Error rate: {metrics.error_rate:.1%}",
                detected_at=datetime.now(),
                auto_resolvable=False,
                suggested_action="manual_investigation"
            ))
            self.consecutive_errors += 1
        else:
            if self.consecutive_errors > 0:
                self.consecutive_errors -= 1
        
        # Process detected issues
        for issue in issues_detected:
            await self._handle_issue(issue)
        
        # Update health status
        await self._update_health_status(issues_detected)
    
    async def _handle_issue(self, issue: Issue):
        """Handle detected issue"""
        logger.warning(f"🚨 {self.agent_id}: Issue detected - {issue.description}")
        
        # Store issue
        self._store_issue(issue)
        self.issues.append(issue)
        
        # Auto-remediate if possible
        if issue.auto_resolvable:
            await self._auto_remediate(issue)
        else:
            # Alert for manual intervention
            await self._alert_critical(issue)
    
    def _store_issue(self, issue: Issue):
        """Store issue in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO issues 
            (timestamp, issue_type, severity, description, auto_resolvable)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            issue.detected_at.isoformat(),
            issue.issue_type.value,
            issue.severity,
            issue.description,
            issue.auto_resolvable
        ))
        
        conn.commit()
        conn.close()
    
    async def _auto_remediate(self, issue: Issue):
        """Automatically remediate issue"""
        logger.info(f"🔧 {self.agent_id}: Auto-remediating {issue.issue_type.value}...")
        
        remediation = None
        
        if issue.issue_type == IssueType.MEMORY_LEAK:
            # Action: Clear caches and force garbage collection
            remediation = await self._action_clear_caches()
            
        elif issue.issue_type == IssueType.HIGH_CPU:
            # Action: Throttle operations
            remediation = await self._action_throttle()
            
        elif issue.issue_type == IssueType.STALE_DATA:
            # Action: Reconnect data stream
            remediation = await self._action_reconnect_data()
            
        elif issue.issue_type == IssueType.LATENCY_SPIKE:
            # Action: Reduce load
            remediation = await self._action_reduce_load()
            
        elif issue.issue_type == IssueType.CONNECTION_LOST:
            # Action: Restart connections
            remediation = await self._action_restart_connections()
        
        if remediation:
            self.remediations.append(remediation)
            self._store_remediation(remediation)
            
            if remediation.success:
                logger.info(f"✅ {self.agent_id}: Remediation successful - {remediation.result}")
            else:
                logger.error(f"❌ {self.agent_id}: Remediation failed - {remediation.result}")
                
            # Callback
            if self.on_remediation:
                await self.on_remediation(remediation)
    
    async def _action_clear_caches(self) -> RemediationAction:
        """Clear caches to free memory"""
        import gc
        
        initial_memory = psutil.Process().memory_info().rss / 1024 / 1024
        
        # Clear Redis caches
        self.redis.delete(f"agent:{self.agent_id}:cache:*")
        
        # Force garbage collection
        gc.collect()
        
        final_memory = psutil.Process().memory_info().rss / 1024 / 1024
        freed_mb = initial_memory - final_memory
        
        return RemediationAction(
            action_type="clear_caches",
            description="Cleared caches and forced garbage collection",
            taken_at=datetime.now(),
            success=freed_mb > 10,
            result=f"Freed {freed_mb:.1f}MB"
        )
    
    async def _action_throttle(self) -> RemediationAction:
        """Throttle operations to reduce CPU"""
        # Signal to agent to reduce frequency
        self.redis.set(f"agent:{self.agent_id}:throttle", "true", ex=300)
        
        return RemediationAction(
            action_type="throttle",
            description="Throttled operations for 5 minutes",
            taken_at=datetime.now(),
            success=True,
            result="Operations throttled"
        )
    
    async def _action_reconnect_data(self) -> RemediationAction:
        """Reconnect data stream"""
        # Signal to agent to reconnect
        self.redis.publish(f"agent:{self.agent_id}:commands", "reconnect_data")
        
        return RemediationAction(
            action_type="reconnect_data",
            description="Signaled agent to reconnect data stream",
            taken_at=datetime.now(),
            success=True,
            result="Reconnect signal sent"
        )
    
    async def _action_reduce_load(self) -> RemediationAction:
        """Reduce processing load"""
        # Reduce batch sizes, skip non-critical operations
        self.redis.set(f"agent:{self.agent_id}:reduced_load", "true", ex=600)
        
        return RemediationAction(
            action_type="reduce_load",
            description="Reduced load for 10 minutes",
            taken_at=datetime.now(),
            success=True,
            result="Load reduced"
        )
    
    async def _action_restart_connections(self) -> RemediationAction:
        """Restart all connections"""
        self.redis.publish(f"agent:{self.agent_id}:commands", "restart_connections")
        
        return RemediationAction(
            action_type="restart_connections",
            description="Restarted all connections",
            taken_at=datetime.now(),
            success=True,
            result="Connections restarted"
        )
    
    def _store_remediation(self, remediation: RemediationAction):
        """Store remediation in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO remediations 
            (timestamp, action_type, description, success, result)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            remediation.taken_at.isoformat(),
            remediation.action_type,
            remediation.description,
            remediation.success,
            remediation.result
        ))
        
        conn.commit()
        conn.close()
    
    async def _update_health_status(self, issues: List[Issue]):
        """Update overall health status"""
        old_status = self.health_status
        
        # Determine new status
        critical_count = sum(1 for i in issues if i.severity == 'critical')
        high_count = sum(1 for i in issues if i.severity == 'high')
        
        if critical_count > 0 or self.consecutive_errors >= self.thresholds['max_consecutive_errors']:
            new_status = HealthStatus.CRITICAL
        elif high_count > 0:
            new_status = HealthStatus.DEGRADED
        elif len(issues) > 0:
            new_status = HealthStatus.DEGRADED
        else:
            if self.health_status == HealthStatus.DEGRADED:
                new_status = HealthStatus.RECOVERING
            else:
                new_status = HealthStatus.HEALTHY
        
        # Update status
        if new_status != old_status:
            self.health_status = new_status
            logger.info(f"🏥 {self.agent_id}: Health status changed from {old_status.value} to {new_status.value}")
            
            # Callback
            if self.on_health_change:
                await self.on_health_change(old_status, new_status)
            
            if new_status == HealthStatus.CRITICAL and self.on_critical:
                await self.on_critical()
    
    async def _alert_critical(self, issue: Issue):
        """Alert for critical issues requiring manual intervention"""
        alert_data = {
            'agent_id': self.agent_id,
            'timestamp': datetime.now().isoformat(),
            'issue_type': issue.issue_type.value,
            'severity': issue.severity,
            'description': issue.description
        }
        
        # Publish to alert channel
        self.redis.publish("alerts:critical", json.dumps(alert_data))
        
        # Store for review
        self.redis.lpush(f"agent:{self.agent_id}:critical_alerts", json.dumps(alert_data))
        
        logger.critical(f"🔴 {self.agent_id}: CRITICAL ALERT - {issue.description}")
    
    # ============ Public API ============
    
    def get_health_report(self) -> Dict:
        """Get comprehensive health report"""
        return {
            'agent_id': self.agent_id,
            'health_status': self.health_status.value,
            'uptime_seconds': int((datetime.now() - self.start_time).total_seconds()),
            'consecutive_errors': self.consecutive_errors,
            'current_metrics': asdict(self.metrics_history[-1]) if self.metrics_history else None,
            'recent_issues': [{
                'type': i.issue_type.value,
                'severity': i.severity,
                'description': i.description,
                'detected_at': i.detected_at.isoformat()
            } for i in self.issues[-5:]],
            'recent_remediations': [{
                'action': r.action_type,
                'success': r.success,
                'result': r.result,
                'taken_at': r.taken_at.isoformat()
            } for r in self.remediations[-5:]]
        }
    
    def get_diagnostics(self) -> Dict:
        """Get detailed diagnostics from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get recent metrics
        cursor.execute('''
            SELECT * FROM health_metrics 
            ORDER BY timestamp DESC LIMIT 100
        ''')
        metrics = [dict(row) for row in cursor.fetchall()]
        
        # Get unresolved issues
        cursor.execute('''
            SELECT * FROM issues 
            WHERE auto_resolved = FALSE
            ORDER BY timestamp DESC LIMIT 20
        ''')
        issues = [dict(row) for row in cursor.fetchall()]
        
        # Get remediation success rate
        cursor.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful
            FROM remediations
        ''')
        remediation_stats = cursor.fetchone()
        
        conn.close()
        
        return {
            'metrics_history': metrics,
            'unresolved_issues': issues,
            'remediation_success_rate': (
                remediation_stats[1] / remediation_stats[0] 
                if remediation_stats[0] > 0 else 0
            )
        }
    
    async def force_self_heal(self):
        """Force self-healing sequence"""
        logger.info(f"🔄 {self.agent_id}: Forcing self-heal sequence...")
        
        # Sequence: Clear caches → Reconnect → Throttle → Restart
        await self._action_clear_caches()
        await asyncio.sleep(1)
        await self._action_reconnect_data()
        await asyncio.sleep(1)
        await self._action_throttle()
        
        self.health_status = HealthStatus.RECOVERING


# Example usage
if __name__ == "__main__":
    async def demo():
        engine = SelfRegulatingEngine(
            agent_id="goals_agent_001",
            config={
                'redis_host': 'localhost',
                'max_memory_mb': 512,
                'max_cpu_percent': 70
            }
        )
        
        # Start monitoring
        await engine.start_monitoring()
    
    asyncio.run(demo())
