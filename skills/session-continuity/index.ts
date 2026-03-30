/**
 * Session Continuity Skill - Main Export
 * 
 * Provides seamless session persistence and restoration for Solomon's Chamber.
 */

// Core
export { SessionContinuity, initializeSessionContinuity, getSessionContinuity } from './core/SessionContinuity';

// State Management
export { StateManager } from './state/StateManager';

// Routing
export { WorkRouter } from './router/WorkRouter';

// Capture
export { SessionCapture } from './capture/SessionCapture';

// Restoration
export { SessionRestorer } from './restore/SessionRestorer';

// Types
export * from './types/session.types';

// Utils
export * from './utils/helpers';

// Version
export const VERSION = '1.0.0';
export const SKILL_NAME = 'session-continuity';
