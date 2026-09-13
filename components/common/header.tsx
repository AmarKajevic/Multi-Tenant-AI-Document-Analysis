"use client";

import { Brain, Building, FileText, Home, LogIn, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { Show, UserButton, useClerk, useOrganization, useUser } from "@clerk/nextjs";

export default function Header() {
  const pathname = usePathname();
  const {user} =  useUser();

  const {organization} = useOrganization()

  const { openSignIn, openSignUp } = useClerk();

    const getNavItems = () => {
    const baseItems = [
      { href: "/", label: "Home", icon: <Home className="h-4 w-4" /> },
    ];

    // If user is in an organization
    if (organization) {
      return [
        ...baseItems,
        {
          href: `/${organization.slug}`,
          label: "Organization Dashboard",
          icon: <Building className="h-4 w-4" />,
        },
        {
          href: `/${organization.slug}/documents`,
          label: "Org Documents",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          href: "/select-org",
          label: "Switch Organization",
          icon: <Users className="h-4 w-4" />,
        },
      ];
    }
    // If user is new
    return [
      ...baseItems,
      {
        href: "/select-org",
        label: "Switch Organization",
        icon: <Users className="h-4 w-4" />,
      },
    ];
  };

  const navItems = getNavItems();

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
          <Show when="signed-in">
            <div className="md:flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {organization ? `In :${organization.name}` : user?.firstName || user?.username}
              </span>
              <UserButton/>
            </div>

          </Show>
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