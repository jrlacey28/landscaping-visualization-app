import type { Request, Response, NextFunction, RequestHandler } from "express";
import { AuthService } from "./auth";

type CostResolver = number | ((req: Request) => number);

interface WindowPolicy {
  windowMs: number;
  max: number;
}

interface TwoTierRateLimitOptions {
  name: string;
  burst: WindowPolicy;
  steady: WindowPolicy;
  cost?: CostResolver;
}

interface UsageEvent {
  timestamp: number;
  cost: number;
}

const rateLimitStore = new Map<string, UsageEvent[]>();

const normalizeIp = (ip?: string): string => {
  if (!ip) return "unknown";
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
};

const resolveUserKey = (req: Request): string => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (bearerToken) {
    const decoded = AuthService.verifyToken(bearerToken);
    if (decoded?.userId) {
      return `user:${decoded.userId}`;
    }
  }

  const sessionUserId = (req as any).session?.userId;
  if (sessionUserId) {
    return `session-user:${sessionUserId}`;
  }

  if ((req as any).session?.isAdmin) {
    return "admin-session";
  }

  return "anonymous";
};

export const default429Handler = (
  req: Request,
  res: Response,
  details: {
    name: string;
    policy: "burst" | "steady";
    retryAfterSeconds: number;
    burst: WindowPolicy;
    steady: WindowPolicy;
    key: string;
  },
) => {
  res.setHeader("Retry-After", details.retryAfterSeconds.toString());
  return res.status(429).json({
    error: "Too many requests",
    code: "RATE_LIMIT_EXCEEDED",
    message: `Rate limit exceeded for ${details.name}. Please retry later.`,
    rateLimit: {
      policy: details.policy,
      retryAfterSeconds: details.retryAfterSeconds,
      burst: {
        max: details.burst.max,
        windowMs: details.burst.windowMs,
      },
      steady: {
        max: details.steady.max,
        windowMs: details.steady.windowMs,
      },
      key: details.key,
    },
    path: req.path,
  });
};

const calculateCost = (req: Request, costResolver?: CostResolver) => {
  if (typeof costResolver === "function") {
    return Math.max(1, Math.floor(costResolver(req)));
  }
  if (typeof costResolver === "number") {
    return Math.max(1, Math.floor(costResolver));
  }
  return 1;
};

const sumCostInWindow = (events: UsageEvent[], now: number, windowMs: number) => {
  const threshold = now - windowMs;
  let total = 0;
  for (const event of events) {
    if (event.timestamp > threshold) {
      total += event.cost;
    }
  }
  return total;
};

export const createTwoTierRateLimiter = (options: TwoTierRateLimitOptions): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = normalizeIp(req.ip);
    const userKey = resolveUserKey(req);
    const requestKey = `${options.name}:${ip}:${userKey}`;

    const cost = calculateCost(req, options.cost);
    const events = rateLimitStore.get(requestKey) ?? [];

    const maxWindowMs = Math.max(options.burst.windowMs, options.steady.windowMs);
    const activeEvents = events.filter((event) => event.timestamp > now - maxWindowMs);

    const burstUsed = sumCostInWindow(activeEvents, now, options.burst.windowMs);
    if (burstUsed + cost > options.burst.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil(options.burst.windowMs / 1000));
      return default429Handler(req, res, {
        name: options.name,
        policy: "burst",
        retryAfterSeconds,
        burst: options.burst,
        steady: options.steady,
        key: requestKey,
      });
    }

    const steadyUsed = sumCostInWindow(activeEvents, now, options.steady.windowMs);
    if (steadyUsed + cost > options.steady.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil(options.steady.windowMs / 1000));
      return default429Handler(req, res, {
        name: options.name,
        policy: "steady",
        retryAfterSeconds,
        burst: options.burst,
        steady: options.steady,
        key: requestKey,
      });
    }

    activeEvents.push({ timestamp: now, cost });
    rateLimitStore.set(requestKey, activeEvents);
    return next();
  };
};

const bytesPerMb = 1024 * 1024;

export const uploadCostByContentLength = (req: Request): number => {
  const contentLength = Number(req.headers["content-length"] ?? 0);
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return 2;
  }

  const sizeInMb = contentLength / bytesPerMb;
  if (sizeInMb <= 2) return 2;
  if (sizeInMb <= 8) return 3;
  if (sizeInMb <= 16) return 4;
  return 5;
};
