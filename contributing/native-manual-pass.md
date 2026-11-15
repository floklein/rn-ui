# The native manual pass

Every React Native component gets one manual pass before it's done: once with VoiceOver, once with TalkBack, and once with a hardware keyboard on each OS, with the screen reader off. No spec runs with a screen reader on, so this pass is the only place a person hears what each one says ([How native correctness is checked](https://github.com/floklein/rn-ui/issues/19)). Record the result in the component's pull request with the template at the end.

A component is done only when its device specs and this pass both succeed. A component whose only missing step is VoiceOver can merge with that step recorded as outstanding; it stays incomplete in the parity list until the step is done.

## Setup

- Run the native playground (`apps/native-playground`) from the branch: `CI=1 NATIVE_PLAYGROUND_PORT=<port> pnpm start`, then open it in Expo Go. Every example of the component is a screen.
- **VoiceOver** needs a physical iPhone; the simulator has none. Settings, Accessibility, VoiceOver.
- **TalkBack** runs on a physical Android phone, or on an emulator whose system image has Android Accessibility Suite (a Google Play image). Settings, Accessibility, TalkBack.
- **iOS keyboard**: on the simulator, turn on Settings, Accessibility, Keyboards, Full Keyboard Access, and send the Mac's keyboard to the simulator (I/O, Keyboard, Connect Hardware Keyboard). On a phone, pair a keyboard and turn on Full Keyboard Access.
- **Android keyboard**: on the emulator, the Mac's keyboard is a hardware keyboard. On a phone, pair or plug one in.

## VoiceOver (iOS)

1. Swipe right through the screen. Every part a user acts on is reached once, in reading order, and nothing decorative is (a thumb, an icon, a backdrop).
2. Each part says its name, its role and its state, like "Airplane mode, switch button, off". A name comes from the label the example gives, never from words the adapter adds.
3. Double-tap each control. It does what a tap does, and the new state is spoken.
4. A disabled part says "dimmed" and a double-tap does nothing. A read-only part changes nothing.
5. Swipe up and down on a slider or a stepper, if the component has one. The value changes by one step and is spoken.
6. Open each popup. Focus moves into it, to its title when it has one, and swiping stays inside a modal one.
7. Close it with the two-finger scrub, and with its own close control. Focus returns to the part that opened it.
8. An announcement the component makes, like a toast or a pending action, is spoken once.

## TalkBack (Android)

1. Swipe right through the screen. Every part a user acts on is reached once, in reading order, and nothing decorative is.
2. Each part says its name, its role and its state, like "Off, Airplane mode, switch". A name comes from the label the example gives.
3. Double-tap each control. It does what a tap does, and the new state is spoken.
4. A disabled part says "disabled" and a double-tap does nothing. A read-only part changes nothing.
5. On a slider or a stepper, swipe up and down (or use the volume keys). The value changes by one step and is spoken.
6. Expandable parts say "expanded" or "collapsed", and the TalkBack menu offers the matching action.
7. Open each popup. Focus moves into it, and swiping stays inside a modal one.
8. Close it with Back, and with its own close control. Focus returns to the part that opened it.
9. An announcement the component makes is spoken once.

## Hardware keyboard, screen reader off (iOS and Android)

1. Tab, and Shift-Tab, reach every part a user acts on, in order, and skip disabled ones. On Android the arrow keys move between them too.
2. The focused part shows focus: the system ring on iOS, and on Android the style the example gives `interaction.focused`, or the system highlight when it gives none. iOS reports no focus to `interaction.focused`.
3. Space activates the focused part on iOS. Enter and Space activate it on Android.
4. A modal popup keeps Tab inside it, where the OS's `Modal` does.
5. Every popup can be dismissed from the keyboard: Escape on Android (it acts as Back), and Escape on iOS with Full Keyboard Access where the OS routes it to the escape gesture. Focus returns to the part that opened it.
6. Note any key a web user would expect that does nothing (arrow keys inside a composite, Home, End, typeahead). They're a recorded scope exception, not a failure.

## Recording it

Paste this into the pull request and fill it in. Write what was heard or seen, not only a mark.

```md
### Manual pass: <Component>

Playground screens: <example names>. Devices: <device, OS version, screen reader version>.

| Step               | Result                         |
| ------------------ | ------------------------------ |
| VoiceOver          | passed / failed / outstanding: |
| TalkBack           | passed / failed:               |
| iOS keyboard (FKA) | passed / failed:               |
| Android keyboard   | passed / failed:               |
```
