// 简易内存频率限制器（单实例适用）
// 生产环境建议替换为 @upstash/ratelimit + Redis

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_ENTRIES = 10_000;

/** 清理过期条目（每 60 秒自动清理，超过上限时淘汰最旧条目） */
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
  // 防御内存无限增长
  if (store.size > MAX_ENTRIES) {
    const keys = [...store.keys()].slice(0, store.size - MAX_ENTRIES);
    for (const k of keys) store.delete(k);
  }
}

/**
 * 固定窗口频率限制（窗口到期后自动重置计数）
 * @param key 唯一标识（如 `login:${ip}` 或 `register:${ip}`）
 * @param maxRequests 窗口内最大请求数
 * @param windowMs 窗口时长（毫秒）
 * @returns { allowed: boolean, remaining: number }
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

/** 认证端点频率限制：每个 IP 每分钟最多 5 次尝试 */
export function authRateLimit(ip: string, action: "login" | "register") {
  return rateLimit(`auth:${action}:${ip}`, 5, 60_000);
}
