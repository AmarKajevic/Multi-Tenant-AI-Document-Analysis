// Array first so it doubles as a runtime-checkable list (see its use in
// app/api/analyze/route.ts) instead of just a compile-time-only union.
export const ANALYSIS_TYPES = [
  "summary",
  "qa",
  "sentiment",
  "entities",
  "extract",
] as const;
export type AnalysisType = (typeof ANALYSIS_TYPES)[number];

// Mirrors lib/usage.ts's OrgUsage — duplicated here (rather than imported)
// because that module pulls in the Prisma client, which can't be bundled
// into client components.
export interface UsageStat {
  used: number;
  limit: number;
  remaining: number;
  exceeded: boolean;
}

export interface OrgUsage {
  planTier: string;
  documents: UsageStat;
  analyses: UsageStat;
}

export interface Document {
  id: string;
  name: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  aiSummary?: string;
  aiKeywords: string[];
  sentiment?: string;
  createdAt: string;
  user: {
    name?: string;
    email: string;
  };
}