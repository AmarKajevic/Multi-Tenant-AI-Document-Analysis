import { AnalyzeWithGemini } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrgUsage } from "@/lib/usage";
import { ANALYSIS_TYPES } from "@/types";

export async function POST(request: Request){
    try {
        //check auth 

        const {userId} = await auth()
        if(!userId){
            return NextResponse.json({error: "Please sign in"}, {status:401})
        }
        //get request data

        const {documentId, organizationId, analysisType} = await request.json();

        if(!documentId || !organizationId) {
            return NextResponse.json({error: "Missing required fields"}, {status:400})
        }

        if(!ANALYSIS_TYPES.includes(analysisType)) {
            return NextResponse.json({error: "Invalid analysis type"}, {status:400})
        }
        //find document

        const document = await prisma.document.findFirst({
            where: {id: documentId,
            organization: {
                clerkOrgId: organizationId,
                members: {
                    some: {
                        user: {clerkUserId: userId}
                    }
                }
            }
    },
    include: { organization: true }})

    if(!document) {
       return NextResponse.json({error: "Document not found or no access"}, {status:404})
    }
        //get content

        const content = document.content || document.name;
        if(!content) {
            return NextResponse.json({error: "Document has no content to analyze"}, {status:400})
        }

        //enforce monthly analysis quota
        const usage = await getOrgUsage(document.organization.id, document.organization.planTier);
        if (usage.analyses.exceeded) {
            return NextResponse.json({
                error: `Monthly analysis limit reached (${usage.analyses.used}/${usage.analyses.limit} on the ${document.organization.planTier} plan)`,
                usage,
            }, {status:429})
        }

        //analysis using gemini ai

        const summary = await AnalyzeWithGemini(content, analysisType)
        //save result to db

        const [updateDocument] = await prisma.$transaction([
            prisma.document.update({
                where: {
                    id: documentId,
                },
                data: {
                    aiSummary: summary,
                    aiKeywords: ["analyzed"],
                    sentiment: analysisType
                }
            }),
            prisma.analysisRun.create({
                data: {
                    organizationId: document.organization.id,
                    documentId: document.id,
                    analysisType,
                }
            }),
        ])
        //return response

        return NextResponse.json({
            success: true,
            summary,
            document: {
                id: updateDocument.id,
                name: updateDocument.name,
                aiSummary: updateDocument.aiSummary
            }
        })



    } catch (error) {
          console.error("Analysis Error", error)
        return NextResponse.json({error: "Failed to create analysis"}, {status:500})
    }
}