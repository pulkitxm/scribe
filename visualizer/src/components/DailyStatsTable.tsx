"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DailyStat {
    date: string;
    totalScreenshots: number;
    size: number;
}

interface DailyStatsTableProps {
    dailyStats: DailyStat[];
}

type SortKey = 'date' | 'totalScreenshots' | 'size';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

function parseDateFolder(dateStr: string) {
    const parts = dateStr.split("-");
    
    if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr); 
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function DailyStatsTable({ dailyStats }: DailyStatsTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });

    const handleSort = (key: SortKey) => {
        setSortConfig((current) => {
            if (current.key === key) {
                return {
                    key,
                    direction: current.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            return { key, direction: 'asc' };
        });
    };

    const sortedStats = [...dailyStats].sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];

        if (sortConfig.key === 'date') {
            aValue = parseDateFolder(a.date).getTime();
            bValue = parseDateFolder(b.date).getTime();
        }

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            <Button
                                variant="ghost"
                                onClick={() => handleSort('date')}
                                className="h-8 flex items-center gap-1 font-semibold"
                            >
                                Date
                                <ArrowUpDown className="h-3 w-3" />
                            </Button>
                        </TableHead>
                        <TableHead className="text-right">
                            <Button
                                variant="ghost"
                                onClick={() => handleSort('totalScreenshots')}
                                className="h-8 flex items-center gap-1 font-semibold ml-auto"
                            >
                                Screenshots
                                <ArrowUpDown className="h-3 w-3" />
                            </Button>
                        </TableHead>
                        <TableHead className="text-right">
                            <Button
                                variant="ghost"
                                onClick={() => handleSort('size')}
                                className="h-8 flex items-center gap-1 font-semibold ml-auto"
                            >
                                Size
                                <ArrowUpDown className="h-3 w-3" />
                            </Button>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedStats.map((stat) => (
                        <TableRow key={stat.date}>
                            <TableCell className="font-medium">
                                {parseDateFolder(stat.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                {stat.totalScreenshots}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                                {formatBytes(stat.size)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
