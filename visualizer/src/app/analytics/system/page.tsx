import Link from "next/link";
import {
  ChevronLeft,
  Cpu,
  HardDrive,
  Battery,
  Volume2,
  Wifi,
  Monitor,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAllScreenshots,
  getSystemContextStats,
  getExtendedStats,
} from "@/lib/data";
import CPUChart from "@/components/system/CPUChart";
import RAMChart from "@/components/system/RAMChart";
import BatteryChart from "@/components/system/BatteryChart";
import AudioVolumeChart from "@/components/system/AudioVolumeChart";
import NetworkSignalChart from "@/components/system/NetworkSignalChart";
import ConnectionTypeChart from "@/components/system/ConnectionTypeChart";
import StorageTrendChart from "@/components/system/StorageTrendChart";
import StorageDistributionChart from "@/components/system/StorageDistributionChart";
import DisplayChart from "@/components/system/DisplayChart";
import IdleTimeChart from "@/components/system/IdleTimeChart";
import SystemAnalyticsDashboard from "@/components/SystemAnalyticsDashboard";

export const dynamic = "force-dynamic";

export default function SystemPage() {
  const screenshots = getAllScreenshots();
  const systemStats = getSystemContextStats(screenshots);
  const extendedStats = getExtendedStats(screenshots);

  const avgCPU = extendedStats.avgCpu;
  const avgRAM = extendedStats.avgRam;
  const avgBattery = extendedStats.avgBattery;
  const avgNetworkSignal =
    systemStats.signalData?.length > 0
      ? systemStats.signalData.reduce((sum, d) => sum + d.signalStrength, 0) /
        systemStats.signalData.length
      : 0;

  const signalPercent = avgNetworkSignal
    ? Math.max(0, Math.min(100, ((avgNetworkSignal + 90) / 60) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <Button variant="ghost" size="icon" asChild className="cursor-pointer">
          <Link href="/analytics">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            System Analytics
          </h1>
          <p className="text-muted-foreground">
            Deep dive into your environment, hardware usage, and system
            performance.
          </p>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4" /> CPU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{avgCPU}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              Average usage
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <HardDrive className="h-4 w-4" /> RAM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{avgRAM}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              Average usage
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Battery className="h-4 w-4" /> Battery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {avgBattery}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Average level
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Wifi className="h-4 w-4" /> Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {signalPercent.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Signal quality
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          Hardware Performance
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CPUChart data={systemStats.hourlyTrends} />
          <RAMChart
            data={systemStats.hourlyTrends}
            totalRAM={systemStats.totalRAM}
          />
        </div>
      </section>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Battery className="h-5 w-5 text-primary" />
          Power & Audio
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BatteryChart data={systemStats.hourlyTrends} />
          <AudioVolumeChart data={systemStats.hourlyTrends} />
        </div>
      </section>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Wifi className="h-5 w-5 text-primary" />
          Connectivity & Storage
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NetworkSignalChart data={systemStats.signalData || []} />
          <StorageTrendChart
            data={systemStats.storageTrend || []}
            totalStorage={systemStats.totalStorage}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConnectionTypeChart data={systemStats.connectionTypes || []} />
          <StorageDistributionChart
            used={
              systemStats.storageTrend?.length > 0
                ? systemStats.storageTrend[systemStats.storageTrend.length - 1]
                    .used
                : 0
            }
            free={
              systemStats.storageTrend?.length > 0
                ? systemStats.storageTrend[systemStats.storageTrend.length - 1]
                    .free
                : 0
            }
            total={systemStats.totalStorage}
          />
        </div>
      </section>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          Environment & Activity
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DisplayChart
            darkModeByHour={systemStats.darkModeByHour}
            monitorUsage={systemStats.monitorUsage}
            externalDisplayCorrelation={systemStats.externalDisplayCorrelation}
          />
          <IdleTimeChart
            distributionData={systemStats.idleDistribution}
            hourlyIdleData={systemStats.idleTimeHourly}
          />
        </div>
      </section>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Context Analytics</h2>
        <SystemAnalyticsDashboard stats={systemStats} />
      </section>
    </div>
  );
}
