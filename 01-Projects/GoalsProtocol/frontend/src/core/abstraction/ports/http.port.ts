/**
 * ═══════════════════════════════════════════════════════════════
 * ABSTRACTION LAYER - HTTP PORT
 * ═══════════════════════════════════════════════════════════════
 */

export interface HttpRequestConfig {
  readonly headers?: Record<string, string>;
  readonly params?: Record<string, string | number | boolean>;
  readonly timeout?: number;
  readonly signal?: AbortSignal;
}

export interface HttpResponse<T> {
  readonly data: T;
  readonly status: number;
  readonly headers: Record<string, string>;
}

export interface HttpPort {
  readonly get: <T>(url: string, config?: HttpRequestConfig) => Promise<HttpResponse<T>>;
  readonly post: <T>(url: string, data?: unknown, config?: HttpRequestConfig) => Promise<HttpResponse<T>>;
  readonly put: <T>(url: string, data?: unknown, config?: HttpRequestConfig) => Promise<HttpResponse<T>>;
  readonly patch: <T>(url: string, data?: unknown, config?: HttpRequestConfig) => Promise<HttpResponse<T>>;
  readonly delete: <T>(url: string, config?: HttpRequestConfig) => Promise<HttpResponse<T>>;
  readonly setBaseURL: (url: string) => void;
  readonly setHeader: (key: string, value: string) => void;
  readonly removeHeader: (key: string) => void;
}
