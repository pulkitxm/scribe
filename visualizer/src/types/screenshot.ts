export interface Scores {
  focus_score: number;
  productivity_score: number;
  distraction_risk: number;
}

export interface Evidence {
  apps_visible: string[];
  active_app_guess: string;
  key_windows_or_panels: string[];
  web_domains_visible: string[];
  text_snippets: string[];
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
  summary_tags: string[];
  dedupe_signature: string;
  confidence: number;
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
}
