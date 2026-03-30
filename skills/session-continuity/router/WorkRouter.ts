/**
 * Work Routing System
 * 
 * Automatically routes work to appropriate folders and projects
 * based on content analysis and patterns.
 */

import * as path from 'path';
import {
  WorkType,
  RouteConfig,
  RouteAction,
  WorkItem
} from '../types/session.types';

export interface RouteResult {
  action: RouteAction;
  targetPath: string;
  projectId: string;
  workType: WorkType;
  confidence: number;
  suggestedTags: string[];
}

export interface RoutingContext {
  userInput: string;
  currentDirectory: string;
  recentFiles: string[];
  gitBranch?: string;
  fileExtensions: string[];
}

export class WorkRouter {
  private routes: RouteConfig[];
  private basePath: string;

  constructor(basePath: string = '/home/teacherchris37/Solomons-Chamber') {
    this.basePath = basePath;
    this.routes = this.initializeRoutes();
  }

  private initializeRoutes(): RouteConfig[] {
    return [
      // Website/Frontend Projects
      {
        pattern: /website|frontend|ui|landing|page|html|css|react|vue|svelte/i,
        target: '15-Website-Factory',
        action: RouteAction.CREATE_PROJECT,
        priority: 100
      },
      {
        pattern: /\.html$|\.tsx$|\.jsx$|\.vue$|\.svelte$/,
        target: '15-Website-Factory',
        action: RouteAction.UPDATE_PROJECT,
        priority: 90
      },

      // Goals Protocol / Blockchain
      {
        pattern: /blockchain|smart.?contract|nft|token|crypto|web3|solana|ethereum/i,
        target: '01-Projects/GoalsProtocol',
        action: RouteAction.UPDATE_PROJECT,
        priority: 95
      },
      {
        pattern: /\.sol$|\.rs$|anchor/i,
        target: '01-Projects/GoalsProtocol/contracts',
        action: RouteAction.UPDATE_PROJECT,
        priority: 90
      },

      // Trading
      {
        pattern: /trading|trader|stock|crypto|forex|signal|strategy|backtest/i,
        target: '03-Trading',
        action: RouteAction.CREATE_PROJECT,
        priority: 95
      },
      {
        pattern: /\.py$|trader/i,
        target: '03-Trading',
        action: RouteAction.UPDATE_PROJECT,
        priority: 85
      },

      // Research
      {
        pattern: /research|analyze|study|investigate|report|paper/i,
        target: '02-Research',
        action: RouteAction.CREATE_PROJECT,
        priority: 90
      },

      // Documentation
      {
        pattern: /document|doc|readme|guide|tutorial|manual/i,
        target: '08-Docs',
        action: RouteAction.CREATE_PROJECT,
        priority: 85
      },

      // Voice/Memo
      {
        pattern: /voice|memo|audio|transcribe|recording/i,
        target: '10-Skills/voice-memo-system',
        action: RouteAction.UPDATE_PROJECT,
        priority: 90
      },

      // Skills Development
      {
        pattern: /skill|mcp|tool|capability|plugin/i,
        target: '10-Skills',
        action: RouteAction.CREATE_PROJECT,
        priority: 90
      },

      // Self Notes/Reflection
      {
        pattern: /journal|reflect|note|daily|weekly|thought/i,
        target: '05-Self-Notes',
        action: RouteAction.CREATE_PROJECT,
        priority: 80
      },

      // Media/Content
      {
        pattern: /media|image|video|audio|content|generate/i,
        target: '06-Media',
        action: RouteAction.CREATE_PROJECT,
        priority: 85
      },

      // Assets/Resources
      {
        pattern: /asset|resource|template|adapter/i,
        target: '04-Assets',
        action: RouteAction.CREATE_PROJECT,
        priority: 80
      },

      // Archive/Complete
      {
        pattern: /archive|done|complete|finish|close/i,
        target: '07-Archive',
        action: RouteAction.ARCHIVE_SESSION,
        priority: 100
      },

      // Restore
      {
        pattern: /restore|resume|continue|previous|last.?session/i,
        target: '',
        action: RouteAction.RESTORE_SESSION,
        priority: 100
      }
    ];
  }

