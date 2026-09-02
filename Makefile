.DEFAULT_GOAL := help

PM ?= npm
EXEC ?= npx
RUN := $(PM) run
MAKE_NO_PRINT := $(MAKE) --no-print-directory
BUNDLE ?= bundle
FASTLANE := $(BUNDLE) exec fastlane

CORE_DIR ?= ../core
DESIGN_TOKENS_DIR ?= ../design-tokens
ANDROID_DIR ?= android
ANDROID_SDK ?= $(if $(ANDROID_HOME),$(ANDROID_HOME),$(if $(ANDROID_SDK_ROOT),$(ANDROID_SDK_ROOT),$(if $(filter Darwin,$(shell uname -s)),$(HOME)/Library/Android/sdk,$(HOME)/Android/Sdk)))
IOS_DIR ?= ios
IOS_WORKSPACE ?= ios/Openings.xcworkspace
IOS_SCHEME ?= Openings
IOS_DERIVED_DATA ?= build/ios
EXPORT_DIR ?= dist

UNAME ?= uname
NODE_BINARY ?= node
POD ?= pod
XCODEBUILD ?= xcodebuild
ANDROID_KEYSTORE_PROPERTIES ?= android/keystore.properties
ANDROID_KEYSTORE ?= android/app/keystore.jks

.PHONY: help setup packages-install packages-build packages-check install
.PHONY: start start-localhost start-lan start-tunnel
.PHONY: lint typecheck test test-watch doctor check check-all config export
.PHONY: prebuild ios-pods ios-run ios-debug ios-build
.PHONY: android-run android-debug android-build
.PHONY: fastlane-install android-release-lanes android-release-check
.PHONY: android-release-bundle android-release-internal android-release-production

help: ## Show the available Openings Mobile commands
	@awk 'BEGIN {FS = ":.*## "; printf "Openings Mobile commands:\n\n"} /^[a-zA-Z0-9_-]+:.*## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Install and build sibling packages, then install the mobile app
	$(MAKE_NO_PRINT) packages-install
	$(MAKE_NO_PRINT) packages-build
	$(MAKE_NO_PRINT) install

packages-install: ## Install dependencies for both public sibling packages
	$(PM) --prefix "$(CORE_DIR)" install
	$(PM) --prefix "$(DESIGN_TOKENS_DIR)" install

packages-build: ## Build both public sibling packages consumed by Metro
	$(PM) --prefix "$(CORE_DIR)" run build
	$(PM) --prefix "$(DESIGN_TOKENS_DIR)" run build

packages-check: ## Run the complete quality gate for both public packages
	$(PM) --prefix "$(CORE_DIR)" run check
	$(PM) --prefix "$(DESIGN_TOKENS_DIR)" run check

install: ## Install mobile JavaScript dependencies with the selected package manager
	$(PM) install

start: ## Start Metro for the Expo development client
	$(RUN) start

start-localhost: ## Start Metro on localhost for simulators and emulators
	$(EXEC) expo start --dev-client --localhost

start-lan: ## Start Metro on the local network for physical devices
	$(EXEC) expo start --dev-client --lan

start-tunnel: ## Start Metro through an Expo tunnel
	$(EXEC) expo start --dev-client --tunnel

lint: ## Run ESLint with zero warnings
	$(RUN) lint

typecheck: ## Run strict TypeScript checking
	$(RUN) typecheck

test: ## Run the Jest suite serially
	$(RUN) test -- --runInBand

test-watch: ## Run Jest in watch mode
	$(RUN) test -- --watch

doctor: ## Validate Expo and React Native dependencies
	$(RUN) doctor

check: ## Run the complete mobile quality gate
	$(RUN) check

check-all: ## Validate both public packages and the mobile app
	$(MAKE_NO_PRINT) packages-check
	$(MAKE_NO_PRINT) check

config: ## Print the resolved public Expo configuration
	$(EXEC) expo config --type public

export: ## Create production JavaScript bundles for iOS and Android
	$(EXEC) expo export --platform all --output-dir "$(EXPORT_DIR)"

prebuild: ## Synchronize checked-in native projects without installing dependencies
	$(RUN) prebuild -- --no-install

ios-pods: ## Install CocoaPods dependencies for the iOS project
	@set -eu; \
		[ "$$($(UNAME) -s)" = "Darwin" ] || { printf '%s\n' "iOS commands require macOS." >&2; exit 1; }; \
		command -v "$(POD)" >/dev/null 2>&1 || { printf '%s\n' "CocoaPods is required. Install it before running ios-pods." >&2; exit 1; }
	cd "$(IOS_DIR)" && $(POD) install

