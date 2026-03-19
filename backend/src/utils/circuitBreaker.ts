/**
 * MyCryptoCoin -- Circuit Breaker for External Services
 *
 * Prevents cascading failures when blockchain RPCs, exchange APIs, or
 * other external dependencies become slow or unresponsive.
 *
 * States:
 *   CLOSED  -- normal operation, requests pass through
 *   OPEN    -- failures exceeded threshold, requests rejected immediately
 *   HALF_OPEN -- after cooldown, allow one probe request to test recovery
 *
 * Usage:
 *   const ethBreaker = new CircuitBreaker('eth-rpc', { failureThreshold: 5 });
 *   const balance = await ethBreaker.execute(() => provider.getBalance(addr));
 */

import { logger } from './logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit (default: 5) */
  failureThreshold?: number;
  /** Milliseconds the circuit stays open before switching to half-open (default: 30 000) */
  resetTimeoutMs?: number;
  /** Per-call timeout in ms (default: 10 000) */
  callTimeoutMs?: number;
  /** Number of successful probes needed to close the circuit from half-open (default: 2) */
  successThreshold?: number;
  /** Optional callback when the circuit opens */
  onOpen?: (name: string) => void;
  /** Optional callback when the circuit closes */
  onClose?: (name: string) => void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class CircuitBreaker {
  readonly name: string;
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly opts: Required<Omit<CircuitBreakerOptions, 'onOpen' | 'onClose'>> & {
    onOpen?: (name: string) => void;
    onClose?: (name: string) => void;
  };

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.opts = {
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeoutMs: options.resetTimeoutMs ?? 30_000,
      callTimeoutMs: options.callTimeoutMs ?? 10_000,
      successThreshold: options.successThreshold ?? 2,
      onOpen: options.onOpen,
      onClose: options.onClose,
    };
  }

  getState(): CircuitState {
    return this.state;
  }

  /**
   * Execute a function through the circuit breaker.
   * Throws CircuitOpenError if the circuit is open and cooldown has not elapsed.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // --- OPEN state: reject immediately unless cooldown elapsed ---
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.opts.resetTimeoutMs) {
        // Transition to HALF_OPEN -- allow a probe
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        logger.info(`Circuit breaker [${this.name}] transitioning to HALF_OPEN`);
      } else {
        throw new CircuitOpenError(
          `Circuit breaker [${this.name}] is OPEN — request rejected`,
          this.name,
        );
      }
    }

    // --- Execute with timeout ---
    try {
      const result = await this.withTimeout(fn, this.opts.callTimeoutMs);
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  /**
   * Convenience: execute and return a fallback value if the circuit is open
   * or the call fails. Useful for non-critical reads (e.g. cached exchange rates).
   */
  async executeWithFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await this.execute(fn);
    } catch {
      return fallback;
    }
  }

  /** Force the circuit open (e.g. from a health check). */
  trip(): void {
    if (this.state !== CircuitState.OPEN) {
      this.state = CircuitState.OPEN;
      this.lastFailureTime = Date.now();
      logger.warn(`Circuit breaker [${this.name}] manually tripped to OPEN`);
      this.opts.onOpen?.(this.name);
    }
  }

  /** Force the circuit closed (e.g. after manual recovery). */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    logger.info(`Circuit breaker [${this.name}] manually reset to CLOSED`);
    this.opts.onClose?.(this.name);
  }

  // ---- Internal helpers ----

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.opts.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        logger.info(`Circuit breaker [${this.name}] recovered — CLOSED`);
        this.opts.onClose?.(this.name);
      }
    } else {
      // In CLOSED state, reset failure counter on success
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Probe failed — reopen
      this.state = CircuitState.OPEN;
      logger.warn(`Circuit breaker [${this.name}] probe failed — re-opening`);
      this.opts.onOpen?.(this.name);
    } else if (this.failureCount >= this.opts.failureThreshold) {
      this.state = CircuitState.OPEN;
      logger.warn(
        `Circuit breaker [${this.name}] failure threshold reached (${this.failureCount}) — OPEN`,
      );
      this.opts.onOpen?.(this.name);
    }
  }

  private withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Circuit breaker [${this.name}] call timed out after ${ms}ms`));
      }, ms);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}

// ---------------------------------------------------------------------------
// Custom error type for open circuits
// ---------------------------------------------------------------------------

export class CircuitOpenError extends Error {
  readonly circuitName: string;

  constructor(message: string, circuitName: string) {
    super(message);
    this.name = 'CircuitOpenError';
    this.circuitName = circuitName;
  }
}

// ---------------------------------------------------------------------------
// Pre-configured breakers for common external dependencies
// ---------------------------------------------------------------------------

export const circuitBreakers = {
  ethRpc: new CircuitBreaker('eth-rpc', { failureThreshold: 5, resetTimeoutMs: 30_000, callTimeoutMs: 10_000 }),
  bscRpc: new CircuitBreaker('bsc-rpc', { failureThreshold: 5, resetTimeoutMs: 30_000, callTimeoutMs: 10_000 }),
  maticRpc: new CircuitBreaker('matic-rpc', { failureThreshold: 5, resetTimeoutMs: 30_000, callTimeoutMs: 10_000 }),
  solRpc: new CircuitBreaker('sol-rpc', { failureThreshold: 5, resetTimeoutMs: 30_000, callTimeoutMs: 10_000 }),
  btcRpc: new CircuitBreaker('btc-rpc', { failureThreshold: 5, resetTimeoutMs: 60_000, callTimeoutMs: 15_000 }),
  tronRpc: new CircuitBreaker('tron-rpc', { failureThreshold: 5, resetTimeoutMs: 30_000, callTimeoutMs: 10_000 }),
  exchangeApi: new CircuitBreaker('exchange-api', { failureThreshold: 3, resetTimeoutMs: 15_000, callTimeoutMs: 5_000 }),
};
