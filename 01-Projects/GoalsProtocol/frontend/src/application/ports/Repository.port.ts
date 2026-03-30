/**
 * ═══════════════════════════════════════════════════════════════
 * APPLICATION - REPOSITORY PORT
 * ═══════════════════════════════════════════════════════════════
 */

export interface Repository<T, ID = string> {
  readonly findById: (id: ID) => Promise<T | null>;
  readonly findAll: () => Promise<ReadonlyArray<T>>;
  readonly save: (entity: T) => Promise<void>;
  readonly delete: (id: ID) => Promise<void>;
}

export interface QueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly orderBy?: string;
  readonly orderDirection?: 'asc' | 'desc';
}

export interface QueryableRepository<T, ID = string> extends Repository<T, ID> {
  readonly query: (predicate: Partial<T>, options?: QueryOptions) => Promise<ReadonlyArray<T>>;
}
