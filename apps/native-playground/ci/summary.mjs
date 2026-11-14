import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"

const platform = process.argv[2]
const { TIMINGS, JOB_START, GITHUB_STEP_SUMMARY } = process.env

const labels = {
  install: "Install workspace dependencies",
  app_cache: "Build cache",
  build_prebuild: "Build: expo prebuild",
  build_pods: "Build: pod install",
  build_xcodebuild: "Build: xcodebuild",
  build_gradle: "Build: gradle assembleRelease",
  build_bundle: "Build: bundle JavaScript into the cached app",
  build: "Build the app, in all",
  app_cache_save: "Save the build cache",
  appium_cache: "Appium cache",
  appium_install: "Install Appium and its driver",
  image: "Install the system image",
  avd_cache: "AVD cache",
  avd_create: "Create the AVD and its snapshot",
  boot: "Boot the device",
  appium_start: "Start the Appium server",
  spec_switch: "Switch spec",
  spec_switch_session: "Switch spec: open the session",
  spec_switch_test: "Switch spec: the test",
  spec_switch_exit: "Switch spec: exit code",
  spec_dialog: "Dialog spec",
  spec_dialog_session: "Dialog spec: open the session",
  spec_dialog_test: "Dialog spec: the test",
  spec_dialog_exit: "Dialog spec: exit code",
  total: "Job, from its first step to this one",
}

const recorded = existsSync(TIMINGS) ? readFileSync(TIMINGS, "utf8") : ""
const timings = Object.fromEntries(
  recorded
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("="))
)
for (const spec of ["switch", "dialog"]) {
  const file = `specs/output/${platform}-${spec}.json`
  if (existsSync(file)) {
    const { sessionSeconds, testSeconds } = JSON.parse(
      readFileSync(file, "utf8")
    )
    timings[`spec_${spec}_session`] = sessionSeconds.toFixed(1)
    timings[`spec_${spec}_test`] = testSeconds.toFixed(1)
  }
}
timings.total = String(Math.round(Date.now() / 1000) - Number(JOB_START))

const unitless = /_cache$|_exit$/
const rows = Object.keys(labels)
  .filter((key) => key in timings)
  .map(
    (key) =>
      `| ${labels[key]} | ${timings[key]}${unitless.test(key) ? "" : " s"} |`
  )
appendFileSync(
  GITHUB_STEP_SUMMARY,
  [
    `### Appium on ${platform}`,
    "",
    "| Step | Result |",
    "| --- | --- |",
    ...rows,
    "",
  ].join("\n")
)
mkdirSync("specs/output", { recursive: true })
writeFileSync(
  `specs/output/${platform}-timings.json`,
  JSON.stringify(timings, null, 2)
)
