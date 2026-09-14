import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge } from "lucide-react";
import { OrgUsage, UsageStat } from "@/types";

interface UsageCardProps {
  usage: OrgUsage;
}

function UsageBar({ label, stat }: { label: string; stat: UsageStat }) {
  const percent = Math.min((stat.used / stat.limit) * 100, 100);
  const barColor = stat.exceeded
    ? "bg-red-500"
    : percent >= 80
      ? "bg-amber-500"
      : "bg-blue-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={stat.exceeded ? "font-medium text-red-600" : "text-gray-500"}>
          {stat.used}/{stat.limit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// Shown on both the org dashboard (server-rendered, computed straight from
// Prisma) and the documents page (client-rendered, comes from
// GET /api/documents's metadata) — see lib/usage.ts for where the numbers
// come from and lib/plans.ts for the limits themselves.
export function UsageCard({ usage }: UsageCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Usage this month
          <Badge variant="outline" className="ml-auto capitalize">
            {usage.planTier} plan
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <UsageBar label="Documents uploaded" stat={usage.documents} />
        <UsageBar label="AI analyses" stat={usage.analyses} />
        {(usage.documents.exceeded || usage.analyses.exceeded) && (
          <p className="text-xs text-red-600">
            Monthly limit reached. Usage resets on the 1st of next month.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
