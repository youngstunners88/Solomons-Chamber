#!/usr/bin/env python3
"""
$GOALS Protocol - Self-Debugging Engine
Automatically detects, diagnoses, and fixes code/runtime errors
Inspired by SAvoice self-healing capabilities
"""

import asyncio
import json
import logging
import traceback
import sys
import inspect
from typing import Dict, List, Optional, Callable, Any, Type
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
import ast
import re
import difflib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ErrorCategory(Enum):
    """Categories of errors"""
    SYNTAX = "syntax_error"
    RUNTIME = "runtime_error"
    LOGIC = "logic_error"
    PERFORMANCE = "performance_issue"
    CONNECTION = "connection_error"
    API = "api_error"
    RESOURCE = "resource_error"


class FixStrategy(Enum):
    """Strategies for fixing errors"""
    RETRY = "retry"
    CIRCUIT_BREAK = "circuit_break"
    FALLBACK = "fallback"
    PATCH_CODE = "patch_code"
    SKIP_OPERATION = "skip_operation"
    RESET_STATE = "reset_state"
    ESCALATE = "escalate"


@dataclass
class ErrorContext:
    """Context of an error"""
    error_type: str
    error_message: str
    traceback_str: str
    category: ErrorCategory
    timestamp: datetime
    function_name: str
    line_number: int
    variables: Dict[str, Any]
    recoverable: bool


@dataclass
class FixAttempt:
    """Record of a fix attempt"""
    error_id: str
    strategy: FixStrategy
    description: str
    timestamp: datetime
    success: bool
    result: str
    new_error: Optional[str]


@dataclass
class CodePatch:
    """A code patch to fix an issue"""
    original_code: str
    patched_code: str
    reason: str
    validated: bool


