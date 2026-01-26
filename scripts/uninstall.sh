#!/bin/bash

INSTALL_DIR="$HOME/.local/bin"
LAUNCHAGENT_DIR="$HOME/Library/LaunchAgents"

echo "Uninstalling Scribe..."

launchctl unload "$LAUNCHAGENT_DIR/com.scribe.service.plist" 2>/dev/null || true

rm -rf "$INSTALL_DIR/Scribe.app"
rm -f "$LAUNCHAGENT_DIR/com.scribe.service.plist"

echo "Scribe uninstalled!"
echo "Screenshots preserved."
