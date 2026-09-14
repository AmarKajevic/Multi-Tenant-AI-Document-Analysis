import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const {userId} = await auth()

        if(!userId){
            return NextResponse.json({error: "Unauthorized"}, {status:401})
        }

        const body = await request.json();
        const {clerkOrgId} = body;

        if(!clerkOrgId) {
            return NextResponse.json(
                {error: "Missing required fields"},
                {status: 400}
            )
        }

        // Never trust org data (name/slug/role) supplied by the client — verify
        // against Clerk itself that this organization exists and that the
        // requesting user is actually a member of it, then pull the
        // authoritative name/slug/role from Clerk's response.
        const client = await clerkClient();

        const organization = await client.organizations
            .getOrganization({ organizationId: clerkOrgId })
            .catch(() => null);

        if (!organization) {
            return NextResponse.json({error: "Organization not found"}, {status:404})
        }

        const { data: memberships } = await client.organizations.getOrganizationMembershipList({
            organizationId: clerkOrgId,
            userId: [userId],
        });

        const membership = memberships[0];
        if (!membership) {
            return NextResponse.json(
                {error: "You are not a member of this organization"},
                {status:403}
            )
        }

        //find user synced from Clerk (see lib/sync-user.ts)
        const user = await prisma.user.findUnique({
            where: {clerkUserId: userId}
        })

        if(!user) {
           return NextResponse.json({error: "Unauthorized"}, {status:401})
        }

        const role = membership.role.includes("admin") ? "owner" : "member";

        //upsert organization in db using Clerk's own name/slug, not the client's
        const dbOrganization = await prisma.organization.upsert({
            where: { clerkOrgId },
            update: { name: organization.name, slug: organization.slug },
            create: {
                clerkOrgId,
                name: organization.name,
                slug: organization.slug,
            },
        })

        await prisma.organizationMember.upsert({
            where: {
                organizationId_userId: {
                    organizationId: dbOrganization.id,
                    userId: user.id,
                },
            },
            update: { role },
            create: {
                userId: user.id,
                organizationId: dbOrganization.id,
                role,
            },
        })

         return NextResponse.json({
            success: true,
            organization: dbOrganization,
            message: "Organization synced successfully"
         })

    } catch (error) {
        console.error("Organization Error", error)
        return NextResponse.json({error: "Failed to create organization"}, {status:500})

    }
}
