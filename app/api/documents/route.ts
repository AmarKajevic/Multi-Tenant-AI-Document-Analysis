import { NextResponse } from "next/server";
import { uploadToBlob } from "@/lib/blob";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrgUsage } from "@/lib/usage";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const content = formData.get("content") as string;
    const clerkOrgId = formData.get("organizationId") as string; // Rename to clarify
    const file = formData.get("file") as File;

    if (!name || !clerkOrgId) {
      return NextResponse.json(
        { error: "Name and organization ID are required" },
        { status: 400 },
      );
    }

    // 1. Get organization from database using Clerk ID
    const organization = await prisma.organization.findUnique({
      where: { clerkOrgId: clerkOrgId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // 2. Get user
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        memberships: {
          where: { organizationId: organization.id }, // Use DATABASE ID here
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json(
        { error: "You do not have access to this organization" },
        { status: 403 },
      );
    }

    const usage = await getOrgUsage(organization.id, organization.planTier);
    if (usage.documents.exceeded) {
      return NextResponse.json(
        {
          error: `Monthly document limit reached (${usage.documents.used}/${usage.documents.limit} on the ${organization.planTier} plan)`,
          usage,
        },
        { status: 429 },
      );
    }

    let fileUrl = null;
    let fileSize = null;
    let fileType = null;
    let extractedContent = content;

    // Upload file to Vercel Blob if exists
    if (file && file.size > 0) {
      const blob = await uploadToBlob(file, clerkOrgId, userId);
      fileUrl = blob.url;
      fileSize = file.size;
      fileType = file.type;

      // If no content provided but we have a text file, extract text
      if (!extractedContent && file.type.includes("text")) {
        extractedContent = await file.text();
      }
    }

    const document = await prisma.document.create({
      data: {
        name,
        content: extractedContent || null,
        fileUrl,
        fileSize: fileSize || 0,
        fileType: fileType || "unknown",
        organizationId: organization.id, // ← DATABASE ID
        userId: user.id, // ← DATABASE ID
        aiKeywords: [],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            name: true,
            clerkOrgId: true, // Include for reference
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      document: {
        id: document.id,
        name: document.name,
        fileUrl: document.fileUrl,
        organization: document.organization.name,
        clerkOrgId: document.organization.clerkOrgId,
        uploadedBy: document.user.name,
      },
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clerkOrgId = searchParams.get("organizationId");

    if (!clerkOrgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Get organization from database
    const organization = await prisma.organization.findUnique({
      where: { clerkOrgId: clerkOrgId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Verify user has access to organization
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        memberships: {
          where: { organizationId: organization.id }, // Use DATABASE ID here
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json(
        { error: "You do not have access to this organization" },
        { status: 403 },
      );
    }

    // Get documents for organization
    const documents = await prisma.document.findMany({
      where: { organizationId: organization.id }, // Use DATABASE ID
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            name: true,
            clerkOrgId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const usage = await getOrgUsage(organization.id, organization.planTier);

    return NextResponse.json({
      documents,
      metadata: {
        organization: organization.name,
        clerkOrgId: organization.clerkOrgId,
        documentCount: documents.length,
        usage,
      },
    });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: "Failed to get documents" },
      { status: 500 },
    );
  }
}