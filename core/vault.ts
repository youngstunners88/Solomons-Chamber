/**
 * Core Vault Library
 * Central abstraction for all vault operations
 */

import { 
  readdirSync, 
  statSync, 
  renameSync, 
  readFileSync, 
  writeFileSync, 
  mkdirSync,
  existsSync
} from "fs";
import { join, basename, dirname } from "path";
import { EventEmitter } from "events";

export interface Note {
  filename: string;
  path: string;
  content: string;
  metadata: {
    title?: string;
    date?: string;
    tags?: string[];
    created?: string;
    modified?: string;
  };
}

export interface VaultStats {
  totalNotes: number;
  totalFolders: number;
  lastModified: string;
  folderCounts: Record<string, number>;
}

export class Vault extends EventEmitter {
  constructor(private basePath: string) {
    super();
  }

  /**
   * Read all notes in a folder
   */
  readFolder(folderPath: string): Note[] {
    const fullPath = join(this.basePath, folderPath);
    if (!existsSync(fullPath)) return [];

    try {
      const files = readdirSync(fullPath, { withFileTypes: true })
        .filter(dirent => dirent.isFile() && dirent.name.endsWith('.md'))
        .map(dirent => this.readNote(join(folderPath, dirent.name)))
        .filter((note): note is Note => note !== null);
      
      return files;
    } catch {
      return [];
    }
  }

  /**
   * Read a single note
   */
  readNote(relativePath: string): Note | null {
    const fullPath = join(this.basePath, relativePath);
    if (!existsSync(fullPath)) return null;

    try {
      const content = readFileSync(fullPath, 'utf-8');
      const metadata = this.parseFrontmatter(content);
      const stats = statSync(fullPath);

      return {
        filename: basename(relativePath),
        path: relativePath,
        content,
        metadata: {
          ...metadata,
          created: stats.birthtime?.toISOString(),
          modified: stats.mtime?.toISOString()
        }
      };
    } catch {
      return null;
    }
  }

  /**
   * Create a new note
   */
  createNote(folder: string, title: string, content: string): string {
    const folderPath = join(this.basePath, folder);
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50);
    const filename = `${date}-${safeTitle}-${timestamp}.md`;
    const filepath = join(folderPath, filename);

    const frontmatter = `---
date: ${date}
title: ${title}
created: ${new Date().toISOString()}
---

`;

    writeFileSync(filepath, frontmatter + content);
    
    this.emit('note:created', { folder, filename, title });
    
    return filepath;
  }

  /**
   * Move a note between folders
   */
  moveNote(filename: string, fromFolder: string, toFolder: string): void {
    const fromPath = join(this.basePath, fromFolder, filename);
    const toPath = join(this.basePath, toFolder, filename);
    
    const toDir = dirname(toPath);
    if (!existsSync(toDir)) {
      mkdirSync(toDir, { recursive: true });
    }

    renameSync(fromPath, toPath);
    this.emit('note:moved', { filename, from: fromFolder, to: toFolder });
  }

  /**
   * Get vault statistics
   */
  getStats(): VaultStats {
    const folders = [
      '00-Inbox',
      '01-Projects/active',
      '02-Research/topics',
      '03-Trading/signals',
      '04-Assets/skills',
      '05-Self-Notes/daily',
      '06-Media/Links',
      '07-Archive'
    ];

    const folderCounts: Record<string, number> = {};
    let totalNotes = 0;

    for (const folder of folders) {
      const count = this.readFolder(folder).length;
      folderCounts[folder] = count;
      totalNotes += count;
    }

    const statsPath = join(this.basePath, '.vault-stats.json');
    let lastModified = new Date().toISOString();
    
    if (existsSync(statsPath)) {
      try {
        const stats = JSON.parse(readFileSync(statsPath, 'utf-8'));
        lastModified = stats.lastModified;
      } catch {}
    }

    return {
      totalNotes,
      totalFolders: folders.length,
      lastModified,
      folderCounts
    };
  }

  /**
   * Search across all notes
   */
  search(query: string): Note[] {
    const folders = [
      '00-Inbox',
      '01-Projects/active',
      '02-Research/topics',
      '05-Self-Notes/daily',
      '06-Media/Links'
    ];

    const results: Note[] = [];
    const lowerQuery = query.toLowerCase();

    for (const folder of folders) {
      const notes = this.readFolder(folder);
      for (const note of notes) {
        if (
          note.content.toLowerCase().includes(lowerQuery) ||
          note.metadata.title?.toLowerCase().includes(lowerQuery) ||
          note.metadata.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        ) {
          results.push(note);
        }
      }
    }

    return results;
  }

  /**
   * Parse YAML frontmatter from markdown
   */
  private parseFrontmatter(content: string): Record<string, any> {
    const match = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (!match) return {};

    const frontmatter: Record<string, any> = {};
    const lines = match[1].split('\n');

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        
        // Handle arrays
        if (value.startsWith('[') && value.endsWith(']')) {
          frontmatter[key] = value
            .slice(1, -1)
            .split(',')
            .map(v => v.trim());
        } else {
          frontmatter[key] = value;
        }
      }
    }

    return frontmatter;
  }
}

export default Vault;