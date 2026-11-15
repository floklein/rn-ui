// Builds the package in the current directory into `dist`: ES modules from
// esbuild, declarations from tsc, then a check of the published manifest.
//
//   node ../../scripts/build/build-package.mjs [--use-client] [--server <module>...] [--solid]
//
// --use-client  Starts every module with "use client", for React packages.
// --server      A module, like `render-element.ts`, that ships without it, for Server Components.
// --solid       Compiles JSX with Solid's compiler, and keeps it as written under `dist/solid`.
import { cpSync, readdirSync, rmSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import { buildNative } from "../native/native-build.mjs"
import { emitDeclarations } from "./declarations.mjs"
import { buildNuxtModule } from "./nuxt-module.mjs"
import { findPublishProblems } from "./publish-manifest.mjs"
import { findServerModuleProblems } from "./server-modules.mjs"
import { transpile } from "./transpile.mjs"
import { transpileSolid } from "./transpile-solid.mjs"

const { values: flags } = parseArgs({
  options: {
    "use-client": { type: "boolean", default: false },
    server: { type: "string", multiple: true, default: [] },
    solid: { type: "boolean", default: false },
    nuxt: { type: "boolean", default: false },
    native: { type: "boolean", default: false },
  },
})

const packageDir = process.cwd()
const sourceDir = path.join(packageDir, "src")
const outDir = path.join(packageDir, "dist")

rmSync(outDir, { recursive: true, force: true })
if (flags.solid) {
  await transpileSolid({ packageDir, sourceDir, outDir })
} else {
  await transpile({
    sourceDir,
    outDir,
    useClient: flags["use-client"],
    serverModules: flags.server,
  })
}
emitDeclarations({ packageDir, sourceDir, outDir })
for (const file of readdirSync(sourceDir, { recursive: true })) {
  if (file.endsWith(".css")) {
    cpSync(path.join(sourceDir, file), path.join(outDir, file))
  }
}
// --nuxt builds the Nuxt module in `nuxt/` into `dist/nuxt`, for Vue.
if (flags.nuxt) {
  await buildNuxtModule({ packageDir, outDir })
}

const problems = [
  ...(flags.native ? buildNative({ packageDir, outDir }) : []),
  ...findPublishProblems(packageDir),
]
if (problems.length) {
  console.error(
    `The published package.json doesn't match the build:\n  ${problems.join("\n  ")}`
  )
  process.exitCode = 1
}
const serverProblems = flags["use-client"]
  ? findServerModuleProblems({
      packageDir,
      outDir,
      serverModules: flags.server,
    })
  : []
if (serverProblems.length) {
  console.error(
    `The build doesn't work in Server Components:\n  ${serverProblems.join("\n  ")}`
  )
  process.exitCode = 1
}
