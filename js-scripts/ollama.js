const http = require('http');

const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;
const MODEL_NAME = process.env.OLLAMA_MODEL || 'qwen3-vl:2b';

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

TEXT EXTRACTION RULES:
- Extract KEY text snippets that help understand the context (15-30 snippets)
- Focus on: file names, function names, app names, window titles, key UI labels, URLs, error messages
- Keep snippets SHORT and meaningful (under 50 characters each)
- Properly escape all quotes and special characters in JSON strings
- Do NOT extract full code blocks or long text passages (OCR handles that separately)

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
    "text_snippets": string[] // Extract 15-30 SHORT key text snippets (file names, function names, UI labels, etc.)
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
- CRITICAL: Ensure ALL strings in JSON are properly escaped (use \\" for quotes, \\\\ for backslashes)
- CRITICAL: Keep text_snippets SHORT (max 50 chars each) to ensure valid JSON
- CRITICAL: Return ONLY valid JSON - no markdown, no extra text, no truncated strings
`.trim();

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
        num_predict: 3072  
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

module.exports = {
  callOllama,
  PROMPT
};
