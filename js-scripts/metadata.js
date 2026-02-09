const { safeString, safeStringArray } = require('./utils');

function buildTimestamp() {
  return {
    iso: process.env.SCRIBE_TIMESTAMP_ISO || new Date().toISOString(),
    unix_ms: parseInt(process.env.SCRIBE_TIMESTAMP_UNIX || Date.now().toString(), 10),
    timezone: process.env.SCRIBE_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone,
    day_of_week: process.env.SCRIBE_DAY_OF_WEEK || new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    time_of_day: process.env.SCRIBE_TIME_OF_DAY || 'unknown'
  };
}

function buildLocation() {
  const lat = process.env.SCRIBE_LATITUDE;
  const lon = process.env.SCRIBE_LONGITUDE;
  if (lat == null || lat === '' || lon == null || lon === '') {
    return null;
  }
  const numLat = parseFloat(lat);
  const numLon = parseFloat(lon);
  if (Number.isNaN(numLat) || Number.isNaN(numLon)) {
    return null;
  }
  const location = {
    latitude: numLat,
    longitude: numLon
  };
  const name = process.env.SCRIBE_LOCATION_NAME || process.env.SCRIBE_LOCATION;
  if (name && name.trim() !== '') {
    location.name = name.trim();
  }
  return location;
}

function buildSystemMetadata() {
  let externalDisplays = [];
  try {
    externalDisplays = JSON.parse(process.env.SCRIBE_EXTERNAL_DISPLAYS || '[]');
  } catch (e) {
    externalDisplays = [];
  }

  const idleSeconds = parseFloat(process.env.SCRIBE_IDLE_SECONDS || '0');

  return {
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
}

function buildVisualization(category, productivityScore, codeLanguage = '') {
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

  const priorityLevel = productivityScore > 70 ? 'high' : (productivityScore > 40 ? 'normal' : 'low');

  return {
    color_code: categoryColors[category] || '#757575',
    emoji: categoryEmojis[category] || '❓',
    priority_level: priorityLevel,
    display_badge: `${categoryEmojis[category] || ''} ${category.charAt(0).toUpperCase() + category.slice(1)}${codeLanguage ? ' - ' + codeLanguage : ''}`
  };
}

function buildSummary(category, shortDescription) {
  return {
    one_liner: shortDescription || '',
    voice_friendly: `You are ${category === 'idle' ? 'currently idle' : `engaged in ${category}`}. ${shortDescription || ''}`
  };
}

module.exports = {
  buildTimestamp,
  buildLocation,
  buildSystemMetadata,
  buildVisualization,
  buildSummary
};
