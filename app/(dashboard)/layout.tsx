import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { suncUserToDatabase } from "@/lib/sync-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fallback sync in case the Clerk webhook (app/api/webhooks/clerk/route.ts)
  // hasn't been configured yet or an event was missed — it's the
  // authoritative path now, this just guarantees a signed-in user has a row
  // before hitting pages that need one. Swallow failures so a DB hiccup
  // doesn't take down the whole dashboard.
  try {
    await suncUserToDatabase();
  } catch (error) {
    console.error("Fallback user sync failed:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - Global header now handles navigation */}
      <main className="py-8">
        <div className="container mx-auto px-4">{children}</div>
      </main>
    </div>
  );
}