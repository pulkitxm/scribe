import Link from "next/link";
import Image from "next/image";
import { getAllScreenshots } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { FilterOptions } from "@/types/screenshot";

interface RecentScreenshotsProps {
  filter: FilterOptions;
  title?: string;
  limit?: number;
  linkToGallery?: boolean;
}

export default function RecentScreenshots({
  filter,
  title = "Recent Screenshots",
  limit = 8,
  linkToGallery = true,
}: RecentScreenshotsProps) {
  const screenshots = getAllScreenshots(filter)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);

  if (screenshots.length === 0) {
    return null;
  }

  const queryParams = new URLSearchParams();
  if (filter.project) queryParams.set("project", filter.project);
  if (filter.app) queryParams.set("app", filter.app);
  if (filter.workspace) queryParams.set("workspace", filter.workspace);
  if (filter.domain) queryParams.set("domain", filter.domain);
  if (filter.language) queryParams.set("language", filter.language);

  const galleryUrl = `/gallery?${queryParams.toString()}`;

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {linkToGallery && (
          <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
            <Link href={galleryUrl}>
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {screenshots.map((screenshot) => (
            <Link
              key={`${screenshot.date}-${screenshot.id}`}
              href={`/gallery/${screenshot.date}/${screenshot.id}`}
              className="group block overflow-hidden rounded-md border border-border transition-colors hover:border-primary/50"
            >
              <div className="relative aspect-video bg-muted">
                <Image
                  src={screenshot.imagePath}
                  alt={screenshot.data.short_description || "Screenshot"}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white font-medium truncate">
                    {screenshot.data.short_description}
                  </p>
                  <p className="text-[10px] text-white/70">
                    {screenshot.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
