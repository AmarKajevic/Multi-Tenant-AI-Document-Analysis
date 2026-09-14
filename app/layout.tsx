import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { Inter} from "next/font/google";
import "./globals.css";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DocAI - AI Powered Multi-tenat Document Analysis",
  description: "Analyze and collaborate on documents with Google Gemini AI",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // User sync into Postgres now happens via the Clerk webhook
  // (app/api/webhooks/clerk/route.ts) and as a fallback in the dashboard
  // layout — no need to hit the DB on every single page view, including
  // anonymous visits to the marketing page and sign-in/sign-up.
  return (
    <ClerkProvider>
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* header */}
          <Header/>
          {/* main */}
          <main className="flex-1">{children}</main>
          {/* footer */}
          <Footer/>
          <Toaster position="top-right" richColors />

        </div>
      </body>
    </html>
    </ClerkProvider>
  );
}
