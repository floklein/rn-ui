# ui-sdk

The vocabulary of ui-sdk, a library of UI behaviors, and of this fork's work to run it on React Native.

## Language

**Host**:
The environment a part's elements live in. There are two: the DOM host, where a part is an HTML element, and the native host, where it is a React Native view.
_Avoid_: Platform (a core layer already has that name), target, environment, framework

**Host capability**:
One thing core needs from the host, such as showing content above the page, placing it beside an anchor or announcing a message, that a single module in core owns.
_Avoid_: Platform API, host service

**Twin**:
The native-host counterpart of a module that owns a host capability. It has the same exports, so shared code calls either without knowing which host it runs on.
_Avoid_: Shim, polyfill, port
