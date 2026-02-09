import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SystemAnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <Button variant="ghost" size="icon" asChild className="cursor-pointer">
          <Link href="/analytics">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-14" />
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[280px] w-full rounded-lg" />
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton className="h-6 w-36" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[280px] w-full rounded-lg" />
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[280px] w-full rounded-lg" />
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </div>
      </section>
    </div>
  );
}
