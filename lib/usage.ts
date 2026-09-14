import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plans";
import { toStat, UsageStat } from "@/lib/usage-math";

export type { UsageStat };

export interface OrgUsage {
  planTier: string;
  documents: UsageStat;
  analyses: UsageStat;
}

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Usage resets every calendar month — counts rows created since the 1st
// rather than keeping a running counter, so there's nothing to reset or get
// out of sync.
export async function getOrgUsage(
  organizationId: string,
  planTier: string,
): Promise<OrgUsage> {
  const limits = getPlanLimits(planTier);
  const since = startOfCurrentMonth();

  const [documentsUsed, analysesUsed] = await Promise.all([
    prisma.document.count({
      where: { organizationId, createdAt: { gte: since } },
    }),
    prisma.analysisRun.count({
      where: { organizationId, createdAt: { gte: since } },
    }),
  ]);

  return {
    planTier,
    documents: toStat(documentsUsed, limits.maxDocumentsPerMonth),
    analyses: toStat(analysesUsed, limits.maxAnalysesPerMonth),
  };
}
