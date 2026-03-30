#!/usr/bin/env node
/**
 * Solomon's Chamber - Website Audit & Improvement System
 * 
 * Automatically audits, fixes, and improves service business websites.
 * Run: node website-auditor.js --audit-all
 *      node website-auditor.js --improve <website-name>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  baseDir: '/home/teacherchris37',
  outputDir: '/home/teacherchris37/Solomons-Chamber/15-Website-Factory',
  websites: [
    {
      name: 'ihhashi-mobile',
      path: 'index.html',
      type: 'food-delivery',
      business: 'iHhashi - Township Food Delivery',
      priority: 'high',
      issues: []
    },
    {
      name: 'storychain',
      path: 'storychain-analysis/index.html',
      type: 'storytelling-platform',
      business: 'StoryChain - Collaborative Storytelling',
      priority: 'medium',
      issues: []
    },
    {
      name: 'youbecamethemoney',
      path: 'youbecamethemoney/index.html',
      type: 'financial-education',
      business: 'You Became The Money - Banking Law Education',
      priority: 'high',
      issues: []
    },
    {
      name: 'bhubezi',
      path: 'Bhubezi/frontend/index.html',
      type: 'taxi-network',
      business: 'Bhubezi - Johannesburg Taxi Network',
      priority: 'medium',
      issues: []
    },
    {
      name: 'miroshark',
      path: 'miroshark-temp/frontend/index.html',
      type: 'prediction-market',
      business: 'MiroShark - Social Opinion Simulation',
      priority: 'low',
      issues: []
    },
    {
      name: 'goals-protocol',
      path: 'goals-protocol/frontend/index.html',
      type: 'nft-gaming',
      business: 'Goals Protocol - NFT Soccer Game',
      priority: 'medium',
      issues: []
    },
    {
      name: 'ihhashi-admin',
      path: 'ihhashi/frontend/index.html',
      type: 'admin-dashboard',
      business: 'iHhashi Admin Dashboard',
      priority: 'low',
      issues: []
    }
  ]
};

class WebsiteAuditor {
  constructor() {
    this.results = [];
    this.ensureDirectories();
  }

  ensureDirectories() {
    ['audit', 'improved', 'automation', 'assets'].forEach(dir => {
      const fullPath = path.join(CONFIG.outputDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  async auditAll() {
    console.log('🔍 AUDITING ALL WEBSITES...\n');
    
    for (const website of CONFIG.websites) {
      await this.auditWebsite(website);
    }
    
    this.generateAuditReport();
  }

  async auditWebsite(website) {
    console.log(`\n📋 Auditing: ${website.name}`);
    console.log(`   Business: ${website.business}`);
    
    const fullPath = path.join(CONFIG.baseDir, website.path);
    const issues = [];
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      issues.push({
        type: 'critical',
        category: 'file',
        description: 'File does not exist',
        fix: 'Create new website from scratch'
      });
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for common issues
      issues.push(...this.checkDesignIssues(content, website));
      issues.push(...this.checkTechnicalIssues(content, website));
      issues.push(...this.checkAccessibilityIssues(content, website));
      issues.push(...this.checkSEOIssues(content, website));
      issues.push(...this.checkImageIssues(content, website, fullPath));
    }
    
    website.issues = issues;
    
    // Calculate score
    const critical = issues.filter(i => i.type === 'critical').length;
    const warning = issues.filter(i => i.type === 'warning').length;
    const info = issues.filter(i => i.type === 'info').length;
    
    website.score = Math.max(0, 100 - (critical * 20) - (warning * 10) - (info * 2));
    website.grade = this.getGrade(website.score);
    
    console.log(`   Score: ${website.score}/100 (${website.grade})`);
    console.log(`   Issues: ${critical} critical, ${warning} warning, ${info} info`);
    
    this.results.push(website);
  }

  checkDesignIssues(content, website) {
    const issues = [];
    
    // Check for generic fonts
    if (content.includes('font-family: Inter') || content.includes('font-family: Arial')) {
      issues.push({
        type: 'warning',
        category: 'design',
        description: 'Using generic font (Inter/Arial)',
        fix: 'Replace with distinctive typography'
      });
    }
    
    // Check for cliché purple gradients
    if (content.match(/gradient.*purple|#667eea|#764ba2/i)) {
      issues.push({
        type: 'warning',
        category: 'design',
        description: 'Using cliché purple gradient aesthetic',
        fix: 'Choose unique color palette appropriate for business'
      });
    }
    
    // Check for responsive meta tag
    if (!content.includes('viewport')) {
      issues.push({
        type: 'critical',
        category: 'design',
        description: 'Missing viewport meta tag - not mobile responsive',
        fix: 'Add viewport meta tag'
      });
    }
    
    // Check for animation
    if (!content.includes('animation') && !content.includes('transition')) {
      issues.push({
        type: 'info',
        category: 'design',
        description: 'No animations or transitions - static feel',
        fix: 'Add subtle micro-interactions and scroll animations'
      });
    }
    
    return issues;
  }

  checkTechnicalIssues(content, website) {
    const issues = [];
    
    // Check for console errors potential
    if (content.includes('console.log')) {
      issues.push({
        type: 'info',
        category: 'technical',
        description: 'Console.log statements in production code',
        fix: 'Remove debug console statements'
      });
    }
    
    // Check for http links (should be https)
    if (content.match(/http:\/\/(?!localhost)/)) {
      issues.push({
        type: 'warning',
        category: 'technical',
        description: 'Insecure HTTP links found',
        fix: 'Update all links to HTTPS'
      });
    }
    
    // Check for broken image patterns
    if (content.includes('img src=""') || content.includes("img src=''")) {
      issues.push({
        type: 'critical',
        category: 'technical',
        description: 'Empty image sources found',
        fix: 'Add proper image URLs or remove broken images'
      });
    }
    
    return issues;
  }

  checkAccessibilityIssues(content, website) {
    const issues = [];
    
    // Check for alt attributes
    const imgTags = content.match(/<img[^>]*>/g) || [];
    const imgsWithoutAlt = imgTags.filter(img => !img.includes('alt='));
    if (imgsWithoutAlt.length > 0) {
      issues.push({
        type: 'warning',
        category: 'accessibility',
        description: `${imgsWithoutAlt.length} images missing alt attributes`,
        fix: 'Add descriptive alt text to all images'
      });
    }
    
    // Check for form labels
    if (content.includes('<input') && !content.includes('<label')) {
      issues.push({
        type: 'warning',
        category: 'accessibility',
        description: 'Form inputs may be missing labels',
        fix: 'Add proper labels to all form inputs'
      });
    }
    
    return issues;
  }

  checkSEOIssues(content, website) {
    const issues = [];
    
    // Check for meta description
    if (!content.includes('meta name="description"')) {
      issues.push({
        type: 'warning',
        category: 'seo',
        description: 'Missing meta description',
        fix: 'Add compelling meta description for SEO'
      });
    }
    
    // Check for title
    if (!content.includes('<title>') || content.includes('<title></title>')) {
      issues.push({
        type: 'critical',
        category: 'seo',
        description: 'Missing or empty page title',
        fix: 'Add descriptive page title'
      });
    }
    
    // Check for heading structure
    if (!content.includes('<h1')) {
      issues.push({
        type: 'warning',
        category: 'seo',
        description: 'Missing H1 heading',
        fix: 'Add H1 heading with main keyword'
      });
    }
    
    return issues;
  }

  checkImageIssues(content, website, fullPath) {
    const issues = [];
    
    // Extract image URLs
    const imgMatches = content.match(/src=["']([^"']+\.(jpg|jpeg|png|gif|webp|svg))["']/gi) || [];
    
    if (imgMatches.length === 0) {
      issues.push({
        type: 'info',
        category: 'images',
        description: 'No images found - consider adding visuals',
        fix: 'Add relevant images to enhance design'
      });
    }
    
    // Check for placeholder images
    const placeholderPatterns = ['placeholder', 'via.placeholder.com', 'dummyimage.com'];
    if (placeholderPatterns.some(p => content.toLowerCase().includes(p))) {
      issues.push({
        type: 'critical',
        category: 'images',
        description: 'Using placeholder images',
        fix: 'Replace with real, high-quality images'
      });
    }
    
    // Check for external images that might break
    if (content.includes('imgur.com') || content.includes('unsplash.com')) {
      issues.push({
        type: 'info',
        category: 'images',
        description: 'Using external image hosting (may break)',
        fix: 'Download and host images locally'
      });
    }
    
    return issues;
  }

  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  generateAuditReport() {
    const reportPath = path.join(CONFIG.outputDir, 'audit', `audit-report-${new Date().toISOString().split('T')[0]}.md`);
    
    let report = `# Website Audit Report\n\n`;
    report += `**Date:** ${new Date().toLocaleString()}\n\n`;
    report += `**Total Websites:** ${this.results.length}\n\n`;
    report += `**Average Score:** ${Math.round(this.results.reduce((a, b) => a + b.score, 0) / this.results.length)}/100\n\n`;
    
    report += `## Summary\n\n`;
    report += `| Website | Business | Score | Grade | Priority | Issues |\n`;
    report += `|---------|----------|-------|-------|----------|--------|\n`;
    
    this.results.sort((a, b) => b.score - a.score);
    
    for (const site of this.results) {
      const totalIssues = site.issues.length;
      report += `| ${site.name} | ${site.business} | ${site.score} | ${site.grade} | ${site.priority} | ${totalIssues} |\n`;
    }
    
    report += `\n## Detailed Findings\n\n`;
    
    for (const site of this.results) {
      report += `### ${site.name.toUpperCase()}\n\n`;
      report += `- **Business:** ${site.business}\n`;
      report += `- **Path:** ${site.path}\n`;
      report += `- **Score:** ${site.score}/100 (${site.grade})\n`;
      report += `- **Priority:** ${site.priority}\n\n`;
      
      if (site.issues.length > 0) {
        report += `**Issues:**\n\n`;
        
        const critical = site.issues.filter(i => i.type === 'critical');
        const warning = site.issues.filter(i => i.type === 'warning');
        const info = site.issues.filter(i => i.type === 'info');
        
        if (critical.length > 0) {
          report += `*Critical:*\n`;
          critical.forEach(i => {
            report += `- ❌ ${i.description}\n`;
            report += `  - *Fix:* ${i.fix}\n`;
          });
          report += `\n`;
        }
        
        if (warning.length > 0) {
          report += `*Warnings:*\n`;
          warning.forEach(i => {
            report += `- ⚠️ ${i.description}\n`;
            report += `  - *Fix:* ${i.fix}\n`;
          });
          report += `\n`;
        }
        
        if (info.length > 0) {
          report += `*Suggestions:*\n`;
          info.forEach(i => {
            report += `- ℹ️ ${i.description}\n`;
            report += `  - *Fix:* ${i.fix}\n`;
          });
          report += `\n`;
        }
      } else {
        report += `✅ No issues found!\n\n`;
      }
      
      report += `---\n\n`;
    }
    
    report += `## Improvement Priority Queue\n\n`;
    report += `1. **Immediate (High Priority, Low Score):**\n`;
    this.results.filter(s => s.priority === 'high' && s.score < 80).forEach(s => {
      report += `   - ${s.name} (${s.score}/100)\n`;
    });
    
    report += `\n2. **Next (Medium Priority or Score 60-80):**\n`;
    this.results.filter(s => (s.priority === 'medium' || s.score < 80) && s.score >= 60).forEach(s => {
      report += `   - ${s.name} (${s.score}/100)\n`;
    });
    
    report += `\n3. **Polish (Low Priority or Score 80+):**\n`;
    this.results.filter(s => s.score >= 80).forEach(s => {
      report += `   - ${s.name} (${s.score}/100)\n`;
    });
    
    fs.writeFileSync(reportPath, report);
    console.log(`\n✅ Audit report saved: ${reportPath}`);
    
    return reportPath;
  }

  async improveWebsite(websiteName) {
    const website = CONFIG.websites.find(w => w.name === websiteName);
    if (!website) {
      console.error(`Website "${websiteName}" not found`);
      return;
    }
    
    console.log(`\n🔧 IMPROVING: ${website.name}`);
    
    // Read original
    const fullPath = path.join(CONFIG.baseDir, website.path);
    const originalContent = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
    
    // Create improved version
    const improvedDir = path.join(CONFIG.outputDir, 'improved', website.name);
    if (!fs.existsSync(improvedDir)) {
      fs.mkdirSync(improvedDir, { recursive: true });
    }
    
    // Apply fixes based on audit
    let improvedContent = originalContent;
    
    // Fix 1: Add viewport if missing
    if (!improvedContent.includes('viewport')) {
      improvedContent = improvedContent.replace(
        '<head>',
        '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">'
      );
    }
    
    // Fix 2: Add meta description if missing
    if (!improvedContent.includes('meta name="description"')) {
      improvedContent = improvedContent.replace(
        '<head>',
        `<head>\n  <meta name="description" content="${website.business} - Professional service. Contact us today.">`
      );
    }
    
    // Save improved version
    const improvedPath = path.join(improvedDir, 'index.html');
    fs.writeFileSync(improvedPath, improvedContent);
    
    console.log(`   ✅ Improved version saved: ${improvedPath}`);
    
    return improvedPath;
  }
}

// CLI
const command = process.argv[2];
const arg = process.argv[3];

const auditor = new WebsiteAuditor();

switch (command) {
  case '--audit-all':
    auditor.auditAll();
    break;
  case '--improve':
    if (arg) {
      auditor.improveWebsite(arg);
    } else {
      console.log('Usage: node website-auditor.js --improve <website-name>');
    }
    break;
  case '--list':
    console.log('\nAvailable websites:');
    CONFIG.websites.forEach(w => {
      console.log(`  - ${w.name} (${w.business})`);
    });
    break;
  default:
    console.log(`
Solomon's Chamber - Website Audit & Improvement System

Usage:
  node website-auditor.js --audit-all     # Audit all websites
  node website-auditor.js --improve <name> # Improve specific website
  node website-auditor.js --list          # List all websites

Examples:
  node website-auditor.js --audit-all
  node website-auditor.js --improve youbecamethemoney
    `);
}

module.exports = { WebsiteAuditor, CONFIG };
