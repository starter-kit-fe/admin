# Makefile for the Go Admin Server

# ====================================================================================
# VARIABLES
# ====================================================================================

# --- Application setup ---
# The final binary name
BINARY_NAME=admin
# The Go package path to build
PKG_PATH=./cmd

# --- Build directories ---
# Directory for temporary development builds
TMP_DIR=./tmp
# Directory for final production builds
BUILD_DIR=./build

# --- Deployment ---
DEPLOY_HOST ?= oci-fr
REMOTE_DIR ?= /opt/admin
REMOTE_TMP ?= /tmp/admin-deploy
SERVICE_NAME ?= admin.service

# --- Versioning ---
# Get version from the root package.json. Use shell to execute the command and assign the result.
# The `:=` operator evaluates the right-hand side immediately.
VERSION := $(shell node -p "require('../../package.json').version")
# Get the short git commit hash
COMMIT := $(shell git rev-parse --short HEAD)

# --- Go build flags (ldflags) ---
# This is the core of version injection. We build a string of linker flags.
# Note: We use single quotes for values in ldflags to handle potential special characters.
LDFLAGS_BASE = -X 'github.com/starter-kit-fe/admin/constant.VERSION=$(VERSION)' \
               -X 'github.com/starter-kit-fe/admin/constant.COMMIT=$(COMMIT)'

# Ldflags for development (debug mode)
LDFLAGS_DEV = $(LDFLAGS_BASE) -X 'github.com/starter-kit-fe/admin/constant.MODE=debug'

# Ldflags for production (release mode)
# -s: Omit the symbol table and debug information.
# -w: Omit the DWARF symbol table.
# These two flags significantly reduce the binary size.
LDFLAGS_PROD = $(LDFLAGS_BASE) -X 'github.com/starter-kit-fe/admin/constant.MODE=release' -s -w -buildid=

# ====================================================================================
# TARGETS
# ====================================================================================

# Phony targets are ones that don't represent actual files.
# 'all' is a common default target.
.PHONY: all dev deploy docs clean

# The default command, executed when you just run `make`.
all: deploy

# Target: dev
# Runs the application in development mode with live reloading using 'air'.
dev:
	@echo "🚀 Starting development server with live reload..."
	# Pass the ldflags directly to go build so air does not need custom flags.
	air --build.cmd "go build -v -ldflags=\"$(LDFLAGS_DEV)\" -o $(TMP_DIR)/$(BINARY_NAME) $(PKG_PATH)"

# Target: deploy
# Builds the application for production (Linux AMD64) and places it in the ./build directory.
deploy:
	@echo "📦 Building for production (linux/arm64)..."
	# CGO_ENABLED=0 creates a static binary without C dependencies.
	# GOOS and GOARCH specify the target Operating System and Architecture.
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -v -trimpath -ldflags="$(LDFLAGS_PROD)" -o $(BUILD_DIR)/$(BINARY_NAME) $(PKG_PATH)
	@echo "⚙️  Copying systemd service file..."
	# Copy the service file from the deployments directory
	cp deployments/admin.service $(BUILD_DIR)/admin.service
	cp ./.env $(BUILD_DIR)/.env
	@echo "📡 Preparing remote host $(DEPLOY_HOST)..."
	ssh $(DEPLOY_HOST) "rm -rf $(REMOTE_TMP) && mkdir -p $(REMOTE_TMP)"
	scp -r $(BUILD_DIR)/. $(DEPLOY_HOST):$(REMOTE_TMP)/
	@echo "🚚 Installing artifacts on $(DEPLOY_HOST)..."
	ssh $(DEPLOY_HOST) "\
		set -e; \
		sudo mkdir -p $(REMOTE_DIR); \
		sudo install -m 755 $(REMOTE_TMP)/$(BINARY_NAME) $(REMOTE_DIR)/$(BINARY_NAME); \
		sudo install -m 600 $(REMOTE_TMP)/.env $(REMOTE_DIR)/.env; \
		sudo install -m 644 $(REMOTE_TMP)/admin.service /etc/systemd/system/$(SERVICE_NAME); \
		sudo systemctl daemon-reload; \
		sudo systemctl restart $(SERVICE_NAME); \
		rm -rf $(REMOTE_TMP)"
	@echo "✅ Build complete! Binary is at $(BUILD_DIR)/$(BINARY_NAME)"

# Target: docs
# Generates API documentation using 'go generate'.
docs:
	@echo "📝 Generating API documentation..."
	go generate ./internal/docs

# Target: clean
# Removes build artifacts and temporary files.
clean:
	@echo "🧹 Cleaning up..."
	@rm -rf $(BUILD_DIR) $(TMP_DIR)
