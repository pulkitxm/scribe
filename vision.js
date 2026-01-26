const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;
const MODEL_NAME = 'qwen2.5:7b';
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
You are a productivity tracking assistant for a SOFTWARE ENGINEER.

Analyze the desktop screenshot and return ONLY VALID JSON (no markdown, no extra text).

Main goals:
1) Extract maximum context (apps, window titles, domains, readable text, code language/tools, repo/file names).
2) Produce an engineer-aware productivity score based only on visible evidence.
3) Provide quantitative breakdown so it can be tracked over time.

Scoring guidelines:
- Writing/debugging code, reviewing PRs, implementing features: 85-100
- Reading technical docs / API references / stack traces: 70-95
- Watching TECH content (tutorials/system design): 55-85 depending on focus cues
- Planning technical tasks / writing notes: 60-85
- Work communication about implementation: 45-75
- Entertainment/social content: 0-35
- Mixed work + distraction: cap overall score <= 70

Rules:
- Never guess personal info.
- If text is unclear, state uncertainty and reduce confidence.
- Always include evidence that explains the score.

Return JSON with this structure:
{
  "overall_productivity_score": number,
  "category": string,
  "workspace_type": string,
  "short_description": string,
  "detailed_analysis": string,
  "scores": {
    "focus": number,
    "engineering_value": number,
    "distraction_risk": number
  },
  "evidence": {
    "apps_visible": string[],
    "active_app_guess": string,
    "key_windows_or_panels": string[],
    "web_domains_visible": string[],
    "text_snippets": string[]
  },
  "work_context": {
    "task_intent": string,
    "work_item": string,
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
    }
  },
  "actions_observed": string[],
  "safety_notes": string[],
  "summary_tags": string[],
  "dedupe_signature": string,
  "confidence": number
}

Important:
- "category" must be a single short label (example: "coding", "documentation", "meeting", "communication", "video-learning", "entertainment", "planning").
- DO NOT output multiple categories joined by "|" or ",".
- "workspace_type" should be a simple label like: "work", "learning", "communication", "distraction", or "mixed".
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
    execSync(`sips -Z 1024 -s format jpeg "${inputPath}" --out "${tempPath}"`, { stdio: 'ignore' });
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

function normalizeCategory(value) {
  if (typeof value !== 'string') return 'unknown';
  const v = value.trim().toLowerCase();
  if (!v) return 'unknown';
  const cleaned = v.replace(/[|,]/g, ' ').replace(/\s+/g, ' ').trim();
  const firstToken = cleaned.split(' ')[0];
  if (!firstToken || firstToken.length > 40) return 'unknown';
  return firstToken;
}

function safeString(x) {
  if (typeof x === 'string') return x.trim();
  return '';
}

function safeStringArray(x) {
  if (!Array.isArray(x)) return [];
  return x.filter(v => typeof v === 'string').map(v => v.trim()).filter(Boolean).slice(0, 50);
}

function callOllama(imageBase64, isRetry = false) {
  return new Promise((resolve, reject) => {
    const retryHint = `PREVIOUS OUTPUT WAS INVALID.
Return ONLY JSON.
Category must be a SINGLE short label like "coding" or "documentation", NOT "coding|research".
Do not include markdown or extra text.`;

    const requestBody = JSON.stringify({
      model: MODEL_NAME,
      prompt: isRetry ? `${retryHint}\n\n${PROMPT}` : PROMPT,
      images: [imageBase64],
      stream: false,
      format: "json",
      keep_alive: "10m",
      options: {
        temperature: 0,
        top_p: 0.9
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
          resolve(parsed.response);
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
  const clean = String(responseString || '').replace(/```json/g, '').replace(/```/g, '').trim();
  const json = JSON.parse(clean);

  if (!json || typeof json !== 'object') throw new Error('Response is not an object');

  json.overall_productivity_score = clamp(json.overall_productivity_score, 0, 100);

  json.category = normalizeCategory(json.category);
  json.workspace_type = safeString(json.workspace_type).toLowerCase() || 'unknown';

  json.short_description = safeString(json.short_description);
  json.detailed_analysis = safeString(json.detailed_analysis);

  if (!json.scores || typeof json.scores !== 'object') json.scores = {};
  json.scores.focus = clamp(json.scores.focus, 0, 100);
  json.scores.engineering_value = clamp(json.scores.engineering_value, 0, 100);
  json.scores.distraction_risk = clamp(json.scores.distraction_risk, 0, 100);

  if (!json.evidence || typeof json.evidence !== 'object') json.evidence = {};
  json.evidence.apps_visible = safeStringArray(json.evidence.apps_visible);
  json.evidence.active_app_guess = safeString(json.evidence.active_app_guess);
  json.evidence.key_windows_or_panels = safeStringArray(json.evidence.key_windows_or_panels);
  json.evidence.web_domains_visible = safeStringArray(json.evidence.web_domains_visible);
  json.evidence.text_snippets = safeStringArray(json.evidence.text_snippets);

  if (!json.work_context || typeof json.work_context !== 'object') json.work_context = {};
  json.work_context.task_intent = safeString(json.work_context.task_intent);
  json.work_context.work_item = safeString(json.work_context.work_item);

  if (!json.work_context.code_context || typeof json.work_context.code_context !== 'object') {
    json.work_context.code_context = {};
  }

  json.work_context.code_context.language = safeString(json.work_context.code_context.language);
  json.work_context.code_context.tools_or_frameworks = safeStringArray(json.work_context.code_context.tools_or_frameworks);
  json.work_context.code_context.files_or_modules = safeStringArray(json.work_context.code_context.files_or_modules);
  json.work_context.code_context.repo_or_project = safeString(json.work_context.code_context.repo_or_project);
  json.work_context.code_context.errors_or_logs_visible = !!json.work_context.code_context.errors_or_logs_visible;

  if (!json.work_context.learning_context || typeof json.work_context.learning_context !== 'object') {
    json.work_context.learning_context = {};
  }

  json.work_context.learning_context.learning_topic = safeString(json.work_context.learning_context.learning_topic);
  json.work_context.learning_context.source_type = safeString(json.work_context.learning_context.source_type);

  json.actions_observed = safeStringArray(json.actions_observed);
  json.safety_notes = safeStringArray(json.safety_notes);
  json.summary_tags = safeStringArray(json.summary_tags);
  json.dedupe_signature = safeString(json.dedupe_signature);
  json.confidence = clamp(json.confidence, 0, 1);

  if (!json.short_description) throw new Error('short_description missing');
  if (!json.detailed_analysis) throw new Error('detailed_analysis missing');

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
    try { fs.unlinkSync(processedImagePath); } catch (e) {}
  }

  let lastErr = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) log.warn(`Retry ${attempt}/${MAX_RETRIES}...`);
      const responseText = await callOllama(imageBase64, attempt > 0);
      const resultJSON = parseAndValidateJSON(responseText);
      fs.writeFileSync(finalOutputPath, JSON.stringify(resultJSON, null, 2));
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
