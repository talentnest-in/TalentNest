import { createClient, RedisClientType } from 'redis';

let instance: RedisService | null = null;

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 200;
const MAX_DELAY_MS = 10000;
const CONNECT_TIMEOUT_MS = 5000;

const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
} as const;

type CircuitState = (typeof CircuitState)[keyof typeof CircuitState];

class CircuitBreaker {
  state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private readonly threshold = 3;
  private readonly resetTimeout = 30000;
  private lastFailureTime = 0;

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  recordFailure(): boolean {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
      return true;
    }
    return false;
  }

  attemptReset(): boolean {
    if (this.state === CircuitState.OPEN && Date.now() - this.lastFailureTime >= this.resetTimeout) {
      this.state = CircuitState.HALF_OPEN;
      return true;
    }
    return false;
  }

  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }
}

export class RedisService {
  public client: RedisClientType | null = null;
  public isConnected = false;
  private url: string;
  private circuit = new CircuitBreaker();
  private reconnectAttempts = 0;

  constructor(url?: string) {
    const password = url
      ? undefined
      : process.env.REDIS_PASSWORD || undefined;
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || '6379';

    this.url =
      url ||
      process.env.REDIS_URL ||
      (password
        ? `redis://:${encodeURIComponent(password)}@${host}:${port}`
        : `redis://${host}:${port}`);
  }

  async connect(): Promise<boolean> {
    if (this.circuit.isOpen()) {
      if (!this.circuit.attemptReset()) {
        console.warn('[Redis] Circuit breaker OPEN — skipping connection attempt');
        this.isConnected = false;
        return false;
      }
      console.log('[Redis] Circuit breaker HALF_OPEN — attempting connection');
    }

    try {
      this.client = createClient({
        url: this.url,
        socket: {
          connectTimeout: CONNECT_TIMEOUT_MS,
          reconnectStrategy: (retries: number) => {
            if (retries > MAX_RETRIES) {
              console.error(`[Redis] Max retries (${MAX_RETRIES}) exceeded — giving up`);
              return new Error('Max reconnection retries exceeded');
            }
            const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retries), MAX_DELAY_MS);
            const jitter = delay * (0.5 + Math.random() * 0.5);
            console.log(`[Redis] Reconnecting in ${Math.round(jitter)}ms (attempt ${retries}/${MAX_RETRIES})`);
            return Math.round(jitter);
          },
        },
      });

      this.client.on('error', (err: Error) => {
        console.error('[Redis] Client error:', err.message);
        this.isConnected = false;
        this.circuit.recordFailure();
      });

      this.client.on('connect', () => {
        console.log('[Redis] Connected');
        this.reconnectAttempts = 0;
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.circuit.recordSuccess();
      });

      this.client.on('end', () => {
        console.log('[Redis] Connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
      this.circuit.recordSuccess();
      this.reconnectAttempts = 0;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[Redis] Failed to connect:', message);

      if (this.client) {
        try { await this.client.disconnect(); } catch { /* ignore */ }
        this.client = null;
      }

      this.isConnected = false;
      this.circuit.recordFailure();
      console.warn('[Redis] Running without Redis — caching and rate limiting degraded');
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
      } catch {
        // ignore
      }
      this.isConnected = false;
      this.client = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async setEx(key: string, ttlSeconds: number, value: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.setEx(key, ttlSeconds, value);
    } catch {
      // silent fail
    }
  }

  async del(key: string | string[]): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch {
      // silent fail
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected || !this.client) return [];
    try {
      return await this.client.keys(pattern);
    } catch {
      return [];
    }
  }

  async ping(): Promise<boolean> {
    if (!this.isConnected || !this.client) return false;
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}

export function getRedisService(): RedisService {
  if (!instance) {
    instance = new RedisService();
  }
  return instance;
}

export async function connectRedis(): Promise<RedisService> {
  const svc = getRedisService();
  await svc.connect();
  return svc;
}

export async function disconnectRedis(): Promise<void> {
  const svc = getRedisService();
  await svc.disconnect();
}
