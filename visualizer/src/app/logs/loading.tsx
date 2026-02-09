import { Skeleton } from "@/components/ui/skeleton";

export default function LogsLoading() {
  return (
    <div className="fixed left-0 right-0 bottom-0 top-14 bg-[#1e1e1e] p-4">
      <div className="max-w-4xl mx-auto space-y-2 font-mono text-sm">
        {[
          90, 70, 85, 45, 95, 60, 80, 55, 75, 88, 65, 92, 40, 78, 72, 98, 50,
          82, 68, 74, 62, 86, 58, 94,
        ].map((pct, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton
              className="h-4 w-8 shrink-0 bg-neutral-700/80"
              style={{ opacity: 0.6 }}
            />
            <Skeleton
              className="h-4 bg-neutral-700/80"
              style={{ width: `${pct}%`, opacity: 0.6 }}
            />
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 right-4 flex flex-col-reverse items-end gap-3 z-10">
        <Skeleton className="h-5 w-36 bg-neutral-700/80 rounded px-2 py-1" />
        <div className="flex gap-2 p-2 bg-[#2d2d2d] rounded-lg border border-neutral-700">
          <Skeleton className="h-8 w-24 rounded-md bg-neutral-600/80" />
          <Skeleton className="h-8 w-28 rounded-md bg-neutral-600/80" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full bg-blue-600/50" />
      </div>
    </div>
  );
}
