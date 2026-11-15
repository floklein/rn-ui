# Tests

A map of every test in the repo: what each kind covers, where it runs, and the exact command. CI is in `.github/workflows`, and the perf budgets in [perf/README.md](perf/README.md).

## Before you run anything

- **Run Playwright and vitest through `scripts/test-slot.sh`.** It waits for one of two machine-wide slots (`UI_SDK_TEST_SLOTS` changes the count), so parallel sessions don't slow each other down.
- **Set your own port on every command that starts a server.** Locally, the configs reuse a server already listening on their port, so a shared port can test someone else's checkout. The ports and their defaults: `PLAYGROUND_PORT` (5300) for the playground, `DOCS_PORT` (5400) for the docs site, `NATIVE_PLAYGROUND_PORT` (8090) for the native playground's Metro server, and `APPIUM_PORT` (a free port when unset) for the device specs' Appium server. The examples below use 5310 and 5410. Pick ones nobody else uses.
- **Check the exit code, not the output.** `echo $?` after the command, or `&& echo passed`.

Run from `tests/`:

```bash
cd tests
PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test specs/menu --project react          # Every menu spec file.
PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test specs/menu.a11y --project vue       # One file.
PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test specs/menu.spec.ts -g 'Escape closes' # Tests whose title matches.
PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test --project react --project vue --project web
```

A file filter is a regular expression matched against the path, so `specs/menu` runs `menu.a11y.spec.ts`, `menu.counts.spec.ts` and `menubar.spec.ts` too. Name the whole file, like `specs/menu.spec.ts`, for the base spec only. `pnpm test` from the root runs `playwright test` in `tests/` with every project, which is the whole matrix: pass `--project` to narrow it.

## At a glance

