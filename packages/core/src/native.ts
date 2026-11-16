/**
 * The native host interface: what core's native code asks of the host, which
 * `@ui-sdk/react-native` implements. Build a native component of your own on
 * it with `definePrimitive` and `@ui-sdk/react-native/primitive`.
 *
 * @module
 */
export { checkboxNative } from "./components/checkbox/checkbox-native"
export { collapsibleNative } from "./components/collapsible/collapsible-native"
export { gaugeNative } from "./foundation/gauge/gauge-native"
export { radioNative } from "./components/radio/radio-native"
export { dialogNative } from "./components/dialog/dialog-native"
export { fieldNative } from "./components/field/field-native"
export { ratingNative } from "./components/rating/rating-native"
export { segmentedControlNative } from "./components/segmented-control/segmented-control-native"
export { sliderNative } from "./components/slider/slider-native"
export { tabsNative } from "./components/tabs/tabs-native"
export { toggleNative } from "./components/toggle/toggle-native"
export {
  type NativeBehavior,
  type NativeDrag,
  type NativeHost,
  nativeHost,
  type NativeInput,
  type NativeTextField,
  type NativeTouch,
  setNativeHost,
} from "./foundation/kernel/native-host"
export { pressTrigger } from "./foundation/popups/popup-native"
