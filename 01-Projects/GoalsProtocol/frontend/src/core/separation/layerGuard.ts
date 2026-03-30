/**
 * ═══════════════════════════════════════════════════════════════
 * SEPARATION OF CONCERNS - LAYER GUARD
 * ═══════════════════════════════════════════════════════════════
 * 
 * Enforces Clean Architecture dependency rules at runtime and build time.
 */

export type ArchitectureLayer =
  | 'presentation'
  | 'application'
  | 'domain'
  | 'infrastructure';

interface LayerRule {
  readonly layer: ArchitectureLayer;
  readonly allowedImports: ReadonlyArray<ArchitectureLayer>;
}

const LAYER_RULES: Record<ArchitectureLayer, LayerRule> = {
  presentation: {
    layer: 'presentation',
    allowedImports: ['application', 'domain'],
  },
  application: {
    layer: 'application',
    allowedImports: ['domain'],
  },
  domain: {
    layer: 'domain',
    allowedImports: [],
  },
  infrastructure: {
    layer: 'infrastructure',
    allowedImports: ['application', 'domain'],
  },
};

export class LayerViolationError extends Error {
  constructor(
    public readonly fromLayer: ArchitectureLayer,
    public readonly toLayer: ArchitectureLayer,
    public readonly importPath: string
  ) {
    super(
      `Architecture violation: ${fromLayer} cannot import ${toLayer} (${importPath}). ` +
        `Allowed imports from ${fromLayer}: ${
          LAYER_RULES[fromLayer].allowedImports.join(', ') || 'none'
        }`
    );
    this.name = 'LayerViolationError';
  }
}

export const layerGuard = {
  validateImport: (
    fromLayer: ArchitectureLayer,
    importPath: string
  ): void => {
    // Determine target layer from import path
    const detectedLayer = detectLayerFromPath(importPath);
    if (!detectedLayer) return;

    const rule = LAYER_RULES[fromLayer];
    if (!rule.allowedImports.includes(detectedLayer) && detectedLayer !== fromLayer) {
      throw new LayerViolationError(fromLayer, detectedLayer, importPath);
    }
  },

  isValidImport: (
    fromLayer: ArchitectureLayer,
    importPath: string
  ): boolean => {
    try {
      layerGuard.validateImport(fromLayer, importPath);
      return true;
    } catch {
      return false;
    }
  },

  getAllowedImports: (layer: ArchitectureLayer): ReadonlyArray<ArchitectureLayer> => {
    return LAYER_RULES[layer].allowedImports;
  },
};

const detectLayerFromPath = (importPath: string): ArchitectureLayer | null => {
  const layers: ArchitectureLayer[] = ['presentation', 'application', 'domain', 'infrastructure'];
  for (const layer of layers) {
    if (
      importPath.includes(`/${layer}/`) ||
      importPath.includes(`@${layer}/`)
    ) {
      return layer;
    }
  }
  return null;
};
