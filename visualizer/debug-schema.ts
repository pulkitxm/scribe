import fs from "fs";
import { ScreenshotDataSchema } from "./src/lib/schemas";

const FILE_PATH =
  "/Users/pulkit/Library/CloudStorage/GoogleDrive-kpulkit15234@gmail.com/My Drive/scribe/27-1-2026/screenshot_2026-01-27_09-58-53.json";

try {
  if (!fs.existsSync(FILE_PATH)) {
    console.error("File not found:", FILE_PATH);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
  const result = ScreenshotDataSchema.safeParse(rawData);

  if (!result.success) {
    console.error("Validation Failed!");
    console.error(JSON.stringify(result.error.format(), null, 2));
  } else {
    console.log("Validation Successful!");
  }
} catch (e) {
  console.error("Script error:", e);
}
