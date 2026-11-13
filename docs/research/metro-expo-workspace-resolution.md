# How Metro and Expo resolve a workspace package

Research for [issue #7](https://github.com/floklein/rn-ui/issues/7), part of [the React Native effort](https://github.com/floklein/rn-ui/issues/2). Written 2026-11-13.

## The question

Can an Expo app in this pnpm workspace consume `@ui-sdk/core` and a new `@ui-sdk/react-native` as they are packaged today? Which resolver features does Metro support by default in the current Expo SDK, and which need configuration? Is swapping host-specific modules at resolution time a viable host seam?

## The answer in short

Yes. An Expo SDK 58 app with **no `metro.config.js`** bundles `@ui-sdk/core` for iOS and Android, from workspace source and from the packed `dist`, under both the hoisted and the isolated pnpm layout. Two things need configuration: the `development` condition (without it `#dev` resolves to the stub, so there are no dev warnings) and the app's `tsconfig.json` (`lib` needs `DOM.Iterable`).

Resolution-time swapping is viable in one form only: **a `react-native` condition in core's `imports` map**, the mechanism `#dev` already uses. `.native.ts` files work from workspace source but are never picked in the published `dist`, so they are not viable as the packages are built today.

## Versions these facts hold for

| What                   | Version                         | Source                                                                                                                            |
| ---------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Expo SDK               | 58 (`expo@58.0.25`, 2026-11-12) | `npm view expo dist-tags`: `latest` is 58.0.25                                                                                    |
| React Native           | 0.88.1                          | `expo-template-default@58.0.34` pins `react-native: 0.88.1` and `react: 19.3.0`                                                   |
| Metro, as Expo runs it | 0.87.1                          | `@expo/metro@58.0.0` depends on `metro: 0.87.1` and `metro-resolver: 0.87.1`, exact. Expo CLI imports Metro through `@expo/metro` |
| Metro, newest          | 0.88.0 (2026-11-06)             | `npm view metro dist-tags`. Not what SDK 58 runs                                                                                  |
| `@expo/metro-config`   | 58.0.22                         | dependency of `expo@58.0.25`                                                                                                      |
| `@expo/cli`            | 58.1.20                         | dependency of `expo@58.0.25`                                                                                                      |
| `babel-preset-expo`    | 58.0.25                         | dependency of `expo@58.0.25`                                                                                                      |

Every Metro and Expo source citation below is to the published npm package at these versions, read from its tarball. Line numbers are the built file's.

## How this was checked

Each claim is marked:

- **Ran**: I bundled it. A throwaway pnpm workspace outside the repo held a copy of `packages/core` (its `package.json` unchanged except that `devDependencies` and `scripts` were removed) and a minimal Expo 58 app, exported with `npx expo export --platform ios|android --source-maps`. I read the source map's `sources` to see which file each import resolved to. Probe modules added to the copy tested each swap mechanism. A second workspace built pristine copies of `packages/core` and `packages/react` with the repo's own `scripts/build`, packed them with `pnpm pack`, and a standalone app bundled the tarballs.
- **Read**: I read the source or the docs at the pinned version but didn't run it.
- **Inferred**: follows from the above; not checked directly.

Limits of the experiments: bundling only. No app ran on a simulator, so nothing here says core's DOM code survives evaluation on Hermes; that is the seam's own question. The scratch workspace used pnpm 12.18.0, not the repo's pinned 10.34.5 ([package.json:5](../../package.json)). Expo web was not tested and is out of scope.

## What a consumer has to resolve

**Workspace.** `apps/*` and `packages/*` are workspace globs ([pnpm-workspace.yaml:1-3](../../pnpm-workspace.yaml)), so `apps/native-playground` and `packages/react-native` join without a change. The layout is hoisted ([.npmrc:2](../../.npmrc)). The catalog pins `react: 19.2.3` ([pnpm-workspace.yaml:19](../../pnpm-workspace.yaml)).

**In the repo, every entry points at TypeScript source.** `@ui-sdk/core` has no `main`. Its `exports` map has one subpath per component, each a string pointing at a `.ts` file, plus the pattern `./internal/*` and `./web.css` ([packages/core/package.json:39-110](../../packages/core/package.json)). `@ui-sdk/react` has no root entry at all: only subpaths, pointing at `.tsx` and `.ts` ([packages/react/package.json:30](../../packages/react/package.json)). So a workspace consumer must support `exports`, resolve an exact `.ts`/`.tsx` target, and compile TypeScript and JSX itself.

**Relative imports have no extension.** None of core's 2,257 relative imports ends in `.ts` or `.js`, although `allowImportingTsExtensions` is on ([tsconfig.base.json:15](../../tsconfig.base.json)).

**`#dev` and `#name-check` are conditional subpath imports.** `development` resolves the real module, `default` a stub ([packages/core/package.json:29-38](../../packages/core/package.json)). 44 files in core import one of them. A consumer must support `imports` and, to get dev warnings, assert the `development` condition. The repo's own tools set it by hand, for example `customConditions: ["development"]` in [scripts/check-code.mjs:908](../../scripts/check-code.mjs).

**Publishing swaps the maps.** `publishConfig` replaces `exports` and `imports` with `dist` maps, each target a `{ types, default }` pair, and adds `main` and `types` for core ([packages/core/package.json:119-420](../../packages/core/package.json)). `./internal/*` is not published ([scripts/build/publish-manifest.mjs:7](../../scripts/build/publish-manifest.mjs)).

**The build is one file to one file.** esbuild compiles every `.ts`/`.tsx` under `src` to an ES module in `dist`, marks every import external, and rewrites relative specifiers to end in `.js` ([scripts/build/transpile.mjs:12-27, 53-73](../../scripts/build/transpile.mjs), [scripts/build/specifiers.mjs:11-28](../../scripts/build/specifiers.mjs)). Bare and `#` specifiers stay as written, so the published `dist` still contains `import … from "#dev"` and the consumer resolves it through the published `imports` map.

**`"use client"`.** No source file carries the directive. The React build is run with `--use-client --server primitive.ts --server render-element.ts` ([packages/react/package.json:383](../../packages/react/package.json)) and prepends `"use client";` to every output module except those two ([scripts/build/transpile.mjs:28-44](../../scripts/build/transpile.mjs)). So only a consumer of the published `dist` ever sees it.

**TypeScript.** `moduleResolution: "bundler"`, `lib: ["ES2022", "DOM", "DOM.Iterable"]`, `verbatimModuleSyntax` ([tsconfig.base.json:5-12](../../tsconfig.base.json)). Because workspace entries are `.ts`, not `.d.ts`, a consumer's `tsc` type-checks core's source under the consumer's own options, and `skipLibCheck` doesn't exempt it.

## Findings per feature

| Feature                                                        | In Expo SDK 58                                                  | How it was checked |
| -------------------------------------------------------------- | --------------------------------------------------------------- | ------------------ |
| `exports`, one subpath per component, target a `.ts` file      | Works by default                                                | Ran                |
| TypeScript and JSX source inside a workspace package           | Works by default                                                | Ran                |
| `exports` subpath pattern (`./internal/*`)                     | Works by default                                                | Read               |
| `react-native` condition in `exports`                          | Works by default on iOS and Android                             | Ran                |
| `react-native` condition in `imports`                          | Works by default on iOS and Android, in source and in `dist`    | Ran                |
| `.native.ts` and `.ios.ts` on an extensionless relative import | Works by default                                                | Ran                |
| `.native.ts` next to an `exports` or `imports` target          | Doesn't work: the target is matched exactly                     | Ran                |
| `.native.js` in the published `dist`                           | Doesn't work: the build writes `./x.js`, and an exact file wins | Ran                |
| `#dev` resolves                                                | Works by default, to the **stub**, in dev and production        | Ran                |
| `#dev` resolves the real module in development                 | Works with configuration (below)                                | Ran                |
| `"use client"` in `dist`                                       | Works by default: ignored in a client bundle                    | Ran                |
| pnpm symlinks, hoisted layout                                  | Works by default                                                | Ran                |
| pnpm symlinks, isolated layout                                 | Works by default                                                | Ran                |
| Watching and resolving the workspace                           | Works by default: Expo detects `pnpm-workspace.yaml`            | Ran                |
| Two React versions in the workspace                            | Works by default: Expo resolves one copy                        | Ran                |
| The packed `dist` (ES modules, `.js` extensions, `#dev`)       | Works by default, Hermes bytecode included                      | Ran                |
| `tsc` in the app over workspace source                         | Works with configuration: add `DOM.Iterable` to `lib`           | Ran                |
| `./web.css`                                                    | Not needed on native. Expo ignores global CSS there             | Read               |

### Package exports

Metro's default is `unstable_enablePackageExports: true` ([metro-config@0.87.1 `src/defaults/index.js:69`](https://unpkg.com/metro-config@0.87.1/src/defaults/index.js)), on since Metro 0.82.0, which is React Native 0.79 and Expo SDK 53 ([Metro v0.82.0 release notes](https://github.com/facebook/metro/releases/tag/v0.82.0), [Expo: ES Module resolution](https://docs.expo.dev/versions/latest/config/metro/#es-module-resolution)).

An `exports` target is used exactly as written. Metro joins it to the package root, looks that one file up and returns its real path, with no source or platform extension tried ([metro-resolver@0.87.1 `src/PackageExportsResolve.js:67-87`](https://unpkg.com/metro-resolver@0.87.1/src/PackageExportsResolve.js)). The Metro docs say the same: subpaths matched in `exports` "will use the exact file path specified by a package, and will not attempt to expand `sourceExts` or platform-specific extensions" ([Package Exports support](https://metrobundler.dev/docs/package-exports/), [source at v0.87.1](https://github.com/facebook/metro/blob/v0.87.1/docs/PackageExports.md)). That is why `"./menu": "./src/components/menu/menu.ts"` resolves: the `.ts` file is named in full. **Ran:** `@ui-sdk/core` and `@ui-sdk/core/menu` bundled from source, 136 core modules, with no Metro config.

Encapsulation is lenient: a subpath missing from `exports` logs a warning and falls back to file-based resolution ([`src/resolve.js:493-529`](https://unpkg.com/metro-resolver@0.87.1/src/resolve.js)). A deep import into `@ui-sdk/core/src/...` would therefore resolve on Metro where Node refuses it. Don't rely on it.

With package exports turned off, which Expo documents as an escape hatch, neither package resolves in the workspace (`@ui-sdk/core` has no `main` there) and `@ui-sdk/react` has no root entry even when published. **Inferred:** the packages need Metro 0.82 or later, so React Native 0.79 or later.

### Conditions, and the `react-native` condition

The set Metro asserts is `default`, then `import` or `require` depending on the import's syntax, then `unstable_conditionNames`, then `unstable_conditionsByPlatform[platform]` ([`src/utils/matchSubpathFromExportsLike.js:16-23`](https://unpkg.com/metro-resolver@0.87.1/src/utils/matchSubpathFromExportsLike.js)). Within one target object the first key that is in the set wins, in the package's key order ([`src/utils/reduceExportsLikeMap.js:29-46`](https://unpkg.com/metro-resolver@0.87.1/src/utils/reduceExportsLikeMap.js)). So `react-native` must come before `default`.

Both option names are still `unstable_`-prefixed in Metro 0.87.1 and 0.88.0. Bare Metro's defaults are `unstable_conditionNames: []` and `unstable_conditionsByPlatform: { web: ["browser"] }` ([metro-config@0.87.1 `src/defaults/index.js:65-68`](https://unpkg.com/metro-config@0.87.1/src/defaults/index.js)). The `react-native` condition comes from the framework config:

- Expo sets `unstable_conditionsByPlatform` to `{ ios: ["react-native"], android: ["react-native"], web: ["browser"] }` ([@expo/metro-config@58.0.22 `build/ExpoMetroConfig.js:306-323`](https://unpkg.com/@expo/metro-config@58.0.22/build/ExpoMetroConfig.js)). The Expo docs: "For native platforms, the condition `react-native` is added, for web exports, the `browser` condition is added" ([ES Module resolution](https://docs.expo.dev/versions/latest/config/metro/#es-module-resolution)).
- Without Expo, `@react-native/metro-config@0.88.1` sets `unstable_conditionNames: ["react-native"]` ([`dist/index.js:49`](https://unpkg.com/@react-native/metro-config@0.88.1/dist/index.js)).

Neither asserts `development` or `production`.

**Ran:** an export `{ "react-native": "./src/probe/cond-native.ts", "default": "./src/probe/cond-dom.ts" }` resolved the native file on iOS and Android.

SDK 58's Metro 0.87.1 predates a 0.87.2 fix, "Fall through to parent conditions when a nested `"exports"` or `"imports"` condition has no match" ([Metro v0.87.2 release notes](https://github.com/facebook/metro/releases/tag/v0.87.2)). Give every nested condition object a `default`.

### Subpath imports

Metro has resolved `package.json#imports` since 0.81.3 ([release notes](https://github.com/facebook/metro/releases/tag/v0.81.3)). A specifier that starts with `#` is looked up in the `imports` of the package closest to the importing file, with the same conditions as `exports`, and the target is again matched exactly ([`src/resolve.js:60-101`](https://unpkg.com/metro-resolver@0.87.1/src/resolve.js), [`src/PackageImportsResolve.js:73-93`](https://unpkg.com/metro-resolver@0.87.1/src/PackageImportsResolve.js)). It is not behind the package exports flag. `*` patterns are supported.

**Ran:**

- `#dev` and `#name-check` resolve by default, to `dev-stub.ts` and `name-check-stub.ts`, in both `expo export` and `expo export --dev`. Nothing asserts `development`.
- The published form, with nested `{ types, default }` targets, resolves the same way from the packed `dist`.
- A probe `"#host": { "react-native": …, "default": … }` and a pattern `"#host/*"` resolved the native files on iOS and Android, from source and from the packed `dist`.

To get the real `#dev` module in development, assert the condition when Metro's resolution context says it is a dev bundle (`dev: boolean`, [metro-resolver@0.87.1 `src/types.d.ts:108`](https://unpkg.com/metro-resolver@0.87.1/src/types.d.ts)). **Ran:** with this `metro.config.js`, `--dev` resolved `dev.ts` and `name-check.ts`, and production still resolved the stubs.

```js
const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

config.resolver.resolveRequest = (context, moduleName, platform) =>
  context.resolveRequest(
    context.dev
      ? {
          ...context,
          unstable_conditionNames: [
            ...context.unstable_conditionNames,
            "development",
          ],
        }
      : context,
    moduleName,
    platform
  )

module.exports = config
```

Every app that consumes the published packages needs the same snippet to see dev warnings. That is a documentation point for the native adapter.

### Platform extensions

For a relative import with no extension, Metro tries, for each source extension in turn, `.<platform>.<ext>`, then `.native.<ext>` when `preferNativePlatform` is set, then `.<ext>` ([`src/resolve.js:608-639`](https://unpkg.com/metro-resolver@0.87.1/src/resolve.js)). Expo sets `preferNativePlatform` for every platform but web ([@expo/cli@58.1.20 `build/src/start/server/metro/withMetroMultiPlatform.js:651`](https://unpkg.com/@expo/cli@58.1.20/build/src/start/server/metro/withMetroMultiPlatform.js)), and its source extensions start with `ts`, `tsx` ([@expo/metro-config@58.0.22 `build/ExpoMetroConfig.js:233-240`](https://unpkg.com/@expo/metro-config@58.0.22/build/ExpoMetroConfig.js)).

Two rules limit it:

- **The exact path is tried first.** `resolveSourceFile` first looks for the specifier as written, with no platform variant ([`src/resolve.js:608-612`](https://unpkg.com/metro-resolver@0.87.1/src/resolve.js)). An import that already names its extension, `./x.ts` or `./x.js`, never reaches `x.native.ts`.
- **`exports` and `imports` targets get no variants** (above).

**Ran,** on a probe entry in core:

| Import                                                             | iOS                   | Android                  |
| ------------------------------------------------------------------ | --------------------- | ------------------------ |
| `./relative` (`.ts` and `.native.ts` exist)                        | `relative.native.ts`  | `relative.native.ts`     |
| `./relative-ios` (`.ts`, `.native.ts`, `.ios.ts`)                  | `relative-ios.ios.ts` | `relative-ios.native.ts` |
| `./explicit.ts` (`.ts` and `.native.ts` exist)                     | `explicit.ts`         | `explicit.ts`            |
| `@ui-sdk/core/probe` (target `entry.ts`, `entry.native.ts` exists) | `entry.ts`            | `entry.ts`               |

**Ran, in the packed `dist`:** the build turned `from "./relative"` into `from "./relative.js"` and emitted `relative.native.js` beside it. Metro resolved `relative.js`, the DOM variant.

### `"use client"`

Expo's Babel preset acts on the directive only when bundling for the React Server environment. In a client bundle it returns early: "Do nothing for "use client" on the client" ([babel-preset-expo@58.0.25 `build/plugins/client-module-proxy-plugin.js:174-177`](https://unpkg.com/babel-preset-expo@58.0.25/build/plugins/client-module-proxy-plugin.js)). **Ran:** `@ui-sdk/react/button` (starts with `"use client";`) and `@ui-sdk/react/primitive` (doesn't) bundled from the packed tarball.

**Inferred:** building `@ui-sdk/react-native` with `--use-client` costs nothing on native and keeps it importable from Expo Router's experimental server components. Without it the directive is simply absent.

### pnpm, symlinks and hoisting

Symlink support is always on in Metro: `unstable_enableSymlinks` was removed in 0.81.0 as "stable and always-on" ([release notes](https://github.com/facebook/metro/releases/tag/v0.81.0)), and both Metro and Expo's file-map fork pass `enableSymlinks: true` ([metro@0.87.1 `src/node-haste/DependencyGraph/createFileMap.js:102`](https://unpkg.com/metro@0.87.1/src/node-haste/DependencyGraph/createFileMap.js), [@expo/cli@58.1.20 `build/src/start/server/metro/createFileMap-fork.js:146`](https://unpkg.com/@expo/cli@58.1.20/build/src/start/server/metro/createFileMap-fork.js)). Resolved paths are real paths, so a workspace package is seen at `packages/core/...`, its `package.json` is the closest one, and its `imports` apply.

Expo configures Metro for the workspace by itself. It finds the workspace root from `pnpm-workspace.yaml` ([@expo/config@58.0.12 `build/paths/paths.js:154-171`](https://unpkg.com/@expo/config@58.0.12/build/paths/paths.js), through [`resolve-workspace-root`](https://unpkg.com/resolve-workspace-root@2.0.1/README.md)), watches the root `node_modules` and every workspace package ([@expo/metro-config@58.0.22 `build/getWatchFolders.js:104-119`](https://unpkg.com/@expo/metro-config@58.0.22/build/getWatchFolders.js)), and adds the app's and the root's `node_modules` to `nodeModulesPaths` ([`build/getModulesPaths.js:30-42`](https://unpkg.com/@expo/metro-config@58.0.22/build/getModulesPaths.js)). The monorepo guide says to delete manual `watchFolders`, `nodeModulesPaths`, `extraNodeModules` and `disableHierarchicalLookup` settings from SDK 52 on ([Work with monorepos](https://docs.expo.dev/guides/monorepos/)).

On the linker, the same guide: "From SDK 54, Expo supports isolated dependencies and isolated installations", with `nodeLinker: hoisted` as the fallback when a library breaks. This repo is already hoisted, the conservative setting. **Ran:** the workspace bundle passed under `nodeLinker: hoisted` and under `nodeLinker: isolated`, with identical resolutions.

**Duplicate React.** Expo SDK 58 needs `react@19.3.0` (React Native 0.88.1's peer range is `^19.3.0`); the catalog has 19.2.3. A workspace package whose own `node_modules/react` is 19.2.3 would normally pull a second React into the bundle. Expo prevents it: "autolinking module resolution" is on by default in a workspace ([@expo/cli@58.1.20 `build/src/start/server/metro/instantiateMetro.js:227`](https://unpkg.com/@expo/cli@58.1.20/build/src/start/server/metro/instantiateMetro.js)) and always pins `react` and `react-dom` to one copy ([`createExpoAutolinkingResolver.js:37-40`](https://unpkg.com/@expo/cli@58.1.20/build/src/start/server/metro/createExpoAutolinkingResolver.js); [Autolinking: dependency resolution and conflicts](https://docs.expo.dev/modules/autolinking/#dependency-resolution-and-conflicts)). **Ran:** a probe adapter package with `react@19.2.3` beside an app on 19.3.0 bundled one React, the app's. With `experiments.autolinkingModuleResolution: false` it bundled two. The docs call this a workaround, and type-checking still sees each package's own `@types/react`, so aligning the versions is the cleaner setup; the scaffolding ticket should decide how.

### The published `dist`

**Ran:** the packed `@ui-sdk/core` and `@ui-sdk/react` tarballs, installed in a standalone app under pnpm's isolated layout, bundled for iOS with no Metro config and compiled to Hermes bytecode. That covers ES modules under `"type": "module"`, `.js` extensions on relative imports, `{ types, default }` targets (Metro never asserts `types` and takes `default`), `#dev` through the published `imports` map, and `"use client"`.

What the `dist` needs for Metro, all of which it has: exact file targets in `exports` and `imports`, a `default` in every condition object, and `imports` shipped in the published manifest. What a consumer needs: Metro 0.82 or later with package exports left on.

`@ui-sdk/react-native` can use the same manifest shape and `scripts/build/build-package.mjs` unchanged (**inferred** from the `@ui-sdk/react` run; esbuild's `jsx: "automatic"` output imports `react/jsx-runtime`, which React Native apps resolve).

### TypeScript in the app

`expo/tsconfig.base` sets `moduleResolution: "bundler"`, `customConditions: ["react-native"]` and `lib: ["DOM", "ESNext"]`, and no `moduleSuffixes` ([expo@58.0.25 `tsconfig.base.json`](https://unpkg.com/expo@58.0.25/tsconfig.base.json)).

**Ran:** `tsc` in the probe app, extending that base, followed the workspace `exports` into core's source and reported nine errors there, all `TS2488` on iterating `NodeListOf` and `HTMLCollection`, because `DOM.Iterable` is missing. With `"lib": ["DOM", "DOM.Iterable", "ESNext"]` in the app's `tsconfig.json`, core's source had no errors. Consumers of the published `.d.ts` files are unaffected (`skipLibCheck`).

## Is resolution-time swapping a viable seam?

Three mechanisms, tested with the same probes. "TS" is what `ts.resolveModuleName` returned (**ran**, TypeScript 5.9.3).

| Mechanism                             | Metro, from source | Metro, from `dist` | Web bundlers | TS, repo config | TS, Expo app config |
| ------------------------------------- | ------------------ | ------------------ | ------------ | --------------- | ------------------- |
| `.native.ts` beside a module in core  | Native             | **DOM**            | DOM          | DOM             | **DOM**             |
| `react-native` condition in `exports` | Native             | Native             | DOM          | DOM             | Native              |
| `react-native` condition in `imports` | Native             | Native             | DOM          | DOM             | Native              |

"Web bundlers" was run with esbuild (default conditions resolve `default`; `--conditions=react-native` resolves the native file). For Vite, webpack, Node and Next it is **inferred** from the Node rule that a condition applies only when the resolver asserts it.

### `.native.ts` files inside core: not viable as built

- It works only from workspace source. In the `dist` every relative import ends in `.js`, and Metro tries the exact path first, so a published consumer gets the DOM module. Fixing that means shipping extensionless relative imports, which Node's ES module resolver rejects and which `scripts/build/specifiers.mjs` exists to avoid, or a second native build.
- TypeScript ignores it. Neither the repo's config nor Expo's sets `moduleSuffixes`, so `tsc` types the import from the DOM file on both sides. Setting `moduleSuffixes: [".ios", ".native", ""]` in an app makes TS follow, but then TS and Metro disagree on explicit-extension imports (TS picked `explicit.native.ts`, Metro `explicit.ts`).
- It can't swap a public entry, since `exports` targets get no variants.

### `react-native` condition in `exports`: works, but swaps the wrong thing

It resolves by default and survives publishing. But it only chooses between public entry points. Host-specific code sits below them, reached by relative imports, where conditions don't apply. An adapter that needs a different entry can import a different subpath by name, with no condition. Reading [scripts/build/publish-manifest.mjs:47-53](../../scripts/build/publish-manifest.mjs), the "`types` first" check would also reject `{ "react-native": {…}, "types": …, "default": … }`, so the shape would have to be `{ "types", "react-native", "default" }` with shared declarations, or the check would have to change (**inferred**).

### `react-native` condition in `imports`: viable

For example `"#host/*": { "react-native": "./src/host/native/*.ts", "default": "./src/host/dom/*.ts" }`, mirrored in `publishConfig.imports`.

- **Metro and Expo:** works by default on iOS and Android in SDK 58, from source and from `dist`, exact and pattern forms. It needs Metro 0.81.3 or later for `imports`. Outside Expo, `@react-native/metro-config` also asserts `react-native`.
- **The web build:** unchanged in what it resolves. No web toolchain asserts `react-native`, so each takes `default`, the DOM module. The native files do ship in `dist`, because the build compiles every file under `src`, but nothing on the web imports them. One exposure: a web setup that asserts `react-native` itself, as some React Native Web configs do, would get the native modules. Expo web doesn't; it asserts `browser`.
- **TypeScript:** each side follows its bundler. The repo's config resolves `default`. An Expo app already has `customConditions: ["react-native"]` from `expo/tsconfig.base` and resolved the native file. Costs: the two files of a pair are never type-checked against each other, so a mismatch in their exports would show only in the app (a type test can pin it); and core's own `tsc` still checks the native files, under core's config with the DOM `lib` and no React Native types, so a native host module that imports `react-native` would make core depend on it for type-checking.
- **The repo's tooling:** it is the `#dev` pattern again. [scripts/build/publish-manifest.mjs:24-25](../../scripts/build/publish-manifest.mjs) already checks `imports` against `publishConfig.imports`, and [scripts/build/published-resolve.mjs:38-51](../../scripts/build/published-resolve.mjs) already resolves `#` specifiers. **Inferred:** vitest keeps resolving `default`, so testing the native modules under Node needs `react-native` added to its resolve conditions.

### What no resolution-time swap does

It replaces the modules behind the alias and nothing else. Any module outside the seam that touches `document` or `window` when it is evaluated is still bundled and still runs on Hermes. Whether core has such modules, and where the seam must sit to keep them out, is for the seam tickets. Resolution-time swapping is also not required: a seam where the adapter hands core a host object at runtime needs nothing from the resolver. This research only says the resolver won't stand in the way.

## For the scaffolding ticket

- No `metro.config.js` is needed to bundle. Add the one above to get `#dev` warnings in development.
- `tsconfig.json`: extend `expo/tsconfig.base` and set `"lib": ["DOM", "DOM.Iterable", "ESNext"]`.
- Keep `node-linker=hoisted`. Isolated also bundled.
- Decide how the app's `react@19.3.0` sits beside the catalog's 19.2.3. Expo deduplicates the bundle by default; types and peer warnings are the remaining cost.
- Don't set `watchFolders`, `nodeModulesPaths` or `disableHierarchicalLookup`.

## Not verified

- Running on a simulator or device. Everything here is bundling and Hermes bytecode compilation.
- The repo's pinned pnpm 10.34.5; the experiments used 12.18.0.
- The `./internal/*` export pattern on Metro (read in source, not bundled).
- EAS Build, Expo web, and Metro 0.88.0, which SDK 58 doesn't use.
