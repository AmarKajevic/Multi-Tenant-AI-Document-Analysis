import { AnalyzeWithGemini } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
    }})

    if(!document) {
       return NextResponse.json({error: "Document not found or no access"}, {status:404})
    }
        //get content

        const content = document.content || document.name;
        if(!content) {
            return NextResponse.json({error: "Document has no content to analyze"}, {status:400})
        }
        //analysis using gemini ai

        const summary = await AnalyzeWithGemini(content, analysisType)
        //save result to db

        const updateDocument = await prisma.document.update({
            where: {
                id: documentId,
            },
            data: {
                aiSummary: summary,
                aiKeywords: ["analyzed"],
                sentiment: analysisType
            }
        })
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



    } catch (error:any) {
          console.error("Analysis Error", error)
        return NextResponse.json({error: error.message || "failed to create analysis"}, {status:500})
    }
}