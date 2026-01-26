#!/bin/bash


INSTALL_DIR="$HOME/.local/bin"
LAUNCHAGENT_DIR="$HOME/Library/LaunchAgents"

echo "🗑️  Uninstalling Screenshot Tool..."


launchctl unload "$LAUNCHAGENT_DIR/com.pulkit.screenshot.plist" 2>/dev/null || true


rm -rf "$INSTALL_DIR/Screenshot.app"
rm -f "$LAUNCHAGENT_DIR/com.pulkit.screenshot.plist"

echo "✅ Screenshot Tool uninstalled!"
echo "📁 Your screenshots have been preserved."
