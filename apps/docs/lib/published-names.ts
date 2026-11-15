import type { Framework } from "./frameworks"

// The fork publishes core and the React and native adapters as `@rn-ui-sdk/*`,
// so the native section shows those names (scripts/native/pack.mjs renames
// the packages the same way). Other frameworks' packages are upstream's.
const forkPackages = /@ui-sdk\/(core|react-native|react)\b/g

/** `text` with the package names a user of `framework` installs. */
const publishedNames = (text: string, framework: Framework | undefined) =>
  framework === "react-native"
    ? text.replace(forkPackages, "@rn-ui-sdk/$1")
    : text

export { publishedNames }
