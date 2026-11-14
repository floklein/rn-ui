#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

mark=$(date +%s)
lap() {
  echo "$1=$(($(date +%s) - mark))" >> "$TIMINGS"
  mark=$(date +%s)
}

npx expo prebuild --platform ios --no-install
lap build_prebuild

(cd ios && pod install)
lap build_pods

xcodebuild \
  -workspace ios/NativePlayground.xcworkspace \
  -scheme NativePlayground \
  -configuration Release \
  -sdk iphonesimulator \
  -destination "generic/platform=iOS Simulator" \
  -derivedDataPath ios/build \
  -quiet \
  ARCHS=arm64
lap build_xcodebuild

rm -rf .native-build/ios
mkdir -p .native-build/ios
cp -R ios/build/Build/Products/Release-iphonesimulator/NativePlayground.app .native-build/ios/
ls -la .native-build/ios/NativePlayground.app
