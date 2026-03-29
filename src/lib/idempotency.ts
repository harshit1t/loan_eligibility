/**
 * Idempotency Storage
 * In a real production environment (like Vercel with multiple serverless instances), 
 * this MUST be backed by a distributed store like Redis.
 * This in-memory implementation serves as a demonstration for a single-instance dev server.
 */

const idempotencyStore = new Map<string, { status: number; body: any; expiresAt: number }>();

const TTL_MS = 1000 * 60 * 60; // 1 hour

export function getCachedResponse(key: string) {
  const cached = idempotencyStore.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached;
  }
  if (cached) {
    idempotencyStore.delete(key);
  }
  return null;
}

export function setCachedResponse(key: string, status: number, body: any) {
  idempotencyStore.set(key, {
    status,
    body,
    expiresAt: Date.now() + TTL_MS,
  });
}

// Cleanup interval (optional for demo)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyStore.entries()) {
    if (now > value.expiresAt) {
      idempotencyStore.delete(key);
    }
  }
}, 1000 * 60 * 10).unref(); // Every 10 mins
