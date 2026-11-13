# @ui-sdk/core

## 0.1.0-beta.2

### Patch Changes

- d699609: A modal opened while another modal is open, like `confirm()` from a button inside a dialog, is no longer made inert by the one underneath, wherever its markup sits, wherever focus was and however soon after the other one it opened.
- c53df2f: When two cookies share a name, the preferences script now reads the same one as the server and the client, the first, so the value no longer changes after hydration.

## 0.1.0-beta.1

### Minor Changes

- Initial release
