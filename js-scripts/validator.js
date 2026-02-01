const { clamp, safeString, safeBool, safeStringArray, pickFromSet, sha1, log } = require('./utils');

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
  json.evidence.raw_text_content = safeString(json.evidence.raw_text_content);

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

module.exports = {
  parseAndValidateJSON,
  validateJSON
};
