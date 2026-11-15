/**
 * For tests: check a native component the way a screen reader user meets it,
 * with no device. Each check takes the rendered host tree and the OS, and
 * imports no renderer.
 *
 * @module
 */
export { checkCreation } from "./check-creation"
export { checkDirection } from "./check-direction"
export { checkPattern, type NativePattern } from "./check-pattern"
export type { Act, CheckOptions, HostNode, OS } from "./host-tree"
