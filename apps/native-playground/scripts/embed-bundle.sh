#!/usr/bin/env bash
# Puts this checkout's JavaScript into an app build-app.sh made, so a cached
# build serves any change that leaves the native dependencies alone.
set -euo pipefail
cd "$(dirname "$0")/.."
platform=$1

embed() {
  npx expo export:embed --platform "$platform" --entry-file index.ts \
    --dev false --minify false --bytecode --bundle-output "$1" --assets-dest "$2"
}

if [ "$platform" = ios ]; then
  app=.native-build/ios/NativePlayground.app
  embed "$app/main.jsbundle" "$app"
  codesign --force --sign - "$app"
else
  stage=$(mktemp -d)
  mkdir -p "$stage/assets"
  embed "$stage/assets/index.android.bundle" "$stage/res"
  cp .native-build/android/app-release.apk "$stage/app.apk"
  (cd "$stage" && zip -0 app.apk assets/index.android.bundle)
  sdk=${ANDROID_HOME:-$HOME/Library/Android/sdk}
  tools=$(ls -d "$sdk"/build-tools/* | sort -V | tail -1)
  "$tools/zipalign" -f -P 16 4 "$stage/app.apk" .native-build/android/app.apk
  "$tools/apksigner" sign --ks .native-build/android/debug.keystore \
    --ks-pass pass:android --key-pass pass:android .native-build/android/app.apk
  rm -rf "$stage"
fi
