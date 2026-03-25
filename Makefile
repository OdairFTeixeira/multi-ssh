.PHONY: build run dev clean install

BINARY_NAME=multi-ssh
BUILD_DIR=./build

# Development mode (hot reload)
dev:
	@echo "🚀 Starting in development mode..."
	@wails dev -tags webkit2_41

# Build production binary
build:
	@echo "🔨 Building $(BINARY_NAME)..."
	@wails build -tags webkit2_41
	@echo "✅ Build complete: $(BUILD_DIR)/bin/$(BINARY_NAME)"

# Run production build
run: build
	@$(BUILD_DIR)/bin/$(BINARY_NAME)

# Install to system (binary + icon + desktop entry)
install: build
	@echo "📦 Installing $(BINARY_NAME)..."
	@sudo cp $(BUILD_DIR)/bin/$(BINARY_NAME) /usr/local/bin/$(BINARY_NAME)
	@sudo cp $(BUILD_DIR)/icons/multi-ssh.svg /usr/share/pixmaps/multi-ssh.svg
	@cp $(BUILD_DIR)/multi-ssh.desktop ~/.local/share/applications/multi-ssh.desktop
	@update-desktop-database ~/.local/share/applications/ 2>/dev/null || true
	@echo "✅ Installed! Search 'Multi SSH' in your apps."

# Uninstall from system
uninstall:
	@echo "🗑️  Uninstalling $(BINARY_NAME)..."
	@sudo rm -f /usr/local/bin/$(BINARY_NAME)
	@sudo rm -f /usr/share/pixmaps/multi-ssh.svg
	@rm -f ~/.local/share/applications/multi-ssh.desktop
	@update-desktop-database ~/.local/share/applications/ 2>/dev/null || true
	@echo "✅ Uninstalled."

# Clean build artifacts
clean:
	@echo "🧹 Cleaning..."
	@rm -rf $(BUILD_DIR)
	@echo "✅ Clean complete"

# Tidy dependencies
deps:
	@echo "📦 Installing dependencies..."
	@go mod tidy
	@cd frontend && npm install
	@echo "✅ Dependencies installed"

# Format code
fmt:
	@go fmt ./...

vet:
	@go vet ./...
