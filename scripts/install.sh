#!/bin/bash


set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_DIR="$HOME/.local/bin"
LAUNCHAGENT_DIR="$HOME/Library/LaunchAgents"
SCREENSHOT_DIR="$HOME/screenshots/ss-tool"

echo "📸 Installing Screenshot Tool..."


if ! command -v swiftc &> /dev/null; then
    echo "❌ Error: swiftc is required but not installed."
    echo "   Install Xcode Command Line Tools to proceed."
    exit 1
fi


if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: ffmpeg is required but not installed."
    echo "   Install with: brew install ffmpeg"
    exit 1
fi


APP_DIR="$INSTALL_DIR/Screenshot.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"


mkdir -p "$MACOS_DIR"


cp "$SCRIPT_DIR/../config/Info.plist" "$CONTENTS_DIR/Info.plist"


echo "🔨 Compiling screenshot tool..."
swiftc "$SCRIPT_DIR/../src/main.swift" "$SCRIPT_DIR/../src/Analyzer.swift" "$SCRIPT_DIR/../src/Logger.swift" "$SCRIPT_DIR/../src/ScreenshotManager.swift" "$SCRIPT_DIR/../src/Utils.swift" -o "$MACOS_DIR/screenshot"


# ---------------------------------------------------------
# Fix: Capture Node Path & Copy vision.js
# ---------------------------------------------------------
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo "⚠️  Warning: Node.js not found in PATH. Please ensure it is installed."
else
    echo "✅ Found Node.js at: $NODE_PATH"
fi

# Create config.json with the node path
CONFIG_FILE="$MACOS_DIR/config.json"
echo "{\"nodePath\": \"$NODE_PATH\"}" > "$CONFIG_FILE"
echo "📄 Created config.json with Node path."

# Copy vision.js to the MacOS directory
cp "$SCRIPT_DIR/../vision.js" "$MACOS_DIR/vision.js"
echo "📜 Copied vision.js to app bundle."
# ---------------------------------------------------------


echo "🔏 Signing App Bundle..."
codesign -f -s - --deep --identifier "com.pulkit.screenshot" "$APP_DIR"


PLIST_SOURCE="$SCRIPT_DIR/../config/com.pulkit.screenshot.plist"
PLIST_DEST="$LAUNCHAGENT_DIR/com.pulkit.screenshot.plist"


cp "$PLIST_SOURCE" "$PLIST_DEST"


USER_HOME=$HOME
sed -i '' "s|/Users/pulkit/.local/bin/screenshot|$USER_HOME/.local/bin/Screenshot.app/Contents/MacOS/screenshot|g" "$PLIST_DEST"



# Create Log Directory
LOG_DIR="$HOME/Library/Logs/com.pulkit.screenshot"
mkdir -p "$LOG_DIR"
touch "$LOG_DIR/app.log"

# Link logs to project directory for convenience
PROJECT_LOGS="$SCRIPT_DIR/../logs"
mkdir -p "$PROJECT_LOGS"
ln -sf "$LOG_DIR/app.log" "$PROJECT_LOGS/app.log"


launchctl unload "$PLIST_DEST" 2>/dev/null || true


# Configure logging in plist
sed -i '' "s|/dev/null|$LOG_DIR/app.log|g" "$PLIST_DEST"



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
