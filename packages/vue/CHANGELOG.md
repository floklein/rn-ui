# @ui-sdk/vue

## 0.1.0-beta.2

### Patch Changes

- da11a08: The Nuxt module pre-bundles every `@ui-sdk/core` entry in one pass, so an app that imports from `@ui-sdk/core` or one of its entries no longer loads a second copy of it in `nuxt dev`.
- 3aa0973: A `SelectTrigger` connected through `controller` outside its `Select`, inside a `Field`, takes the field's control id and label in the server HTML, so the `FieldLabel` points at it before the page hydrates.
- Updated dependencies [d699609]
- Updated dependencies [c53df2f]
  - @ui-sdk/core@0.1.0-beta.2

## 0.1.0-beta.1

### Minor Changes

- Initial release
