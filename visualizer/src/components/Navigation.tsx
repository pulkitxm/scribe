"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

import ControlCenter from "@/components/ControlCenter";

const links = [
    { href: "/", label: "Dashboard" },
    { href: "/gallery", label: "Gallery" },
    { href: "/analytics", label: "Analytics" },
    { href: "/logs", label: "Logs" },
    { href: "/tags", label: "Tags" },
];

export default function Navigation() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-14 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ControlCenter />
                        <Link
                            href="/"
                            className="text-xl font-bold text-foreground hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            Scribe Visualizer
                        </Link>
                    </div>
                    <div className="flex items-center gap-1">
                        {links.map((link) => (
                            <Button
                                key={link.href}
                                variant={isActive(link.href) ? "secondary" : "ghost"}
                                size="sm"
                                asChild
                                className="cursor-pointer"
                            >
                                <Link href={link.href}>
                                    {link.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}
