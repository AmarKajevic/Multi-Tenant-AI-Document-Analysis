import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { Inter} from "next/font/google";
import "./globals.css";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";
import { suncUserToDatabase } from "@/lib/sync-user";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DocAI - AI Powered Multi-tenat Document Analysis",
  description: "Analyze and collaborate on documents with Google Gemini AI",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await suncUserToDatabase()
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

        </div>
      </body>
    </html>
    </ClerkProvider>
  );
}
