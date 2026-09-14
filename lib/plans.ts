// Central place for plan limits. There's no billing provider wired up yet —
// every organization is created on "free" (see prisma/schema.prisma) — but
// keeping the limits keyed by planTier means a future Stripe webhook only
// has to flip that one field, not touch any enforcement logic.
export const PLAN_LIMITS = {
  free: {
    label: "Free",
    maxDocumentsPerMonth: 20,
    maxAnalysesPerMonth: 50,
  },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;

export function getPlanLimits(planTier: string) {
  return PLAN_LIMITS[planTier as PlanTier] ?? PLAN_LIMITS.free;
}