| Kind                                  | Files                                                             | Runs in                                                                              | CI tier   |
| ------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------- |
| [Behavior](#behavior)                 | `tests/specs/<name>.spec.ts`                                      | Every framework project with the fixture, plus the portal, sheet and engine projects | `pr`      |
| [Accessibility](#accessibility)       | `<name>.a11y.spec.ts`                                             | Like behavior, without the sheet projects                                            | `pr`      |
| [Screen reader](#screen-reader)       | `<name>.sr.spec.ts`                                               | Like behavior, without the sheet projects                                            | `pr`      |
| [Right to left](#right-to-left)       | `<name>.rtl.spec.ts`                                              | Like behavior, without the sheet projects                                            | `pr`      |
| [Server rendering](#server-rendering) | `<name>.ssr.spec.ts`                                              | `react-ssr`, `vue-ssr`                                                               | `main`    |
| [Custom rendering](#custom-rendering) | `<name>.render.spec.ts`                                           | Like behavior, without the sheet projects                                            | `pr`      |
| [Enhancements](#enhancements)         | `<name>.enhancements.spec.ts`, and any test tagged `@enhancement` | Like behavior, without the sheet projects                                            | `pr`      |
| [Kitchen sinks](#kitchen-sinks)       | `<name>.kitchen-sink.spec.ts`                                     | `react`, `vue`, `web` and their engine projects                                      | `pr`      |
| [Count gates](#count-gates)           | `<name>.counts.spec.ts`                                           | `react`, `vue`, `web`, engines                                                       | `pr`      |
| [Leak specs](#leak-specs)             | `leaks.spec.ts`                                                   | Every framework. Chromium only                                                       | `pr`      |
| [One-off specs](#one-off-specs)       | `<name>.<topic>.spec.ts`, like `combobox.virtual.spec.ts`         | Like behavior, without the sheet projects                                            | `pr`      |
| [Device specs](#device-specs)         | `tests/native/<name>.spec.ts`, `<name>.a11y.spec.ts`              | An iOS simulator and an Android emulator, through Appium                             | `pr`      |
| [Unit tests](#unit-tests)             | `packages/*/test/*.test.ts(x)`                                    | Node, vitest                                                                         | `pr`      |
| [Docs tests](#docs-tests)             | `tests/docs/*.spec.ts`                                            | Chromium, against the docs site                                                      | `nightly` |
| [Bundle size](#bundle-size)           | `scripts/size.mjs`, `size-budget.json`                            | Node                                                                                 | `pr`      |
| [Perf docs](#perf-docs)               | `scripts/perf-docs.mjs`                                           | Node                                                                                 | `pr`      |

## Projects

`tests/playwright.config.ts` defines every project. Each Playwright spec runs once per project that includes it. A project sets the framework, the browser and, for some, URL options every test gets (`fixtureOptions`).

| Projects                             | Browser         | Fixture                                                                         | Runs                                                                                |
| ------------------------------------ | --------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `react`, `vue`, `web`                | Chromium        | `<fixture>/react.tsx`, `vue.ts`, `web.ts`: the component built from parts       | Every spec, except `specsThatSkip`                                                  |
| `react-data`, `vue-data`, `web-data` | Chromium        | `<fixture>/<framework>-data.*`: the same component built from a data definition | Specs whose fixtures have a `-data` file                                            |
| `react-ssr`, `vue-ssr`               | Chromium        | `<fixture>/<framework>-ssr.*`: rendered to a string, then hydrated              | Specs whose fixtures have an `-ssr` file                                            |
| `react-portal`                       | Chromium        | Like `react`, with `?container=portal-root`                                     | Every spec of the components in `portalSpecs`, except kitchen sinks and count gates |
| `*-sheet`, one per framework         | Chromium        | Like the framework's project, with `?presentation=sheet`                        | The base spec of each component in `sheetSpecs`                                     |
| `web-webkit`, `web-firefox`          | WebKit, Firefox | Like `web`                                                                      | Like `web`, except the leak specs, which read the heap through CDP                  |

- **`specsThatSkip`** (`tests/fixture-files.ts`) leaves out of a project every spec file whose fixtures don't exist for its framework. It reads the fixtures a spec opens from its `open("<fixture>")` calls and looks for `apps/playground/src/fixtures/<fixture>/<framework>.ts(x)`. Kitchen sinks are left out of every project but the composition ones. CI shards split by test count, so a file that would only skip would still take a shard's share.
- **`portalSpecs`**: alignment, autocomplete, combobox, command, dialog, drawer, hover-card, list, menu, menubar, navigation-menu, popover, popup, presentation, select, toast, token-input, tooltip and trigger-menu. The pattern is `**/<name>.*spec.ts`, so it matches every kind of spec for those names. Add a component when it gains a popup.
- **`sheetSpecs`**: autocomplete, combobox, dialog, menu, popover and select, as `**/<name>.spec.ts`. Specs that measure placement against a trigger skip there, through `isSheet(fixtureOptions)` in `tests/fixtures.ts`.
- **Engines.** WebKit and Firefox run web only: behavior lives in core and differs by engine, not framework. Edge is Chromium's engine, so it has no project. `BROWSERS=webkit,firefox` keeps only those engines' projects. `BROWSERS=chromium` drops both.
- **Missing fixtures.** A test whose fixture doesn't exist for its framework skips with "No `<fixture>` fixture for `<framework>`." `open()` knows from the files before it loads the page.

## CI tiers

From `.github/workflows`:

| Tier               | When                                              | Playwright projects                                                                            | Also                                         |
| ------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `affected`         | Pull requests and pushes to `main`                | The specs the changes can affect, from `pnpm test:pr`, on 1 to 12 runners                      | Typecheck, perf docs, unit tests             |
| `affected-engines` | Pushes to a pull request with the `engines` label | `affected`, plus `web-webkit` and `web-firefox` for the touched specs                          | Typecheck, perf docs, unit tests             |
| `engines`          | Adding the `engines` label to a pull request      | `*-webkit`, `*-firefox`                                                                        | Docs tests                                   |
| `main`             | Run workflow                                      | Every Chromium project: the 5 frameworks, `*-data`, `*-ssr`, `*-portal`, `*-sheet` (10 shards) | Typecheck, perf docs, unit tests             |
| `nightly`          | 03:00 UTC Monday to Saturday, when main changed   | `*-webkit`, `*-firefox`                                                                        |                                              |
| `full`             | Sundays from `weekly.yml`, and Run workflow       | Everything above                                                                               | Typecheck, perf docs, unit tests, docs tests |

Pushes to main that change only Markdown files or `.claude/` skip CI, unless one of them is `tests/perf/README.md`, which `pnpm docs:perf --check` reads. Pull requests always run it, so each one reports `CI passed`, the check the main ruleset requires; Markdown alone runs no specs.

The affected tiers size themselves. The Plan affected specs job lists the plan's tests with `pnpm test:pr --shards`, estimates their time on one runner and asks for a runner per 6 minutes of it, up to 12. Each runner then takes its share of every command with `--shard <n>/<count>`. A component change runs on one runner. A change to shared code, which runs a framework's whole project, takes a few. The estimate counts a leak test as 16 tests and a WebKit or Firefox test as 2; retune `testSeconds` in `scripts/affected-specs.mjs` from the runners' durations.

To run a CI shard locally:

```bash
cd tests && CI=1 PLAYGROUND_PORT=5330 ../scripts/test-slot.sh npx playwright test --project "*-firefox" --shard=2/7
```

With `CI` set, the configs retry twice, use 2 workers, fail on `test.only`, and serve a development build (`vite build`, then `vite preview`) instead of the dev server.

## URL options

Specs open fixtures with `open("<fixture>", { option: "value" })` from `tests/fixtures.ts`, which loads `/?fixture=<fixture>&framework=<framework>&...`. The project's `fixtureOptions` come first, then the test's options. These work in every fixture. `apps/playground/src/main.ts` reads the first group, `tests/fixtures/page.ts` the rest:

| Option                                                                       | Effect                                                                                                                                                                                        |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `?fixture=menu&framework=react`                                              | Loads `apps/playground/src/fixtures/menu/react.tsx`. `framework` can be `react-data`, `vue-ssr` and so on.                                                                                    |
| `?lazy`                                                                      | With `?presentation`, leaves loading the sheet code to the popups. Otherwise the page loads it first.                                                                                         |
| `?dir=rtl`                                                                   | Sets `dir="rtl"` on `<html>`.                                                                                                                                                                 |
| `?layout=<name>`                                                             | Sets `data-layout` on `<body>`: `bottom` and `right` move the fixture, `tall` makes the page scroll, `top` moves the tooltip page, `scroll-padding` gives the listbox 32px of scroll padding. |
| `?animate`, `?animate=slow`, `?animate=infinite`                             | Turns on the fixtures' enter and exit animations, slower, or with an exit that never ends.                                                                                                    |
| `?container=<id>`                                                            | Adds an element with that id to the page, for popups to render into. The portal projects set `portal-root`.                                                                                   |
| `?sr`                                                                        | Loads a virtual screen reader (`@guidepup/virtual-screen-reader`) on `window.virtual`.                                                                                                        |
| `?modal=true\|false\|pointer`, `?presentation=auto\|popover\|sheet`, `?open` | Menu options, from `menuOptions()`. The sheet projects set `presentation=sheet`.                                                                                                              |
| `?n=500`                                                                     | Perf fixtures render this many items (`perfSize()` in `tests/fixtures/perf.ts`, default 10, or 200 rows in `rows-perf`).                                                                      |

Components read more from `tests/fixtures/page.ts`: `tabsOptions()` (`activation`, `orientation`, `default=none`, `keep-mounted`, `cancel`), `accordionOptions()` (`default`, `multiple`, `disabled`, `keep-mounted`, `hidden-until-found`, `cancel`, `collapsible=false`), `collapsibleOptions()` (`open`, `disabled`, `keep-mounted`, `hidden-until-found`, `cancel=open|close`) and `toggleOptions()` (`orientation`, `deselectable=false`, `loop=false`, `disabled`, `pressed`, `alignment`, `cancel`). Other fixtures read their own options with `params.get` and `params.has`. Search the fixture for them.

Open a fixture by hand at `http://localhost:5310/?fixture=menu&framework=react&dir=rtl` after `PLAYGROUND_PORT=5310 pnpm dev`.

## The `@enhancement` tag

Tests tagged `@enhancement`, on the test or on its `describe`, cover behavior past the WAI-ARIA pattern.

```ts
test("the menu lines up with the trigger's right edge", { tag: "@enhancement" }, async ({ page }) => {
```

The suite runs them like any other test. Most live in `<name>.enhancements.spec.ts`, but any spec can tag a test. Untagged tests in an enhancements file are pattern behavior every implementation must have. Run only the tagged ones with `--grep @enhancement`, or everything else with `--grep-invert @enhancement`.

## Playwright specs

Every spec is in `tests/specs/` and imports `test` and `expect` from `tests/fixtures.ts`, which adds the `open()` and `tab()` fixtures. Helpers that only one component's specs share are in `<name>.helpers.ts`. Fixtures for each spec live in `apps/playground/src/fixtures/<fixture>/`, and their shared contracts (labels, items, options) in `tests/fixtures/*.ts`. Test titles are plain sentences that state the behavior, since the docs' `<SpecList>` (`apps/docs/components/spec-list.tsx`) shows them on each component's page.

### Behavior

`<name>.spec.ts`. The component's pattern behavior: keyboard interaction from the WAI-ARIA Authoring Practices, pointer and touch, focus, dismissal, positioning, animation, forms, controlled and uncontrolled state, and change details. Some base specs cover something other than one component:

- `alignment`, `hover-popups`, `item-icon`, `popup`, `presentation`, `source`, `wrapped-content`: behavior shared across components, like change details' `source`, or the popup layer's page-wide side effects.
- `elements`, `web-data-lists`, `web-menu`, `web-popups`: web components only. `vue-updates`: Vue only.

Runs in every project that has the fixture. The sheet projects run the six base specs in `sheetSpecs`. CI: `pr`, with `main` adding `-data`, `-ssr`, `-portal` and `-sheet`, and nightly and weekly adding the engines.

```bash
cd tests && PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test specs/dialog.spec.ts --project react --project react-sheet
```

### Accessibility

`<name>.a11y.spec.ts`. Axe (`@axe-core/playwright`) in each state, with the rules about page structure turned off (`region`, `landmark-one-main`, `page-has-heading-one`), and ARIA snapshots (`toMatchAriaSnapshot`) of the tree. A component with a WAI-ARIA pattern also runs `checkPattern` from `@ui-sdk/core/testing` on its fixture, through `patternProblems`, the check people run on what they build.

```bash
cd tests && PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test specs/menu.a11y --project react
```

### Screen reader

`<name>.sr.spec.ts`. What a screen reader announces. The spec opens the fixture with `?sr`, starts the virtual screen reader on the page, walks the component, and compares the spoken phrase log. Every implementation must say the same.

```bash
cd tests && PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test specs/menu.sr --project web
```

### Right to left

`<name>.rtl.spec.ts`. The fixture with `?dir=rtl`: mirrored horizontal arrows, submenus and popups opening to the left, and placement against the trigger's right edge.

```bash
cd tests && PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test specs/menu.rtl --project vue
```

### Server rendering

`<name>.ssr.spec.ts`. The `-ssr` fixtures render to a string, then hydrate, and record every hydration mismatch on `window.__hydrationErrors`. The Vue, Svelte and Solid ones get their string from the playground's `/__ssr` route, which renders them in Node. Vue checks text when it hydrates, so in `vue-ssr` text that Node's ICU writes differently from the browser's shows up as a mismatch. The specs check there are none, closed and open, and that the hydrated component behaves. `specsThatSkip` leaves them out of every project whose framework doesn't end in `-ssr`, so they run in `react-ssr`, `vue-ssr`, `svelte-ssr` and `solid-ssr` only, which CI runs from the `main` tier. Web components have no server rendering. `controller-shortcuts.ssr.spec.ts` covers controllers and shortcuts across components.

```bash
cd tests && PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test specs/menu.ssr --project react-ssr --project vue-ssr
```

The React and Vue unit tests check `renderToString` output too. See [Unit tests](#unit-tests).

### Custom rendering

`<name>.render.spec.ts`. Parts rendered as other elements, against the `<name>-render` fixture: `render` in React, `as` and the `render` slot in Vue, `as-child` on web components. Links that stay items, render functions that receive the part's state, and, in some, parts that render again only when the state they read changes.

```bash
cd tests && PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test specs/menu.render --project react --project vue --project web
```

### Enhancements

`<name>.enhancements.spec.ts`. Behavior past the pattern's baseline. See [the `@enhancement` tag](#the-enhancement-tag).

```bash
cd tests && PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test specs/menu.enhancements --project react
```

### Kitchen sinks

`<name>.kitchen-sink.spec.ts`. The `<name>-kitchen-sink` fixture shows every variant on one page for manual testing. The spec loads it with `page.goto`, without the project's fixture options, opens every variant, checks it opens and positions, closes it, and fails on any console error. Runs in `react`, `vue`, `web` and their engine projects, never in `-data`, `-ssr` or `-portal`.

```bash
cd tests && PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test specs/menu.kitchen-sink --project web
```

### Count gates

`<name>.counts.spec.ts`. Exact counts of renders, subscriptions, DOM calls, attribute writes and frames per interaction, at several item counts, against `tests/perf/budgets.ts`. Today: `menu`, `tabs`, `toolbar`, `timeline`, `rows` (a page of closed popups), `select`, `combobox`, `reopen` (frames until a popup settles), `popup-open` (whole-page restyles as a modal popup opens), `slider`, `resizable` and `scroll-area`. They run in `react`, `vue`, `web` and the engine projects. The portal projects leave them out, since a portal doesn't change the work. Restyle counts read a Chromium trace and are skipped elsewhere. Every budget, what it measures, why, and its command are in the [perf catalog](perf/README.md).

```bash
cd tests && PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test counts.spec --project react --project vue --project web --workers 1
```

`PERF_SIZES=10,500,2000` measures more sizes than the default 10 and 500, and `PERF_REPORT=1` prints every count. A failure's message links to the budget's catalog entry.

### Leak specs

`leaks.spec.ts`. Opens and closes a menu, select, combobox, autocomplete, popover, dialog, drawer, tooltip, hover card, accordion and collapsible 200 times, then mounts and unmounts it 200 times, and unmounts it while open 50 times. Tabs and a toolbar get arrow keys instead, and unmount right after one; a slider, a resizable group and a scroll area get drags (and keys or the wheel), and unmount in the middle of one. Then the listeners on the window and the document, the pending animation frames, the open popup layers and the detached `[data-slot]` elements must be back to their values after a warmup, and the heap after garbage collection within budget. They read those through the Chrome DevTools Protocol, so they run in Chromium only and leave out the WebKit and Firefox projects. The fixture is `apps/playground/src/fixtures/leaks`, with `?component=`. The budgets are `leaks.cycles` and `leaks.unmount-open` in the [perf catalog](perf/README.md).

```bash
cd tests && PLAYGROUND_PORT=5310 PERF_REPORT=1 ../scripts/test-slot.sh npx playwright test specs/leaks.spec.ts --project react --project vue --project web --project solid --project svelte --workers 1
```

### One-off specs

`<name>.<topic>.spec.ts`. One component's behavior that is big enough for its own file. They run like behavior specs.

- **Changing items** (`autocomplete.items`, `combobox.items`, `select.items`, `menu.groups`): items or groups that change or move while the list is open. The keys follow the order on screen.
- **Composite patterns** (`checkbox.group`, `field.set`, `forms.form`, `toggle.group`): groups of controls, and native form participation.
- **Edge cases** (`menu.cases`): cases found while writing the docs examples.
- **Lists** (`file-input.list`, `list.highlight`, `list.rows`): the attachments list, match highlighting, and rows people rebuild around a list.
- **Motion** (`drawer.motion`): how the drawer moves frame by frame.
- **Patterns** (`dialog.patterns`): opening from a menu item, shortcuts, a dirty form that refuses to close, async actions.
- **Payloads** (`dialog.payload`, `drawer.payload`, `menu.payload`, `popover.payload`): one popup two triggers share, and `payloadchange`.
- **Scrubbing** (`number-input.scrub`): scrub areas, with a stand-in for pointer lock.
- **Search** (`select.search`): a search field inside a select's list.
- **The overlay host** (`toast.host`): what `toast()` and `confirm()` open from anywhere.
- **Touch screen readers** (`list.touch`): VoiceOver on iOS ignores `aria-activedescendant`, so a list opened by a screen reader's tap takes real focus.
- **Virtualized lists** (`combobox.virtual`, `command.virtual`): 10,000 items with only the rows in view rendered.

```bash
cd tests && PLAYGROUND_PORT=5310 ../scripts/test-slot.sh npx playwright test specs/combobox.virtual --project react
```

## Device specs

`tests/native/`, for React Native. They're written apart from the Playwright specs, with the same kinds of file and the same scenario names where the scenario exists: `<name>.spec.ts` for behavior, `<name>.a11y.spec.ts` for the platform's accessibility tree per state and, on iOS, Apple's audit. Each file opens one Appium session (`tests/native/device.ts`) on the native playground's standalone release build, which carries its JavaScript bundle, so no Metro server runs. The specs open fixtures of their own from `apps/native-playground/fixtures/<name>.tsx` and press with real touches, and each example in `examples/components/<name>/react-native/` is opened once. The timeouts Appium's measurement had to raise, [issue #29](https://github.com/floklein/rn-ui/issues/29), are in `device.ts`.

`scripts/device-specs.mjs` plans and runs them on one device. A component's specs run when its native entry or anything that entry imports changes, in the adapter or in core, or its example, fixture or spec does. The harness, the playground's app and build files and the lockfile run every spec.

```bash
pnpm test:device --dry                                  # The plan against origin/main, without running it.
pnpm test:device --platform ios --base feat/react-native-support
pnpm test:device:sweep --platform android               # Every device spec.
SIMULATOR_UDID=<udid> APPIUM_PORT=4791 pnpm test:device:sweep --platform ios
ANDROID_SERIAL=emulator-5556 APPIUM_PORT=4792 pnpm test:device:sweep --platform android
```

- **The device.** Boot one first. iOS needs `SIMULATOR_UDID`, plus `SIMULATOR_DEVICE_SET` for a simulator outside Xcode's own set, like a Simlock lease's `SIMLOCK_IOS_DEVICE_SET`. Android takes `ANDROID_SERIAL` when more than one device is attached. `WDA_PATH` points at a prebuilt WebDriverAgent (`appium driver run xcuitest download-wda`); without it the driver builds its own.
- **The app.** The script builds it when `apps/native-playground/.native-build/<platform>/` is empty, with `apps/native-playground/scripts/build-app.sh <platform>`: `expo prebuild` generates the native folders, which are never committed, then Xcode or Gradle builds a release app. After a change to JavaScript only, `scripts/embed-bundle.sh <platform>` puts the new bundle into the built app in seconds. `APP_PATH` runs another build.
- **Appium.** Version and drivers are in `tests/native/appium.json`. The script runs it with `npx` and installs the platform's driver when missing, or uses `APPIUM_BIN`. Its log, and the trees the specs save, go to `tests/test-results/native/` (`DEVICE_SPEC_OUTPUT` changes it).
- **One spec file.** With Appium already running: `DEVICE_PLATFORM=ios APP_PATH=<app> APPIUM_PORT=4791 SIMULATOR_UDID=<udid> node --test tests/native/switch.spec.ts`.
- **CI.** The Device specs jobs in `ci.yml` run the plan on a pull request and every spec on a `main` or `full` run, each on its own runner. The Android job blocks: `CI passed` reads it. The iOS job reports without blocking, since 3 of 20 measured runs failed with no real fault ([issue #119](https://github.com/floklein/rn-ui/issues/119)). Rerun a red iOS job once by hand (`gh run rerun <run> --failed`); its first result stays on the pull request, and a failure that repeats holds the merge until it's diagnosed. The built app is cached on the native dependencies and the build script, so a change to JavaScript alone takes about 3 minutes on Android and 9 on iOS.

The planner's own tests are in `apps/native-playground/test/device-plan.test.mjs` (`cd apps/native-playground && node --test test/device-plan.test.mjs`).

## Unit tests

`packages/*/test/*.test.ts` and `.test.tsx`, run by vitest in Node, with no browser:

- `packages/core/test`: the core's logic with no framework, like stores, ordering, positioning math, typeahead and each component's state machine. Some read budgets from `tests/perf/budgets.ts`, like `store-fanout.test.ts`.
- `packages/react/test`, `packages/solid/test` and `packages/svelte/test`: server rendering for each component (`*-ssr.test.tsx`), merged props, and the package's exports.
- `packages/vue/test`: server rendering for each component (`*-ssr.test.ts`), and which state changes render a part again (`slot-state.test.ts`).
- `packages/web/test`: attributes, properties and lifecycle of the elements, in jsdom. Their behavior in a browser is covered by the `web` projects.
- `apps/docs`: the docs site's helpers, like search and the setup prompts.

They run in the CI Unit tests job in the `affected`, `affected-engines`, `main` and `full` tiers.

```bash
scripts/test-slot.sh pnpm --filter "./packages/*" --filter ./apps/docs test  # Everything CI runs.
cd packages/core && ../../scripts/test-slot.sh npx vitest run test/order.test.ts  # One file.
cd packages/core && ../../scripts/test-slot.sh npx vitest run -t 'notifies two items'
```

`pnpm typecheck` runs in the same job. It checks every workspace, `tests/` included, and that the packages import types from other entries with `import type` (`scripts/check-type-imports.mjs`).

## Docs tests

`tests/docs/*.spec.ts`, with their own config, `tests/docs.config.ts`. Smoke tests against the docs site in every framework (React, Vue, Svelte, Solid and web components): every example renders and its controls work, every framework has the same examples, every public prop appears in at least one React example (`props.spec.ts`), demo links point somewhere real, spec lists say where tests run, and axe passes on the docs shell. Chromium only. Specs take `test` from `docs/docs-test.ts`, whose `page.goto` scrolls to each example, since examples load as they near the viewport, and waits until every one has replaced its prerendered HTML. It also stands in for Vercel's analytics scripts, which only Vercel serves. CI: `nightly` and `full`.

The config builds the examples first, then starts `next dev` locally or a production build in CI, on `DOCS_PORT`:

```bash
DOCS_PORT=5410 scripts/test-slot.sh pnpm test:docs
cd tests && DOCS_PORT=5410 ../scripts/test-slot.sh npx playwright test --config docs.config.ts menubar
```

`next dev` compiles each page on its first visit, which can take about 8 seconds, so a cold local run is slow.

## Bundle size

`pnpm size` (`scripts/size.mjs`) bundles every React, Vue, Svelte, Solid and web components entry from source the way an app's production build would: minified, core included, and `#dev` resolved without the `development` condition. React stays external. Svelte, Vue and Solid rows count the part of their runtime the entry adds to a bare app. Svelte rows compile components as `@sveltejs/vite-plugin-svelte` does, and Solid rows as `@solidjs/vite-plugin` does. A web components row imports the whole entry, since importing it defines its elements. A row is what a page loads up front: the entry's chunk and the chunks it imports statically. Code it loads with `import()`, like the sheet, gets its own `(lazy)` row and budget. An `import()` in code the build shakes out counts for nothing, as in Vite. The `(perf pages)` rows bundle every part the perf pages use in one entry, so shared code counts once, as in an app.

It compares each row's gzip size with `size-budget.json` and reports each row that grows more than 3% past its budget, or has none, in the CI job summary too. For now this is a report, not a failure; `pnpm size --strict` fails on it, and CI will run that again once sizes settle. It does fail, in every framework including web components, when production code contains strings only development code has, when an entry other than Field bundles Field code, and when an entry bundles a module it should never need, like a page with a component's basic parts bundling code for a part it doesn't render (`absent` and `minimalPages` in the script). The CI packages job runs it. After a change that shrinks or grows an entry on purpose, `pnpm size --update` writes the new budgets.

```bash
pnpm size            # Check, reporting growth past a budget.
pnpm size --strict   # Check, failing on growth past a budget.
pnpm size --update   # Write today's sizes as the budgets.
```

## Perf docs

`pnpm docs:perf` regenerates the catalog in [perf/README.md](perf/README.md) from `tests/perf/budgets.ts`. With `--check`, in the CI check job, it writes nothing and fails when the catalog is stale, when no test reads a budget, when a budget's `measures` or `why` is empty, or when a test links to a catalog anchor that doesn't exist.

```bash
pnpm docs:perf --check
```

## Coverage

`scripts/check-coverage.mjs`, part of `pnpm lint`, checks that every component in `packages/core/src/components` has a base, `a11y`, `rtl` and `ssr` spec, fixtures in all five frameworks, an entry in the leaks fixture, a core unit test, a docs page for every framework and a docs spec. A component without one lists it in `tests/coverage-exemptions.json` with a reason, or `todo` for coverage still to write. An exemption for something the component now has fails, so remove it in the same change that adds the coverage.

```bash
node scripts/check-coverage.mjs          # Check.
node scripts/check-coverage.mjs --list   # What each component is missing.
```

## Reading a failure

- **Locally.** The `list` reporter prints each failure with its project, file, line, the assertion's message and the expected and received values. Playwright writes each failed test's output to `tests/test-results/<file>-<title>-<project>/`, with `error-context.md` holding a snapshot of the page. Traces are off locally: add `--trace on`, then open one with `npx playwright show-trace <path>/trace.zip`. For an HTML report, add `--reporter html` and open it with `npx playwright show-report --port 9330`.
- **Skips.** "No `<fixture>` fixture for `<framework>`." means the framework has no fixture for that spec. That's expected for many components in `-data` and `-ssr`.
- **Flakes.** Reproduce with `--repeat-each 20` on your own port before changing anything. CI retries twice and reports a test that passed on a retry as flaky.
- **Count gates.** The message names what went over and links to the budget in the [perf catalog](perf/README.md). Rerun with `PERF_REPORT=1` to see every count.
- **CI.** The run's summary page lists failed and flaky tests with their project, file and line. The `playwright-report` artifact is the merged HTML report of every shard, with traces of retried tests. `docs-report` is the other. `blob-report-<engine>-<n>` artifacts are the raw shard reports, kept 3 days. Unzip a report and open it with `npx playwright show-report <folder> --port 9330`.
- **vitest.** Prints the failing assertion with a diff, and exits non-zero.

Where output lands:

| Output                       | Where                      | Kept                                  |
| ---------------------------- | -------------------------- | ------------------------------------- |
| Failed tests' output, traces | `tests/test-results/`      | Ignored by git                        |
| HTML reports                 | `tests/playwright-report/` | Ignored by git                        |
| CI shard reports             | `tests/blob-report/`       | Ignored by git, uploaded as artifacts |

Delete `test-results` and `playwright-report` after a run, since they grow.
