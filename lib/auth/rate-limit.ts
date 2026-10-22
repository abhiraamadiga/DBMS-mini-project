interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
}

const attempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record) {
    return { allowed: true, remaining: MAX_ATTEMPTS, resetInMs: 0 };
  }

  if (now - record.firstAttemptAt > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true, remaining: MAX_ATTEMPTS, resetInMs: 0 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: WINDOW_MS - (now - record.firstAttemptAt),
    };
  }

  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - record.count,
    resetInMs: WINDOW_MS - (now - record.firstAttemptAt),
  };
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptAt: now });
  } else {
    record.count += 1;
  }
}

export function resetRateLimit(key: string): void {
  attempts.delete(key);
}
