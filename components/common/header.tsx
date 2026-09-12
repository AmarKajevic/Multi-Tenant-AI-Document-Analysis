"use client";

import { Brain, Home, LogIn, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { Show, UserButton, useClerk } from "@clerk/nextjs";

export default function Header() {
  const pathname = usePathname();
  const { openSignIn, openSignUp } = useClerk();

  const navItems = [
    { href: "/", label: "Home", icon: <Home className="w-4 h-4" /> },
    { href: "/select-org", label: "Switch Organization", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 border-b backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Brain className="w-6 h-6 text-blue-500" />
          DocAI
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
         <Show when="signed-out">
            {/* Opcija A: Clerk modal (preporučeno) */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button  size="sm">
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </div>
          </Show>
        </div>
      </div>
    </header>
  );
}