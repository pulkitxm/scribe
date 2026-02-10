"use client";

import dynamic from "next/dynamic";
import type { LocationPoint } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";

const LocationsMap = dynamic(
  () => import("@/components/LocationsMap").then((m) => m.default),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-[360px] rounded-lg" />,
  },
);

interface LocationsMapClientProps {
  points: LocationPoint[];
}

export default function LocationsMapClient({
  points,
}: LocationsMapClientProps) {
  return <LocationsMap points={points} />;
}
