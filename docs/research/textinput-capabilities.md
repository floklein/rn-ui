# What TextInput gives for selection, composition and the caret

Research for [issue #25](https://github.com/floklein/rn-ui/issues/25). It feeds the decision "How text entry components work on TextInput".

- **Date:** 2026-11-13.
- **React Native:** 0.88.1, tag `v0.88.1`, commit `c30b7f86`, released 2026-10-27. Every React Native fact below holds for that tag unless it names another version. The repository now lives at `react/react-native`; `facebook/react-native` redirects there.
- **Architecture:** New Architecture (Fabric) only. The iOS view is `RCTTextInputComponentView`, the Android view is `ReactEditText`.
- **Core:** this repo at `d101ca04`.
- **Expo SDK 58:** not checked. Nothing here depends on Expo.

How to read the marks:

- **[V]** verified: I read it in the source or the official documentation at the version stated.
- **[I]** inferred: it follows from the source, but nothing states it and I did not run it.
- **[Device]** only a device can confirm it. All of these are gathered again in [To confirm on a device](#to-confirm-on-a-device).

No simulator or emulator was used. Nothing in this file was observed at run time.

## The answer in short

`TextInput` reports what happened to the text. It never asks first. The web components in core lean on the opposite: `beforeinput` lets them refuse or rewrite an edit before the browser draws it. That one difference decides most of the design.

1. **Selection** can be read and set on both platforms, but only through events and commands that cross threads. There is no synchronous getter and no selection direction.
2. **A controlled value flickers** whenever JS answers an edit with a different text, because the native view has already drawn the edit. `maxLength` and `editable` are the only filters that run natively.
3. **Composition is invisible.** There is no composition event and no `isComposing` flag on either platform.
4. **`onKeyPress` is a text-change report, not a key event.** It never reports arrows, Home, End or modifiers, it cannot cancel anything, and on Android it ignores hardware keyboards.
5. **The caret's rectangle is not exposed** on either platform.
6. **Keyboard types, autofill hints, secure entry and one-time-code autofill are well covered** by props that map straight onto UIKit and Android features.

What follows from that, for the decision. This part is my reading of the findings, not a finding:

- Input, PasswordInput and OTPInput port cleanly, with small losses.
- NumberInput and DateInput must change from "refuse the edit" to "accept, then correct", and will show the rejected character for a moment.
- TokenInput and TriggerMenu lose their two foundations, atomic tokens inside editable text and a caret rectangle, and need a different design or a documented approximation.

## What core's text components rely on

Read from `packages/core/src` at `d101ca04`. A dash means the component does not use the capability.

| Component            | Selection ranges                                                        | `beforeinput`                                                                                            | Composition                                                                           | Caret rectangle                                  | `inputmode`                     | `autocomplete`                     | Paste handling                       | Segments with their own focus                              |
| -------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------- | ---------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Input, Textarea      | Puts the caret back after a canceled change                             | —                                                                                                        | Waits for the IME, listens to `compositionend`; the submit shortcut skips composition | —                                                | Through `inputHints`            | Through `inputHints`               | —                                    | —                                                          |
| NumberInput          | Reads the selection to build the text an insert would give; selects all | Cancels an insert that could not become a number                                                         | Skips composing inserts                                                               | —                                                | Computed per platform           | `off`                              | Through `beforeinput`                | —                                                          |
| OTPInput             | Reads and writes on every change; the selection is the active slot      | Cancels inserts of several characters or of a character that does not fit                                | `isComposing`, `compositionend`                                                       | —                                                | From the pattern                | `one-time-code`                    | `paste` event and `clipboardData`    | No: one real input under the slots                         |
| DateInput, TimeInput | Selects the whole segment on focus                                      | Cancels every edit and applies it itself                                                                 | Lets the IME write, then adopts the digits                                            | —                                                | `numeric` or `text` per segment | `off`                              | `paste` event, parses a whole date   | Yes: each segment is an input, and focus advances          |
| PasswordInput        | Saves start, end and direction, restores them when the type switches    | —                                                                                                        | Through the text field                                                                | —                                                | —                               | `current-password`, `new-password` | —                                    | —                                                          |
| TokenInput           | Maps the DOM selection to offsets and back                              | The centre of it: cancels deletions, new lines, replacements, undo and redo, and reads `getTargetRanges` | Tracked, never canceled                                                               | `Range.getBoundingClientRect`                    | —                               | —                                  | Own copy, cut and paste with a codec | Tokens are non-editable hosts inside one `contenteditable` |
| TriggerMenu          | `textBefore` and `selection` through the editor adapter                 | Snapshots the text to diff the edit                                                                      | Never opens or acts while composing                                                   | Mirror element, or Chromium's `createValueRange` | —                               | —                                  | A paste is one user edit             | —                                                          |

Where each cell comes from:

- **Text field** (`foundation/forms/text-field.ts`): a canceled change writes the old value back and restores the caret (L103–126); it returns early while `isComposing` (L119) and listens to `compositionend` (L165).
- **Value writes** (`foundation/forms/value.ts`): a write "as the user" goes through the prototype setter and fires `input` (L62–74).
- **Input** (`components/input/input.ts`): the submit shortcut (L259–284) and the textarea's fit to its content (L204–216).
- **Hints** (`foundation/forms/input-hints.ts`): the per-kind table of `inputMode`, `enterKeyHint`, `autoComplete`, `autoCapitalize`, `autoCorrect` and `spellCheck` (L60–100).
- **NumberInput** (`components/number-input/number-input-api.ts`): `inputMode` (L123–137), `beforeinput` (L314–333), keys with `preventDefault` (L375–401).
- **OTPInput** (`components/otp-input/otp-input-api.ts`): the design note (L1–4), selection sync (L306–338), `typed` (L342–378), the undo-keeping insert through `execCommand` (L396–417), `beforeinput` (L512–528), `paste` (L529–536), arrow keys (L549–573), `selectionchange` (L585–588). Attributes are in `otp-input.ts` L261–270.
- **DateInput** (`components/date-input/date-input-api.ts`): focus advance (L423–435), `paste` (L468–485), `keydown` (L487–516), `beforeinput` (L520–542), `adopt` (L546–577). Segment attributes and select-on-focus are in `date-input-parts.ts` L283–298 and L329–337.
- **PasswordInput** (`components/password-input/password-input.ts`): `showText` keeps the selection through the type switch (L213–239), the toggle restores it (L345–361), caps lock comes from `getModifierState` (L364–366), the selection is saved on blur (L367–376).
- **TokenInput**: the DOM shape (`token-input-view.ts` L1–9), selection (L327–361), `rectAt` (L366–409); `beforeinput` (`token-input-editing.ts` L178–223), target ranges (L226–235), clipboard (L378–420), composition (L487–497).
- **TriggerMenu**: the adapter contract (`foundation/text/text-editor.ts` L73–96); the field adapter (`foundation/text/caret.ts`): mirror measurement (L40–70), `createValueRange` (L80–93), undoable replace (L161–184), events (L205–290); keys (`components/trigger-menu/trigger-menu-keyboard.ts`); composition guard (`trigger-menu-api.ts` L502); caret anchor (L747–754).

Three more things the web components use that are not text capabilities but matter here: a cancelable `keydown` for arrows, Home, End, Enter, Tab and Escape; programmatic edits that keep the browser's undo stack (`execCommand("insertText")`); and form participation (submit, reset, `minlength`, `pattern`, `validity`).

## What TextInput offers

### Reading and setting the selection

**Reading.**

- `onSelectionChange` reports `{selection: {start, end}}` on both platforms **[V]** ([`TextInput.flow.js`][flow] L87–97).
- Since 0.85, `onChange` carries the same `selection` next to `text`, so one event gives both **[V]** ([changelog][changelog], 0.85.0; iOS in [`TextInputEventEmitter.cpp`][emitter] L145–148; Android in [`ReactTextChangedEvent.kt`][changedevent] L25–37).
- There is no synchronous getter. The instance has `focus`, `blur`, `clear`, `isFocused`, `getNativeRef` and `setSelection`, and nothing that returns the selection or the value **[V]** ([`TextInput.flow.js`][flow] L1050–1064).
- `start` is never greater than `end`, and there is no direction. Android normalizes the pair explicitly **[V]** ([`ReactTextSelectionWatcher.kt`][selwatcher] L27–45).
- Android only emits the event while the field has focus, and only if the handler is set **[V]** ([`ReactEditText.kt`][edittext] L501–510; [`ReactTextInputManager.kt`][manager] L297–304).
- On iOS the selection event follows the change event. The adapter fires it after `textFieldDidChange`, and for multiline it forces the change out first **[V]** ([`RCTBackedTextInputDelegateAdapter.mm`][adapter] L132–139, L341–349). The order on Android is not fixed by RN's code **[Device]**.

**Setting.**

- The `selection` prop and `ref.setSelection(start, end)` both end in the native command `setTextAndSelection` **[V]** ([`TextInput.js`][js] L201–231, L373–383; [`TextInputNativeCommands.js`][commands] L15–25). The 0.88 documentation page lists `focus`, `blur`, `clear` and `isFocused` but not `setSelection` **[V]** ([docs][docs]).
- The command carries the last event count JS has seen. If the native view has moved on, it drops the command: iOS requires an exact match, Android requires JS not to be behind **[V]** ([`RCTTextInputComponentView.mm`][componentview] L590–620; [`ReactEditText.kt`][edittext] L469–487, L740). So a selection set while the user is typing can be lost. The next event repeats the attempt for the `selection` prop, but not for a one-off `setSelection` call.
- `selectTextOnFocus` selects everything on focus, on both platforms **[V]** ([`TextInput.flow.js`][flow] L963–966).
- Offsets are UTF-16 code units on both platforms, the same unit as a JS string index **[I]** (`NSString` and Java `CharSequence` offsets).

### Controlled values and the flicker they cause

The native view owns the text. The path of one keystroke:

1. The view applies the edit and draws it. iOS answers `YES` to every proposed change **[V]** ([`RCTTextInputComponentView.mm`][componentview] L491–494). Android hears about it in a `TextWatcher`, after the text has changed **[V]** ([`ReactTextInputTextWatcher.kt`][textwatcher] L31–69).
2. The view raises its event count and sends `onChange`.
3. JS renders. If `value` differs from the text the view reported, an effect sends `setTextAndSelection` with the new text **[V]** ([`TextInput.js`][js] L201–231).
4. The view applies it only if no newer edit has happened (the gate described above).

So when JS answers with a different text, such as a refused character, a formatted number or a mask, the user sees the unwanted text until step 4 lands. The documentation says so and names the only two native ways around it: "either set `editable={false}`, or set/update `maxLength` to prevent unwanted edits without flicker" **[V]** ([`TextInput.flow.js`][flow] L1021–1030; [docs][docs]).

Details that matter:

- When JS echoes the same text, nothing is sent and nothing flickers **[V]** ([`TextInput.js`][js] L204).
- After a programmatic text change with a collapsed selection, both platforms keep the caret at the same distance from the end of the text, unless a `selection` is given **[V]** ([`RCTTextInputComponentView.mm`][componentview] L791–818; [`ReactTextInputManager.kt`][manager] L203–222). That is right for an edit before the caret and wrong for most formatting, so a formatter has to send its own selection.
- `clear()` is the only imperative write. Everything else goes through `value` **[V]** ([`TextInput.js`][js] L351–361).
- 0.89.0-rc.0 reworks how iOS applies an edit that was transformed inside the delegate callback, which is the `maxLength` truncation, behind a runtime gate **[V]** ([changelog][changelog], commit `6f67e185`). I did not read whether it changes anything for rewrites that come from JS.
- How long the wrong text stays on screen depends on the device and on how busy the JS thread is **[Device]**.

### Composition and IME input

- There is no `onCompositionStart`, `onCompositionUpdate` or `onCompositionEnd`, and no `isComposing` in `onChange`, `onSelectionChange` or `onKeyPress`, on either platform **[V]** (event types in [`TextInput.flow.js`][flow] L28–140; a search of the JS, iOS and Android TextInput sources finds composition only in internal native code).
- iOS reads `markedTextRange` internally, and only to decide how to compare texts. While text is marked, during dictation, with a Korean keyboard and in secure fields, it compares bare strings, because replacing the attributed text "will break input mechanism" **[V]** ([`RCTTextInputComponentView.mm`][componentview] L873–906). Apple defines marked text as "provisionally inserted text that requires user confirmation" **[V]** ([Apple: `markedTextRange`][apple-marked]).
- Android keeps the spans of the current text when JS replaces it, and has a workaround for keyboards that do not clear composing text **[V]** ([`ReactEditText.kt`][edittext] L742–796).
- The consequence: JS receives the composing text as ordinary `onChange` events **[I]**. If JS echoes it, composition survives. If JS answers with a different text in the middle of a composition, the native text is replaced under the IME and the composition can break **[I]** **[Device]**.
- The usual workaround is to never rewrite the text while the user may be composing: validate on blur or on submit, or only strip characters an IME would never produce. There is no JS-only way to know that a composition is in progress.

### `onKeyPress` and which keys it reports

`onKeyPress` is derived from text changes. It is not a keyboard event. Its payload is `{key, eventCount}`, with no modifiers, no code and no repeat **[V]** ([`TextInput.flow.js`][flow] L99–111). It is sent to JS asynchronously and cannot cancel the edit on either platform.

|                              | iOS                                                                                                                                                                                                                                                                           | Android                                                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source                       | The proposed replacement text of each change **[V]** ([`RCTTextInputComponentView.mm`][componentview] L455–467)                                                                                                                                                               | The soft keyboard's `InputConnection` calls **[V]** ([`ReactEditTextInputConnectionWrapper.kt`][icwrapper] L17–47)                                                                   |
| A typed character            | The replacement string, which can be several characters for a predictive or autocorrected word **[I]**                                                                                                                                                                        | The committed text if it is one or two UTF-16 units; longer commits are ignored. While composing, the character before the caret, guessed from how the caret moved **[V]** (L72–107) |
| `Backspace`                  | An empty replacement. In an empty single-line field it comes from a private UIKit hook **[V]** ([`TextInputEventEmitter.cpp`][emitter] L112–135; [`RCTBackedTextInputDelegateAdapter.mm`][adapter] L148–154)                                                                  | `deleteSurroundingText`, a delete key event, or a caret that moved back while composing **[V]** (L84–91, L109–123)                                                                   |
| `Enter`                      | Only when a new line reaches the text: multiline with `submitBehavior="newline"`. A single-line field and a submitting multiline field handle Return before the key press is sent **[I]** ([`RCTBackedTextInputDelegateAdapter.mm`][adapter] L123–128, L283–296) **[Device]** | A new line, or an Enter key event from the keyboard **[V]** (L118–131, L141–145)                                                                                                     |
| `Tab`, `Escape`              | Reported when the replacement text starts with a tab or an escape character, which needs a hardware keyboard **[V]** ([`TextInputEventEmitter.cpp`][emitter] L122–130) **[Device]**                                                                                           | Not reported                                                                                                                                                                         |
| Arrows, Home, End, modifiers | Never: they change no text                                                                                                                                                                                                                                                    | Never                                                                                                                                                                                |
| Paste                        | Suppressed on purpose **[V]** ([`RCTTextInputComponentView.mm`][componentview] L459; [`RCTUITextField.mm`][textfield] L262–266)                                                                                                                                               | Not reported: a menu paste bypasses the `InputConnection`, and a keyboard paste commits more than two units **[I]**                                                                  |
| Hardware keyboard            | Characters, yes, since they change text **[I]** **[Device]**                                                                                                                                                                                                                  | No. The docs say "only the inputs from soft keyboard are handled" **[V]** ([docs][docs])                                                                                             |
| Several edits at once        | One event per change                                                                                                                                                                                                                                                          | Inside a batch edit only the last key is sent, "but it's completely arbitrary" **[V]** (L35–40, L58–70)                                                                              |

Android's wrapper is only installed if `onKeyPress` was set when the keyboard connected to the field **[V]** ([`ReactEditText.kt`][edittext] L362–380).

**Real key events.** `View`, and so `TextInput`, declares `onKeyDown` and `onKeyUp` with `key`, `code`, modifiers, `repeat` and `isComposing` **[V]** ([`ViewPropTypes.js`][viewprops] L131–136; [`CoreEventTypes.js`][coreevents] L329–358). In 0.88 this is not usable:

- Only Android implements it, since 0.84 **[V]** ([changelog][changelog]; [`JSKeyDispatcher.kt`][keydispatcher]). A search of the iOS sources finds no emitter **[V]**.
- It sits behind the feature flag `enableKeyEvents`, which defaults to `false` and has `ossReleaseStage: 'none'` **[V]** ([`ReactNativeFeatureFlags.config.js`][flags] L426–436; [`ReactRootView.java`][rootview] L429–433).
- The Android payload fills `key`, `code` and the four modifiers. It sets neither `repeat` nor `isComposing`, and the event is sent before the view handles the key, with no way to stop it **[V]** ([`KeyEvent.kt`][keyevent]; [`ReactRootView.java`][rootview] L338–343).

Arrow-key behavior inside a field therefore has no JS-only path on iOS, and none on Android without turning on an experimental flag.

### Filtering and formatting as the user types

There is no `beforeinput`: no way to see an edit before it is applied, to cancel it, or to learn what kind of edit it was. What exists:

- **`maxLength`** is enforced natively on both platforms. iOS truncates a paste to fit and does not split an emoji; Android uses a `LengthFilter` **[V]** ([`RCTTextInputComponentView.mm`][componentview] L469–486; [`ReactTextInputManager.kt`][manager] L617–656).
- **`editable={false}`** stops edits natively.
- **`keyboardType`** chooses the keys shown. It does not restrict the text. A paste, autofill or a hardware keyboard can insert anything, and on Android RN replaces the key listener with one that "permits all keyboard input through" for every input type **[V]** ([`ReactEditText.kt`][edittext] L619–626, L1310–1347). UIKit has a veto of its own, the delegate method Apple documents "to prevent the user from entering anything but numerical values" **[V]** ([Apple: `shouldChangeCharactersIn`][apple-shouldchange]), but RN keeps it for itself.
- **`autoCapitalize="characters"`** asks the keyboard for capitals. It is a hint, not a transform.
- **Everything else is "accept, then correct"**: compute the allowed text in `onChangeText` and render it as `value`. That is the flicker path above.

To know what an edit did, diff the previous text against the new one, with the `selection` that `onChange` carries. Core already has that function, `textDiff` in `foundation/text/caret.ts` (L138–155), and it is pure.

What JS-only libraries do:

- `react-native-mask-input` formats in `onChangeText`, passes the masked text back as `value`, and accepts the flicker. It only sets `selection` when the value is obfuscated **[V]** ([source][lib-mask]).
- `react-native-otp-entry` ignores a change that does not fit by not updating its state, which makes RN write the old value back **[V]** ([source][lib-otp-hook] L40–49).

### The caret's position on screen

Not available **[V]**. No prop, event or method returns a caret or selection rectangle. Both native views override `caretRectForPosition` only to hide the caret ([`RCTUITextField.mm`][textfield] L213–220; [`RCTUITextView.mm`][textview] L371–378), and iOS uses `selectionRectsForRange` only to scroll the field above the keyboard ([`RCTTextInputComponentView.mm`][componentview] L152–175). UIKit can answer the question (`caretRect(for:)`, `firstRect(for:)`) **[V]** ([Apple: `caretRect(for:)`][apple-caretrect]), and so can Android's text layout, but nothing carries the answer to JS.

What can be measured from JS:

- The field's own box: `measureInWindow` and `getBoundingClientRect` on the element **[V]** ([`ReactNativeElement.js`][element] L214; [`ReadOnlyElement.js`][readonlyelement] L190).
- The content height of a multiline field, from `onContentSizeChange`, and its scroll offset, from `onScroll` **[V]** ([`TextInput.flow.js`][flow] L829–836, L885–890).
- The lines of a `<Text>`: `onTextLayout` gives each line's `x`, `y`, `width`, `height` and `text` **[V]** ([`CoreEventTypes.js`][coreevents] L64–86; [`TextProps.js`][textprops] L206–207).

The usual workarounds:

1. **Anchor to the field, not the caret.** Put the menu above or below the input. `react-native-controlled-mentions` returns the matched keyword and leaves the suggestions list to the app; it computes no caret position **[V]** ([source][lib-mentions]).
2. **A mirror `<Text>`**, the same idea as core's mirror element: render the text up to the caret in a hidden `<Text>` with the field's style and width, and read the last line from `onTextLayout`. This is an estimate. A field and a `<Text>` are laid out by different native classes, a single-line field's horizontal scroll is not reported, and the measurement arrives a frame late **[I]** **[Device]**.

`createInputHistory` also needs caret rectangles, to tell whether the caret is on the first or last visual row of a wrapped line (`foundation/text/input-history.ts` L34–59). The same limit applies to it.

### Keyboard types and autofill hints

**Web names work.** `TextInput` takes `inputMode`, `enterKeyHint`, `autoComplete` and `readOnly` and maps them itself **[V]** ([`TextInput.js`][js] L696–716, L934–961):

| `inputMode` | `keyboardType`                                 | iOS **[V]** ([`RCTTextInputUtils.mm`][utils] L109–145)                                                              | Android **[V]** ([`ReactTextInputManager.kt`][manager] L736–768, L1133–1137) |
| ----------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `text`      | `default`                                      | `UIKeyboardTypeDefault`                                                                                             | `TYPE_CLASS_TEXT`                                                            |
| `numeric`   | `number-pad`                                   | `UIKeyboardTypeNumberPad`                                                                                           | `TYPE_CLASS_NUMBER`                                                          |
| `decimal`   | `decimal-pad`                                  | `UIKeyboardTypeDecimalPad`                                                                                          | number, with the decimal flag                                                |
| `tel`       | `phone-pad`                                    | `UIKeyboardTypePhonePad`                                                                                            | `TYPE_CLASS_PHONE`                                                           |
| `email`     | `email-address`                                | `UIKeyboardTypeEmailAddress`                                                                                        | text, email variation                                                        |
| `url`       | `url`                                          | `UIKeyboardTypeURL`                                                                                                 | URI variation, see the bug below                                             |
| `search`    | `web-search` on iOS, `default` on Android      | `UIKeyboardTypeWebSearch`                                                                                           | `TYPE_CLASS_TEXT`                                                            |
| `none`      | `default`, with `showSoftInputOnFocus={false}` | An empty input view: no keyboard, the caret still blinks ([`RCTTextInputComponentView.mm`][componentview] L856–871) | The soft keyboard is not shown                                               |

- **A minus sign.** `keyboardType="numeric"` is a different value from `inputMode="numeric"`. On Android it is a signed decimal number; on iOS it is the decimal pad, which has no minus key. The iOS keyboard with digits and a minus is `numbers-and-punctuation` **[V]**. Android defines the flags as "allowing a positive or negative sign at the start" and "allowing a decimal point" **[V]** ([Android: `InputType`][android-inputtype]). Core's NumberInput already picks its `inputmode` per platform for this reason (`number-input-api.ts` L120–137).
- **A Return key on iOS number pads.** They have none. RN adds an accessory bar with one button when `returnKeyType` or `inputAccessoryViewButtonLabel` is set **[V]** ([`RCTTextInputComponentView.mm`][componentview] L666–719).
- **`enterKeyHint`** maps to `returnKeyType`; `previous` exists only on Android **[V]** ([`TextInput.js`][js] L696–704; [`ReactEditText.kt`][edittext] L1008–1027).
- **A bug in 0.88.** On Android, `keyboardType="url"` and `"visible-password"` produce an input type with no text class. 0.89.0-rc.0 fixes both **[V]** ([`ReactTextInputManager.kt`][manager] L758–766; [changelog][changelog]). What the user sees in 0.88 was not checked **[Device]**.
- **A known issue:** Android does not support `secureTextEntry` with `keyboardType="email-address"` or `"phone-pad"` **[V]** ([docs][docs], Known issues).

**Autofill.** `autoComplete` takes the HTML names and translates them per platform **[V]** ([`TextInput.js`][js] L719–790):

- **iOS:** to a `UITextContentType`. `textContentType`, if also given, wins **[V]** (L952–961; [`RCTTextInputUtils.mm`][utils] L181–255). `off` maps to `none`. The newer values need iOS 17 **[V]** ([`TextInput.flow.js`][flow] L536–568). Apple: setting the content type "improves the performance of Password AutoFill's heuristics" **[V]** ([Apple: Password AutoFill][apple-autofill]).
- **Android:** to an autofill hint through `View.setAutofillHints`, on API 26 and later. `null`, `off` and unknown values set `IMPORTANT_FOR_AUTOFILL_NO` **[V]** ([`ReactTextInputManager.kt`][manager] L289–295, L658–670, L1075–1126). 0.86 extended the list of Android hints **[V]** ([changelog][changelog]).

Every `autoComplete` value core's `inputHints` uses has a mapping on both platforms: `email`, `tel`, `one-time-code`, `name`, `username`, `current-password`, `new-password`, `postal-code` and `off`. The exception is `url`, which is iOS only: Android has no hint for it, logs a warning and turns autofill off for the field **[V]**.

`autoCapitalize` and `autoCorrect` exist on both platforms. `spellCheck` is iOS only **[V]** ([`TextInput.flow.js`][flow] L343–349, L517–524, L681–684).

### Secure entry

- `secureTextEntry` is one prop on both platforms. It "does not work with `multiline={true}`" **[V]** ([`TextInput.flow.js`][flow] L943–947).
- **iOS:** it sets `secureTextEntry` on the field. Apple: it "disables the user's ability to copy the text", "in some cases" prevents recording, and in a `UITextField` "enables a password-style experience" **[V]** ([Apple: `isSecureTextEntry`][apple-secure]). When the prop changes, RN clears and re-sets the text to work around a trailing-space bug **[V]** ([`RCTUITextField.mm`][textfield] L120–134). Where the caret lands after that was not checked **[Device]**.
- **Android:** it sets the password variation of the input type, text or numeric **[V]** ([`ReactTextInputManager.kt`][manager] L697–710, L1187–1199), and restores the selection when the input type changes **[V]** ([`ReactEditText.kt`][edittext] L563–571). 0.87 keeps the brief reveal of the last typed character when JS echoes the same text **[V]** ([changelog][changelog]).
- **Autofill and saved passwords:** `autoComplete="current-password"` or `"new-password"` on both platforms, and `passwordRules` on iOS for generated passwords **[V]** ([`TextInput.flow.js`][flow] L319–326).
- **Showing and hiding** is a toggle of the same prop, as on the web. Core restores the selection by hand after the switch (`password-input.ts` L213–239). On RN that would be a `setSelection` call, with the event-count gate described above.
- **Not available:** caps lock state. Nothing reports modifier state on iOS, and Android's key events are off by default.
- **Not checked:** whether an iOS secure field clears its text on the first edit after it regains focus. That is UIKit behavior, not RN code **[Device]**.

### One-time-code autofill

- **iOS:** `autoComplete="one-time-code"` or `textContentType="oneTimeCode"` sets `UITextContentTypeOneTimeCode`, which exists since iOS 12 **[V]** ([`TextInput.js`][js] L782; [`RCTTextInputUtils.mm`][utils] L217; [Apple: `oneTimeCode`][apple-otp]). Apple: "you can autocomplete security codes from single-factor SMS login flows", and "leverage the system keyboard rather than implementing a keyboard directly in your app's view hierarchy" **[V]** ([Apple: Password AutoFill][apple-autofill]). So a custom keypad, or `inputMode="none"`, gives the suggestion up **[I]**.
- **Android:** `autoComplete="one-time-code"` becomes `sms-otp`, which sets the hint `AUTOFILL_HINT_SMS_OTP` (`"smsOTPCode"`) **[V]** ([`TextInput.js`][js] L742; [`ReactTextInputManager.kt`][manager] L1117; [Android: `HintConstants`][android-hints]). It is a hint to the user's autofill service. Whether a code is offered depends on that service **[I]** **[Device]**.
- **One field for the whole code.** Android's documentation suggests a per-character hint for a field per digit, `generateSmsOtpHintForCharacterPosition`. RN cannot express it: any value outside its table turns autofill off for the field **[V]** ([`ReactTextInputManager.kt`][manager] L665–668). iOS inserts a suggested code into the focused field. Core's design, "one real `<input>` holds the whole code", is the shape that fits both platforms.
- **Not available without native code:** Google's SMS Retriever API, which reads the message "without requiring the user to manually type verification codes", and the SMS User Consent API. Both belong to Google Play services **[V]** ([Google: SMS Retriever][google-retriever]; [Google: choose an API][google-choose]).

What JS-only libraries do **[V]**:

- `react-native-otp-entry`: one `TextInput` laid over the cells with `StyleSheet.absoluteFill`, with `maxLength`, `textContentType="oneTimeCode"`, and `autoComplete` set to `sms-otp` on Android and `one-time-code` on iOS. The caret is hidden on iOS ([source][lib-otp] L110–128).
- `react-native-confirmation-code-field`: the same, with `caretHidden`. A tap on a cell is located from the press coordinates and clears the code from that cell on ([source][lib-ccf]; [`useClearByFocusCell.ts`][lib-ccf-clear]). Its source notes that with the caret hidden and an empty value, the paste menu does not appear.

Neither library moves the selection onto a slot the way core's OTPInput does. Both always type at the end.

### Paste, undo, tokens and segments

- **Paste.** There is no paste event and no `clipboardData` **[V]**. iOS only records that a paste happened, to suppress the key press; Android turns the menu's Paste into "paste as plain text" **[V]** ([`ReactEditText.kt`][edittext] L386–389). A paste is an ordinary change. A change that adds several characters at once may be a paste, autofill, a keyboard suggestion or dictation, and JS cannot tell them apart. Core's "a whole code replaces the value" rule for OTP (`otp-input-model.ts` L112–130) works on that signal alone.
- **Clipboard.** `Clipboard` is still exported from `react-native` in 0.88, but it warns that it "will be removed in a future release" **[V]** ([`index.js`][index] L243–251). TokenInput's own copy and cut would need it or a native module.
- **Undo.** RN has no undo API or event. A programmatic write replaces the whole text on both platforms **[V]** ([`RCTTextInputComponentView.mm`][componentview] L791–818; [`ReactEditText.kt`][edittext] L742–796). What that does to the platform's undo stack was not checked **[Device]**. The undo-keeping insert core does with `execCommand` has no counterpart.
- **Styled runs.** A `TextInput` can take nested `<Text>` children instead of `value`, which styles ranges of the text. On Android, `value` and children together throw **[V]** ([`TextInput.js`][js] L626–634). `react-native-controlled-mentions` highlights mentions this way and tracks the selection in state from `onSelectionChange` **[V]** ([source][lib-mentions]).
- **Atomic tokens.** The styled runs stay ordinary editable characters. There is no non-editable inline host, and no inline view inside the editable text **[I]**. One keystroke removing one token has to be emulated by rewriting the text after the edit, with the flicker and the composition risk above.
- **Segments with their own focus.** Several `TextInput`s work, and `focus()` moves between them on both platforms **[V]**. `Backspace` in an empty single-line field is reported on both, which gives the move back to the previous segment. Arrow keys between segments are not available. Moving focus to a field with another `keyboardType` swaps the keyboard, which the user sees **[I]** **[Device]**.
- **Forms.** There is no form, so no submit, reset, `minlength`, `pattern` or `validity`. `onSubmitEditing` and `submitBehavior` cover the Return key **[V]** ([`TextInput.flow.js`][flow] L879–883, L982–1000).

## Gaps, one DOM capability at a time

"Yes" means the capability exists with the same strength as on the web. "Partly" means a weaker form exists. "No" means nothing does.

| DOM capability                                                          | iOS                                                | Android                                           | Usual workaround without native code                                                                                    |
| ----------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Read the selection (`selectionStart`, `selectionchange`)                | Partly: events only                                | Partly: events only, while focused                | Keep the last `selection` from `onChange` and `onSelectionChange` in state                                              |
| Set the selection (`setSelectionRange`, `select()`)                     | Partly: asynchronous, dropped if the view is ahead | Same                                              | `selection` prop or `setSelection`; `selectTextOnFocus` for select-all                                                  |
| Selection direction                                                     | No                                                 | No                                                | Do without                                                                                                              |
| `beforeinput`: cancel or rewrite an edit before it shows                | No                                                 | No                                                | `maxLength` and `editable` natively; otherwise accept the edit, then write the corrected `value` and accept the flicker |
| `inputType`, `data`, `getTargetRanges`                                  | No                                                 | No                                                | Diff the previous and new text with the selection                                                                       |
| Composition events, `isComposing`                                       | No                                                 | No                                                | Do not rewrite the text while typing; validate on blur or submit                                                        |
| Caret rectangle                                                         | No                                                 | No                                                | Anchor to the field's box; or estimate with a mirror `<Text>` and `onTextLayout`                                        |
| `inputmode`, `enterkeyhint`                                             | Yes                                                | Yes (`url` is broken in 0.88)                     | `inputMode`, `enterKeyHint`, or `keyboardType` for a signed number                                                      |
| `autocomplete`                                                          | Yes                                                | Yes, API 26 and later                             | `autoComplete` with the HTML names                                                                                      |
| One-time-code autofill                                                  | Yes, with the system keyboard                      | Partly: a hint to the autofill service            | One field for the whole code, with `autoComplete="one-time-code"`                                                       |
| `paste` event, `clipboardData`                                          | No                                                 | No                                                | Treat a multi-character insert as a possible paste                                                                      |
| Cancelable `keydown` (arrows, Home, End, Enter, Tab, Escape, modifiers) | No                                                 | No (a flagged, non-cancelable `onKeyDown` exists) | `onSubmitEditing` for Return; `onKeyPress` for `Backspace` in an empty field; on-screen buttons for the rest            |
| Programmatic edit that keeps undo (`execCommand`)                       | No                                                 | No                                                | Do without                                                                                                              |
| Password type switch keeping the selection                              | Partly                                             | Partly                                            | Toggle `secureTextEntry`, then `setSelection`                                                                           |
| Caps lock state                                                         | No                                                 | No                                                | Do without                                                                                                              |
| Several inputs with their own focus                                     | Yes, without arrow keys                            | Yes, without arrow keys                           | One `TextInput` per segment and `focus()`; or one field for the whole value                                             |
| `contenteditable` with non-editable tokens                              | No                                                 | No                                                | Styled `<Text>` children plus rewriting after each edit; or tokens outside the text                                     |
| Textarea that fits its text                                             | Yes **[I]**                                        | Yes **[I]**                                       | `multiline`, with `onContentSizeChange` if the height is needed                                                         |
| Form submit, reset and validity                                         | No                                                 | No                                                | `onSubmitEditing`; validate in JS                                                                                       |

## What cannot be done without native code

With `react` and `react-native` as the only peers, and no native module:

1. Refuse or rewrite an edit before it is drawn. Every filter other than `maxLength` and `editable` shows the unwanted text first.
2. Know that an IME is composing, or protect a composition from a rewrite.
3. Get the caret's or the selection's rectangle.
4. Read the selection or the value synchronously, or set the selection with a guarantee that it applies.
5. Hear arrow, Home, End, Tab, Escape or modifier keys on iOS, or on Android without an experimental flag. Cancel any key's default action on either platform.
6. Hear a paste, read what was pasted, or tell a paste from autofill or a suggestion.
7. Make a programmatic edit that the platform's undo treats as one user step.
8. Put a non-editable token or a view inside editable text.
9. Read caps lock.
10. Read an SMS code on Android through the SMS Retriever or User Consent APIs.

## To confirm on a device

Nothing below could be settled by reading. Each is marked **[Device]** above.

1. How visible the flicker is when a controlled value rejects or reformats a character, on a real iPhone and a mid-range Android phone, at typing speed.
2. What `onChange` and `onKeyPress` deliver during composition: Japanese, pinyin and Korean on iOS; Gboard's underlined composing text on Android. Whether rewriting `value` in the middle of it breaks the composition.
3. Whether iOS ever sends `Enter` through `onKeyPress` for a single-line field, and what a hardware keyboard sends for Tab and Escape.
4. Whether typing on a hardware keyboard produces `onKeyPress` on iOS, and confirms the documented absence on Android.
5. The order of `onChange` and `onSelectionChange` on Android.
6. Whether a `setSelection` sent right after a keystroke is dropped often enough to matter.
7. Where the caret lands after `secureTextEntry` is toggled on iOS, and whether a secure field clears on the first edit after it regains focus.
8. What Android shows for `keyboardType="url"` and `"visible-password"` in 0.88, given the missing text class.
9. Whether Android offers an SMS code for the `sms-otp` hint with the common autofill services, and how the iOS code suggestion arrives: as one change holding the whole code, or several.
10. How close a mirror `<Text>` gets to the real caret position, in single-line and multiline fields.
11. What a programmatic text write does to the undo stack on each platform.
12. Whether the keyboard visibly swaps when focus moves between fields with different `keyboardType`s.

## Sources

React Native, at tag `v0.88.1` unless noted:

- [`TextInput.js`][js], [`TextInput.flow.js`][flow], [`TextInputNativeCommands.js`][commands]
- iOS: [`RCTTextInputComponentView.mm`][componentview], [`RCTTextInputUtils.mm`][utils], [`RCTBackedTextInputDelegateAdapter.mm`][adapter], [`RCTUITextField.mm`][textfield], [`RCTUITextView.mm`][textview]
- Shared C++: [`TextInputEventEmitter.cpp`][emitter]
- Android: [`ReactEditText.kt`][edittext], [`ReactTextInputManager.kt`][manager], [`ReactEditTextInputConnectionWrapper.kt`][icwrapper], [`ReactTextInputTextWatcher.kt`][textwatcher], [`ReactTextChangedEvent.kt`][changedevent], [`ReactTextSelectionWatcher.kt`][selwatcher]
- Key events: [`ViewPropTypes.js`][viewprops], [`CoreEventTypes.js`][coreevents], [`JSKeyDispatcher.kt`][keydispatcher], [`KeyEvent.kt`][keyevent], [`ReactRootView.java`][rootview], [`ReactNativeFeatureFlags.config.js`][flags]
- Measuring: [`ReactNativeElement.js`][element], [`ReadOnlyElement.js`][readonlyelement], [`TextProps.js`][textprops]
- [`index.js`][index]
- [Changelog][changelog], read on `main` on 2026-11-13, for the 0.84 to 0.89.0-rc.1 entries
- [TextInput documentation for 0.88][docs]

Apple:

- [`UITextContentType.oneTimeCode`][apple-otp]
- [Enabling Password AutoFill on a text input view][apple-autofill]
- [`isSecureTextEntry`][apple-secure]
- [`markedTextRange`][apple-marked]
- [`caretRect(for:)`][apple-caretrect]
- [`textField(_:shouldChangeCharactersIn:replacementString:)`][apple-shouldchange]

Android and Google:

- [`InputType`][android-inputtype]
- [`HintConstants`][android-hints]
- [SMS Retriever API][google-retriever], [Choose an API][google-choose]

Libraries with no native code, each read at the commit in its link:

- `react-native-otp-entry`: [`OtpInput.tsx`][lib-otp], [`useOtpInput.ts`][lib-otp-hook]
- `react-native-confirmation-code-field`: [`CodeField.tsx`][lib-ccf], [`useClearByFocusCell.ts`][lib-ccf-clear]
- `react-native-mask-input`: [`useMaskedInputProps.tsx`][lib-mask]
- `react-native-controlled-mentions`: [`use-mentions.ts`][lib-mentions]

[js]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/TextInput/TextInput.js
[flow]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/TextInput/TextInput.flow.js
[commands]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/TextInput/TextInputNativeCommands.js
[componentview]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/ComponentViews/TextInput/RCTTextInputComponentView.mm
[utils]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/React/Fabric/Mounting/ComponentViews/TextInput/RCTTextInputUtils.mm
[adapter]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Text/TextInput/RCTBackedTextInputDelegateAdapter.mm
[textfield]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Text/TextInput/Singleline/RCTUITextField.mm
[textview]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Text/TextInput/Multiline/RCTUITextView.mm
[emitter]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactCommon/react/renderer/components/textinput/TextInputEventEmitter.cpp
[edittext]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/textinput/ReactEditText.kt
[manager]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/textinput/ReactTextInputManager.kt
[icwrapper]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/textinput/ReactEditTextInputConnectionWrapper.kt
[textwatcher]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/textinput/ReactTextInputTextWatcher.kt
[changedevent]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/textinput/ReactTextChangedEvent.kt
[selwatcher]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/textinput/ReactTextSelectionWatcher.kt
[viewprops]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Components/View/ViewPropTypes.js
[coreevents]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Types/CoreEventTypes.js
[textprops]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/Libraries/Text/TextProps.js
[keydispatcher]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/JSKeyDispatcher.kt
[keyevent]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/events/KeyEvent.kt
[rootview]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/ReactRootView.java
[flags]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js
[element]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/src/private/webapis/dom/nodes/ReactNativeElement.js
[readonlyelement]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/src/private/webapis/dom/nodes/ReadOnlyElement.js
[index]: https://github.com/react/react-native/blob/v0.88.1/packages/react-native/index.js
[changelog]: https://github.com/react/react-native/blob/main/CHANGELOG.md
[docs]: https://github.com/facebook/react-native-website/blob/main/website/versioned_docs/version-0.88/textinput.md
[apple-otp]: https://developer.apple.com/documentation/uikit/uitextcontenttype/onetimecode
[apple-autofill]: https://developer.apple.com/documentation/security/enabling-password-autofill-on-a-text-input-view
[apple-secure]: https://developer.apple.com/documentation/uikit/uitextinputtraits/issecuretextentry
[apple-marked]: https://developer.apple.com/documentation/uikit/uitextinput/markedtextrange
[apple-caretrect]: https://developer.apple.com/documentation/uikit/uitextinput/caretrect(for:)
[apple-shouldchange]: https://developer.apple.com/documentation/uikit/uitextfielddelegate/textfield(_:shouldchangecharactersin:replacementstring:)
[android-inputtype]: https://developer.android.com/reference/android/text/InputType
[android-hints]: https://developer.android.com/reference/androidx/autofill/HintConstants
[google-retriever]: https://developers.google.com/identity/sms-retriever/overview
[google-choose]: https://developers.google.com/identity/sms-retriever/choose-an-api
[lib-otp]: https://github.com/anday013/react-native-otp-entry/blob/f816e48c5acf9304bff42790c46f408ec1978e68/src/OtpInput/OtpInput.tsx
[lib-otp-hook]: https://github.com/anday013/react-native-otp-entry/blob/55a723ab9552c77794335847512758a0b3a43c76/src/OtpInput/useOtpInput.ts
[lib-ccf]: https://github.com/retyui/react-native-confirmation-code-field/blob/d2f46608d98564e392c36049e5f774b575c1ecce/src/CodeField.tsx
[lib-ccf-clear]: https://github.com/retyui/react-native-confirmation-code-field/blob/d2f46608d98564e392c36049e5f774b575c1ecce/src/useClearByFocusCell.ts
[lib-mask]: https://github.com/CaioQuirinoMedeiros/react-native-mask-input/blob/f5ba1fd265a6ae97edf8183547ca59bc7b7d06f4/src/useMaskedInputProps.tsx
[lib-mentions]: https://github.com/dabakovich/react-native-controlled-mentions/blob/5ad3a4a9548e5933c1e3722990e90908b0e396dc/src/hooks/use-mentions.ts