  public analyzeAndRoute(context: RoutingContext): RouteResult {
    const { userInput, currentDirectory, recentFiles, gitBranch, fileExtensions } = context;

    // Score each route
    const scoredRoutes = this.routes.map(route => {
      let score = 0;

      // Input matching
      if (route.pattern instanceof RegExp) {
        const matches = (userInput.match(route.pattern) || []).length;
        score += matches * 10 * route.priority;
      } else if (userInput.toLowerCase().includes(route.pattern.toLowerCase())) {
        score += 5 * route.priority;
      }

      // File extension matching
      fileExtensions.forEach(ext => {
        if (route.pattern instanceof RegExp && route.pattern.test(ext)) {
          score += 20 * route.priority;
        }
      });

      // Recent files matching
      recentFiles.forEach(file => {
        if (route.pattern instanceof RegExp && route.pattern.test(file)) {
          score += 15 * route.priority;
        }
      });

      // Current directory matching
      if (currentDirectory.includes(route.target)) {
        score += 25 * route.priority;
      }

      // Git branch hints
      if (gitBranch) {
        if (route.pattern instanceof RegExp && route.pattern.test(gitBranch)) {
          score += 10 * route.priority;
        }
      }

      return { route, score };
    });

    // Sort by score
    scoredRoutes.sort((a, b) => b.score - a.score);
    const bestMatch = scoredRoutes[0];

    // Determine work type from context
    const workType = this.detectWorkType(userInput);

    // Generate suggested tags
    const suggestedTags = this.generateTags(userInput, workType);

    // Calculate confidence (normalize score)
    const maxPossibleScore = 100 * 100; // max priority * max multiplier
    const confidence = Math.min(bestMatch.score / maxPossibleScore, 1);

    return {
      action: bestMatch.route.action,
      targetPath: path.join(this.basePath, bestMatch.route.target),
      projectId: this.generateProjectId(bestMatch.route.target, userInput),
      workType,
      confidence,
      suggestedTags
    };
  }

  private detectWorkType(input: string): WorkType {
    const patterns: [RegExp, WorkType][] = [
      [/fix|bug|error|issue|broken|crash/i, WorkType.BUGFIX],
      [/refactor|rewrite|restructure|clean.?up/i, WorkType.REFACTOR],
      [/research|investigate|analyze|study/i, WorkType.RESEARCH],
      [/document|doc|readme|guide/i, WorkType.DOCUMENTATION],
      [/design|ui|ux|layout|style/i, WorkType.DESIGN],
      [/deploy|release|publish|ship/i, WorkType.DEPLOYMENT],
      [/integrate|connect|bridge/i, WorkType.INTEGRATION],
      [/new|add|create|build|implement/i, WorkType.FEATURE]
    ];

    for (const [pattern, type] of patterns) {
      if (pattern.test(input)) return type;
    }

    return WorkType.UNKNOWN;
  }

  private generateTags(input: string, workType: WorkType): string[] {
    const tags: string[] = [workType];

    // Extract technology tags
    const techPatterns = [
      [/react|next\.?js/i, 'react'],
      [/vue|nuxt/i, 'vue'],
      [/svelte/i, 'svelte'],
      [/python/i, 'python'],
      [/typescript|ts/i, 'typescript'],
      [/javascript|js/i, 'javascript'],
      [/rust/i, 'rust'],
      [/solidity/i, 'solidity'],
      [/blockchain|web3/i, 'blockchain'],
      [/tailwind|css/i, 'styling'],
      [/api|rest|graphql/i, 'api'],
      [/database|db|sql/i, 'database'],
      [/test|spec/i, 'testing'],
      [/docker|container/i, 'docker'],
      [/kubernetes|k8s/i, 'kubernetes']
    ];

    techPatterns.forEach(([pattern, tag]) => {
      if (pattern.test(input) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });

    return tags;
  }

  private generateProjectId(target: string, input: string): string {
    const timestamp = Date.now().toString(36);
    const targetSlug = target.replace(/\//g, '-').toLowerCase();
    const inputSlug = input
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .split('-')
      .filter(s => s.length > 2)
      .slice(0, 3)
      .join('-');
    
    return `${targetSlug}-${inputSlug}-${timestamp}`.substring(0, 100);
  }

  public suggestNextActions(currentWork: WorkItem): string[] {
    const suggestions: string[] = [];

    switch (currentWork.type) {
      case WorkType.FEATURE:
        suggestions.push(
          'Write tests for the new feature',
          'Update documentation',
          'Create example usage',
          'Add error handling',
          'Optimize performance'
        );
        break;

      case WorkType.BUGFIX:
        suggestions.push(
          'Write regression test',
          'Verify fix across edge cases',
          'Update changelog',
          'Check related components'
        );
        break;

      case WorkType.REFACTOR:
        suggestions.push(
          'Run full test suite',
          'Check performance impact',
          'Update affected documentation',
          'Verify no breaking changes'
        );
        break;

      case WorkType.RESEARCH:
        suggestions.push(
          'Summarize findings',
          'Create implementation plan',
          'Document trade-offs',
          'Share with team'
        );
        break;

      case WorkType.DOCUMENTATION:
        suggestions.push(
          'Review for clarity',
          'Add code examples',
          'Check all links work',
          'Get peer review'
        );
        break;
    }

    return suggestions;
  }

  public getProjectPath(routeResult: RouteResult): string {
    return routeResult.targetPath;
  }

  public shouldCreateNewProject(input: string): boolean {
    const newProjectIndicators = [
      /create.?new|start.?new|init|new.?project/i,
      /build.?from.?scratch/i,
      /separate|standalone/i
    ];

    return newProjectIndicators.some(pattern => pattern.test(input));
  }

  public async findExistingProject(workType: WorkType, tags: string[]): Promise<string | null> {
    // This would search through existing projects
    // For now, return null to indicate new project
    return null;
  }
}
