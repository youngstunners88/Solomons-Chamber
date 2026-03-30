/**
 * ═══════════════════════════════════════════════════════════════
 * ABSTRACTION LAYER - HTTP ADAPTER (Axios)
 * ═══════════════════════════════════════════════════════════════
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { HttpPort, HttpRequestConfig, HttpResponse } from '../ports/http.port.ts';

export class AxiosHttpAdapter implements HttpPort {
  private client: AxiosInstance;

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const normalizedError = new Error(
          error.response?.data?.message || error.message || 'HTTP Request failed'
        );
        (normalizedError as Error & { status?: number }).status = error.response?.status;
        throw normalizedError;
      }
    );
  }

  private mapConfig(config?: HttpRequestConfig): AxiosRequestConfig {
    return {
      headers: config?.headers,
      params: config?.params,
      timeout: config?.timeout,
      signal: config?.signal,
    };
  }

  private mapResponse<T>(response: { data: T; status: number; headers: unknown }): HttpResponse<T> {
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    };
  }

  async get<T>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.get<T>(url, this.mapConfig(config));
    return this.mapResponse(response);
  }

  async post<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.post<T>(url, data, this.mapConfig(config));
    return this.mapResponse(response);
  }

  async put<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.put<T>(url, data, this.mapConfig(config));
    return this.mapResponse(response);
  }

  async patch<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.patch<T>(url, data, this.mapConfig(config));
    return this.mapResponse(response);
  }

  async delete<T>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.delete<T>(url, this.mapConfig(config));
    return this.mapResponse(response);
  }

  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
  }

  setHeader(key: string, value: string): void {
    this.client.defaults.headers.common[key] = value;
  }

  removeHeader(key: string): void {
    delete this.client.defaults.headers.common[key];
  }
}
