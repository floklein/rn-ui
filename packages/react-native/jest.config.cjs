// Every test runs once per OS: React Native picks `Platform.OS` from the
// files Jest resolves, `.ios.js` or `.android.js`. Every module gets the
// React that `react-native` resolves, since the repo's own is older.
const path = require("node:path")
const preset = require("@react-native/jest-preset")

const react = path.dirname(
  require.resolve("react/package.json", {
    paths: [path.dirname(require.resolve("react-native/package.json"))],
  })
)

// Core's development build, as an app in development loads it.
const core = path.resolve(__dirname, "../core")

const project = (os) => ({
  ...preset,
  displayName: os,
  haste: { ...preset.haste, defaultPlatform: os },
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    "^react$": react,
    "^react/(.*)$": `${react}/$1`,
    "^#dev$": `${core}/src/foundation/kernel/dev.ts`,
    "^#name-check$": `${core}/src/foundation/text/name-check.ts`,
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native(-gesture-handler)?|@react-native(-community)?)/)",
  ],
  setupFiles: [
    ...preset.setupFiles,
    require.resolve("react-native-gesture-handler/jestSetup.js"),
  ],
  testMatch: ["<rootDir>/test/**/*.test.ts?(x)"],
})

module.exports = { projects: [project("ios"), project("android")] }
