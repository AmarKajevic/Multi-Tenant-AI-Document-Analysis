
import { put, del, get } from "@vercel/blob";
export async function uploadToBlob(
    file: File,
    organizationId: string,
    userId: string,

):Promise<{url:string, pathname:string}> {
    try{
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const pathname = `org-${organizationId}/user-${userId}/${filename}`;

        // The store is configured for private access, so uploaded files are not
        // reachable via their raw URL — they must be fetched server-side with the
        // token (see getBlobStream) after verifying the requester has access.
        const blob = await put(pathname, file, {
            access: "private",
            token: process.env.BLOB_READ_WRITE_TOKEN || "",
        });

        return { url: blob.url, pathname: blob.pathname };

    }catch(error){
        console.error("Error occurred while uploading file to Blob:", error);
        throw error;
    }

}

// Fetches a private blob's content so it can be streamed back through our own
// API route after we've verified the requesting user has access to it.
export async function getBlobStream(url: string) {
    try {
        return await get(url, {
            access: "private",
            token: process.env.BLOB_READ_WRITE_TOKEN || "",
        });
    } catch (error) {
        console.error("Error occurred while fetching file from Blob:", error);
        throw error;
    }
}
export async function deleteFromBlob(url: string): Promise<void> {
    try{
        await del(url, {
            token: process.env.BLOB_READ_WRITE_TOKEN ,
        })
    }catch(error){
        console.error("Error occurred while deleting file from Blob:", error);
        throw error;
    }
}