/**
 * ═══════════════════════════════════════════════════════════════
 * INFRASTRUCTURE - API CLIENT
 * ═══════════════════════════════════════════════════════════════
 */

import { AxiosHttpAdapter } from '../../core/abstraction/adapters/http.adapter.ts';

export const apiClient = new AxiosHttpAdapter(
  import.meta.env.VITE_API_URL || 'https://api.goalsprotocol.xyz'
);
