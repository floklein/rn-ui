import { toggleNative } from "@ui-sdk/core/native"
import {
  toggle,
  toggleGroup,
  type ToggleGroupController,
  type ToggleGroupOptions,
  type ToggleGroupState,
  type ToggleOptions,
  type ToggleState,
} from "@ui-sdk/core/toggle"
import * as React from "react"
import { Pressable, View } from "react-native"
import {
  createParts,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

type ToggleParts = Parts<
  typeof toggle,
  { root: typeof Pressable; icon: typeof View }
>

const parts: ToggleParts = createParts(
  toggle,
  { root: Pressable, icon: View },
  toggleNative
)

const ToggleGroupContext = React.createContext<PrimitiveHandle<
  typeof toggleGroup
> | null>(null)

/**
 * A button that stays pressed: a `Pressable` with the toggle button role.
 * Inside a ToggleGroup, the group decides whether it's pressed.
 * @experimental
 */
function Toggle(
  props: ToggleOptions & PartProps<typeof Pressable, ToggleState>
) {
  const group = React.useContext(ToggleGroupContext)
  return <parts.Root {...props} group={group ? () => group.api : undefined} />
}

/**
 * An icon inside a toggle. A toggle with only an icon needs an `aria-label`.
 * Screen readers skip it, and `mirror` flips it when the app runs right to left.
 * @experimental
 */
const ToggleIcon: ToggleParts["Icon"] = parts.Icon

/**
 * Toggles that share one value, in a `View`. Each toggle is its own
 * accessible element, reached by swiping. `T` is inferred from `value`,
 * `defaultValue` or `onValueChange`.
 * @experimental
 */
function ToggleGroup<T extends string = string>({
  value,
  defaultValue,
  onValueChange,
  multiple,
  deselectable,
  disabled,
  orientation,
  loop,
  controller,
  debug,
  ...props
}: ToggleGroupOptions<T> & PartProps<typeof View, ToggleGroupState<T>>) {
  const group = usePrimitive(toggleGroup, {
    value,
    defaultValue,
    onValueChange: onValueChange as ToggleGroupOptions["onValueChange"],
    multiple,
    deselectable,
    disabled,
    orientation,
    loop,
    controller: controller as ToggleGroupController | undefined,
    debug,
  })
  // The state holds only values of type `T`, which the primitive types as strings.
  return (
    <ToggleGroupContext value={group}>
      {usePart(
        group,
        "group",
        {},
        props as Omit<PartProps<typeof View, ToggleGroupState>, "ref"> & {
          ref?: React.Ref<unknown>
        },
        View
      )}
    </ToggleGroupContext>
  )
}

export {
  createToggleController,
  createToggleGroupController,
} from "@ui-sdk/core/toggle"
export type {
  ToggleApi,
  ToggleChangeOptions,
  ToggleController,
  ToggleGroupApi,
  ToggleGroupChangeOptions,
  ToggleGroupController,
  ToggleGroupOptions,
  ToggleGroupOrientation,
  ToggleGroupPrimitive,
  ToggleGroupState,
  ToggleGroupValueChangeReason,
  ToggleIconProps,
  ToggleIconState,
  ToggleOptions,
  TogglePressedChangeReason,
  TogglePrimitive,
  ToggleState,
} from "@ui-sdk/core/toggle"

export { Toggle, ToggleGroup, ToggleIcon }
