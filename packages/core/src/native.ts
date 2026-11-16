/**
 * The native host interface: what core's native code asks of the host, which
 * `@ui-sdk/react-native` implements. Build a native component of your own on
 * it with `definePrimitive` and `@ui-sdk/react-native/primitive`.
 *
 * @module
 */
export { tabsNative } from "./components/tabs/tabs-native"
export { toggleNative } from "./components/toggle/toggle-native"
export {
  type NativeBehavior,
  type NativeHost,
  nativeHost,
  setNativeHost,
} from "./foundation/kernel/native-host"
export { joinCheckboxGroup } from "./components/checkbox/checkbox-native"
