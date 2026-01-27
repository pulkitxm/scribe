import {
  ScreenshotData as ScreenshotDataZod, // Import just to re-exported or used? No, define exported types.
} from "@/lib/schemas";

// Re-export inferred types from schemas
export type {
  ScreenshotData,
  Scores,
  Evidence,
  Context,
  WorkContext,
  CodeContext,
  LearningContext,
  CommunicationContext,
  EntertainmentContext,
  SystemMetadata,
  AudioDevice
} from "@/lib/schemas";

import { ScreenshotData } from "@/lib/schemas";

export interface Session {
  id: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  screenshotCount: number;
  category: string;
  dominantApp: string;
  avgFocusScore: number;
  avgProductivityScore: number;
  avgDistractionScore: number;
  screenshots: Screenshot[];
  workType?: string; // e.g. "coding", "meeting"
  project?: string;
  tags: string[];
  contextSwitches: number;
  interruptions: number;
  dominantProject?: string;
  workspaceStabilityScore?: number;
}

export interface Screenshot {
  id: string;
  timestamp: Date;
  date: string;
  imagePath: string;
  jsonPath: string;
  data: ScreenshotData;
}

export interface DailyStats {
  date: string;
  avgFocusScore: number;
  avgProductivityScore: number;
  avgDistraction: number;
  totalScreenshots: number;
  categories: Record<string, number>;
  apps: Record<string, number>;
  workTypes: Record<string, number>;
}

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  category?: string;
  app?: string;
  minFocusScore?: number;
  maxFocusScore?: number;
  minProductivityScore?: number;
  maxProductivityScore?: number;
  maxDistractionScore?: number;
  project?: string;
  domain?: string;
  language?: string;
  workspace?: string;
  text?: string;
  tag?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  hasCode?: boolean;
  isMeeting?: boolean;
  lowBattery?: boolean;
  highCpu?: boolean;
  hasErrors?: boolean;
  network?: string;
}
