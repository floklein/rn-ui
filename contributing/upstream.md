# Taking Upstream Changes

This fork adds a native host beside `vercel-labs/ui` and keeps merging it. The native host restates in new files what upstream's code does on the DOM, so an upstream change to a mirrored rule never conflicts and never reaches native by itself. The native registry is how such a change gets noticed.

## The Registry

`packages/react-native/registry.json` holds:

- **`upstream`**: the upstream commit the fork last merged.
- **`entries`**: every twin, native behavior file, focus reroute and edit the fork made inside an upstream file. Each names its `file`, the upstream files it `mirrors`, the upstream commit it was last `reviewed` against, and `why`.
- **`components`**: each component with a native entry, and each of its slots that declares a hook the native adapter skips (`bind`, `on`, `connect`, `asleep`), marked as `covered` by a named file or as needing `nothing`, with a `reason`. A slot is keyed as `<primitive export>.<slot>`.
- **`pending`**: every component core exports that has no native entry yet. The parity check, the size check and the example check read this one list. A component upstream adds stays here, visibly incomplete, without turning the fork red.
- **`exemptions`**: each example of a web-only feature that native doesn't have, with the `feature` and the `reason`. An exemption never stands in for an example not yet written.

## Its Checks

Run from the repo root. Each exits 1 when it finds something.

```bash
node scripts/check-native-registry.mjs edits                      # Every upstream file the fork changed is in the registry.
node scripts/check-native-registry.mjs parity                     # Every component has a native entry with its slots marked, or is pending.
node scripts/check-native-registry.mjs drift --upstream upstream/main # Mirrored files upstream changed since their recorded commit.
node scripts/check-native-examples.mjs                            # Native has every example the other frameworks have, or an exemption.
node scripts/probe-no-document.mjs                                # Every primitive with no document: what throws, by component.
```

With no command, `check-native-registry.mjs` runs `edits` and `parity`. `@ui-sdk/react-native`'s Jest tests run all of them.

When you add a twin, a native behavior file or a reroute, or edit a file upstream owns, add its entry in the same change. When a component gets its native entry, take it out of `pending` and mark its slots.

## Merging Upstream

1. Add the remote once: `git remote add upstream https://github.com/vercel-labs/ui.git`, then `git fetch upstream`.
2. On `main`, merge with a merge commit, never a rebase, so the commits the registry records stay in the history: `git merge upstream/main`.
3. Resolve conflicts in the files the registry lists as `edit` or `reroute` by keeping upstream's change and putting the fork's edit back. For `pnpm-lock.yaml`, take upstream's and run `pnpm install`.
4. Run the drift check: `node scripts/check-native-registry.mjs drift --upstream upstream/main`. For each file it lists, read upstream's change (`git diff <reviewed> upstream/main -- <file>`) and update the native files it names so they still behave as the rule they mirror.
5. Once each listed file is reviewed, set its entries' `reviewed`, and the registry's `upstream`, to the upstream commit you merged. Run the drift check again: it lists nothing.
6. Run the other registry checks, then the web gates the repo already has (`pnpm lint`, `pnpm format`, `pnpm typecheck`, the unit tests, `pnpm check:packages --build`, `pnpm test:pr`), then the native Jest-level checks: `cd packages/react-native && ../../scripts/test-slot.sh npx jest`.
7. Run the sweep of every device spec, since a merge touches shared code.
