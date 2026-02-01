#!/bin/bash

try() {
    "$@" || {
        echo "Error executing: $*"
        exit 1
    }
}

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_DIR="$HOME/.local/bin"
LAUNCHAGENT_DIR="$HOME/Library/LaunchAgents"
SCREENSHOT_DIR="$HOME/screenshots/scribe"

echo "Installing Scribe..."

if ! command -v swiftc &> /dev/null; then
    echo "Error: swiftc is required but not installed."
    echo "   Install Xcode Command Line Tools to proceed."
    exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is required but not installed."
    echo "   Install with: brew install ffmpeg"
    exit 1
fi

APP_DIR="$INSTALL_DIR/Scribe.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"

mkdir -p "$MACOS_DIR"

try cp "$SCRIPT_DIR/../config/Info.plist" "$CONTENTS_DIR/Info.plist"

echo "Compiling Scribe..."
try swiftc -framework CoreWLAN -framework CoreAudio -framework AVFoundation -framework CoreMedia "$SCRIPT_DIR/../src/"*.swift "$SCRIPT_DIR/../src/utils/"*.swift -o "$MACOS_DIR/scribe"

NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo "Warning: Node.js not found in PATH."
else
    echo "Found Node.js at: $NODE_PATH"
fi

CONFIG_FILE="$MACOS_DIR/config.json"
echo "{\"nodePath\": \"$NODE_PATH\"}" > "$CONFIG_FILE"
echo "Created config.json"

try cp "$SCRIPT_DIR/../vision.js" "$MACOS_DIR/vision.js"
echo "Copied vision.js"

try cp -r "$SCRIPT_DIR/../js-scripts" "$MACOS_DIR/js-scripts"
echo "Copied js-scripts/"

if [ -f "$SCRIPT_DIR/../.env" ]; then
    try cp "$SCRIPT_DIR/../.env" "$MACOS_DIR/.env"
    echo "Copied .env"
fi

echo "Signing App Bundle..."
try codesign -f -s - --deep --identifier "com.scribe.service" "$APP_DIR"

PLIST_SOURCE="$SCRIPT_DIR/../config/com.scribe.service.plist"
PLIST_DEST="$LAUNCHAGENT_DIR/com.scribe.service.plist"

try cp "$PLIST_SOURCE" "$PLIST_DEST"

sed -i '' "s|/usr/local/bin/Scribe.app/Contents/MacOS/scribe|$INSTALL_DIR/Scribe.app/Contents/MacOS/scribe|g" "$PLIST_DEST"

LOG_DIR="$HOME/Library/Logs/com.scribe.service"
mkdir -p "$LOG_DIR"
touch "$LOG_DIR/app.log"

PROJECT_LOGS="$SCRIPT_DIR/../logs"
mkdir -p "$PROJECT_LOGS"
ln -sf "$LOG_DIR/app.log" "$PROJECT_LOGS/app.log"

launchctl unload "$PLIST_DEST" 2>/dev/null || true

sed -i '' "s|/dev/null|$LOG_DIR/app.log|g" "$PLIST_DEST"

launchctl load "$PLIST_DEST"

echo "Scribe installed successfully!"
echo "Screenshots saved to: $SCREENSHOT_DIR"
echo ""
echo "IMPORTANT: Grant Screen Recording permission to 'scribe' in System Settings."
echo "Then restart: launchctl kickstart -k gui/$(id -u)/com.scribe.service"
echo ""
echo "Uninstall: ./uninstall.sh"
