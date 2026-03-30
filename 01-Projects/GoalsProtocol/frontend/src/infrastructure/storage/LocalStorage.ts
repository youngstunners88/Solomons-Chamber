/**
 * ═══════════════════════════════════════════════════════════════
 * INFRASTRUCTURE - LOCAL STORAGE
 * ═══════════════════════════════════════════════════════════════
 */

import { LocalStorageAdapter } from '../../core/abstraction/adapters/storage.adapter.ts';

export const localStorage = new LocalStorageAdapter('goals_protocol_');