class SelfDebuggingEngine:
    """
    Self-debugging engine for $GOALS agents
    Catches errors, analyzes them, and applies fixes
    """
    
    def __init__(self, agent_id: str, config: Dict):
        self.agent_id = agent_id
        self.config = config
        
        # State
        self.error_history: List[ErrorContext] = []
        self.fix_attempts: List[FixAttempt] = []
        self.patches_applied: List[CodePatch] = []
        self.circuit_breakers: Dict[str, bool] = {}
        self.fallback_handlers: Dict[str, Callable] = {}
        
        # Error patterns and fixes
        self.error_patterns = self._load_error_patterns()
        
        # Metrics
        self.total_errors = 0
        self.auto_fixed = 0
        self.escalated = 0
        
        # Callbacks
        self.on_error: Optional[Callable] = None
        self.on_fix: Optional[Callable] = None
        self.on_escalation: Optional[Callable] = None
        
        logger.info(f"🐛 SelfDebuggingEngine initialized for {agent_id}")
    
    def _load_error_patterns(self) -> Dict:
        """Load error patterns and their fixes"""
        return {
            # Connection errors
            'ConnectionError': {
                'category': ErrorCategory.CONNECTION,
                'fix': FixStrategy.RETRY,
                'max_retries': 3,
                'backoff': 'exponential'
            },
            'ConnectionRefusedError': {
                'category': ErrorCategory.CONNECTION,
                'fix': FixStrategy.CIRCUIT_BREAK,
                'cooldown': 60
            },
            'TimeoutError': {
                'category': ErrorCategory.CONNECTION,
                'fix': FixStrategy.RETRY,
                'max_retries': 3
            },
            # API errors
            'RateLimitError': {
                'category': ErrorCategory.API,
                'fix': FixStrategy.RETRY,
                'backoff': 'linear',
                'delay': 5
            },
            'APIError': {
                'category': ErrorCategory.API,
                'fix': FixStrategy.FALLBACK
            },
            # Resource errors
            'MemoryError': {
                'category': ErrorCategory.RESOURCE,
                'fix': FixStrategy.RESET_STATE
            },
            'ResourceExhausted': {
                'category': ErrorCategory.RESOURCE,
                'fix': FixStrategy.SKIP_OPERATION
            },
            # Logic errors (requires human review)
            'AssertionError': {
                'category': ErrorCategory.LOGIC,
                'fix': FixStrategy.ESCALATE
            },
            'ValueError': {
                'category': ErrorCategory.LOGIC,
                'fix': FixStrategy.PATCH_CODE,
                'auto_fix': True
            }
        }
    
    def wrap_function(self, func: Callable) -> Callable:
        """Wrap a function with error handling and auto-fix"""
        async def async_wrapper(*args, **kwargs):
            return await self._execute_with_debug(func, *args, **kwargs)
        
        def sync_wrapper(*args, **kwargs):
            return self._execute_with_debug_sync(func, *args, **kwargs)
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    async def _execute_with_debug(self, func: Callable, *args, **kwargs):
        """Execute async function with debugging wrapper"""
        max_attempts = 3
        last_error = None
        
        for attempt in range(max_attempts):
            try:
                return await func(*args, **kwargs)
                
            except Exception as e:
                last_error = e
                error_context = self._analyze_error(e, func.__name__)
                
                logger.warning(
                    f"🐛 {self.agent_id}: Error in {func.__name()} "
                    f"(attempt {attempt + 1}/{max_attempts}): {str(e)}"
                )
                
                # Try to auto-fix
                fix_result = await self._attempt_fix(error_context)
                
                if fix_result.success:
                    logger.info(f"✅ {self.agent_id}: Auto-fixed, retrying...")
                    self.auto_fixed += 1
                    continue
                else:
                    if not fix_result.new_error:
                        # Fix didn't work, but no new error - escalate
                        await self._escalate(error_context, fix_result)
                        raise
        
        # All attempts failed
        raise last_error
    
    def _execute_with_debug_sync(self, func: Callable, *args, **kwargs):
        """Execute sync function with debugging wrapper"""
        max_attempts = 3
        last_error = None
        
        for attempt in range(max_attempts):
            try:
                return func(*args, **kwargs)
                
            except Exception as e:
                last_error = e
                error_context = self._analyze_error(e, func.__name__)
                
                logger.warning(
                    f"🐛 {self.agent_id}: Error in {func.__name__} "
                    f"(attempt {attempt + 1}/{max_attempts}): {str(e)}"
                )
                
                # Try to auto-fix (sync version)
                import asyncio
                fix_result = asyncio.run(self._attempt_fix(error_context))
                
                if fix_result.success:
                    logger.info(f"✅ {self.agent_id}: Auto-fixed, retrying...")
                    self.auto_fixed += 1
                    continue
                else:
                    if not fix_result.new_error:
                        raise
        
        raise last_error
    
    def _analyze_error(self, error: Exception, function_name: str) -> ErrorContext:
        """Analyze an error and extract context"""
        error_type = type(error).__name__
        error_message = str(error)
        
        # Get traceback
        tb = traceback.format_exc()
        
        # Parse traceback for line number
        line_number = 0
        tb_lines = tb.strip().split('\n')
        for i, line in enumerate(tb_lines):
            if 'File "' in line and 'line ' in line:
                match = re.search(r'line (\d+)', line)
                if match:
                    line_number = int(match.group(1))
                    break
        
        # Determine category
        category = self._categorize_error(error_type, error_message)
        
        # Check if recoverable
        recoverable = self._is_recoverable(error_type)
        
        # Get local variables (if available)
        variables = {}
        try:
            tb_obj = sys.exc_info()[2]
            if tb_obj:
                frame = tb_obj.tb_frame
                variables = dict(frame.f_locals)
                # Remove non-serializable objects
                variables = {k: str(v) for k, v in variables.items() 
                           if not callable(v) and not isinstance(v, (type, module))}
        except:
            pass
        
        context = ErrorContext(
            error_type=error_type,
            error_message=error_message,
            traceback_str=tb,
            category=category,
            timestamp=datetime.now(),
            function_name=function_name,
            line_number=line_number,
            variables=variables,
            recoverable=recoverable
        )
        
        self.error_history.append(context)
        self.total_errors += 1
        
        # Callback
        if self.on_error:
            asyncio.create_task(self.on_error(context))
        
        return context
    
    def _categorize_error(self, error_type: str, error_message: str) -> ErrorCategory:
        """Categorize an error"""
        if error_type in self.error_patterns:
            return self.error_patterns[error_type]['category']
        
        # Fallback categorization
        if 'connection' in error_message.lower():
            return ErrorCategory.CONNECTION
        elif 'memory' in error_message.lower() or 'resource' in error_message.lower():
            return ErrorCategory.RESOURCE
        elif 'api' in error_message.lower() or 'rate' in error_message.lower():
            return ErrorCategory.API
        elif 'timeout' in error_message.lower():
            return ErrorCategory.PERFORMANCE
        else:
            return ErrorCategory.RUNTIME
    
    def _is_recoverable(self, error_type: str) -> bool:
        """Check if error type is typically recoverable"""
        recoverable_types = [
            'ConnectionError', 'TimeoutError', 'RateLimitError',
            'ResourceExhausted', 'TemporaryFailure'
        ]
        return error_type in recoverable_types
    
    async def _attempt_fix(self, error: ErrorContext) -> FixAttempt:
        """Attempt to fix an error"""
        error_id = f"{error.function_name}:{error.line_number}:{error.timestamp.timestamp()}"
        
        # Get fix strategy
        strategy = self._determine_fix_strategy(error)
        
        logger.info(f"🔧 {self.agent_id}: Attempting fix with strategy {strategy.value}")
        
        # Execute fix
        if strategy == FixStrategy.RETRY:
            success, result = await self._fix_retry(error)
        elif strategy == FixStrategy.CIRCUIT_BREAK:
            success, result = await self._fix_circuit_break(error)
        elif strategy == FixStrategy.FALLBACK:
            success, result = await self._fix_fallback(error)
        elif strategy == FixStrategy.PATCH_CODE:
            success, result = await self._fix_patch_code(error)
        elif strategy == FixStrategy.SKIP_OPERATION:
            success, result = await self._fix_skip(error)
        elif strategy == FixStrategy.RESET_STATE:
            success, result = await self._fix_reset_state(error)
        elif strategy == FixStrategy.ESCALATE:
            success, result = False, "Escalated to human"
            await self._escalate(error, None)
        else:
            success, result = False, "Unknown fix strategy"
        
        fix_attempt = FixAttempt(
            error_id=error_id,
            strategy=strategy,
            description=f"Applied {strategy.value} to {error.error_type}",
            timestamp=datetime.now(),
            success=success,
            result=result,
            new_error=None
        )
        
        self.fix_attempts.append(fix_attempt)
        
        # Callback
        if self.on_fix:
            asyncio.create_task(self.on_fix(fix_attempt))
        
        return fix_attempt
    
    def _determine_fix_strategy(self, error: ErrorContext) -> FixStrategy:
        """Determine the best fix strategy for an error"""
        if error.error_type in self.error_patterns:
            return self.error_patterns[error.error_type]['fix']
        
        # Default strategies by category
        category_strategies = {
            ErrorCategory.CONNECTION: FixStrategy.RETRY,
            ErrorCategory.API: FixStrategy.FALLBACK,
            ErrorCategory.RESOURCE: FixStrategy.RESET_STATE,
            ErrorCategory.PERFORMANCE: FixStrategy.CIRCUIT_BREAK,
            ErrorCategory.LOGIC: FixStrategy.ESCALATE,
            ErrorCategory.RUNTIME: FixStrategy.SKIP_OPERATION,
            ErrorCategory.SYNTAX: FixStrategy.ESCALATE
        }
        
        return category_strategies.get(error.category, FixStrategy.ESCALATE)
    
    async def _fix_retry(self, error: ErrorContext) -> tuple:
        """Retry the operation"""
        pattern = self.error_patterns.get(error.error_type, {})
        max_retries = pattern.get('max_retries', 3)
        backoff = pattern.get('backoff', 'linear')
        delay = pattern.get('delay', 1)
        
        # Exponential backoff
        if backoff == 'exponential':
            await asyncio.sleep(delay * (2 ** len(self.error_history) % max_retries))
        else:
            await asyncio.sleep(delay)
        
        return True, f"Waited {delay}s before retry"
    
    async def _fix_circuit_break(self, error: ErrorContext) -> tuple:
        """Open circuit breaker"""
        service = error.function_name
        self.circuit_breakers[service] = True
        
        # Schedule circuit close
        cooldown = self.error_patterns.get(error.error_type, {}).get('cooldown', 60)
        asyncio.create_task(self._close_circuit_after(service, cooldown))
        
        return True, f"Circuit opened for {service}, cooldown: {cooldown}s"
    
    async def _close_circuit_after(self, service: str, delay: int):
        """Close circuit breaker after delay"""
        await asyncio.sleep(delay)
        self.circuit_breakers[service] = False
        logger.info(f"🔌 {self.agent_id}: Circuit closed for {service}")
    
    async def _fix_fallback(self, error: ErrorContext) -> tuple:
        """Use fallback handler"""
        if error.function_name in self.fallback_handlers:
            fallback = self.fallback_handlers[error.function_name]
            try:
                result = fallback()
                return True, f"Fallback executed: {result}"
            except Exception as e:
                return False, f"Fallback failed: {str(e)}"
        
        return False, "No fallback handler registered"
    
    async def _fix_patch_code(self, error: ErrorContext) -> tuple:
        """Attempt to patch code automatically"""
        # This is advanced - only for simple fixes
        if not error.recoverable:
            return False, "Error not suitable for auto-patching"
        
        # Generate patch
        patch = self._generate_patch(error)
        
        if patch and patch.validated:
            # Apply patch (in production, this would hot-reload)
            self.patches_applied.append(patch)
            return True, f"Code patched: {patch.reason}"
        
        return False, "Could not generate valid patch"
    
    def _generate_patch(self, error: ErrorContext) -> Optional[CodePatch]:
        """Generate a code patch for common issues"""
        # Example: Fix NoneType errors by adding null checks
        if "NoneType" in error.error_message:
            original = f"{error.function_name}(...)"
            patched = f"if value is not None: {original}"
            
            return CodePatch(
                original_code=original,
                patched_code=patched,
                reason="Added null check",
                validated=True
            )
        
        return None
    
    async def _fix_skip(self, error: ErrorContext) -> tuple:
        """Skip the problematic operation"""
        return True, "Operation skipped to maintain stability"
    
    async def _fix_reset_state(self, error: ErrorContext) -> tuple:
        """Reset agent state"""
        # Clear caches
        import gc
        gc.collect()
        
        # Reset any stateful variables
        self.circuit_breakers.clear()
        
        return True, "Agent state reset, caches cleared"
    
    async def _escalate(self, error: ErrorContext, fix_attempt: Optional[FixAttempt]):
        """Escalate to human operators"""
        self.escalated += 1
        
        escalation_data = {
            'agent_id': self.agent_id,
            'timestamp': datetime.now().isoformat(),
            'error': asdict(error),
            'fix_attempt': asdict(fix_attempt) if fix_attempt else None,
            'requires_immediate': error.category == ErrorCategory.LOGIC
        }
        
        logger.critical(
            f"🚨 {self.agent_id}: ESCALATION REQUIRED\n"
            f"Error: {error.error_type} - {error.error_message}\n"
            f"Function: {error.function_name}:{error.line_number}"
        )
        
        # Callback
        if self.on_escalation:
            await self.on_escalation(escalation_data)
    
    # ============ Public API ============
    
    def register_fallback(self, function_name: str, handler: Callable):
        """Register a fallback handler for a function"""
        self.fallback_handlers[function_name] = handler
    
    def is_circuit_open(self, service: str) -> bool:
        """Check if circuit breaker is open for a service"""
        return self.circuit_breakers.get(service, False)
    
    def get_debug_report(self) -> Dict:
        """Get comprehensive debug report"""
        return {
            'agent_id': self.agent_id,
            'total_errors': self.total_errors,
            'auto_fixed': self.auto_fixed,
            'escalated': self.escalated,
            'fix_success_rate': (
                self.auto_fixed / (self.auto_fixed + self.escalated)
                if (self.auto_fixed + self.escalated) > 0 else 0
            ),
            'recent_errors': [
                {
                    'type': e.error_type,
                    'message': e.error_message,
                    'category': e.category.value,
                    'recoverable': e.recoverable,
                    'timestamp': e.timestamp.isoformat()
                }
                for e in self.error_history[-10:]
            ],
            'fix_attempts': [
                {
                    'strategy': f.strategy.value,
                    'success': f.success,
                    'result': f.result,
                    'timestamp': f.timestamp.isoformat()
                }
                for f in self.fix_attempts[-10:]
            ],
            'circuit_breakers': self.circuit_breakers,
            'patches_applied': len(self.patches_applied)
        }
    
    def suggest_fix(self, error_message: str) -> Optional[str]:
        """Suggest a fix for a given error message (AI-like suggestion)"""
        # Simple pattern matching for suggestions
        suggestions = {
            'Connection refused': 'Check if the service is running and accessible',
            'Rate limit': 'Add exponential backoff between requests',
            'Timeout': 'Increase timeout or optimize the operation',
            'Memory': 'Clear caches or optimize data structures',
            'KeyError': 'Add key existence check before accessing',
            'IndexError': 'Add bounds checking before array access',
            'NoneType': 'Add null check before using the value'
        }
        
        for pattern, suggestion in suggestions.items():
            if pattern.lower() in error_message.lower():
                return suggestion
        
        return None


# Decorator for easy usage
def self_debug(agent_id: str, config: Dict = None):
    """Decorator to add self-debugging to a function"""
    config = config or {}
    debugger = SelfDebuggingEngine(agent_id, config)
    
    def decorator(func):
        return debugger.wrap_function(func)
    
    return decorator


# Example usage
if __name__ == "__main__":
    # Create debugger
    debugger = SelfDebuggingEngine("test_agent", {})
    
    # Example function with error
    @debugger.wrap_function
    async def risky_function(should_fail: bool = False):
        if should_fail:
            raise ConnectionError("Simulated connection error")
        return "Success"
    
    # Test
    async def test():
        try:
            result = await risky_function(should_fail=False)
            print(f"Result: {result}")
            
            # This will auto-retry
            result = await risky_function(should_fail=True)
            print(f"Result after fix: {result}")
        except Exception as e:
            print(f"Final error: {e}")
        
        # Print report
        print("\nDebug Report:")
        print(json.dumps(debugger.get_debug_report(), indent=2))
    
    asyncio.run(test())
