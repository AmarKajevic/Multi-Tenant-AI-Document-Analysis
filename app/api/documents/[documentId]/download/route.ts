import { NextResponse } from "next/server";
import { getBlobStream } from "@/lib/blob";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ documentId: string }>;
}

// The blob store is private, so files are not reachable via their raw URL.
// This route verifies the requester belongs to the document's organization,
// then streams the file through from Blob storage.
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { documentId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        organization: {
          include: {
            members: {
              where: {
                user: { clerkUserId: userId },
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    if (document.organization.members.length === 0) {
      return NextResponse.json(
        { error: "You do not have permission to access this document" },
        { status: 403 },
      );
    }

    if (!document.fileUrl) {
      return NextResponse.json(
        { error: "This document has no file attached" },
        { status: 404 },
      );
    }

    const blob = await getBlobStream(document.fileUrl);

    if (!blob || !blob.stream) {
      return NextResponse.json(
        { error: "File not found in storage" },
        { status: 404 },
      );
    }

    return new NextResponse(blob.stream, {
      headers: {
        "Content-Type": blob.blob.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.name)}"`,
      },
    });
  } catch (error: any) {
    console.error("Document download error:", error);
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 },
    );
  }
}
