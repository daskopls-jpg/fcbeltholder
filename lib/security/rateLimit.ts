type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function nowMs(): number {
  return Date.now();
}

export function getClientIp(request: Request): string {
  const headers = (request as { headers?: { get?: (name: string) => string | null } }).headers;

  const forwarded = headers?.get?.('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = headers?.get?.('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { limited: boolean; retryAfterSeconds: number } {
  const now = nowMs();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfterSeconds: 0 };
  }

  current.count += 1;
  if (current.count > limit) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  return { limited: false, retryAfterSeconds: 0 };
}
