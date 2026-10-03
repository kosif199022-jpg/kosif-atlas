export interface PredicateRegistration {
  readonly name: string;
  evaluate(...args: readonly unknown[]): unknown;
}

export interface EffectRegistration {
  readonly name: string;
  execute(...args: readonly unknown[]): unknown;
}

export interface RoleRegistration {
  readonly name: string;
  readonly packageRef: string;
}

export interface Registry<T> {
  register(registration: T): void;
  get(name: string): T | undefined;
  has(name: string): boolean;
  entries(): IterableIterator<[string, T]>;
}

class NamedRegistry<T extends { readonly name: string }> implements Registry<T> {
  readonly #registrations = new Map<string, T>();

  register(registration: T): void {
    if (registration.name.length === 0) {
      throw new Error("Registry names must not be empty");
    }
    if (this.#registrations.has(registration.name)) {
      throw new Error(`Duplicate registry name: ${registration.name}`);
    }

    this.#registrations.set(registration.name, registration);
  }

  get(name: string): T | undefined {
    return this.#registrations.get(name);
  }

  has(name: string): boolean {
    return this.#registrations.has(name);
  }

  entries(): IterableIterator<[string, T]> {
    return this.#registrations.entries();
  }
}

export interface KernelRegistries {
  readonly predicates: Registry<PredicateRegistration>;
  readonly effects: Registry<EffectRegistration>;
  readonly roles: Registry<RoleRegistration>;
}

export function createKernelRegistries(): KernelRegistries {
  return {
    predicates: new NamedRegistry<PredicateRegistration>(),
    effects: new NamedRegistry<EffectRegistration>(),
    roles: new NamedRegistry<RoleRegistration>(),
  };
}
