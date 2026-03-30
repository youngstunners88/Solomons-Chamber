/**
 * ═══════════════════════════════════════════════════════════════
 * SEPARATION OF CONCERNS - BOUNDARY ENFORCEMENT
 * ═══════════════════════════════════════════════════════════════
 * 
 * Runtime and build-time boundary checks for module isolation.
 */

export interface BoundaryRule {
  readonly module: string;
  readonly exports: ReadonlyArray<string>;
  readonly allowedConsumers: ReadonlyArray<string>;
}

export interface BoundaryConfig {
  readonly rules: ReadonlyArray<BoundaryRule>;
  readonly strict: boolean;
}

class BoundaryEnforcerImpl {
  private config: BoundaryConfig = { rules: [], strict: false };

  configure(config: BoundaryConfig): void {
    this.config = config;
  }

  checkImport(
    importerModule: string,
    importPath: string
  ): { allowed: boolean; reason?: string } {
    if (!this.config.strict) {
      return { allowed: true };
    }

    // Find which module is being imported
    const targetModule = this.config.rules.find((rule) =>
      importPath.includes(rule.module)
    );

    if (!targetModule) {
      return { allowed: true };
    }

    if (
      targetModule.allowedConsumers.length > 0 &&
      !targetModule.allowedConsumers.includes(importerModule)
    ) {
      return {
        allowed: false,
        reason: `Module "${importerModule}" is not allowed to import from "${targetModule.module}". ` +
          `Allowed consumers: ${targetModule.allowedConsumers.join(', ')}`,
      };
    }

    return { allowed: true };
  }

  validateExport(
    moduleName: string,
    exportName: string
  ): { valid: boolean; reason?: string } {
    const rule = this.config.rules.find((r) => r.module === moduleName);
    if (!rule) {
      return { valid: true };
    }

    if (rule.exports.length > 0 && !rule.exports.includes(exportName)) {
      return {
        valid: false,
        reason: `"${exportName}" is not in the public API of module "${moduleName}". ` +
          `Allowed exports: ${rule.exports.join(', ')}`,
      };
    }

    return { valid: true };
  }
}

export const boundaryEnforcer = new BoundaryEnforcerImpl();
