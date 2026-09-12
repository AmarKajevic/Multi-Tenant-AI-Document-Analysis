import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center mt-10 mb-10">
            <SignUp/>
        </div>
    )
}