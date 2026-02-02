import { notFound } from "next/navigation";
import {
  getScreenshotById,
  getScreenshotsForDate,
  getAllDates,
} from "@/lib/data";
import ScreenshotDetailView from "@/components/ScreenshotDetailView";

interface PageProps {
  params: Promise<{
    date: string;
    id: string;
  }>;
}

export default async function ScreenshotDetailPage({ params }: PageProps) {
  const { date, id } = await params;
  const screenshot = getScreenshotById(date, id);

  if (!screenshot) {
    notFound();
  }

  const allDates = getAllDates();
  const allScreenshots: { date: string; id: string }[] = [];

  for (const d of allDates) {
    const screenshots = getScreenshotsForDate(d);
    for (const s of screenshots) {
      allScreenshots.push({ date: d, id: s.id });
    }
  }

  const currentIndex = allScreenshots.findIndex(
    (s) => s.date === date && s.id === id,
  );
  const prevScreenshot =
    currentIndex > 0 ? allScreenshots[currentIndex - 1] : null;
  const nextScreenshot =
    currentIndex < allScreenshots.length - 1
      ? allScreenshots[currentIndex + 1]
      : null;

  return (
    <ScreenshotDetailView
      screenshot={screenshot}
      prevScreenshot={prevScreenshot}
      nextScreenshot={nextScreenshot}
    />
  );
}
