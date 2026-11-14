#!/usr/bin/env bash
# Puts this checkout's JavaScript into the cached app, whose native code is
# keyed on the native dependencies only.
set -euo pipefail
cd "$(dirname "$0")/.."

embed() {
  npx expo export:embed --platform "$1" --entry-file index.ts --dev false \
    --minify false --bytecode --bundle-output "$2" --assets-dest "$3"
}

if [ "$1" = ios ]; then
  app=.native-build/ios/NativePlayground.app
  embed ios "$app/main.jsbundle" "$app"
  codesign --force --sign - "$app"
else
  stage=$(mktemp -d)
  mkdir -p "$stage/assets"
  embed android "$stage/assets/index.android.bundle" "$stage/res"
  cp .native-build/android/app-release.apk "$stage/app.apk"
  (cd "$stage" && zip -0 app.apk assets/index.android.bundle)
  tools=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
  "$tools/zipalign" -f -P 16 4 "$stage/app.apk" "$APP_PATH"
  "$tools/apksigner" sign --ks .native-build/android/debug.keystore \
    --ks-pass pass:android --key-pass pass:android "$APP_PATH"
fi
