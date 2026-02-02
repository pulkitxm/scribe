import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  params: Record<string, string | undefined>;
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  params,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const createQueryString = (page: number) => {
    const newParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
    });
    newParams.set("page", page.toString());
    return newParams.toString();
  };

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage <= 1}
        asChild={currentPage > 1}
        className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}
      >
        {currentPage > 1 ? (
          <Link href={`${baseUrl}?${createQueryString(currentPage - 1)}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      <div className="text-sm text-muted-foreground mx-2">
        Page {currentPage} of {totalPages}
      </div>

      <Button
        variant="outline"
        size="icon"
        disabled={currentPage >= totalPages}
        asChild={currentPage < totalPages}
        className={cn(
          currentPage >= totalPages && "pointer-events-none opacity-50",
        )}
      >
        {currentPage < totalPages ? (
          <Link href={`${baseUrl}?${createQueryString(currentPage + 1)}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
