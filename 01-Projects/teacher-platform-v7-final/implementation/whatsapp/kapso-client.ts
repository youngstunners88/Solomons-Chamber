// apps/web/lib/whatsapp/kapso-client.ts
// WhatsApp Business API client using @kapso/cli

import { offlineDB } from '@/lib/offline/offline-db';

// ==================== TYPES ====================

export interface KapsoConfig {
  apiKey: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookSecret?: string;
  baseUrl?: string;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    parameters: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
      text?: string;
      currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
      };
      date_time?: {
        fallback_value: string;
      };
      image?: { link: string };
      document?: { link: string; filename: string };
      video?: { link: string };
    }>;
  }>;
}

export interface SendMessageOptions {
  to: string;
  template?: WhatsAppTemplate;
  text?: string;
  media?: {
    type: 'image' | 'document' | 'video' | 'audio';
    url: string;
    caption?: string;
    filename?: string;
  };
}

export interface MessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface WebhookPayload {
  object: 'whatsapp_business_account';
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: 'whatsapp';
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; mime_type: string; sha256: string };
          document?: { id: string; filename: string; mime_type: string };
          audio?: { id: string; mime_type: string };
          video?: { id: string; mime_type: string };
          location?: { latitude: number; longitude: number };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          conversation?: {
            id: string;
            origin: { type: string };
          };
          pricing?: {
            category: string;
            pricing_model: string;
          };
          errors?: Array<{
            code: number;
            title: string;
            message?: string;
          }>;
        }>;
      };
      field: string;
    }>;
  }>;
}

// ==================== KAPSO CLIENT ====================

export class KapsoWhatsAppClient {
  private config: KapsoConfig;
  private baseUrl: string;
  
  constructor(config: KapsoConfig) {
    this.config = {
      baseUrl: 'https://graph.facebook.com/v18.0',
      ...config,
    };
    this.baseUrl = this.config.baseUrl!;
  }
  
  // ==================== MESSAGE SENDING ====================
  
  async sendMessage(options: SendMessageOptions): Promise<MessageResponse> {
    const payload = this.buildMessagePayload(options);
    
    const response = await fetch(
      `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new KapsoError(
        error.error?.message || 'Failed to send message',
        error.error?.code,
        error.error?.type
      );
    }
    
    return response.json();
  }
  
  private buildMessagePayload(options: SendMessageOptions): any {
    const base = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(options.to),
    };
    
    if (options.template) {
      return {
        ...base,
        type: 'template',
        template: options.template,
      };
    }
    
    if (options.text) {
      return {
        ...base,
        type: 'text',
        text: { body: options.text },
      };
    }
    
    if (options.media) {
      return {
        ...base,
        type: options.media.type,
        [options.media.type]: {
          link: options.media.url,
          ...(options.media.caption && { caption: options.media.caption }),
          ...(options.media.filename && { filename: options.media.filename }),
        },
      };
    }
    
    throw new Error('Must provide template, text, or media');
  }
  
  // ==================== TEMPLATES ====================
  
  async getTemplates(): Promise<Array<{
    name: string;
    language: string;
    status: string;
    category: string;
    components: any[];
  }>> {
    const response = await fetch(
      `${this.baseUrl}/${this.config.businessAccountId}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }
    
    const data = await response.json();
    return data.data || [];
  }
  
  // ==================== BROADCASTING ====================
  
