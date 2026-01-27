export interface Scores {
  focus_score: number;
  productivity_score: number;
  distraction_risk: number;
}

export interface Evidence {
  apps_visible?: string[];
  active_app_guess?: string;
  key_windows_or_panels?: string[];
  web_domains_visible?: string[];
  text_snippets?: string[];
}

export interface WorkContext {
  work_type: string;
  project_or_doc: string;
}

export interface CodeContext {
  language: string;
  tools_or_frameworks: string[];
  files_or_modules: string[];
  repo_or_project: string;
  errors_or_logs_visible: boolean;
}

export interface LearningContext {
  learning_topic: string;
  source_type: string;
}

export interface CommunicationContext {
  communication_type: string;
  platform_guess: string;
  meeting_indicator: boolean;
}

export interface EntertainmentContext {
  entertainment_type: string;
  platform_guess: string;
}

export interface Context {
  intent_guess: string;
  topic_or_game_or_media: string;
  work_context: WorkContext;
  code_context: CodeContext;
  learning_context: LearningContext;
  communication_context: CommunicationContext;
  entertainment_context: EntertainmentContext;
}

export interface ScreenshotData {
  overall_activity_score: number;
  category: string;
  workspace_type: string;
  short_description: string;
  detailed_analysis: string;
  scores: Scores;
  evidence: Evidence;
  context: Context;
  actions_observed: string[];
  privacy_notes: string[];
  summary_tags?: string[];
  dedupe_signature: string;
  confidence: number;
  system_metadata?: SystemMetadata;
}

export interface SystemMetadata {
  active_app: string;
  opened_apps: string[];
  audio: {
    volume: number;
    is_muted: boolean;
    inputs: AudioDevice[];
    outputs: AudioDevice[];
  };
  stats: {
    battery: { percentage: number; isPlugged: boolean };
    ram: { total: number; used: number; free: number };
    cpu: { cores: number; used: number; idle: number };
    network: { connected: boolean; type: string; signal_strength: number };
    display: { dark_mode: boolean; external_displays: any[] };
    input: { idle_seconds: number };
  };
}

export interface AudioDevice {
  name: string;
  is_default: boolean;
  manufacturer?: string;
  transport?: string;
}

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
  minProductivityScore?: number;
  project?: string;
  domain?: string;
  language?: string;
  workspace?: string;
  text?: string;
  tag?: string;
}
