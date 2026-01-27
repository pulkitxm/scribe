PLIST_NAME := com.scribe.service
PLIST_PATH := $(HOME)/Library/LaunchAgents/$(PLIST_NAME).plist
USER_ID := $(shell id -u)

.PHONY: all install uninstall start stop restart status check-running help viz-start viz-stop viz-restart viz-status

all: help

help:
	@echo "Scribe - Automated Screenshot Tracker"
	@echo ""
	@echo "Usage:"
	@echo "  make install       - Compile and install the tool"
	@echo "  make uninstall     - Remove the tool and service"
	@echo "  make start         - Start the background service"
	@echo "  make stop          - Stop the background service"
	@echo "  make restart       - Restart the background service"
	@echo "  make status        - Check if the service is running"
	@echo "  make check-running - Alias for status"
	@echo "  make dev           - Run the script directly for testing"
	@echo "  make viz-start     - Start the visualizer (pnpm serve via pm2)"
	@echo "  make viz-stop      - Stop the visualizer"
	@echo "  make viz-restart   - Restart the visualizer"
	@echo "  make viz-status    - Check visualizer status"
	@echo ""

dev:
	@swiftc -framework CoreWLAN -framework CoreAudio -framework AVFoundation -framework CoreMedia src/*.swift src/utils/*.swift -o scribe
	@./scribe

run-once:
	@swiftc -framework CoreWLAN -framework CoreAudio -framework AVFoundation -framework CoreMedia src/*.swift src/utils/*.swift -o scribe
	@./scribe --run-once

install:
	@./scripts/install.sh

uninstall:
	@./scripts/uninstall.sh

start:
	@echo "Starting service..."
	@launchctl unload "$(PLIST_PATH)" 2>/dev/null || true
	@launchctl load "$(PLIST_PATH)"
	@echo "Service started."

stop:
	@echo "Stopping service..."
	@launchctl unload "$(PLIST_PATH)"
	@echo "Service stopped."

restart:
	@echo "Restarting service..."
	@launchctl kickstart -k gui/$(USER_ID)/$(PLIST_NAME)
	@echo "Service restarted."

status:
	@echo "Checking status..."
	@launchctl list | grep $(PLIST_NAME) || echo "Service is NOT running"

check-running: status

clean:
	@rm -f scribe

viz-start:
	@echo "Starting Visualizer (pm2)..."
	@pm2 start pnpm --name visualizer --cwd visualizer -- serve

viz-stop:
	@echo "Stopping Visualizer..."
	@pm2 stop visualizere

viz-restart:
	@echo "Restarting Visualizer..."
	@pm2 restart visualizer

viz-status:
	@echo "Checking Visualizer status..."
	@pm2 show visualizer > /dev/null 2>&1 && pm2 status visualizer || echo "Visualizer is NOT running in pm2"

viz-delete:
	@echo "Deleting Visualizer..."
	@pm2 delete visualizer
	@echo "Visualizer deleted."