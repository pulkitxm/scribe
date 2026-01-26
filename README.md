# Scribe

> [!WARNING]
> This project is completely vibe coded. Use at your own risk.

A lightweight, silent background service that captures full-screen screenshots every 5 seconds.

## Features

- **Silent** - No sounds, no notifications, no visual indicators
- **Lightweight** - Compiled Swift binary (~200KB), uses native macOS tools
- **Storage efficient** - WebP format (~30-50KB per screenshot)
- **Low resource usage** - Runs with low I/O and CPU priority
- **Starts on boot** - Automatically runs when you log in

## Installation

### Prerequisites

You need `swift` installed (part of Xcode Command Line Tools) and `ffmpeg`.

```bash
xcode-select --install
brew install ffmpeg
```

### Install

```bash
./install.sh
```

This will:
1. Compile the tool from source
2. Install it to `~/.local/bin`
3. Set up the launch agent for background execution

### Grant Screen Recording Permission (Required)

1. Open **System Settings → Privacy & Security → Screen Recording**
2. Click the **+** button
3. Navigate to `~/.local/bin/scribe` (cmd+shift+g to paste path) and add it
4. Restart the service:
   ```bash
   launchctl kickstart -k gui/$(id -u)/com.scribe.service
   ```

## Uninstall

```bash
./uninstall.sh
```

## Check Status

```bash
# See if it's running
launchctl list | grep scribe

# Manually stop
launchctl unload ~/Library/LaunchAgents/com.scribe.service.plist

# Manually start
launchctl load ~/Library/LaunchAgents/com.scribe.service.plist

# Restart
launchctl kickstart -k gui/$(id -u)/com.scribe.service
```

## Storage Estimate

With aggressive optimization (1280px width, Q50 WebP):
- ~30-50 KB per screenshot
- ~20-30 MB/hour (720 screenshots)
- ~600-700 MB/day

This is nearly **10x smaller** than the original high-quality settings.
