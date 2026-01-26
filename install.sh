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
APP_DIR="$INSTALL_DIR/Screenshot.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"

# Create App Bundle structure
mkdir -p "$MACOS_DIR"

# Copy Info.plist to bundle
cp "$SCRIPT_DIR/Info.plist" "$CONTENTS_DIR/Info.plist"

# Compile binary into the App Bundle
echo "🔨 Compiling screenshot tool..."
swiftc "$SCRIPT_DIR/screenshot.swift" -o "$MACOS_DIR/screenshot"

# Sign the App Bundle
echo "🔏 Signing App Bundle..."
codesign -f -s - --deep --identifier "com.pulkit.screenshot" "$APP_DIR"

# Setup plist with correct path
PLIST_SOURCE="$SCRIPT_DIR/com.pulkit.screenshot.plist"
PLIST_DEST="$LAUNCHAGENT_DIR/com.pulkit.screenshot.plist"

# Copy plist
cp "$PLIST_SOURCE" "$PLIST_DEST"

# Replace placeholder with actual path
# Point to the binary INSIDE the App Bundle
USER_HOME=$HOME
sed -i '' "s|/Users/pulkit/.local/bin/screenshot|$USER_HOME/.local/bin/Screenshot.app/Contents/MacOS/screenshot|g" "$PLIST_DEST"

# Unload if already running (ignore errors)
launchctl unload "$PLIST_DEST" 2>/dev/null || true

# Load and start the service
launchctl load "$PLIST_DEST"

echo "✅ Screenshot Tool installed successfully!"
echo "📁 Screenshots will be saved to: $SCREENSHOT_DIR"
echo "⏱️  Taking a screenshot every 5 seconds (AVIF format)"
echo ""
echo "⚠️  IMPORTANT: Grant Screen Recording permission to 'screenshot' in:"
echo "   System Settings → Privacy & Security → Screen Recording"
echo "   Then restart the service with: launchctl kickstart -k gui/\$(id -u)/com.pulkit.screenshot"
echo ""
echo "To uninstall, run: ./uninstall.sh"
