

PLIST_NAME := com.pulkit.screenshot
PLIST_PATH := $(HOME)/Library/LaunchAgents/$(PLIST_NAME).plist
USER_ID := $(shell id -u)

.PHONY: all install uninstall start stop restart status check-running help

all: help

help:
	@echo "📸 Screenshot Tool Manager"
	@echo ""
	@echo "Usage:"
	@echo "  make install       - Compile and install the tool"
	@echo "  make uninstall     - Remove the tool and service"
	@echo "  make start         - Start the background service"
	@echo "  make stop          - Stop the background service"
	@echo "  make restart       - Restart the background service"
	@echo "  make status        - Check if the service is running"
	@echo "  make check-running - Alias for status"
	@echo ""

install:
	@./scripts/install.sh

uninstall:
	@./scripts/uninstall.sh

start:
	@echo "🚀 Starting service..."
	@launchctl unload "$(PLIST_PATH)" 2>/dev/null || true
	@launchctl load "$(PLIST_PATH)"
	@echo "Service started."

stop:
	@echo "🛑 Stopping service..."
	@launchctl unload "$(PLIST_PATH)"
	@echo "Service stopped."

restart:
	@echo "🔄 Restarting service..."
	@launchctl kickstart -k gui/$(USER_ID)/$(PLIST_NAME)
	@echo "Service restarted."

status:
	@echo "🔍 Checking status..."
	@launchctl list | grep $(PLIST_NAME) || echo "❌ Service is NOT running"

check-running: status

clean:
	@rm -f screenshot
