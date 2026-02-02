"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CategoryLink({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  if (!category) return null;
  return (
    <Link
      href={`/analytics?category=${encodeURIComponent(category)}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Badge
        variant="secondary"
        className={cn(
          "hover:bg-primary/20 transition-colors cursor-pointer",
          className,
        )}
      >
        {category}
      </Badge>
    </Link>
  );
}

export function TagLink({
  tag,
  className,
}: {
  tag: string;
  className?: string;
}) {
  if (!tag) return null;
  return (
    <Link
      href={`/tags?q=${encodeURIComponent(tag)}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Badge
        variant="outline"
        className={cn(
          "hover:bg-accent transition-colors cursor-pointer",
          className,
        )}
      >
        #{tag}
      </Badge>
    </Link>
  );
}

export function ProjectLink({
  project,
  className,
}: {
  project: string;
  className?: string;
}) {
  if (!project) return null;
  return (
    <Link
      href={`/analytics/projects/${encodeURIComponent(project)}`}
      className={cn(
        "text-primary hover:underline underline-offset-4 cursor-pointer",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {project}
    </Link>
  );
}

export function AppLink({
  app,
  className,
  children,
}: {
  app: string;
  className?: string;
  children?: React.ReactNode;
}) {
  if (!app) return null;
  return (
    <Link
      href={`/analytics/apps/${encodeURIComponent(app)}`}
      className={cn(
        "font-medium hover:text-primary transition-colors cursor-pointer",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children || app}
    </Link>
  );
}

export function TextLink({
  text,
  className,
  children,
}: {
  text: string;
  className?: string;
  children?: React.ReactNode;
}) {
  if (!text) return null;
  return (
    <Link
      href={`/gallery?text=${encodeURIComponent(text)}`}
      className={cn(
        "hover:text-primary hover:underline transition-colors cursor-pointer decoration-dotted underline-offset-4",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children || text}
    </Link>
  );
}
