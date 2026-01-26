# 📸 Screenshot Tool for macOS

A lightweight, silent background service that captures high-quality full-screen screenshots every 5 seconds.

## Features

- **Silent** - No sounds, no notifications, no visual indicators
- **Lightweight** - Compiled Swift binary (~200KB), uses native macOS tools
- **Storage efficient** - WebP format (~300KB per screenshot vs 2-5MB for PNG)
- **Low resource usage** - Runs with low I/O and CPU priority
- **Starts on boot** - Automatically runs when you log in

## Installation

```bash
./install.sh
```

### Grant Screen Recording Permission (Required)

1. Open **System Settings → Privacy & Security → Screen Recording**
2. Click the **+** button
3. Navigate to `~/.local/bin/screenshot` and add it
4. Restart the service:
   ```bash
   launchctl kickstart -k gui/$(id -u)/com.samaan.screenshot
   ```

## Uninstall

```bash
./uninstall.sh
```

## Check Status

```bash
# See if it's running
launchctl list | grep screenshot

# Manually stop
launchctl unload ~/Library/LaunchAgents/com.samaan.screenshot.plist

# Manually start
launchctl load ~/Library/LaunchAgents/com.samaan.screenshot.plist

# Restart
launchctl kickstart -k gui/$(id -u)/com.samaan.screenshot
```

## Storage Estimate

WebP format gives ~85% compression vs PNG:
- ~300 KB per screenshot
- ~216 MB/hour (720 screenshots)
- ~5.2 GB/day
