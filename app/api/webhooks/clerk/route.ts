import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Keeps our Postgres mirror of Clerk's users/organizations/memberships in
// sync. This is the *authoritative* sync path — unlike the best-effort call
// made client-side right after creating an organization (see
// app/(dashboard)/select-org/page.tsx), this runs for every membership
// change regardless of which client triggered it (invitations accepted,
// members removed by an admin, accounts deleted, etc).
//
// Configure this endpoint's URL in the Clerk dashboard (Webhooks) and copy
// the signing secret into CLERK_WEBHOOK_SIGNING_SECRET in .env.
export async function POST(request: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(request);
  } catch (error) {
    console.error("Clerk webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const { id, email_addresses, primary_email_address_id, first_name, last_name } =
          event.data;
        const primaryEmail =
          email_addresses.find((e) => e.id === primary_email_address_id)
            ?.email_address ?? email_addresses[0]?.email_address ?? "";
        const name = `${first_name ?? ""} ${last_name ?? ""}`.trim();

        await prisma.user.upsert({
          where: { clerkUserId: id },
          update: { email: primaryEmail, name: name || undefined },
          create: { clerkUserId: id, email: primaryEmail, name: name || "User" },
        });
        break;
      }

      case "user.deleted": {
        if (event.data.id) {
          // Cascades to their organization memberships and documents
          // (see prisma/schema.prisma onDelete: Cascade).
          await prisma.user.deleteMany({ where: { clerkUserId: event.data.id } });
        }
        break;
      }

      case "organization.created":
      case "organization.updated": {
        const { id, name, slug } = event.data;
        await prisma.organization.upsert({
          where: { clerkOrgId: id },
          update: { name, slug },
          create: { clerkOrgId: id, name, slug },
        });
        break;
      }

      case "organization.deleted": {
        if (event.data.id) {
          // Cascades to its memberships and documents.
          await prisma.organization.deleteMany({ where: { clerkOrgId: event.data.id } });
        }
        break;
      }

      case "organizationMembership.created":
      case "organizationMembership.updated": {
        const { organization, public_user_data, role } = event.data;

        // Event delivery order isn't guaranteed, so the org/user row this
        // membership points at may not exist locally yet — upsert both from
        // the payload we already have instead of failing the webhook.
        const [org, user] = await Promise.all([
          prisma.organization.upsert({
            where: { clerkOrgId: organization.id },
            update: { name: organization.name, slug: organization.slug },
            create: {
              clerkOrgId: organization.id,
              name: organization.name,
              slug: organization.slug,
            },
          }),
          prisma.user.upsert({
            where: { clerkUserId: public_user_data.user_id },
            update: {},
            create: {
              clerkUserId: public_user_data.user_id,
              email: public_user_data.identifier,
              name:
                `${public_user_data.first_name ?? ""} ${public_user_data.last_name ?? ""}`.trim() ||
                "User",
            },
          }),
        ]);

        const memberRole = role.includes("admin") ? "owner" : "member";

        await prisma.organizationMember.upsert({
          where: {
            organizationId_userId: { organizationId: org.id, userId: user.id },
          },
          update: { role: memberRole },
          create: { organizationId: org.id, userId: user.id, role: memberRole },
        });
        break;
      }

      case "organizationMembership.deleted": {
        const { organization, public_user_data } = event.data;

        const [org, user] = await Promise.all([
          prisma.organization.findUnique({ where: { clerkOrgId: organization.id } }),
          prisma.user.findUnique({ where: { clerkUserId: public_user_data.user_id } }),
        ]);

        if (org && user) {
          await prisma.organizationMember.deleteMany({
            where: { organizationId: org.id, userId: user.id },
          });
        }
        break;
      }

      default:
        // Ignore event types we don't care about (billing, sessions, etc).
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Clerk webhook handler failed for "${event.type}":`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
