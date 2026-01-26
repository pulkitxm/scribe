# How to Run & How it Works

> [!WARNING]
> This project is completely vibe coded. Use at your own risk.

## How it Works

1.  **Swift Binary**: A small compiled program runs in the background.
2.  **Capture**: Every 5 seconds, it takes a silent screenshot using native macOS APIs.
3.  **Optimize**: It uses `ffmpeg` to:
    - Resize the image to 1280px width (720p-ish resolution).
    - Convert it to WebP format with quality 50.
    - Result: **~30-50KB** per image (vs 5MB for a normal screenshot).
4.  **Persistence**: A `LaunchAgent` ensures it starts automatically when you log in.

## Detailed Installation Guide

### 1. Prerequisites

You need `ffmpeg` for image compression and `swift` to compile the tool.

```bash
# Install ffmpeg
brew install ffmpeg

# Install Swift (if not already installed)
xcode-select --install
```

### 2. Install

```bash
./install.sh
```

This script compiles the code and sets up the background service.

### 3. Grant Permissions (CRITICAL)

macOS requires explicit permission for screen recording.

1.  Go to **System Settings > Privacy & Security > Screen Recording**.
2.  Click `+`.
3.  Press **Cmd+Shift+G** and paste: `~/.local/bin/scribe`
4.  Select the `scribe` binary and click **Open**.
5.  Toggle the switch **ON**.

### 4. Start the Service

After granting permissions, restart the service to begin capturing:

```bash
launchctl kickstart -k gui/$(id -u)/com.scribe.service
```

## Usage

- **Location**: Screenshots are saved in `~/screenshots/scribe/`.
- **Format**: `screenshot_YYYY-MM-DD_HH-mm-ss.webp`

### Controls

```bash
# Check status
launchctl list | grep scribe

# Stop temporarily
launchctl unload ~/Library/LaunchAgents/com.scribe.service.plist

# Resume
launchctl load ~/Library/LaunchAgents/com.scribe.service.plist

# Uninstall completely
./uninstall.sh
```
