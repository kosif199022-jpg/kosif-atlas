export type AdapterSurface = "chat" | "cli" | "autonomous_self_hosted";

export type AdapterOutcome =
  | "success"
  | "transient_failure"
  | "auth_failure"
  | "fatal_failure";

export interface InvocationRequest {
  readonly jobId: string;
  readonly requestId: string;
  readonly surface: AdapterSurface;
  readonly prompt: string;
  readonly workingDirectory: string;
}

export interface AdapterSecretPattern {
  readonly id: string;
  readonly vendor: string;
  readonly patternKind: "regex";
  readonly pattern: string;
}

export interface AdapterFacts {
  readonly adapterId: string;
  readonly vendor: string;
  readonly executable: {
    readonly available: boolean;
    readonly path: string;
    readonly version?: string;
  };
  readonly auth: {
    readonly available: boolean;
    readonly authMethod?: string;
    readonly apiProvider?: string;
    readonly subscriptionEligible: boolean;
  };
  readonly headless: boolean;
  readonly surfaces: readonly AdapterSurface[];
  readonly autonomousEligible: boolean;
  readonly limits: {
    readonly processTimeoutMs: number;
  };
  readonly secretPatterns: readonly AdapterSecretPattern[];
}

export interface InvocationDiagnostic {
  readonly kind: string;
  readonly message: string;
  readonly exitCode?: number;
}

// Model-usage figures the vendor CLI reported for one invocation, when it
// did: claude's result envelope carries usage + total_cost_usd, codex's
// turn.completed carries usage. Absent fields mean the vendor did not report
// them - never zero. Pure telemetry: no gate or predicate may read this.
export interface InvocationUsage {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly costUsd?: number;
}

// Transport-neutral attempt summary (packet adapter-resilience-layer-1). Field
// names are final; the follow-up packet records them. Absent on preflight-gated
// failures that never spawned.
export interface InvocationResilience {
  readonly attempts: number;
  readonly backoffMs: number;
  readonly budgetMs: number;
  readonly progress?: { readonly progressing: boolean; readonly reason: string };
  readonly transcriptPath?: string;
}

export interface InvocationResult {
  readonly outcome: AdapterOutcome;
  readonly adapterId: string;
  readonly jobId: string;
  readonly requestId: string;
  readonly response?: {
    readonly text: string;
    readonly sessionId: string;
    readonly usage?: InvocationUsage;
  };
  readonly diagnostic?: InvocationDiagnostic;
  readonly resilience?: InvocationResilience;
}

export interface Adapter {
  preflight(): Promise<AdapterFacts>;
  invoke(request: InvocationRequest): Promise<InvocationResult>;
}
