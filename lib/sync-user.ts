import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function suncUserToDatabase () {
    try {
        const clerkUser = await currentUser();
        if(!clerkUser) {
            return null;
        }
        const email = clerkUser.emailAddresses[0]?.emailAddress || "";
        const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();

        //chech if user exists in db

        let dbUser = await prisma.user.findUnique({
            where: {clerkUserId: clerkUser.id}
        })

        if(dbUser) {
            // Upadte existing user
            dbUser = await prisma.user.update({
                where: {id: dbUser.id},
                data: {
                    email,
                    name: name || dbUser.name
                }
            })

        }else {
            //create new user
            dbUser = await prisma.user.create({
                data : {
                    clerkUserId: clerkUser.id,
                    email,
                    name: name || "User"
                }
              
            })
            console.log(`New user created: ${email}`)

        }
        return dbUser;
    } catch (error) {
        console.log("Error syncing user from Clerk", error);
        throw error;
    }
}