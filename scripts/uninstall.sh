#!/bin/bash
# Uninstall Screenshot Tool

INSTALL_DIR="$HOME/.local/bin"
LAUNCHAGENT_DIR="$HOME/Library/LaunchAgents"

echo "🗑️  Uninstalling Screenshot Tool..."

# Stop and unload the service
launchctl unload "$LAUNCHAGENT_DIR/com.pulkit.screenshot.plist" 2>/dev/null || true

# Remove files
rm -rf "$INSTALL_DIR/Screenshot.app"
rm -f "$LAUNCHAGENT_DIR/com.pulkit.screenshot.plist"

echo "✅ Screenshot Tool uninstalled!"
echo "📁 Your screenshots have been preserved."