ios-run: ## Build, install, and run the iOS app through Expo
	$(RUN) ios

ios-debug: ## Build and run the Debug iOS app through Expo
	$(RUN) ios:debug

ios-build: ## Compile the Debug app for a generic iOS Simulator
	@set -eu; \
		[ "$$($(UNAME) -s)" = "Darwin" ] || { printf '%s\n' "iOS commands require macOS." >&2; exit 1; }; \
		command -v "$(XCODEBUILD)" >/dev/null 2>&1 || { printf '%s\n' "xcodebuild is required. Install Xcode and its command-line tools." >&2; exit 1; }; \
		command -v "$(NODE_BINARY)" >/dev/null 2>&1 || { printf '%s\n' "Node.js is required by the React Native build scripts." >&2; exit 1; }; \
		[ -d "$(IOS_WORKSPACE)" ] || { printf '%s\n' "iOS workspace not found at $(IOS_WORKSPACE)." >&2; exit 1; }; \
		NODE_BINARY="$(NODE_BINARY)" $(XCODEBUILD) \
			-workspace "$(IOS_WORKSPACE)" \
			-scheme "$(IOS_SCHEME)" \
			-configuration Debug \
			-sdk iphonesimulator \
			-destination "generic/platform=iOS Simulator" \
			-derivedDataPath "$(IOS_DERIVED_DATA)" \
			CODE_SIGNING_ALLOWED=NO build

android-run: ## Build, install, and run the Android app through Expo
	$(RUN) android

android-debug: ## Build and run the Debug Android app through Expo
	$(RUN) android:debug

android-build: ## Compile the Android Debug APK with Gradle
	@set -eu; \
		[ -x "$(ANDROID_DIR)/gradlew" ] || { printf '%s\n' "Android Gradle wrapper not found at $(ANDROID_DIR)/gradlew." >&2; exit 1; }; \
		[ -d "$(ANDROID_SDK)" ] || { printf '%s\n' "Android SDK not found. Set ANDROID_HOME, ANDROID_SDK_ROOT, or ANDROID_SDK." >&2; exit 1; }
	cd "$(ANDROID_DIR)" && ANDROID_HOME="$(ANDROID_SDK)" ANDROID_SDK_ROOT="$(ANDROID_SDK)" ./gradlew :app:assembleDebug

fastlane-install: ## Install the pinned Ruby release dependencies
	$(BUNDLE) install

android-release-lanes: ## List the available Android Fastlane lanes
	$(FASTLANE) lanes

android-release-check: ## Run the mobile quality gate through Fastlane
	$(FASTLANE) android check

android-release-bundle: ## Build a signed Android App Bundle without uploading it
	@set -eu; \
		[ -f "$(ANDROID_KEYSTORE_PROPERTIES)" ] || { printf '%s\n' "Missing $(ANDROID_KEYSTORE_PROPERTIES)." >&2; exit 2; }; \
		[ -f "$(ANDROID_KEYSTORE)" ] || { printf '%s\n' "Missing $(ANDROID_KEYSTORE)." >&2; exit 2; }
	$(FASTLANE) android bundle_release

android-release-internal: ## Build and upload an explicit version to Google Play internal testing
	@set -eu; \
		[ -n "$(ANDROID_VERSION_CODE)" ] || { printf '%s\n' "ANDROID_VERSION_CODE is required." >&2; exit 2; }; \
		[ -n "$(ANDROID_VERSION_NAME)" ] || { printf '%s\n' "ANDROID_VERSION_NAME is required." >&2; exit 2; }; \
		[ -f "$(ANDROID_KEYSTORE_PROPERTIES)" ] || { printf '%s\n' "Missing $(ANDROID_KEYSTORE_PROPERTIES)." >&2; exit 2; }; \
		[ -f "$(ANDROID_KEYSTORE)" ] || { printf '%s\n' "Missing $(ANDROID_KEYSTORE)." >&2; exit 2; }
	$(FASTLANE) android internal version_code:"$(ANDROID_VERSION_CODE)" version_name:"$(ANDROID_VERSION_NAME)"

android-release-production: ## Promote an explicit internal version to Google Play production
	@set -eu; \
		[ -n "$(ANDROID_VERSION_CODE)" ] || { printf '%s\n' "ANDROID_VERSION_CODE is required." >&2; exit 2; }
	$(FASTLANE) android production version_code:"$(ANDROID_VERSION_CODE)"
