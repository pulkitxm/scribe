const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');
const crypto = require('crypto');

const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;
const MODEL_NAME = process.env.OLLAMA_MODEL || 'qwen3-vl:2b';
const MAX_RETRIES = 2;

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg) => console.warn(`${colors.yellow}[WARN]${colors.reset} ${msg}`)
};

const PROMPT = `
You are a generic desktop activity tracking assistant.

Analyze the desktop screenshot and return ONLY VALID JSON (no markdown, no extra text).

Context from system:
- Active Application: ${process.env.SCRIBE_ACTIVE_APP || 'Unknown'}
- All Running Applications: ${process.env.SCRIBE_OPENED_APPS || 'Unknown'}
- Battery/Power: ${process.env.SCRIBE_BATTERY || 'Unknown'} (${process.env.SCRIBE_BATTERY_PERCENT || '0'}%, Plugged in: ${process.env.SCRIBE_IS_PLUGGED || 'false'})
- Volume: ${process.env.SCRIBE_VOLUME || 'Unknown'}%
- RAM: ${process.env.SCRIBE_RAM_USED || '0'}GB used / ${process.env.SCRIBE_RAM_TOTAL || '0'}GB total
- Storage: ${process.env.SCRIBE_STORAGE_USED || '0'}GB used / ${process.env.SCRIBE_STORAGE_TOTAL || '0'}GB total
- CPU: ${process.env.SCRIBE_CPU_USED || '0'}%
- Network: ${process.env.SCRIBE_NETWORK_TYPE || 'unknown'} (${process.env.SCRIBE_NETWORK_CONNECTED === 'true' ? 'connected' : 'disconnected'})
- Display Brightness: ${process.env.SCRIBE_BRIGHTNESS || 'unknown'}%
- Input Idle: ${process.env.SCRIBE_IDLE_SECONDS || '0'} seconds
- Time: ${process.env.SCRIBE_TIME_OF_DAY || 'unknown'} (${process.env.SCRIBE_DAY_OF_WEEK || 'unknown'})

Goal:
Give a high-signal summary of what the user is doing on their laptop based on the screenshot and provided system context.

Strict rules:
1) Extract STRICTLY VISIBLE context from screenshot, but you can use system context for better accuracy (e.g., if you see a code editor and system says "VS Code" is active).
2) Do NOT guess. Do NOT hallucinate.
3) If text is not clearly readable, do not infer it unless system context supports it.
4) If you are unsure about an app or site, omit it.
5) Do not invent filenames, code, chats, or people.
6) Treat privacy seriously. Do not reveal secrets. If sensitive data is visible, mention it generically (e.g., "personal info visible").

Activity categories:
Use ONE short label only:
- "work"
- "coding"
- "study"
- "reading"
- "writing"
- "browsing"
- "planning"
- "communication"
- "meeting"
- "social"
- "gaming"
- "entertainment"
- "creative"
- "shopping"
- "finance"
- "tools"
- "system"
- "file-management"
- "idle"
- "unknown"

Workspace types:
Use ONE label only:
- "focused"
- "mixed"
- "casual"
- "social"
- "leisure"
- "productive"
- "idle"
- "unknown"

Scoring (based only on visible evidence):
- overall_activity_score: How engaged the user appears (0-100)
- focus_score: How concentrated the context appears (0-100)
- productivity_score: How much the context suggests useful progress toward goals (0-100)
- distraction_risk: How likely the context suggests drifting away from intended task (0-100)

Guidelines:
- Deep work visible (coding, writing, studying, designing): productivity_score 70-100
- Meetings / communication: productivity_score 40-80 depending on context
- Browsing/exploring: productivity_score 20-70 depending on intent and clarity
- Movies / gaming / entertainment: productivity_score 0-45
- Idle / desktop / nothing open: overall_activity_score < 35 and productivity_score < 30

Return JSON with this structure:
{
  "overall_activity_score": number,
  "category": string,
  "workspace_type": string,
  "short_description": string,
  "detailed_analysis": string,
  "scores": {
    "focus_score": number,
    "productivity_score": number,
    "distraction_risk": number
  },
  "evidence": {
    "apps_visible": string[],
    "active_app_guess": string,
    "key_windows_or_panels": string[],
    "web_domains_visible": string[],
    "text_snippets": string[]
  },
  "context": {
    "intent_guess": string,
    "topic_or_game_or_media": string,
    "work_context": {
      "work_type": string,
      "project_or_doc": string
    },
    "code_context": {
      "language": string,
      "tools_or_frameworks": string[],
      "files_or_modules": string[],
      "repo_or_project": string,
      "errors_or_logs_visible": boolean
    },
    "learning_context": {
      "learning_topic": string,
      "source_type": string
    },
    "communication_context": {
      "communication_type": string,
      "platform_guess": string,
      "meeting_indicator": boolean
    },
    "entertainment_context": {
      "entertainment_type": string,
      "platform_guess": string
    }
  },
  "actions_observed": string[],
  "privacy_notes": string[],
  "summary_tags": string[],
  "dedupe_signature": string,
  "confidence": number
}

Important:
- "category" must be exactly ONE label from the list.
- Be direct, brutally honest, and minimal.
- confidence: 0 to 1, based on how clearly visible the context is.
`.trim();

