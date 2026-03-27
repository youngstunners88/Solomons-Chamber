/**
 * Vault Router
 * Routes content to appropriate folders based on type and tags
 */

import { Vault } from './vault.ts';
import { EventEmitter } from 'events';

export interface RouteRule {
  pattern: RegExp | string;
  test: (content: string, metadata: any) => boolean;
  destination: string;
  priority: number;
}

export class VaultRouter extends EventEmitter {
  private vault: Vault;
  private rules: RouteRule[] = [];

  constructor(vaultPath: string) {
    super();
    this.vault = new Vault(vaultPath);
    this.setupDefaultRules();
  }

  private setupDefaultRules(): void {
    this.rules = [
      // Project detection
      {
        pattern: /#project|#build|#create/i,
        test: (content, metadata) => 
          metadata.tags?.includes('project') || 
          content.toLowerCase().includes('project:') ||
          content.includes('PROJ-'),
        destination: '01-Projects/active/',
        priority: 100
      },
      
      // Research detection
      {
        pattern: /#research|#study|#learn/i,
        test: (content, metadata) => 
          metadata.tags?.includes('research') || 
          content.includes('SRC-') ||
          /^https?:\/\//m.test(content),
        destination: '02-Research/topics/',
        priority: 90
      },
      
      // Trading/Signals
      {
        pattern: /#trading|#signal|#position/i,
        test: (content, metadata) => 
          metadata.tags?.includes('trading') || 
          metadata.tags?.includes('signal') ||
          content.includes('SIG-') ||
          /\$[A-Z]{2,5}/.test(content),
        destination: '03-Trading/signals/',
        priority: 95
      },
      
      // Voice memos (already handled by voice-capture.ts)
      {
        pattern: /type:\s*voice-memo/i,
        test: (content, metadata) => metadata['type'] === 'voice-memo',
        destination: '06-Media/Audio/Voice-Memos/Processed/',
        priority: 80
      },
      
      // Media links
      {
        pattern: /youtube|facebook|instagram|tiktok/i,
        test: (content, metadata) => 
          /https?:\/\/(www\.)?(youtube|fb\.watch|instagram|tiktok)/i.test(content),
        destination: '06-Media/Links/',
        priority: 85
      },
      
      // Daily notes (lowest priority - catch-all)
      {
        pattern: /.*/,
        test: () => true,
        destination: '05-Self-Notes/daily/',
        priority: 10
      }
    ];

    // Sort by priority (highest first)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Route a note to its destination
   */
  routeNote(filename: string, fromFolder: string = '00-Inbox'): { destination: string; reason: string } | null {
    const note = this.vault.readNote(`${fromFolder}/${filename}`);
    if (!note) return null;

    // Find matching rule
    for (const rule of this.rules) {
      if (rule.test(note.content, note.metadata)) {
        this.emit('routed', {
          filename,
          from: fromFolder,
          to: rule.destination,
          reason: `Matched rule: priority ${rule.priority}`
        });

        return {
          destination: rule.destination,
          reason: `Matched pattern: ${rule.pattern}`
        };
      }
    }

    return null;
  }

  /**
   * Process entire inbox
   */
  async processInbox(options: { dryRun?: boolean } = {}): Promise<Array<{filename: string; dest: string}>> {
    const inboxNotes = this.vault.readFolder('00-Inbox');
    const results: Array<{filename: string; dest: string}> = [];

    for (const note of inboxNotes) {
      const route = this.routeNote(note.filename);
      
      if (route) {
        results.push({ filename: note.filename, dest: route.destination });
        
        if (!options.dryRun) {
          this.vault.moveNote(note.filename, '00-Inbox/', route.destination);
          this.emit('moved', { filename: note.filename, to: route.destination });
        }
      }
    }

    return results;
  }

  /**
   * Add custom routing rule
   */
  addRule(rule: RouteRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - b.priority);
  }

  /**
   * Get all rules
   */
  getRules(): RouteRule[] {
    return this.rules;
  }

  /**
   * Preview routing without moving
   */
  previewRoute(filename: string, fromFolder: string = '00-Inbox'): string | null {
    const result = this.routeNote(filename, fromFolder);
    return result?.destination || null;
  }
}

export default VaultRouter;