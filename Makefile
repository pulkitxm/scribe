PLIST_NAME := com.scribe.service
PLIST_PATH := $(HOME)/Library/LaunchAgents/$(PLIST_NAME).plist
USER_ID := $(shell id -u)

.PHONY: all install uninstall start stop restart status check-running help analyze viz-start viz-stop viz-restart viz-status

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
	@echo "  make run-once      - Run once and exit"
	@echo "  make analyze       - Batch analyze incomplete screenshots"
	@echo "  make viz-start     - Start the visualizer (pnpm serve via pm2)"
	@echo "  make viz-stop      - Stop the visualizer"
	@echo "  make viz-restart   - Restart the visualizer"
	@echo "  make viz-status    - Check visualizer status"
	@echo "  make viz-logs      - Show visualizer logs"
	@echo "  make viz-delete    - Delete visualizer"
	@echo ""

dev:
	@swiftc -framework CoreWLAN -framework CoreAudio -framework AVFoundation -framework CoreMedia src/*.swift src/utils/*.swift -o scribe_cli
	@./scribe_cli

run-once:
	@swiftc -framework CoreWLAN -framework CoreAudio -framework AVFoundation -framework CoreMedia src/*.swift src/utils/*.swift -o scribe_cli
	@./scribe_cli --run-once

analyze:
	@echo "Analyzing incomplete screenshots with GPU acceleration..."
	@echo "GPU Status:"
	@ollama ps 2>/dev/null || echo "  Ollama not running - GPU acceleration unavailable"
	@echo ""
	@pm2 start analyze.js --name scribe-analyzer --output logs/analyse.log --error logs/analyse.log -- --concurrency $(or $(THREADS),$(CONCURRENCY),4) $(if $(FOLDER),--folder "$(FOLDER)",) $(if $(YES),--yes,)

analyze-stop:
	@echo "Stopping analysis..."
	@pm2 stop scribe-analyzer

analyze-restart:
	@echo "Restarting analysis..."
	@pm2 restart scribe-analyzer

analyze-status:
	@echo "Checking analysis status..."
	@pm2 status scribe-analyzer

analyze-gpu-status:
	@echo "=== GPU Acceleration Status ==="
	@echo ""
	@echo "Ollama Models:"
	@ollama ps 2>/dev/null || echo "  ❌ Ollama not running"
	@echo ""
	@echo "GPU Hardware:"
	@system_profiler SPDisplaysDataType 2>/dev/null | grep -A 3 "Chipset Model" | head -4 || echo "  Unable to detect GPU"
	@echo ""
	@echo "Note: Analysis uses Ollama with vision models for GPU-accelerated inference."
	@echo "      Default concurrency: 4 (adjust with THREADS=N or CONCURRENCY=N)"

analyze-logs:
	@echo "Showing analysis logs..."
	@pm2 logs scribe-analyzer

analyze-delete:
	@echo "Deleting analysis..."
	@pm2 delete scribe-analyzer
	@echo "Analysis deleted."

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
	@rm -f scribe_cli

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

viz-logs:
	@echo "Showing Visualizer logs..."
	@pm2 logs visualizer

make viz-dev:
	@echo "Starting Visualizer in development mode..."
	cd visualizer && pnpm dev

get-daily-sizes:
	@echo "Getting daily sizes..."
	@du -d 1 -k "$(FOLDER)"

videos:
	@echo "Creating daily video..."
	python3 scripts/images_to_video.py --input './outputs' --output './output_video.mp4' --fps 15