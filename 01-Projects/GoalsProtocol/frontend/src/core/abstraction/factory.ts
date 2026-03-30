/**
 * ═══════════════════════════════════════════════════════════════
 * ABSTRACTION LAYER - FACTORY PATTERNS
 * ═══════════════════════════════════════════════════════════════
 */

export interface FactoryConfig<P, T> {
  readonly create: (params: P) => T;
  readonly reset?: (instance: T) => void;
  readonly validate?: (params: P) => boolean;
}

export class ObjectFactory<P, T> {
  private config: FactoryConfig<P, T>;
  private pool: T[] = [];
  private maxPoolSize: number;

  constructor(config: FactoryConfig<P, T>, maxPoolSize: number = 10) {
    this.config = config;
    this.maxPoolSize = maxPoolSize;
  }

  create(params: P): T {
    if (this.config.validate && !this.config.validate(params)) {
      throw new Error('Factory validation failed for params');
    }

    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }

    return this.config.create(params);
  }

  release(instance: T): void {
    if (this.pool.length < this.maxPoolSize) {
      this.config.reset?.(instance);
      this.pool.push(instance);
    }
  }

  clearPool(): void {
    this.pool = [];
  }
}

export const createFactory = <P, T>(
  createFn: (params: P) => T,
  options?: {
    reset?: (instance: T) => void;
    validate?: (params: P) => boolean;
    poolSize?: number;
  }
): ObjectFactory<P, T> => {
  return new ObjectFactory(
    {
      create: createFn,
      reset: options?.reset,
      validate: options?.validate,
    },
    options?.poolSize
  );
};
