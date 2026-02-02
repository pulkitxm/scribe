"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Filter, BarChart3 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RankingItem {
  name: string;
  count: number;
}

interface RankingTableProps {
  items: RankingItem[];
  total: number;
  label: string;
  icon?: string;
  valueFormatter?: (value: number) => string;
  linkPrefix?: string;
  galleryFilterKey?: string;
}

export default function RankingTable({
  items,
  total,
  label,
  icon,
  valueFormatter,
  linkPrefix,
  galleryFilterKey,
}: RankingTableProps) {
  const maxCount =
    items.length > 0 ? Math.max(...items.map((i) => i.count)) : 0;

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>{label}</TableHead>
            <TableHead className="w-[150px]">Usage</TableHead>
            <TableHead className="text-right w-[100px]">Count</TableHead>
            {(linkPrefix || galleryFilterKey) && (
              <TableHead className="w-[80px] text-center">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.name}>
              <TableCell className="font-medium text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {icon && <span>{icon}</span>}
                  {linkPrefix ? (
                    <Link
                      href={`${linkPrefix}/${encodeURIComponent(item.name)}`}
                      className="font-medium hover:underline decoration-primary underline-offset-4"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{item.name}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Progress
                  value={(item.count / maxCount) * 100}
                  className="h-2 w-full"
                />
              </TableCell>
              <TableCell className="text-right font-mono">
                {valueFormatter ? valueFormatter(item.count) : item.count}
              </TableCell>
              {(linkPrefix || galleryFilterKey) && (
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <TooltipProvider>
                      {linkPrefix && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <Link
                                href={`${linkPrefix}/${encodeURIComponent(item.name)}`}
                              >
                                <BarChart3 className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Analytics</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {galleryFilterKey && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <Link
                                href={`/gallery?${galleryFilterKey}=${encodeURIComponent(item.name)}`}
                              >
                                <Filter className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Filter Gallery</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TooltipProvider>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={linkPrefix || galleryFilterKey ? 5 : 4}
                className="h-24 text-center text-muted-foreground"
              >
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
