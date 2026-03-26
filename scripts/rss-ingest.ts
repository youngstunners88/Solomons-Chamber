#!/usr/bin/env bun
/**
 * RSS Feed Ingestor
 * Automatically imports RSS feeds into vault
 */

import { Vault } from "./lib/vault.ts";

interface FeedConfig {
  name: string;
  url: string;
  category: string; // Which folder to save to
}

// Example feeds — users configure their own
const feeds: FeedConfig[] = [
  {
    name: "Tech News",
    url: "https://news.ycombinator.com/rss",
    category: "02-Research/sources/"
  },
  {
    name: "Market Analysis",
    url: "https://feeds.marketwatch.com/marketwatch/marketpulse/",
    category: "03-Trading/analysis/"
  }
];

async function fetchRSS(url: string): Promise<Array<{title: string, link: string, date: string}>> {
  try {
    const response = await fetch(url);
    const xml = await response.text();
    
    // Simple XML parsing for RSS
    const items: Array<{title: string, link: string, date: string}> = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    
    for (const match of itemMatches) {
      const itemXml = match[1];
      const title = itemXml.match(/<title>(.*?)<\/title>/)?.[1] || "Untitled";
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const date = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
      
      items.push({ title, link, date });
    }
    
    return items.slice(0, 10); // Top 10 items
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error.message);
    return [];
  }
}

async function ingestFeeds(): Promise<void> {
  const vaultPath = process.env.VAULT_PATH || ".";
  const vault = new Vault(vaultPath);
  
  console.log("🔍 Ingesting RSS feeds...\n");
  
  for (const feed of feeds) {
    console.log(`📡 ${feed.name}...`);
    const items = await fetchRSS(feed.url);
    
    for (const item of items) {
      const content = `# ${item.title}

**Source:** ${item.link}
**Date:** ${item.date}

## Summary

[Add your notes here]

---
*
This note was auto-created from RSS feed.*
`;
      
      const path = vault.createNote(feed.category, item.title, content);
      console.log(`  ✓ ${item.title.substring(0, 50)}...`);
    }
    
    console.log(`  ✓ ${items.length} items imported\n`);
  }
  
  console.log("✅ RSS ingestion complete");
}

// Run if called directly
if (import.meta.main) {
  ingestFeeds();
}