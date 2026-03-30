/**
 * ═══════════════════════════════════════════════════════════════
 * ABSTRACTION LAYER - DEPENDENCY INJECTION CONTAINER
 * ═══════════════════════════════════════════════════════════════
 */

export type Constructor<T> = new (...args: unknown[]) => T;
export type Factory<T> = () => T;

export interface Registration<T> {
  readonly token: string;
  readonly instance?: T;
  readonly factory?: Factory<T>;
  readonly singleton: boolean;
}

class DIContainerImpl {
  private registrations = new Map<string, Registration<unknown>>();
  private singletons = new Map<string, unknown>();

  registerSingleton<T>(token: string, constructor: Constructor<T>): void;
  registerSingleton<T>(token: string, factory: Factory<T>): void;
  registerSingleton<T>(token: string, value: Constructor<T> | Factory<T>): void {
    if (typeof value === 'function' && value.prototype?.constructor === value) {
      this.registrations.set(token, {
        token,
        factory: () => new (value as Constructor<T>)(),
        singleton: true,
      });
    } else {
      this.registrations.set(token, {
        token,
        factory: value as Factory<T>,
        singleton: true,
      });
    }
  }

  registerTransient<T>(token: string, constructor: Constructor<T>): void;
  registerTransient<T>(token: string, factory: Factory<T>): void;
  registerTransient<T>(token: string, value: Constructor<T> | Factory<T>): void {
    if (typeof value === 'function' && value.prototype?.constructor === value) {
      this.registrations.set(token, {
        token,
        factory: () => new (value as Constructor<T>)(),
        singleton: false,
      });
    } else {
      this.registrations.set(token, {
        token,
        factory: value as Factory<T>,
        singleton: false,
      });
    }
  }

  registerInstance<T>(token: string, instance: T): void {
    this.registrations.set(token, {
      token,
      instance,
      singleton: true,
    });
    this.singletons.set(token, instance);
  }

  resolve<T>(token: string): T {
    const registration = this.registrations.get(token);
    if (!registration) {
      throw new Error(`No registration found for token: ${token}`);
    }

    if (registration.instance !== undefined) {
      return registration.instance as T;
    }

    if (registration.singleton) {
      const existing = this.singletons.get(token);
      if (existing !== undefined) {
        return existing as T;
      }
      const instance = registration.factory!();
      this.singletons.set(token, instance);
      return instance as T;
    }

    return registration.factory!() as T;
  }

  has(token: string): boolean {
    return this.registrations.has(token);
  }

  unregister(token: string): boolean {
    this.singletons.delete(token);
    return this.registrations.delete(token);
  }

  clear(): void {
    this.registrations.clear();
    this.singletons.clear();
  }
}

export const container = new DIContainerImpl();

// Decorator for injectable services
export const injectable = (token?: string) => {
  return <T extends Constructor<unknown>>(constructor: T): T => {
    const serviceToken = token || constructor.name;
    container.registerSingleton(serviceToken, constructor);
    return constructor;
  };
};
