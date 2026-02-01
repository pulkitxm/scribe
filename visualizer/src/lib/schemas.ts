import { z } from "zod";

export const AudioDeviceSchema = z.object({
    name: z.string(),
    is_default: z.boolean(),
    manufacturer: z.string().optional(),
    transport: z.string().optional(),
});

export type AudioDevice = z.infer<typeof AudioDeviceSchema>;

export const VideoDeviceSchema = z.object({
    name: z.string(),
    manufacturer: z.string().optional(),
    unique_id: z.string().optional(),
    is_connected: z.boolean().optional(),
    is_suspended: z.boolean().optional(),
});

export type VideoDevice = z.infer<typeof VideoDeviceSchema>;

export const SystemMetadataSchema = z.object({
    active_app: z.string(),
    opened_apps: z.array(z.string()),
    audio: z.object({
        volume: z.number(),
        is_muted: z.boolean(),
        inputs: z.array(AudioDeviceSchema),
        outputs: z.array(AudioDeviceSchema),
    }),
    video: z.object({
        sources: z.array(VideoDeviceSchema).optional().default([]),
    }).optional(),
    stats: z.object({
        battery: z.object({
            percentage: z.number(),
            isPlugged: z.boolean(),
        }),
        ram: z.object({
            total: z.number(),
            used: z.number(),
            free: z.number(),
        }),
        storage: z.object({
            total: z.number(),
            used: z.number(),
            free: z.number(),
        }).optional(),
        cpu: z.object({
            cores: z.number(),
            used: z.number(),
            idle: z.number(),
        }),
        network: z.object({
            connected: z.boolean(),
            type: z.string().optional(),
            signal_strength: z.number().optional(),
            ssid: z.string().optional(),
            local_ip: z.string().optional(),
            rx_bytes: z.number().optional(),
            tx_bytes: z.number().optional(),
            link_speed: z.number().optional(),
            channel: z.number().optional(),
        }),
        display: z.object({
            dark_mode: z.boolean(),
            brightness: z.number().optional(),
            external_displays: z.array(z.any()),
        }),
        input: z.object({
            idle_seconds: z.number(),
        }),
    }),
});

export type SystemMetadata = z.infer<typeof SystemMetadataSchema>;

export const ScoresSchema = z.object({
    focus_score: z.number(),
    productivity_score: z.number(),
    distraction_risk: z.number(),
});

export type Scores = z.infer<typeof ScoresSchema>;

export const EvidenceSchema = z.object({
    apps_visible: z.array(z.string()).optional().default([]),
    active_app_guess: z.string().optional().default("Unknown"),
    key_windows_or_panels: z.array(z.string()).optional().default([]),
    web_domains_visible: z.array(z.string()).optional().default([]),
    text_snippets: z.array(z.string()).optional().default([]),
    raw_text_content: z.string().optional(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

export const WorkContextSchema = z.object({
    work_type: z.string().optional().default(""),
    project_or_doc: z.string().optional().default(""),
});

export type WorkContext = z.infer<typeof WorkContextSchema>;

export const CodeContextSchema = z.object({
    language: z.string().optional().default(""),
    tools_or_frameworks: z.array(z.string()).optional().default([]),
    files_or_modules: z.array(z.string()).optional().default([]),
    repo_or_project: z.string().optional().default(""),
    errors_or_logs_visible: z.boolean().optional().default(false),
});

export type CodeContext = z.infer<typeof CodeContextSchema>;

export const LearningContextSchema = z.object({
    learning_topic: z.string().optional().default(""),
    source_type: z.string().optional().default(""),
});

export type LearningContext = z.infer<typeof LearningContextSchema>;

export const CommunicationContextSchema = z.object({
    communication_type: z.string().optional().default(""),
    platform_guess: z.string().optional().default(""),
    meeting_indicator: z.boolean().optional().default(false),
});

export type CommunicationContext = z.infer<typeof CommunicationContextSchema>;

export const EntertainmentContextSchema = z.object({
    entertainment_type: z.string().optional().default(""),
    platform_guess: z.string().optional().default(""),
});

export type EntertainmentContext = z.infer<typeof EntertainmentContextSchema>;

export const ContextSchema = z.object({
    intent_guess: z.string().optional().default(""),
    topic_or_game_or_media: z.string().optional().default(""),
    work_context: WorkContextSchema.optional().default({
        work_type: "",
        project_or_doc: ""
    }),
    code_context: CodeContextSchema.optional().default({
        language: "",
        tools_or_frameworks: [],
        files_or_modules: [],
        repo_or_project: "",
        errors_or_logs_visible: false
    }),
    learning_context: LearningContextSchema.optional().default({
        learning_topic: "",
        source_type: ""
    }),
    communication_context: CommunicationContextSchema.optional().default({
        communication_type: "",
        platform_guess: "",
        meeting_indicator: false
    }),
    entertainment_context: EntertainmentContextSchema.optional().default({
        entertainment_type: "",
        platform_guess: ""
    }),
});

export type Context = z.infer<typeof ContextSchema>;

export const TimestampSchema = z.object({
    iso: z.string(),
    unix_ms: z.number(),
    timezone: z.string(),
    day_of_week: z.string(),
    time_of_day: z.string(),
});

export type Timestamp = z.infer<typeof TimestampSchema>;

export const VisualizationSchema = z.object({
    color_code: z.string().optional(),
    emoji: z.string().optional(),
    priority_level: z.string().optional(),
    display_badge: z.string().optional(),
});

export type Visualization = z.infer<typeof VisualizationSchema>;

export const SummarySchema = z.object({
    one_liner: z.string(),
    voice_friendly: z.string().optional(),
});

export type Summary = z.infer<typeof SummarySchema>;

export const ScreenshotDataSchema = z.object({
    overall_activity_score: z.number(),
    category: z.string(),
    workspace_type: z.string(),
    short_description: z.string(),
    detailed_analysis: z.string(),
    scores: ScoresSchema,
    evidence: EvidenceSchema.optional().default({
        apps_visible: [],
        active_app_guess: "Unknown",
        key_windows_or_panels: [],
        web_domains_visible: [],
        text_snippets: [],
        raw_text_content: ""
    }),
    context: ContextSchema.optional().default({
        intent_guess: "",
        topic_or_game_or_media: "",
        work_context: { work_type: "", project_or_doc: "" },
        code_context: { language: "", tools_or_frameworks: [], files_or_modules: [], repo_or_project: "", errors_or_logs_visible: false },
        learning_context: { learning_topic: "", source_type: "" },
        communication_context: { communication_type: "", platform_guess: "", meeting_indicator: false },
        entertainment_context: { entertainment_type: "", platform_guess: "" }
    }),
    actions_observed: z.array(z.string()).optional().default([]),
    privacy_notes: z.array(z.string()).optional().default([]),
    summary_tags: z.array(z.string()).optional().default([]),
    dedupe_signature: z.string().optional().default(""),
    confidence: z.number(),
    system_metadata: SystemMetadataSchema.optional(),

    // New top-level fields
    timestamp: TimestampSchema.optional(), // Optional for now to maintain backward compat if needed, or make refined based on data
    visualization: VisualizationSchema.optional(),
    summary: SummarySchema.optional(),
});

export type ScreenshotData = z.infer<typeof ScreenshotDataSchema>;
