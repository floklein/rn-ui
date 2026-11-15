#!/usr/bin/env bash
# Builds the standalone release app the device specs run against, with its
# JavaScript bundle inside: .native-build/ios/NativePlayground.app or
# .native-build/android/app.apk. The native folders are generated, never kept.
set -euo pipefail
cd "$(dirname "$0")/.."
platform=$1

npx expo prebuild --platform "$platform" --no-install --clean

if [ "$platform" = ios ]; then
  (cd ios && pod install)
  xcodebuild \
    -workspace ios/NativePlayground.xcworkspace \
    -scheme NativePlayground \
    -configuration Release \
    -sdk iphonesimulator \
    -destination "generic/platform=iOS Simulator" \
    -derivedDataPath ios/build \
    -quiet \
    ARCHS=arm64
  rm -rf .native-build/ios
  mkdir -p .native-build/ios
  cp -R ios/build/Build/Products/Release-iphonesimulator/NativePlayground.app .native-build/ios/
else
  arch=${ANDROID_ARCH:-$([ "$(uname -m)" = arm64 ] && echo arm64-v8a || echo x86_64)}
  (cd android && ./gradlew :app:assembleRelease -PreactNativeArchitectures="$arch" --console=plain)
  rm -rf .native-build/android
  mkdir -p .native-build/android
  cp android/app/build/outputs/apk/release/app-release.apk android/app/debug.keystore .native-build/android/
  cp .native-build/android/app-release.apk .native-build/android/app.apk
fi
