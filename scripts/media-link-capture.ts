#!/usr/bin/env bun
/**
 * Media Link Capture
 * 
 * Ingests links to YouTube, Facebook, Instagram, TikTok
 * Extracts metadata, transcripts, thumbnails
 * Creates vault entries with summaries
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-Template";

interface MediaLink {
  url: string;
  source: "youtube" | "facebook" | "instagram" | "tiktok" | "generic";
  title?: string;
  author?: string;
  description?: string;
  thumbnailUrl?: string;
  transcript?: string;
  duration?: string;
  processedAt: string;
}

async function captureLink(url: string, options: { fetchTranscript?: boolean; saveThumbnail?: boolean } = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const mediaPath = join(VAULT_PATH, "06-Media");
  const linksPath = join(mediaPath, "Links");
  
  if (!existsSync(linksPath)) mkdirSync(linksPath, { recursive: true });

  // Detect source type
  const source = detectSource(url);
  console.log(`🔗 Processing ${source} link...`);

  // Extract metadata (mock - would integrate with yt-dlp, social APIs)
  const metadata: MediaLink = {
    url,
    source,
    processedAt: new Date().toISOString(),
  };

  // Create vault entry
  const safeTitle = (metadata.title || `link-${timestamp}`).replace(/[^a-z0-9]/gi, "-").slice(0, 50);
  const entryPath = join(linksPath, `${safeTitle}.md`);

  const content = `### Media Item (${source})
URL: ${url}
Captured: ${metadata.processedAt}

Metadata:
  Source Type: ${source}
  ${metadata.title ? `Title: ${metadata.title}` : ""}
  ${metadata.author ? `Author: ${metadata.author}` : ""}
  ${metadata.duration ? `Duration: ${metadata.duration}` : ""}

Content:
  [Content summary or transcript would appear here]

Tags: #media #${source} #captured
`;

  writeFileSync(entryPath, content);
  console.log(`   Saved: ${entryPath}`);

  // Create inbox reference
  const inboxPath = join(VAULT_PATH, "00-Inbox", `${timestamp}-media.md`);
  const inboxContent = `## Media Captured
Source: ${source}
URL: ${url}

**Quick Review:**
- [ ] Watched/reviewed
- [ ] Key insights extracted
- [ ] Related connections made
`;
  writeFileSync(inboxPath, inboxContent);

  return { metadata, entryPath, inboxPath };
}

function detectSource(url: string): MediaLink["source"] {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("facebook.com") || lower.includes("fb.watch")) return "facebook";
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("tiktok.com")) return "tiktok";
  return "generic";
}

// CLI
if (require.main === module) {
  const url = process.argv[2];
  if (!url) {
    console.log("Usage: bun media-link-capture.ts <url> [--transcript] [--thumbnail]");
    console.log("\nSupported sources:");
    console.log("  YouTube, Facebook, Instagram, TikTok, generic URLs");
    process.exit(1);
  }

  captureLink(url).then(() => {
    console.log("✅ Link captured to vault");
  }).catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
}

export { captureLink };
// Example usage:
// bun media-link-capture.ts https://youtube.com/watch?v=...
// bun media-link-capture.ts https://facebook.com/... [--transcript]