const crypto = require('crypto');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
};

const useColors = process.stdout.isTTY;

const log = {
  info: (msg) => console.log(`${useColors ? colors.cyan : ''}[${getTimestamp()}] [INFO]${useColors ? colors.reset : ''} ${msg}`),
  success: (msg) => console.log(`${useColors ? colors.green : ''}[${getTimestamp()}] [SUCCESS]${useColors ? colors.reset : ''} ${msg}`),
  error: (msg) => console.error(`${useColors ? colors.red : ''}[${getTimestamp()}] [ERROR]${useColors ? colors.reset : ''} ${msg}`),
  warn: (msg) => console.warn(`${useColors ? colors.yellow : ''}[${getTimestamp()}] [WARN]${useColors ? colors.reset : ''} ${msg}`)
};

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

function cleanObject(obj) {
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
}

module.exports = {
  colors,
  log,
  clamp,
  safeString,
  safeBool,
  safeStringArray,
  normalizeLabel,
  pickFromSet,
  sha1,
  cleanObject
};
