// Pure quota math, split out from lib/usage.ts so it can be unit tested
// (lib/usage.test.ts) without dragging in the Prisma client — importing
// lib/usage.ts constructs a PrismaClient at module load time, which needs a
// real DATABASE_URL and isn't something a pure-logic test should depend on.
export interface UsageStat {
  used: number;
  limit: number;
  remaining: number;
  exceeded: boolean;
}

export function toStat(used: number, limit: number): UsageStat {
  return {
    used,
    limit,
    remaining: Math.max(limit - used, 0),
    exceeded: used >= limit,
  };
}