function validateArgs() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    log.error('Usage: node vision.js <path_to_image>');
    process.exit(1);
  }
  const imagePath = path.resolve(args[0]);
  if (!fs.existsSync(imagePath)) {
    log.error(`File not found: ${imagePath}`);
    process.exit(1);
  }
  return imagePath;
}

function preprocessImage(inputPath) {
  const tempPath = path.join(path.dirname(inputPath), `temp_${Date.now()}.jpg`);
  try {
    execSync(`sips -Z 1280 -s format jpeg "${inputPath}" --out "${tempPath}"`, { stdio: 'ignore' });
    return tempPath;
  } catch (e) {
    return inputPath;
  }
}

function getImageBase64(filePath) {
  const fileData = fs.readFileSync(filePath);
  return fileData.toString('base64');
}

function clamp(n, min, max) {
  if (typeof n !== 'number' || Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function safeString(x) {
  if (typeof x === 'string') return x.trim();
  return '';
}

function safeBool(x) {
  return !!x;
}

function safeStringArray(x) {
  if (!Array.isArray(x)) return [];
  return x.filter(v => typeof v === 'string').map(v => v.trim()).filter(Boolean).slice(0, 80);
}

function normalizeLabel(value, fallback = 'unknown') {
  if (typeof value !== 'string') return fallback;
  const v = value.trim().toLowerCase();
  if (!v) return fallback;
  const cleaned = v.replace(/[|,]/g, ' ').replace(/\s+/g, ' ').trim();
  const firstToken = cleaned.split(' ')[0];
  if (!firstToken || firstToken.length > 60) return fallback;
  return firstToken;
}

function pickFromSet(v, allowed, fallback) {
  const x = normalizeLabel(v, fallback);
  if (allowed.has(x)) return x;
  return fallback;
}

function sha1(s) {
  return crypto.createHash('sha1').update(String(s || ''), 'utf8').digest('hex');
}

function callOllama(imageBase64, isRetry = false) {
  return new Promise((resolve, reject) => {
    const retryHint = `PREVIOUS OUTPUT WAS INVALID.
Return ONLY JSON.
No markdown.
No extra text.
Use a single category label only.`;

    const requestBody = JSON.stringify({
      model: MODEL_NAME,
      prompt: isRetry ? `${retryHint}\n\n${PROMPT}` : PROMPT,
      images: [imageBase64],
      stream: false,
      format: 'json',
      keep_alive: '10m',
      options: {
        temperature: 0,
        top_p: 0.9,
        num_ctx: 8192,
        num_predict: 2048
      }
    });

    const options = {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Ollama status ${res.statusCode}: ${data}`));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.response || parsed.thinking || '';
          if (!content) {
            reject(new Error('Ollama returned empty response'));
            return;
          }
          resolve(content);
        } catch (e) {
          reject(new Error(`Failed to parse Ollama wrapper JSON: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Ollama connection error: ${e.message}`)));
    req.write(requestBody);
    req.end();
  });
}

function parseAndValidateJSON(responseString) {
  const str = String(responseString || '');
  const start = str.indexOf('{');
  let end = str.lastIndexOf('}');

  if (start === -1) {
    log.error('Raw response was: ' + responseString);
    throw new Error('No JSON object found in response');
  }

  if (end < start) end = str.length;

  const clean = str.substring(start, end + 1);
  try {
    const json = JSON.parse(clean);
    return validateJSON(json);
  } catch (e) {
    // Attempt repairs
    const repairs = [
      clean + '}',
      clean + '"}',
      clean + '"]}',
      clean + '"}]}',
      clean + '}}',
      clean + '"}}',
    ];

    for (const r of repairs) {
      try {
        return validateJSON(JSON.parse(r));
      } catch (err) { }
    }

    log.error('Failed to parse JSON: ' + e.message);
    log.error('Raw content was: ' + clean);
    throw e;
  }
}

function validateJSON(json) {
  if (!json || typeof json !== 'object') throw new Error('Response is not an object');

  const categorySet = new Set([
    'work',
    'coding',
    'study',
    'reading',
    'writing',
    'browsing',
    'planning',
    'communication',
    'meeting',
    'social',
    'gaming',
    'entertainment',
    'creative',
    'shopping',
    'finance',
    'tools',
    'system',
    'file-management',
    'idle',
    'unknown'
  ]);

  const workspaceSet = new Set([
    'focused',
    'mixed',
    'casual',
    'social',
    'leisure',
    'productive',
    'idle',
    'unknown'
  ]);

  json.overall_activity_score = clamp(json.overall_activity_score, 0, 100);
  json.category = pickFromSet(json.category, categorySet, 'unknown');
  json.workspace_type = pickFromSet(json.workspace_type, workspaceSet, 'unknown');

  json.short_description = safeString(json.short_description);
  json.detailed_analysis = safeString(json.detailed_analysis);

  if (!json.scores || typeof json.scores !== 'object') json.scores = {};
  json.scores.focus_score = clamp(json.scores.focus_score, 0, 100);
  json.scores.productivity_score = clamp(json.scores.productivity_score, 0, 100);
  json.scores.distraction_risk = clamp(json.scores.distraction_risk, 0, 100);

  if (!json.evidence || typeof json.evidence !== 'object') json.evidence = {};
  json.evidence.apps_visible = safeStringArray(json.evidence.apps_visible);
  json.evidence.active_app_guess = safeString(json.evidence.active_app_guess);
  json.evidence.key_windows_or_panels = safeStringArray(json.evidence.key_windows_or_panels);
  json.evidence.web_domains_visible = safeStringArray(json.evidence.web_domains_visible);
  json.evidence.text_snippets = safeStringArray(json.evidence.text_snippets);

  if (!json.context || typeof json.context !== 'object') json.context = {};
  json.context.intent_guess = safeString(json.context.intent_guess);
  json.context.topic_or_game_or_media = safeString(json.context.topic_or_game_or_media);

  if (!json.context.work_context || typeof json.context.work_context !== 'object') json.context.work_context = {};
  json.context.work_context.work_type = safeString(json.context.work_context.work_type);
  json.context.work_context.project_or_doc = safeString(json.context.work_context.project_or_doc);

  if (!json.context.code_context || typeof json.context.code_context !== 'object') json.context.code_context = {};
  json.context.code_context.language = safeString(json.context.code_context.language);
  json.context.code_context.tools_or_frameworks = safeStringArray(json.context.code_context.tools_or_frameworks);
  json.context.code_context.files_or_modules = safeStringArray(json.context.code_context.files_or_modules);
  json.context.code_context.repo_or_project = safeString(json.context.code_context.repo_or_project);
  json.context.code_context.errors_or_logs_visible = safeBool(json.context.code_context.errors_or_logs_visible);

  if (!json.context.learning_context || typeof json.context.learning_context !== 'object') json.context.learning_context = {};
  json.context.learning_context.learning_topic = safeString(json.context.learning_context.learning_topic);
  json.context.learning_context.source_type = safeString(json.context.learning_context.source_type);

  if (!json.context.communication_context || typeof json.context.communication_context !== 'object') json.context.communication_context = {};
  json.context.communication_context.communication_type = safeString(json.context.communication_context.communication_type);
  json.context.communication_context.platform_guess = safeString(json.context.communication_context.platform_guess);
  json.context.communication_context.meeting_indicator = safeBool(json.context.communication_context.meeting_indicator);

  if (!json.context.entertainment_context || typeof json.context.entertainment_context !== 'object') json.context.entertainment_context = {};
  json.context.entertainment_context.entertainment_type = safeString(json.context.entertainment_context.entertainment_type);
  json.context.entertainment_context.platform_guess = safeString(json.context.entertainment_context.platform_guess);

  json.actions_observed = safeStringArray(json.actions_observed);
  json.privacy_notes = safeStringArray(json.privacy_notes);
  json.summary_tags = safeStringArray(json.summary_tags);

  const baseSig = JSON.stringify({
    category: json.category,
    workspace_type: json.workspace_type,
    apps_visible: json.evidence.apps_visible.slice(0, 12),
    web_domains_visible: json.evidence.web_domains_visible.slice(0, 12),
    key_windows_or_panels: json.evidence.key_windows_or_panels.slice(0, 12)
  });

  json.dedupe_signature = safeString(json.dedupe_signature) || sha1(baseSig);
  json.confidence = clamp(json.confidence, 0, 1);

  if (!json.short_description) throw new Error('short_description missing');
  if (!json.detailed_analysis) throw new Error('detailed_analysis missing');

  if (!json.system_metadata || typeof json.system_metadata !== 'object') json.system_metadata = {};
  json.system_metadata.active_app = safeString(json.system_metadata.active_app);
  json.system_metadata.opened_apps = safeStringArray(json.system_metadata.opened_apps);

  if (!json.system_metadata.battery || typeof json.system_metadata.battery !== 'object') {
    json.system_metadata.battery = {};
  }
  json.system_metadata.battery.percentage = typeof json.system_metadata.battery.percentage === 'number' ? json.system_metadata.battery.percentage : 0;
  json.system_metadata.battery.isPlugged = !!json.system_metadata.battery.isPlugged;
  json.system_metadata.battery.battery_status = safeString(json.system_metadata.battery.battery_status);

  return json;
}

async function main() {
  const imagePath = validateArgs();
  const baseName = path.basename(imagePath, path.extname(imagePath));
  const finalOutputPath = path.join(path.dirname(imagePath), `${baseName}.json`);

  log.info(`Processing ${path.basename(imagePath)}...`);

  const processedImagePath = preprocessImage(imagePath);
  const imageBase64 = getImageBase64(processedImagePath);

  if (processedImagePath !== imagePath && fs.existsSync(processedImagePath)) {
    try { fs.unlinkSync(processedImagePath); } catch (e) { }
  }

  let lastErr = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) log.warn(`Retry ${attempt}/${MAX_RETRIES}...`);
      const responseText = await callOllama(imageBase64, attempt > 0);
      const resultJSON = parseAndValidateJSON(responseText);

      // Inject real system metadata to ensure accuracy
      const category = resultJSON.category || 'unknown';
      const categoryColors = {
        'coding': '#4CAF50', 'work': '#2196F3', 'study': '#9C27B0', 'reading': '#00BCD4',
        'writing': '#3F51B5', 'browsing': '#FF9800', 'planning': '#795548', 'communication': '#E91E63',
        'meeting': '#F44336', 'social': '#EC407A', 'gaming': '#8BC34A', 'entertainment': '#FFEB3B',
        'creative': '#FF5722', 'shopping': '#FFC107', 'finance': '#607D8B', 'tools': '#9E9E9E',
        'system': '#78909C', 'file-management': '#8D6E63', 'idle': '#BDBDBD', 'unknown': '#757575'
      };
      const categoryEmojis = {
        'coding': '💻', 'work': '💼', 'study': '📚', 'reading': '📖', 'writing': '✍️',
        'browsing': '🌐', 'planning': '📋', 'communication': '💬', 'meeting': '🎥',
        'social': '👥', 'gaming': '🎮', 'entertainment': '🎬', 'creative': '🎨',
        'shopping': '🛒', 'finance': '💰', 'tools': '🔧', 'system': '⚙️',
        'file-management': '📁', 'idle': '💤', 'unknown': '❓'
      };

      let externalDisplays = [];
      try {
        externalDisplays = JSON.parse(process.env.SCRIBE_EXTERNAL_DISPLAYS || '[]');
      } catch (e) {
        externalDisplays = [];
      }

      const productivityScore = resultJSON.scores?.productivity_score || 0;
      const idleSeconds = parseFloat(process.env.SCRIBE_IDLE_SECONDS || '0');

      let eyeStrainRisk = 'low';
      if (productivityScore > 70 && idleSeconds < 30) {
        eyeStrainRisk = 'moderate';
      }
      if (productivityScore > 85 && idleSeconds < 10) {
        eyeStrainRisk = 'high';
      }

      const priorityLevel = productivityScore > 70 ? 'high' : (productivityScore > 40 ? 'normal' : 'low');

      resultJSON.timestamp = {
        iso: process.env.SCRIBE_TIMESTAMP_ISO || new Date().toISOString(),
        unix_ms: parseInt(process.env.SCRIBE_TIMESTAMP_UNIX || Date.now().toString(), 10),
        timezone: process.env.SCRIBE_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone,
        day_of_week: process.env.SCRIBE_DAY_OF_WEEK || new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        time_of_day: process.env.SCRIBE_TIME_OF_DAY || 'unknown'
      };



      resultJSON.system_metadata = {
        active_app: process.env.SCRIBE_ACTIVE_APP || 'Unknown',
        opened_apps: (process.env.SCRIBE_OPENED_APPS || '').split(',').map(s => s.trim()).filter(Boolean),
        audio: {
          volume: parseInt(process.env.SCRIBE_VOLUME || '0', 10),
          is_muted: process.env.SCRIBE_AUDIO_MUTED === 'true',
          inputs: (() => {
            try {
              return JSON.parse(process.env.SCRIBE_AUDIO_INPUTS || '[]');
            } catch (e) { return []; }
          })(),
          outputs: (() => {
            try {
              return JSON.parse(process.env.SCRIBE_AUDIO_OUTPUTS || '[]');
            } catch (e) { return []; }
          })()
        },
        video: {
          sources: (() => {
            try {
              return JSON.parse(process.env.SCRIBE_VIDEO_SOURCES || '[]');
            } catch (e) { return []; }
          })()
        },
        stats: {
          battery: {
            percentage: parseInt(process.env.SCRIBE_BATTERY_PERCENT || '0', 10),
            isPlugged: process.env.SCRIBE_IS_PLUGGED === 'true'
          },
          ram: {
            total: parseInt(process.env.SCRIBE_RAM_TOTAL || '0', 10),
            used: parseInt(process.env.SCRIBE_RAM_USED || '0', 10),
            free: parseInt(process.env.SCRIBE_RAM_FREE || '0', 10)
          },
          storage: {
            total: parseInt(process.env.SCRIBE_STORAGE_TOTAL || '0', 10),
            used: parseInt(process.env.SCRIBE_STORAGE_USED || '0', 10),
            free: parseInt(process.env.SCRIBE_STORAGE_FREE || '0', 10)
          },
          cpu: {
            cores: parseInt(process.env.SCRIBE_CPU_CORES || '0', 10),
            used: parseFloat(process.env.SCRIBE_CPU_USED || '0'),
            idle: parseFloat(process.env.SCRIBE_CPU_IDLE || '0')
          },
          network: (() => {
            const net = {
              connected: process.env.SCRIBE_NETWORK_CONNECTED === 'true',
              type: process.env.SCRIBE_NETWORK_TYPE || 'unknown',
              local_ip: process.env.SCRIBE_NETWORK_LOCAL_IP || '',
              rx_bytes: parseInt(process.env.SCRIBE_NETWORK_RX_BYTES || '0', 10),
              tx_bytes: parseInt(process.env.SCRIBE_NETWORK_TX_BYTES || '0', 10)
            };

            const ssid = process.env.SCRIBE_NETWORK_SSID || '';
            if (ssid) net.ssid = ssid;

            const signal = parseInt(process.env.SCRIBE_NETWORK_SIGNAL || '0', 10);
            if (signal !== 0) net.signal_strength = signal;

            const speed = parseInt(process.env.SCRIBE_NETWORK_LINK_SPEED || '0', 10);
            if (speed > 0) net.link_speed = speed;

            const channel = parseInt(process.env.SCRIBE_NETWORK_CHANNEL || '0', 10);
            if (channel > 0) net.channel = channel;

            const bssid = process.env.SCRIBE_NETWORK_BSSID || '';
            if (bssid) net.bssid = bssid;

            return net;
          })(),
          display: (() => {
            const disp = {
              dark_mode: process.env.SCRIBE_DARK_MODE === 'true',
              external_displays: externalDisplays
            };
            const b = parseInt(process.env.SCRIBE_BRIGHTNESS || '-1', 10);
            if (b >= 0) disp.brightness = b;
            return disp;
          })(),
          input: {
            idle_seconds: idleSeconds
          }
        }
      };

      resultJSON.visualization = {
        color_code: categoryColors[category] || '#757575',
        emoji: categoryEmojis[category] || '❓',
        priority_level: priorityLevel,
        display_badge: `${categoryEmojis[category] || ''} ${category.charAt(0).toUpperCase() + category.slice(1)}${resultJSON.context?.code_context?.language ? ' - ' + resultJSON.context.code_context.language : ''}`
      };



      resultJSON.summary = {
        one_liner: resultJSON.short_description || '',
        voice_friendly: `You are ${category === 'idle' ? 'currently idle' : `engaged in ${category}`}. ${resultJSON.short_description || ''}`
      };

      // Helper to recursively clean object
      const cleanObject = (obj) => {
        if (Array.isArray(obj)) {
          return obj
            .map(v => cleanObject(v))
            .filter(v => v !== null && v !== undefined && v !== '' && (typeof v !== 'object' || Object.keys(v).length > 0));
        } else if (typeof obj === 'object' && obj !== null) {
          const newObj = {};
          for (const key in obj) {
            const val = cleanObject(obj[key]);
            if (val !== null &&
              val !== undefined &&
              val !== '' &&
              val !== 'none' &&
              val !== 'unknown' &&
              !(Array.isArray(val) && val.length === 0) &&
              !(typeof val === 'object' && Object.keys(val).length === 0)) {
              newObj[key] = val;
            }
          }
          return newObj;
        }
        return obj;
      };

      const cleanedJSON = cleanObject(resultJSON);

      fs.writeFileSync(finalOutputPath, JSON.stringify(cleanedJSON, null, 2));
      log.success(`Saved: ${finalOutputPath}`);
      return;
    } catch (err) {
      lastErr = err;
      log.warn(err.message);
    }
  }

  log.error(`Failed after ${MAX_RETRIES + 1} attempts: ${lastErr?.message || 'unknown error'}`);
  process.exit(1);
}

main();