  async broadcast(params: {
    recipients: string[];
    templateName: string;
    language?: string;
    parameters?: Record<string, string>;
    batchSize?: number;
    delayMs?: number;
  }): Promise<{
    sent: number;
    failed: number;
    results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }>;
  }> {
    const { 
      recipients, 
      templateName, 
      language = 'en', 
      parameters = {},
      batchSize = 50,
      delayMs = 1000 
    } = params;
    
    const results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }> = [];
    
    // Process in batches to avoid rate limits
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (phone) => {
          try {
            // Queue in offline DB first
            const messageId = crypto.randomUUID();
            await offlineDB.saveMessage({
              id: messageId,
              teacherId: 'current-teacher', // Get from auth context
              recipientPhone: phone,
              templateName,
              parameters,
              status: 'pending',
              createdAt: Date.now(),
            });
            
            // Try to send immediately if online
            if (navigator.onLine) {
              const response = await this.sendMessage({
                to: phone,
                template: this.buildTemplate(templateName, language, parameters),
              });
              
              await offlineDB.updateMessageStatus(messageId, 'sent');
              
              return {
                phone,
                success: true,
                messageId: response.messages[0]?.id,
              };
            } else {
              // Will be sent when back online
              return {
                phone,
                success: true,
                messageId: messageId,
              };
            }
          } catch (error) {
            return {
              phone,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );
      
      results.push(...batchResults);
      
      // Delay between batches
      if (i + batchSize < recipients.length) {
        await this.delay(delayMs);
      }
    }
    
    return {
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }
  
  // ==================== WEBHOOK HANDLING ====================
  
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const { value } = change;
        
        // Handle incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            await this.handleIncomingMessage(message, value.contacts?.[0]);
          }
        }
        
        // Handle status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            await this.handleStatusUpdate(status);
          }
        }
      }
    }
  }
  
  private async handleIncomingMessage(
    message: WebhookPayload['entry'][0]['changes'][0]['value']['messages'][0],
    contact?: WebhookPayload['entry'][0]['changes'][0]['value']['contacts'][0]
  ): Promise<void> {
    // Store in database
    await offlineDB.saveMessage({
      id: message.id,
      teacherId: 'current-teacher',
      recipientPhone: message.from,
      templateName: 'incoming_message',
      parameters: {
        body: message.text?.body || '[Media]',
        sender: contact?.profile?.name || message.from,
      },
      body: message.text?.body,
      status: 'delivered',
      createdAt: parseInt(message.timestamp) * 1000,
      deliveredAt: Date.now(),
    });
    
    // Trigger notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Message from ${contact?.profile?.name || message.from}`, {
        body: message.text?.body || 'New message received',
        icon: '/icons/icon-192x192.png',
      });
    }
  }
  
  private async handleStatusUpdate(
    status: WebhookPayload['entry'][0]['changes'][0]['value']['statuses'][0]
  ): Promise<void> {
    // Find message by original ID and update status
    const pendingMessages = await offlineDB.getPendingMessages();
    const message = pendingMessages.find(m => {
      // Match by sender or lookup mapping
      return m.recipientPhone === status.recipient_id;
    });
    
    if (message) {
      await offlineDB.updateMessageStatus(
        message.id,
        status.status,
        status.errors?.[0]?.message
      );
    }
  }
  
  // ==================== UTILITY METHODS ====================
  
  private formatPhoneNumber(phone: string): string {
    // Remove non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // Ensure it starts with country code
    if (!cleaned.startsWith('1') && !cleaned.startsWith('7')) {
      // Assume South African if no country code
      if (cleaned.startsWith('0')) {
        cleaned = '27' + cleaned.slice(1);
      }
    }
    
    return cleaned;
  }
  
  private buildTemplate(
    name: string, 
    language: string, 
    parameters: Record<string, string>
  ): WhatsAppTemplate {
    return {
      name,
      language: { code: language },
      components: [
        {
          type: 'body',
          parameters: Object.entries(parameters).map(([_, value]) => ({
            type: 'text',
            text: value,
          })),
        },
      ],
    } as WhatsAppTemplate;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== ERROR CLASS ====================

class KapsoError extends Error {
  code?: number;
  type?: string;
  
  constructor(message: string, code?: number, type?: string) {
    super(message);
    this.name = 'KapsoError';
    this.code = code;
    this.type = type;
  }
}

// ==================== HOOK ====================

import { useState, useEffect, useCallback } from 'react';

export function useWhatsAppClient(config: KapsoConfig) {
  const [client] = useState(() => new KapsoWhatsAppClient(config));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Update pending count periodically
    const interval = setInterval(async () => {
      const pending = await offlineDB.getPendingMessages();
      setPendingCount(pending.length);
    }, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  const sendMessage = useCallback(async (options: SendMessageOptions) => {
    return client.sendMessage(options);
  }, [client]);
  
  const broadcast = useCallback(async (params: Parameters<KapsoWhatsAppClient['broadcast']>[0]) => {
    return client.broadcast(params);
  }, [client]);
  
  return {
    client,
    isOnline,
    pendingCount,
    sendMessage,
    broadcast,
  };
}
