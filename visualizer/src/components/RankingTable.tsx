"use client";

import { useRef, memo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Filter, BarChart3 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useVirtualizer } from "@tanstack/react-virtual";

const ROW_HEIGHT = 52;
const VIRTUALIZE_THRESHOLD = 25;

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

function RankingTableInner({
  items,
  total,
  label,
  icon,
  valueFormatter,
  linkPrefix,
  galleryFilterKey,
}: RankingTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const maxCount =
    items.length > 0 ? Math.max(...items.map((i) => i.count)) : 0;
  const useVirtual = items.length > VIRTUALIZE_THRESHOLD;
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });
  const virtualRows = useVirtual ? rowVirtualizer.getVirtualItems() : null;
  const totalHeight = useVirtual ? rowVirtualizer.getTotalSize() : 0;

  const renderCells = (item: RankingItem, index: number) => (
    <>
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
          value={maxCount > 0 ? (item.count / maxCount) * 100 : 0}
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
    </>
  );

  return (
    <div
      ref={useVirtual ? parentRef : undefined}
      className="rounded-md border border-border bg-card overflow-auto"
      style={useVirtual ? { maxHeight: "400px" } : undefined}
    >
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
        <TableBody className={useVirtual ? "relative" : undefined}>
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
          {useVirtual && virtualRows && virtualRows.length > 0 && (
            <TableRow
              style={{
                height: totalHeight,
                visibility: "hidden",
                pointerEvents: "none",
              }}
              aria-hidden
            >
              <TableCell
                colSpan={linkPrefix || galleryFilterKey ? 5 : 4}
                className="p-0 border-0 h-0"
                style={{ height: totalHeight, lineHeight: 0 }}
              />
            </TableRow>
          )}
          {useVirtual &&
            virtualRows &&
            virtualRows.length > 0 &&
            virtualRows.map((virtualRow) => {
              const item = items[virtualRow.index];
              return (
                <TableRow
                  key={item.name}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: "table",
                    tableLayout: "fixed",
                  }}
                  data-index={virtualRow.index}
                >
                  {renderCells(item, virtualRow.index)}
                </TableRow>
              );
            })}
          {!useVirtual &&
            items.map((item, index) => (
              <TableRow key={item.name}>{renderCells(item, index)}</TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default memo(RankingTableInner);
