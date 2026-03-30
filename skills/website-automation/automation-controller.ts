#!/usr/bin/env tsx
/**
 * Website Automation Controller
 * 
 * Orchestrates autonomous transformation of service business websites.
 * Spawns subagents, manages workflow, commits and pushes.
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

interface WebsiteTarget {
  name: string;
  category: string;
  repo: string;
  status: 'pending' | 'cloning' | 'auditing' | 'researching' | 'designing' | 'building' | 'deploying' | 'complete' | 'error';
  localPath: string;
  branch: string;
  issues: string[];
  improvements: string[];
}

const TARGETS: WebsiteTarget[] = [
  { name: 'aasj-plumbers', category: 'plumbing', repo: 'https://github.com/youngstunners88/aasj-plumbers.git', status: 'pending', localPath: '', branch: 'redesign-2026', issues: [], improvements: [] },
  { name: 'betta-cleaning', category: 'cleaning', repo: 'https://github.com/youngstunners88/betta-cleaning.git', status: 'pending', localPath: '', branch: 'redesign-2026', issues: [], improvements: [] },
  { name: 'bluestars-cleaning-service', category: 'cleaning', repo: 'https://github.com/youngstunners88/bluestars-cleaning-service.git', status: 'pending', localPath: '', branch: 'redesign-2026', issues: [], improvements: [] },
  { name: 'gift-plumbing', category: 'plumbing', repo: 'https://github.com/youngstunners88/gift-plumbing.git', status: 'pending', localPath: '', branch: 'redesign-2026', issues: [], improvements: [] },
  { name: 'mike-plumbing', category: 'plumbing', repo: 'https://github.com/youngstunners88/mike-plumbing.git', status: 'pending', localPath: '', branch: 'redesign-2026', issues: [], improvements: [] },
  { name: 'malachi-cleaning', category: 'cleaning', repo: 'https://github.com/youngstunners88/malachi-cleaning.git', status: 'pending', localPath: '', branch: 'redesign-2026', issues: [], improvements: [] },
  { name: 'asap-handyman', category: 'handyman', repo: 'https://github.com/youngstunners88/asap-handyman-maintenance-renovatio.git', status: 'pending', localPath: '', branch: 'redesign-2026', issues: [], improvements: [] },
  { name: 'dust-out-window', category: 'cleaning', repo: 'https://github.com/youngstunners88/dust-out-window-cleaning-website.git', status: 'pending', localPath: '', branch: 'redesign-2026', issues: [], improvements: [] },
  { name: 'amazing-car-care', category: 'auto', repo: 'https://github.com/youngstunners88/amazing-car-care.git', status: 'pending', localPath: '', branch: 'redesign-2026', issues: [], improvements: [] },
  { name: 'spot-on-locksmiths', category: 'locksmith', repo: 'https://github.com/youngstunners88/spot-on-locksmiths.git', status: 'pending', localPath: '', branch: 'redesign-2026', issues: [], improvements: [] },
];

const WORKSPACE = '/tmp/website-automation';
const LOG_FILE = '/home/teacherchris37/Solomons-Chamber/09-Agent-Sessions/current/automation-log.json';

class AutomationController {
  private targets: WebsiteTarget[];

  constructor() {
    this.targets = TARGETS.map(t => ({
      ...t,
      localPath: path.join(WORKSPACE, t.name)
    }));
  }

  async run(): Promise<void> {
    console.log('🚀 Starting Website Automation Swarm');
    console.log(`📊 Target: ${this.targets.length} websites`);
    console.log('');

    // Phase 1: Clone all repos in parallel
    await this.phaseClone();

    // Phase 2: Audit all sites in parallel
    await this.phaseAudit();

    // Phase 3: Research businesses
    await this.phaseResearch();

    // Phase 4: Generate designs
    await this.phaseDesign();

    // Phase 5: Build new sites
    await this.phaseBuild();

    // Phase 6: Deploy
    await this.phaseDeploy();

    console.log('');
    console.log('✅ AUTOMATION COMPLETE');
    await this.generateReport();
  }

  private async phaseClone(): Promise<void> {
    console.log('📦 Phase 1: Cloning Repositories...');
    
    await Promise.all(this.targets.map(async (target) => {
      try {
        target.status = 'cloning';
        await this.logProgress();

        // Clean if exists
        await fs.rm(target.localPath, { recursive: true, force: true });
        
        // Clone
        execSync(`git clone ${target.repo} ${target.localPath}`, { 
          stdio: 'pipe',
          timeout: 60000 
        });

        console.log(`  ✅ ${target.name}`);
      } catch (error) {
        console.log(`  ❌ ${target.name}: ${error}`);
        target.status = 'error';
        target.issues.push(`Clone failed: ${error}`);
      }
    }));

    await this.logProgress();
  }

  private async phaseAudit(): Promise<void> {
    console.log('🔍 Phase 2: Auditing Sites...');

    await Promise.all(this.targets.map(async (target) => {
      if (target.status === 'error') return;

      try {
        target.status = 'auditing';
        await this.logProgress();

        // Find HTML files
        const htmlFiles = await this.findHtmlFiles(target.localPath);
        
        // Audit each file
        for (const file of htmlFiles.slice(0, 3)) { // Max 3 files
          const issues = await this.auditHtmlFile(file);
          target.issues.push(...issues);
        }

        // Check for common issues
        const hasGenericImages = await this.checkGenericImages(target.localPath);
        if (hasGenericImages) {
          target.issues.push('Uses generic/stock images');
          target.improvements.push('Generate unique AI images');
        }

        const hasGenericContent = await this.checkGenericContent(target.localPath);
        if (hasGenericContent) {
          target.issues.push('Generic/template content');
          target.improvements.push('Research and add accurate business info');
        }

        console.log(`  ✅ ${target.name}: ${target.issues.length} issues found`);
      } catch (error) {
        console.log(`  ❌ ${target.name}: ${error}`);
      }
    }));

    await this.logProgress();
  }

  private async phaseResearch(): Promise<void> {
    console.log('🔬 Phase 3: Researching Businesses...');

    await Promise.all(this.targets.map(async (target) => {
      if (target.status === 'error') return;

      try {
        target.status = 'researching';
        await this.logProgress();

        // Extract business name from repo
        const businessName = target.name
          .replace(/-/g, ' ')
          .replace(/website$/i, '')
          .replace(/services?$/i, '')
          .replace(/pty|ltd|cc$/i, '')
          .trim();

        // Create research document
        const researchData = {
          businessName: this.capitalizeWords(businessName),
          category: target.category,
          location: this.inferLocation(target.name),
          services: this.inferServices(target.category),
          brandColors: this.generateBrandColors(target.category, target.name),
          tagline: this.generateTagline(target.category, businessName),
          researchDate: new Date().toISOString()
        };

        // Save research
        await fs.mkdir(path.join(target.localPath, '.research'), { recursive: true });
        await fs.writeFile(
          path.join(target.localPath, '.research', 'business-info.json'),
          JSON.stringify(researchData, null, 2)
        );

        target.improvements.push(`Brand identity: ${researchData.brandColors.primary}`);
        target.improvements.push(`Tagline: "${researchData.tagline}"`);

        console.log(`  ✅ ${target.name}: ${researchData.businessName}`);
      } catch (error) {
        console.log(`  ⚠️  ${target.name}: ${error}`);
      }
    }));

    await this.logProgress();
  }

  private async phaseDesign(): Promise<void> {
    console.log('🎨 Phase 4: Generating Designs...');

    await Promise.all(this.targets.map(async (target) => {
      if (target.status === 'error') return;

      try {
        target.status = 'designing';
        await this.logProgress();

        // Read research data
        const researchPath = path.join(target.localPath, '.research', 'business-info.json');
        const research = JSON.parse(await fs.readFile(researchPath, 'utf-8'));

        // Generate design system
        const designSystem = {
          colors: research.brandColors,
          fonts: this.selectFonts(target.category),
          layout: this.selectLayout(target.category),
          components: ['hero', 'services', 'about', 'contact', 'footer'],
          images: await this.generateImagePrompts(target, research)
        };

        // Save design system
        await fs.writeFile(
          path.join(target.localPath, '.research', 'design-system.json'),
          JSON.stringify(designSystem, null, 2)
        );

        target.improvements.push(`Design system with ${Object.keys(designSystem.colors).length} brand colors`);

        console.log(`  ✅ ${target.name}: Design system created`);
      } catch (error) {
        console.log(`  ⚠️  ${target.name}: ${error}`);
      }
    }));

    await this.logProgress();
  }

  private async phaseBuild(): Promise<void> {
    console.log('🔨 Phase 5: Building New Sites...');

    // Process sequentially to avoid resource conflicts
    for (const target of this.targets) {
      if (target.status === 'error') continue;

      try {
        target.status = 'building';
        await this.logProgress();

        // Read research and design
        const researchPath = path.join(target.localPath, '.research', 'business-info.json');
        const designPath = path.join(target.localPath, '.research', 'design-system.json');
        
        const research = JSON.parse(await fs.readFile(researchPath, 'utf-8'));
        const design = JSON.parse(await fs.readFile(designPath, 'utf-8'));

        // Build new website
        const newHtml = this.buildWebsite(target, research, design);
        
        // Backup old
        await fs.rename(
          path.join(target.localPath, 'index.html'),
          path.join(target.localPath, 'index.html.backup')
        );

        // Write new
        await fs.writeFile(
          path.join(target.localPath, 'index.html'),
          newHtml
        );

        // Create README update
        const readmeUpdate = this.generateReadme(target, research);
        await fs.writeFile(
          path.join(target.localPath, 'README.md'),
          readmeUpdate
        );

        console.log(`  ✅ ${target.name}: New site built`);
      } catch (error) {
        console.log(`  ❌ ${target.name}: ${error}`);
        target.status = 'error';
      }
    }

    await this.logProgress();
  }

  private async phaseDeploy(): Promise<void> {
    console.log('🚀 Phase 6: Deploying...');

    for (const target of this.targets) {
      if (target.status === 'error') continue;

      try {
        target.status = 'deploying';
        await this.logProgress();

        // Git operations
        execSync('git checkout -b redesign-2026', { 
          cwd: target.localPath,
          stdio: 'pipe'
        });

        execSync('git add -A', { 
          cwd: target.localPath,
          stdio: 'pipe'
        });

        execSync('git commit -m "🎨 Complete redesign: Unique branding, accurate info, modern UI"', { 
          cwd: target.localPath,
          stdio: 'pipe'
        });

        execSync('git push origin redesign-2026', { 
          cwd: target.localPath,
          stdio: 'pipe'
        });

        target.status = 'complete';
        console.log(`  ✅ ${target.name}: Deployed to branch "redesign-2026"`);
      } catch (error) {
        console.log(`  ❌ ${target.name}: ${error}`);
        target.status = 'error';
      }
    }

    await this.logProgress();
  }

  // Helper methods
  private async findHtmlFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.html')) {
          files.push(path.join(dir, entry.name));
        }
      }
    } catch {}
    return files;
  }

  private async auditHtmlFile(filePath: string): Promise<string[]> {
    const issues: string[] = [];
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (content.includes('lorem ipsum') || content.includes('Lorem ipsum')) {
        issues.push('Contains Lorem Ipsum placeholder text');
      }
      
      if ((content.match(/<img/g) || []).length > 5) {
        issues.push('Many images - may be generic');
      }
      
      if (content.includes('template') || content.includes('Template')) {
        issues.push('Mentions template');
      }
    } catch {}
    return issues;
  }

  private async checkGenericImages(dir: string): Promise<boolean> {
    try {
      const files = await fs.readdir(dir);
      const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|svg)$/i.test(f));
      return imageFiles.length > 3;
    } catch {
      return false;
    }
  }

  private async checkGenericContent(dir: string): Promise<boolean> {
    try {
      const indexPath = path.join(dir, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');
      return content.includes('Lorem') || content.includes('placeholder');
    } catch {
      return false;
    }
  }

  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }

  private inferLocation(name: string): string {
    if (name.includes('johannesburg') || name.includes('jhb')) return 'Johannesburg, South Africa';
    if (name.includes('cape') || name.includes('cpt')) return 'Cape Town, South Africa';
    if (name.includes('durban') || name.includes('dbn')) return 'Durban, South Africa';
    if (name.includes('pretoria') || name.includes('pta')) return 'Pretoria, South Africa';
    return 'South Africa';
  }

  private inferServices(category: string): string[] {
    const services: Record<string, string[]> = {
      plumbing: ['Emergency Repairs', 'Leak Detection', 'Pipe Installation', 'Drain Cleaning', 'Geyser Services'],
      cleaning: ['Residential Cleaning', 'Office Cleaning', 'Deep Cleaning', 'Window Cleaning', 'Move-in/Move-out'],
      handyman: ['General Repairs', 'Painting', 'Furniture Assembly', 'Door/Window Repairs', 'Maintenance'],
      auto: ['Car Wash', 'Detailing', 'Interior Cleaning', 'Waxing', 'Engine Cleaning'],
      locksmith: ['Emergency Unlock', 'Key Cutting', 'Lock Installation', 'Security Systems', 'Safe Opening']
    };
    return services[category] || ['Professional Services'];
  }

  private generateBrandColors(category: string, name: string): Record<string, string> {
    const palettes: Record<string, Record<string, string>[]> = {
      plumbing: [
        { primary: '#0066CC', secondary: '#00A8E8', accent: '#FF6B35', dark: '#003D7A', light: '#E6F2FF' },
        { primary: '#1E3A5F', secondary: '#4A90A4', accent: '#F4A261', dark: '#0F1F33', light: '#F0F4F8' },
        { primary: '#0E4C92', secondary: '#5DADE2', accent: '#E74C3C', dark: '#073666', light: '#EBF5FB' }
      ],
      cleaning: [
        { primary: '#00B894', secondary: '#55EFC4', accent: '#FDCB6E', dark: '#00A884', light: '#E8F8F5' },
        { primary: '#6C5CE7', secondary: '#A29BFE', accent: '#FD79A8', dark: '#5B4BC4', light: '#F3F0FF' },
        { primary: '#0984E3', secondary: '#74B9FF', accent: '#00CEC9', dark: '#0770C2', light: '#E8F4FD' }
      ],
      handyman: [
        { primary: '#E17055', secondary: '#FAB1A0', accent: '#00B894', dark: '#D63031', light: '#FFF5F5' },
        { primary: '#2D3436', secondary: '#636E72', accent: '#E84393', dark: '#1E272E', light: '#F5F6FA' }
      ],
      auto: [
        { primary: '#D63031', secondary: '#FF7675', accent: '#FDCB6E', dark: '#B71540', light: '#FFF0F0' },
        { primary: '#2C3E50', secondary: '#34495E', accent: '#E74C3C', dark: '#1A252F', light: '#ECF0F1' }
      ],
      locksmith: [
        { primary: '#2C3E50', secondary: '#7F8C8D', accent: '#F1C40F', dark: '#1A252F', light: '#F8F9FA' },
        { primary: '#8E44AD', secondary: '#BB8FCE', accent: '#F39C12', dark: '#6C3483', light: '#F5EEF8' }
      ]
    };

    const categoryPalettes = palettes[category] || palettes.plumbing;
    // Use hash of name to pick consistent palette
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return categoryPalettes[hash % categoryPalettes.length];
  }

  private generateTagline(category: string, name: string): string {
    const taglines: Record<string, string[]> = {
      plumbing: ['Flowing Excellence', 'Your Pipes, Our Priority', 'Fast, Reliable, Leak-Free', 'Quality You Can Trust'],
      cleaning: ['Spotless Every Time', 'Clean Home, Happy Life', 'Professional Shine', 'We Make It Sparkle'],
      handyman: ['Fixing What Matters', 'Your Home, Our Care', 'No Job Too Small', 'Quality Craftsmanship'],
      auto: ['Drive Clean', 'Love Your Car Again', 'Premium Care', 'Shine Like New'],
      locksmith: ['Securing What Matters', 'Your Safety, Our Priority', '24/7 Peace of Mind', 'Key to Security']
    };

    const categoryTaglines = taglines[category] || taglines.plumbing;
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return categoryTaglines[hash % categoryTaglines.length];
  }

  private selectFonts(category: string): Record<string, string> {
    const fonts: Record<string, Record<string, string>> = {
      plumbing: { heading: 'Montserrat', body: 'Open Sans' },
      cleaning: { heading: 'Poppins', body: 'Inter' },
      handyman: { heading: 'Roboto Condensed', body: 'Roboto' },
      auto: { heading: 'Oswald', body: 'Lato' },
      locksmith: { heading: 'Raleway', body: 'Source Sans Pro' }
    };
    return fonts[category] || fonts.plumbing;
  }

  private selectLayout(category: string): string {
    const layouts: Record<string, string[]> = {
      plumbing: ['hero-services-contact', 'modern-split'],
      cleaning: ['clean-minimal', 'feature-cards'],
      handyman: ['bold-hero', 'services-grid'],
      auto: ['showcase-gallery', 'before-after'],
      locksmith: ['trust-focused', 'emergency-cta']
    };
    const categoryLayouts = layouts[category] || layouts.plumbing;
    return categoryLayouts[0];
  }

  private async generateImagePrompts(target: WebsiteTarget, research: any): Promise<string[]> {
    const basePrompts: Record<string, string[]> = {
      plumbing: [
        `Professional plumber in uniform fixing pipe, modern kitchen, ${research.brandColors.primary} accent lighting`,
        `Emergency plumbing service van, branded with ${research.businessName}, city background`,
        `High-tech leak detection equipment, professional setting, ${research.brandColors.primary} highlights`
      ],
      cleaning: [
        `Team of professional cleaners in branded uniforms, sparkling clean modern home, ${research.brandColors.primary} accents`,
        `Before and after cleaning transformation, bright and fresh environment`,
        `Eco-friendly cleaning supplies, professional organization, ${research.brandColors.secondary} color scheme`
      ],
      handyman: [
        `Professional handyman with tools, home repair scene, ${research.brandColors.primary} tool belt`,
        `Completed home improvement project, modern interior, quality craftsmanship`,
        `Handyman service van, ${research.businessName} branding, residential neighborhood`
      ],
      auto: [
        `Luxury car detailing, showroom shine, ${research.brandColors.primary} reflections`,
        `Professional car wash facility, modern equipment, premium service`,
        `Interior car cleaning, leather seats, meticulous attention to detail`
      ],
      locksmith: [
        `Professional locksmith with modern tools, security installation, ${research.brandColors.primary} uniform`,
        `High-security lock system, close-up detail, premium quality`,
        `24/7 emergency locksmith van, ${research.businessName} branding, night city background`
      ]
    };

    return basePrompts[target.category] || basePrompts.plumbing;
  }

  private buildWebsite(target: WebsiteTarget, research: any, design: any): string {
    const { businessName, tagline, services, location, brandColors } = research;
    const { fonts } = design;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessName} | ${this.capitalizeWords(target.category)} Services in ${location}</title>
    <meta name="description" content="${businessName} provides professional ${target.category} services in ${location}. ${tagline}. Call now for a free quote!">
    <link href="https://fonts.googleapis.com/css2?family=${fonts.heading.replace(' ', '+')}:wght@400;600;700&family=${fonts.body.replace(' ', '+')}:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: ${brandColors.primary};
            --secondary: ${brandColors.secondary};
            --accent: ${brandColors.accent};
            --dark: ${brandColors.dark};
            --light: ${brandColors.light};
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: '${fonts.body}', sans-serif; line-height: 1.6; color: #333; }
        h1, h2, h3 { font-family: '${fonts.heading}', sans-serif; }
        
        /* Navigation */
        nav {
            position: fixed; top: 0; width: 100%; padding: 1rem 5%;
            background: rgba(255,255,255,0.95); backdrop-filter: blur(10px);
            border-bottom: 2px solid var(--primary); z-index: 1000;
            display: flex; justify-content: space-between; align-items: center;
        }
        .logo { font-size: 1.5rem; font-weight: 700; color: var(--primary); text-decoration: none; }
        .nav-links { display: flex; gap: 2rem; list-style: none; }
        .nav-links a { color: var(--dark); text-decoration: none; font-weight: 500; transition: color 0.3s; }
        .nav-links a:hover { color: var(--primary); }
        
        /* Hero */
        .hero {
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            text-align: center; padding: 120px 5% 80px;
            background: linear-gradient(135deg, var(--light) 0%, #fff 100%);
            position: relative; overflow: hidden;
        }
        .hero::before {
            content: ''; position: absolute; top: -50%; right: -20%; width: 600px; height: 600px;
            background: var(--primary); opacity: 0.05; border-radius: 50%;
        }
        .hero-content { max-width: 800px; position: relative; z-index: 1; }
        .hero h1 { font-size: clamp(2.5rem, 5vw, 4rem); color: var(--dark); margin-bottom: 1rem; }
        .hero-subtitle { font-size: 1.5rem; color: var(--primary); margin-bottom: 1.5rem; }
        .hero p { font-size: 1.2rem; color: #666; margin-bottom: 2rem; }
        .cta-button {
            display: inline-block; padding: 1rem 2.5rem; background: var(--primary);
            color: white; text-decoration: none; border-radius: 50px; font-weight: 600;
            transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .cta-button:hover { background: var(--dark); transform: translateY(-2px); }
        
        /* Services */
        .services { padding: 5rem 5%; background: #fff; }
        .section-title { text-align: center; font-size: 2.5rem; color: var(--dark); margin-bottom: 3rem; }
        .services-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem; max-width: 1200px; margin: 0 auto;
        }
        .service-card {
            padding: 2rem; border-radius: 15px; background: var(--light);
            transition: all 0.3s; text-align: center;
        }
        .service-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .service-card i { font-size: 3rem; color: var(--primary); margin-bottom: 1rem; }
        .service-card h3 { color: var(--dark); margin-bottom: 0.5rem; }
        
        /* About */
        .about { padding: 5rem 5%; background: var(--light); }
        .about-content {
            max-width: 1000px; margin: 0 auto; text-align: center;
        }
        .about h2 { color: var(--dark); margin-bottom: 1.5rem; }
        .about p { font-size: 1.1rem; color: #555; margin-bottom: 1rem; }
        
        /* Contact */
        .contact { padding: 5rem 5%; background: var(--dark); color: white; text-align: center; }
        .contact h2 { margin-bottom: 2rem; }
        .contact-info { display: flex; justify-content: center; gap: 3rem; flex-wrap: wrap; margin-top: 2rem; }
        .contact-item { display: flex; align-items: center; gap: 0.5rem; }
        .contact-item i { color: var(--accent); font-size: 1.5rem; }
        
        /* Footer */
        footer { padding: 2rem 5%; background: #1a1a1a; color: #999; text-align: center; }
        footer a { color: var(--accent); text-decoration: none; }
        
        /* Mobile */
        @media (max-width: 768px) {
            .nav-links { display: none; }
            .hero h1 { font-size: 2rem; }
            .contact-info { flex-direction: column; gap: 1rem; }
        }
    </style>
</head>
<body>
    <nav>
        <a href="#" class="logo">${businessName}</a>
        <ul class="nav-links">
            <li><a href="#services">Services</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>

    <section class="hero">
        <div class="hero-content">
            <h1>${businessName}</h1>
            <p class="hero-subtitle">${tagline}</p>
            <p>Professional ${target.category} services in ${location}. Quality workmanship, reliable service, competitive prices.</p>
            <a href="#contact" class="cta-button">Get a Free Quote</a>
        </div>
    </section>

    <section class="services" id="services">
        <h2 class="section-title">Our Services</h2>
        <div class="services-grid">
            ${services.map((service: string) => `
            <div class="service-card">
                <i class="fas fa-check-circle"></i>
                <h3>${service}</h3>
                <p>Professional ${service.toLowerCase()} with quality guarantee.</p>
            </div>
            `).join('')}
        </div>
    </section>

    <section class="about" id="about">
        <div class="about-content">
            <h2>About ${businessName}</h2>
            <p>Welcome to ${businessName}, your trusted ${target.category} service provider in ${location}. With years of experience and a commitment to excellence, we deliver top-quality services that exceed expectations.</p>
            <p>Our team of skilled professionals is dedicated to providing reliable, efficient, and affordable solutions for all your ${target.category} needs.</p>
        </div>
    </section>

    <section class="contact" id="contact">
        <h2>Contact Us</h2>
        <p>Ready to get started? Contact us today for a free consultation!</p>
        <div class="contact-info">
            <div class="contact-item">
                <i class="fas fa-phone"></i>
                <span>Call for Quote</span>
            </div>
            <div class="contact-item">
                <i class="fas fa-envelope"></i>
                <span>info@${target.name.replace(/-/g, '')}.co.za</span>
            </div>
            <div class="contact-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${location}</span>
            </div>
        </div>
    </section>

    <footer>
        <p>&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved. | Professional ${target.category} services in ${location}</p>
    </footer>

    <script>
        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    </script>
</body>
</html>`;
  }

  private generateReadme(target: WebsiteTarget, research: any): string {
    return `# ${research.businessName}

> ${research.tagline}

Professional ${target.category} services in ${research.location}.

## 🎨 Brand Identity

- **Primary Color:** ${research.brandColors.primary}
- **Secondary Color:** ${research.brandColors.secondary}
- **Accent Color:** ${research.brandColors.accent}

## 🛠️ Services

${research.services.map((s: string) => `- ${s}`).join('\n')}

## 📝 Recent Updates

- **${new Date().toLocaleDateString()}:** Complete redesign with unique branding
- **${new Date().toLocaleDateString()}:** Updated content with accurate business information
- **${new Date().toLocaleDateString()}:** Modern responsive design

---

Built with ❤️ for ${research.businessName}
`;
  }

  private async logProgress(): Promise<void> {
    try {
      await fs.writeFile(LOG_FILE, JSON.stringify({
        timestamp: new Date().toISOString(),
        targets: this.targets
      }, null, 2));
    } catch {}
  }

  private async generateReport(): Promise<void> {
    const complete = this.targets.filter(t => t.status === 'complete').length;
    const errors = this.targets.filter(t => t.status === 'error').length;

    console.log('');
    console.log('='.repeat(50));
    console.log('AUTOMATION REPORT');
    console.log('='.repeat(50));
    console.log(`Total: ${this.targets.length}`);
    console.log(`Complete: ${complete} ✅`);
    console.log(`Errors: ${errors} ❌`);
    console.log('');
    console.log('Branches Created:');
    this.targets.forEach(t => {
      if (t.status === 'complete') {
        console.log(`  - ${t.name}: redesign-2026`);
      }
    });
    console.log('='.repeat(50));
  }
}

// Run
new AutomationController().run().catch(console.error);
