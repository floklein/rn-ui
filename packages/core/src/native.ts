/**
 * The native host interface: what core's native code asks of the host, which
 * `@ui-sdk/react-native` implements. Build a native component of your own on
 * it with `definePrimitive` and `@ui-sdk/react-native/primitive`.
 *
 * @module
 */
export { type NativeHost, setNativeHost } from "./foundation/kernel/native-host"
