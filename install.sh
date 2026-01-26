#!/bin/bash
# Install Screenshot Tool

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_DIR="$HOME/.local/bin"
LAUNCHAGENT_DIR="$HOME/Library/LaunchAgents"
SCREENSHOT_DIR="$HOME/screenshots/ss-tool"

echo "📸 Installing Screenshot Tool..."

# Check for swift
if ! command -v swiftc &> /dev/null; then
    echo "❌ Error: swiftc is required but not installed."
    echo "   Install Xcode Command Line Tools to proceed."
    exit 1
fi

# Check for ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: ffmpeg is required but not installed."
    echo "   Install with: brew install ffmpeg"
    exit 1
fi

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$LAUNCHAGENT_DIR"
mkdir -p "$SCREENSHOT_DIR"

# Compile binary
echo "🔨 Compiling screenshot tool..."
swiftc "$SCRIPT_DIR/screenshot.swift" -o "$INSTALL_DIR/screenshot"

# Setup plist with correct path
PLIST_SOURCE="$SCRIPT_DIR/com.samaan.screenshot.plist"
PLIST_DEST="$LAUNCHAGENT_DIR/com.samaan.screenshot.plist"

# Copy plist
cp "$PLIST_SOURCE" "$PLIST_DEST"

# Replace placeholder with actual path if needed, or ensure it points to the correct binary location
# Since we know the install location is $HOME/.local/bin/screenshot, we can update it dynamically
# But since $HOME is expanded in the plist only if we use it, simpler to just use full path
USER_HOME=$HOME
sed -i '' "s|/Users/pulkit/.local/bin/screenshot|$USER_HOME/.local/bin/screenshot|g" "$PLIST_DEST"

# Unload if already running (ignore errors)
launchctl unload "$PLIST_DEST" 2>/dev/null || true

# Load and start the service
launchctl load "$PLIST_DEST"

echo "✅ Screenshot Tool installed successfully!"
echo "📁 Screenshots will be saved to: $SCREENSHOT_DIR"
echo "⏱️  Taking a screenshot every 5 seconds (WebP format)"
echo ""
echo "⚠️  IMPORTANT: Grant Screen Recording permission to 'screenshot' in:"
echo "   System Settings → Privacy & Security → Screen Recording"
echo "   Then restart the service with: launchctl kickstart -k gui/\$(id -u)/com.samaan.screenshot"
echo ""
echo "To uninstall, run: ./uninstall.sh"
