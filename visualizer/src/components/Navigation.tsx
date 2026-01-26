"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "Dashboard" },
        { href: "/gallery", label: "Gallery" },
        { href: "/analytics", label: "Analytics" },
        { href: "/tags", label: "Tags" },
    ];

    return (
        <nav className="nav">
            <div className="nav-content">
                <Link href="/" className="nav-logo">
                    Scribe Visualizer
                </Link>
                <div className="nav-links">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`nav-link ${pathname === link.href ? "active" : ""}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
