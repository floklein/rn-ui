#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

mark=$(date +%s)
lap() {
  echo "$1=$(($(date +%s) - mark))" >> "$TIMINGS"
  mark=$(date +%s)
}

npx expo prebuild --platform android --no-install
lap build_prebuild

(cd android && ./gradlew :app:assembleRelease -PreactNativeArchitectures=x86_64 --console=plain)
lap build_gradle

rm -rf .native-build/android
mkdir -p .native-build/android
cp android/app/build/outputs/apk/release/app-release.apk android/app/debug.keystore .native-build/android/
unzip -l .native-build/android/app-release.apk | grep -v 'res/'
