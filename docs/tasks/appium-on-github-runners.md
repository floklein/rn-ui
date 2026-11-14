# Appium on GitHub runners

Resolves [Measure Appium on GitHub runners](https://github.com/floklein/rn-ui/issues/29), for [How native correctness is checked](https://github.com/floklein/rn-ui/issues/19). Measured on 2026-11-14 on the branch `task/appium-ci`, which is never merged.

## In short

20 runs per platform on unchanged code (`d70423bd`), 15 with the build cache warm and 5 with it cold.

|                                  | iOS, `macos-26` | Android, `ubuntu-24.04` |
| -------------------------------- | --------------- | ----------------------- |
| Job, warm cache: median, worst   | 9m06s, 11m23s   | 2m53s, 3m32s            |
| Job, cold cache: median, worst   | 12m58s, 15m21s  | 10m03s, 10m38s          |
| Switch spec: median, worst       | 2m02s, 3m44s    | 22s, 32s                |
| Dialog spec: median, worst       | 47s, 3m13s      | 12s, 15s                |
| Of which the test itself, median | 4s and 9s       | 3s and 5s               |
| Failed runs                      | 3 of 20 (15%)   | 0 of 20                 |
| Failed without a real fault      | 3 of 20 (15%)   | 0 of 20                 |

- **Android is fast and was stable.** Three minutes with a warm cache, ten with a cold one, no failure in 20 runs.
- **iOS is slow and failed without a fault in 3 runs of 20.** Nine minutes with a warm cache, of which 13 seconds are the two tests. The rest is the simulator's boot and the first Appium session, on a 3-core runner that is busy for minutes after the simulator boots.
- **A pull request waits for the iOS job:** about 9 minutes with a warm cache, 11 and a half at worst, and about 13 minutes with a cold one, 15 and a half at worst.
- 20 runs bound the rates loosely: 3 of 20 is between 5% and 36% at 95% confidence, and 0 of 20 is anything up to 16%.

## Setup

- **App.** `apps/native-playground` from `prototype/host-seam`, built as a standalone release app that carries its Hermes bundle, so no Metro server runs. The native folders are **generated in CI** by `expo prebuild`, not committed: that is what a real setup with Expo would do, and it costs one second. iOS: `pod install`, then `xcodebuild` for the simulator, Release, arm64. Android: `gradlew :app:assembleRelease` for x86_64. Scripts in `apps/native-playground/ci`.
- **Build cache.** The built app is cached under a key made of `pnpm-lock.yaml`, the playground's `package.json` and `app.json`, and the build script. On a hit, the job bundles this checkout's JavaScript again and puts it into the cached app (`ci/bundle.sh`: replace `main.jsbundle` and sign again on iOS; replace the asset, `zipalign` and `apksigner` on Android). So "warm" is what a pull request that changes only JavaScript would get, not a replay of an identical app.
- **Other caches.** Appium with its driver and, on iOS, the prebuilt WebDriverAgent; the Android AVD with its snapshot; pnpm's store, through the repo's setup action. Gradle's and CocoaPods' download caches are not kept: they only matter on a cold build.
- **Cold.** `workflow_dispatch` with `cache: cold` gives every cache but pnpm's a key of its own, so each misses and is saved again, as on a first run.
- **Devices.** iOS: an iPhone simulator on iOS 26.5, Xcode 26.6, booted with `simctl` before the specs. Android: API 35, `google_apis`, x86_64, through `reactivecircus/android-emulator-runner` 2.38.0 with KVM.
- **Appium.** Server 3.9.0, XCUITest driver 12.22.8 with the prebuilt WebDriverAgent it downloads, UiAutomator2 driver 8.7.3. One server per job.
- **Specs.** `apps/native-playground/specs`, TypeScript, WebdriverIO 10.2.0 as a plain client under `node --test`. Each spec opens its own session, saves the platform tree before and after, and asserts through the tree: the switch's role, label and checked state before and after a press; the dialog's title as a heading, its description and its close button, then dismissal by Android's back or by the close button on iOS.
- **No retries.** `node --test` retries nothing, and the client's own retry of a request is off (`connectionRetryCount: 0`). Waits are conditions with a 5 second limit, 20 for the first element. Two timeouts are above their defaults, both for the first iOS session: WebDriverAgent's launch (120 s) and the client's wait for a response (300 s, default 120 s). See [the first session](#the-first-ios-session).
- **Workflow.** `.github/workflows/appium.yml`, two jobs, standard runners, `timeout-minutes: 45`. Each job writes its timings to the job summary and uploads them with the saved trees and the Appium log.

## Runs

All at `d70423bd`. The first run came from the push, the others from `gh workflow run`. "Build" is the whole build step: prebuild, pods and `xcodebuild` or Gradle on a miss, bundling and repacking on a hit. "Boot" is `simctl boot` until `bootstatus` returns on iOS, and the emulator action's start until its script runs on Android. "Job" is the job's own duration from the API, queue time left out. Every number is in [`appium-on-github-runners.json`](appium-on-github-runners.json).

### iOS

| #   | Run                                                                                        | Build cache | Build | Boot  | Switch spec    | Dialog spec    | Job    | Outcome  |
| --- | ------------------------------------------------------------------------------------------ | ----------- | ----- | ----- | -------------- | -------------- | ------ | -------- |
| 1   | [43535252517](https://github.com/floklein/rn-ui/actions/runs/43535252517/job/132262564157) | hit         | 25s   | 3m05s | 1m58s          | 1m06s          | 10m17s | pass     |
| 2   | [43536414877](https://github.com/floklein/rn-ui/actions/runs/43536414877/job/132266404405) | hit         | 9s    | 1m01s | 1m27s          | 1m08s          | 6m00s  | pass     |
| 3   | [43536438675](https://github.com/floklein/rn-ui/actions/runs/43536438675/job/132266496384) | hit         | 18s   | 1m53s | 1m25s          | 2m51s          | 9m51s  | pass     |
| 4   | [43536441258](https://github.com/floklein/rn-ui/actions/runs/43536441258/job/132266502199) | hit         | 15s   | 1m58s | 1m44s          | 47s            | 7m49s  | pass     |
| 5   | [43536444700](https://github.com/floklein/rn-ui/actions/runs/43536444700/job/132266516112) | hit         | 18s   | 1m38s | 3m18s          | 47s            | 9m46s  | pass     |
| 6   | [43536447112](https://github.com/floklein/rn-ui/actions/runs/43536447112/job/132266523788) | hit         | 17s   | 2m16s | 1m48s          | 3m13s (failed) | 11m23s | **fail** |
| 7   | [43537680029](https://github.com/floklein/rn-ui/actions/runs/43537680029/job/132270536202) | miss        | 2m42s | 1m19s | 2m08s          | 22s            | 8m15s  | pass     |
| 8   | [43537688502](https://github.com/floklein/rn-ui/actions/runs/43537688502/job/132270562737) | miss        | 6m22s | 2m26s | 1m29s          | 34s            | 15m21s | pass     |
| 9   | [43537696636](https://github.com/floklein/rn-ui/actions/runs/43537696636/job/132270586952) | miss        | 4m59s | 1m45s | 2m10s          | 45s            | 12m51s | pass     |
| 10  | [43539368783](https://github.com/floklein/rn-ui/actions/runs/43539368783/job/132276058678) | miss        | 5m15s | 2m38s | 1m15s          | 1m32s          | 15m04s | pass     |
| 11  | [43539376801](https://github.com/floklein/rn-ui/actions/runs/43539376801/job/132276083963) | miss        | 5m06s | 1m37s | 1m33s          | 51s            | 12m58s | pass     |
| 12  | [43539384250](https://github.com/floklein/rn-ui/actions/runs/43539384250/job/132276109205) | hit         | 10s   | 1m14s | 3m24s          | 1m29s          | 8m50s  | pass     |
| 13  | [43539391705](https://github.com/floklein/rn-ui/actions/runs/43539391705/job/132276135467) | hit         | 15s   | 1m52s | 1m42s          | 46s            | 8m07s  | pass     |
| 14  | [43539399576](https://github.com/floklein/rn-ui/actions/runs/43539399576/job/132276161149) | hit         | 17s   | 2m22s | 3m44s          | 46s            | 10m35s | pass     |
| 15  | [43540917325](https://github.com/floklein/rn-ui/actions/runs/43540917325/job/132281042374) | hit         | 11s   | 1m34s | 2m05s          | 36s            | 6m18s  | pass     |
| 16  | [43540924587](https://github.com/floklein/rn-ui/actions/runs/43540924587/job/132281064088) | hit         | 27s   | 2m43s | 2m35s          | 32s            | 10m48s | pass     |
| 17  | [43540931391](https://github.com/floklein/rn-ui/actions/runs/43540931391/job/132281087903) | hit         | 16s   | 1m34s | 3m24s          | 45s            | 8m24s  | pass     |
| 18  | [43540938739](https://github.com/floklein/rn-ui/actions/runs/43540938739/job/132281112670) | hit         | 14s   | 1m31s | 3m00s          | 29s            | 9m06s  | pass     |
| 19  | [43540948671](https://github.com/floklein/rn-ui/actions/runs/43540948671/job/132281141992) | hit         | 22s   | 2m33s | 3m08s (failed) | 56s            | 9m45s  | **fail** |
| 20  | [43540959043](https://github.com/floklein/rn-ui/actions/runs/43540959043/job/132281169511) | hit         | 15s   | 1m25s | 1m58s (failed) | 39s            | 6m52s  | **fail** |

### Android

| #   | Run                                                                                        | Build cache | Build | Boot | Switch spec | Dialog spec | Job    | Outcome |
| --- | ------------------------------------------------------------------------------------------ | ----------- | ----- | ---- | ----------- | ----------- | ------ | ------- |
| 1   | [43535252517](https://github.com/floklein/rn-ui/actions/runs/43535252517/job/132262563936) | hit         | 18s   | 20s  | 29s         | 13s         | 2m57s  | pass    |
| 2   | [43536414877](https://github.com/floklein/rn-ui/actions/runs/43536414877/job/132266404123) | hit         | 15s   | 17s  | 17s         | 12s         | 2m38s  | pass    |
| 3   | [43536438675](https://github.com/floklein/rn-ui/actions/runs/43536438675/job/132266496089) | hit         | 17s   | 18s  | 22s         | 12s         | 3m32s  | pass    |
| 4   | [43536441258](https://github.com/floklein/rn-ui/actions/runs/43536441258/job/132266502468) | hit         | 19s   | 17s  | 22s         | 10s         | 2m48s  | pass    |
| 5   | [43536444700](https://github.com/floklein/rn-ui/actions/runs/43536444700/job/132266516407) | hit         | 15s   | 17s  | 20s         | 10s         | 2m34s  | pass    |
| 6   | [43536447112](https://github.com/floklein/rn-ui/actions/runs/43536447112/job/132266524116) | hit         | 20s   | 19s  | 20s         | 12s         | 3m00s  | pass    |
| 7   | [43537680029](https://github.com/floklein/rn-ui/actions/runs/43537680029/job/132270535592) | miss        | 6m28s | 18s  | 31s         | 14s         | 10m03s | pass    |
| 8   | [43537688502](https://github.com/floklein/rn-ui/actions/runs/43537688502/job/132270563092) | miss        | 6m35s | 17s  | 27s         | 12s         | 10m18s | pass    |
| 9   | [43537696636](https://github.com/floklein/rn-ui/actions/runs/43537696636/job/132270586604) | miss        | 7m01s | 18s  | 32s         | 15s         | 10m38s | pass    |
| 10  | [43539368783](https://github.com/floklein/rn-ui/actions/runs/43539368783/job/132276058225) | miss        | 5m42s | 16s  | 21s         | 11s         | 9m23s  | pass    |
| 11  | [43539376801](https://github.com/floklein/rn-ui/actions/runs/43539376801/job/132276083687) | miss        | 5m04s | 15s  | 21s         | 12s         | 8m25s  | pass    |
| 12  | [43539384250](https://github.com/floklein/rn-ui/actions/runs/43539384250/job/132276109000) | hit         | 18s   | 18s  | 21s         | 12s         | 2m47s  | pass    |
| 13  | [43539391705](https://github.com/floklein/rn-ui/actions/runs/43539391705/job/132276135226) | hit         | 22s   | 20s  | 29s         | 12s         | 2m53s  | pass    |
| 14  | [43539399576](https://github.com/floklein/rn-ui/actions/runs/43539399576/job/132276160935) | hit         | 17s   | 17s  | 19s         | 11s         | 2m38s  | pass    |
| 15  | [43540917325](https://github.com/floklein/rn-ui/actions/runs/43540917325/job/132281043112) | hit         | 15s   | 18s  | 21s         | 11s         | 3m11s  | pass    |
| 16  | [43540924587](https://github.com/floklein/rn-ui/actions/runs/43540924587/job/132281064392) | hit         | 18s   | 20s  | 27s         | 12s         | 2m52s  | pass    |
| 17  | [43540931391](https://github.com/floklein/rn-ui/actions/runs/43540931391/job/132281087196) | hit         | 21s   | 21s  | 30s         | 14s         | 2m51s  | pass    |
| 18  | [43540938739](https://github.com/floklein/rn-ui/actions/runs/43540938739/job/132281112359) | hit         | 17s   | 17s  | 20s         | 11s         | 3m13s  | pass    |
| 19  | [43540948671](https://github.com/floklein/rn-ui/actions/runs/43540948671/job/132281141800) | hit         | 19s   | 18s  | 21s         | 13s         | 3m05s  | pass    |
| 20  | [43540959043](https://github.com/floklein/rn-ui/actions/runs/43540959043/job/132281169926) | hit         | 21s   | 19s  | 26s         | 14s         | 2m53s  | pass    |

### Before the code was frozen

Two earlier runs fixed the setup. They are not in the numbers above.

| Run                                                                       | Commit     | iOS                                      | Android                         |
| ------------------------------------------------------------------------- | ---------- | ---------------------------------------- | ------------------------------- |
| [43532875934](https://github.com/floklein/rn-ui/actions/runs/43532875934) | `7823cf70` | **fail**, 11m48s, real fault in the spec | pass, 8m29s, every cache cold   |
| [43534409074](https://github.com/floklein/rn-ui/actions/runs/43534409074) | `cec71c5a` | pass, 5m40s, warm                        | **fail**, 2m45s, no fault found |

- **iOS, first run: a real fault in the spec.** `label == "Delete project"` matched two elements, because iOS exposes a `Text` as a static text inside a static text. The selector now adds `accessible == true`. In the same run the first session took longer than the client's default 120 seconds; the client asked again by itself and the second request passed. That retry is now off.
- **Android, second run: no fault found.** Both specs failed because the app drew its screen and ignored every press: the driver's click returned 200, the switch stayed unchecked and the tab didn't change. No device log was kept yet, so the cause isn't known. The next commit only added `adb logcat`, and the same app and specs then passed 20 times. Counted with the series, that is 1 Android job in 22 failing without a known fault.

## Medians and worst case

Over the 20 runs at `d70423bd`. Each cell is median, then worst.

|                                 | iOS warm (15)     | iOS cold (5)       | Android warm (15) | Android cold (5)   |
| ------------------------------- | ----------------- | ------------------ | ----------------- | ------------------ |
| Install workspace dependencies  | 1m04s, 1m24s      | 57s, 1m29s         | 19s, 26s          | 17s, 20s           |
| Build the app                   | 16s, 27s          | 5m06s, 6m22s       | 18s, 22s          | 6m28s, 7m01s       |
| Install Appium and its driver   | cached            | 25s, 30s           | cached            | 12s, 15s           |
| Install the system image        | –                 | –                  | 46s, 1m19s        | 38s, 45s           |
| Create the AVD and its snapshot | –                 | –                  | cached            | 50s, 56s           |
| Boot the device                 | 1m52s, 3m05s      | 1m45s, 2m38s       | 18s, 21s          | 17s, 18s           |
| Start the Appium server         | 22s, 38s          | 25s, 1m21s         | 2s, 2s            | 3s, 6s             |
| Switch spec                     | 2m05s, 3m44s      | 1m33s, 2m10s       | 21s, 30s          | 27s, 32s           |
| – open the session              | 1m46s, 3m26s      | 1m20s, 2m01s       | 17s, 25s          | 23s, 26s           |
| – the test                      | 4s, 27s           | 4s, 6s             | 3s, 4s            | 3s, 3s             |
| Dialog spec                     | 47s, 3m13s        | 45s, 1m32s         | 12s, 14s          | 12s, 15s           |
| – open the session              | 31s, 2m41s        | 26s, 1m17s         | 6s, 7s            | 7s, 9s             |
| – the test                      | 9s, 25s           | 9s, 12s            | 5s, 6s            | 4s, 5s             |
| **Job**                         | **9m06s, 11m23s** | **12m58s, 15m21s** | **2m53s, 3m32s**  | **10m03s, 10m38s** |
| Job, best                       | 6m00s             | 8m15s              | 2m34s             | 8m25s              |

- A cold iOS build is `pod install` (median 1m56s) and `xcodebuild` (3m00s): React Native and Expo's modules come prebuilt. A cold Android build is Gradle alone (6m27s), with no dependency cache.
- Saving the build cache takes 1 to 4 seconds: the app is 7 MB on iOS and 8 MB on Android. The AVD cache is 1.5 GB.
- The switch spec runs first, so its session pays for installing the app and the driver's agent. The dialog spec's session shows what each further spec file would cost: about 31 seconds on iOS and 6 on Android before its test starts. Sharing one session between spec files would remove most of that; it wasn't measured.
- Queue time was 2 to 5 seconds. One iOS job waited 5m58s, because I had started six runs at once and a free account runs five macOS jobs at a time.

### The first iOS session

Opening the first session on iOS took 1m08s to 3m26s, and more than the client's default limit of 120 seconds in 7 runs of 19. The Appium log shows where: the driver's own shell commands on a simulator that just booted, for example 7 to 86 seconds for one architecture check of the app's binary, and 10 to 47 seconds to install a 7 MB app. Without the two raised timeouts, about a third of the iOS runs would have failed there or passed only on the client's silent retry. The first run before the freeze did exactly that.

In that first run the driver also shut the simulator down and booted it again, because its window wasn't visible (43 seconds). `appium:isHeadless` stops that and is set since.

## Failures

iOS: 3 of 20 runs failed, each in one spec, each differently, none from a fault in the spec or the app. Android: none.

| Run                                                                       | Spec   | What happened                                                                                                                                                                                                                                                                                              | Class                                         |
| ------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [43536447112](https://github.com/floklein/rn-ui/actions/runs/43536447112) | Dialog | The tap on the Dialog tab returned 200 and the screen never changed: the tree saved on failure still shows the Switch screen. The session had taken 2m41s to open and the tap came 16 seconds after it.                                                                                                    | No real fault: a tap lost on a stalled runner |
| [43540948671](https://github.com/floklein/rn-ui/actions/runs/43540948671) | Switch | The session opened after 1m59s. The client's first command reached the server 60.2 seconds later, 0.7 seconds after the driver's 60 second "new command" timeout had ended the session. Every later command got "session terminated". Whether the client or the server held the command isn't established. | No real fault: driver timeout                 |
| [43540959043](https://github.com/floklein/rn-ui/actions/runs/43540959043) | Switch | The tap on the switch took 2.7 seconds and returned 200. The switch stayed unchecked for the 5 seconds the spec waits, and the app's own log shows no `onCheckedChange`: the press never reached JavaScript. The tap came 21 seconds after the session opened.                                             | No real fault: a tap lost on a stalled runner |

- In all three the runner was slow at that moment: a session five times the median in the first, a 60 second gap in the second, and in the third a tap that took 2.7 seconds where it usually takes half a second.
- For the two lost taps, the app handled the same tap in every other run, and the dialog spec passed in the same job as the failed switch spec. The simulator's own log wasn't kept, so I can't say whether the tap was lost before the app or inside React Native. A longer wait wouldn't have helped: the press was never delivered.
- The spec hid the second failure's cause: closing the session threw from `finally` and replaced the first error. The Appium log has it.
- **No spec needed a retry to pass in the series**, because none was allowed. The only retry seen is the client's, in the first run before the freeze.

## What a pull request would wait for

The two jobs run side by side, so the wait is the iOS job, plus a few seconds of queue.

| Build cache                                                                                       | Median                    | Worst seen |
| ------------------------------------------------------------------------------------------------- | ------------------------- | ---------- |
| Warm: the pull request changes JavaScript only                                                    | about 9 minutes (9m06s)   | 11m23s     |
| Cold: it changes the lockfile, the playground's `package.json` or `app.json`, or the build script | about 13 minutes (12m58s) | 15m21s     |

- Android alone: 2m53s warm, 3m32s at worst; 10m03s cold, 10m38s at worst.
- "Cold" here keeps pnpm's store. The very first run, with nothing cached at all, took 8m29s on Android and 11m48s on iOS.
- If the iOS job blocked a pull request, about one in seven would fail for no fault of its own, and a rerun costs another 9 minutes. A rerun of only the failed job is possible with `gh run rerun --failed`.
- These are two components with one spec file each. The fixed cost is paid once per job; each further spec file adds its session and test, about 47 seconds on iOS and 12 on Android as measured.

## Not measured

- More than two spec files, one session shared between specs, or several simulators in one job.
- A larger macOS runner. They are billed even in a public repository, so the task left them out.
- iOS without the raised timeouts, beyond the first run.
- Apple's accessibility audit through Appium, and any spec with a screen reader on.
- What loses a tap on a stalled iOS runner. The simulator's log would be the next thing to keep.

## Seen on the way

- On iOS the content behind an open modal stays in the tree XCUITest returns, with `visible="false"`. On Android the tree holds only the dialog's window.
- The switch is a `XCUIElementTypeSwitch` with value `0` or `1` on iOS, and an `android.widget.Switch` with `checked` on Android. The dialog's title has the `Header` trait on iOS and `heading="true"` on Android.
