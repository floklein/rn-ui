import { toolbarNative } from "@ui-sdk/core/native"
import {
  toolbar,
  type ToolbarGroupProps,
  type ToolbarGroupState,
  type ToolbarInputState,
  type ToolbarOptions,
  type ToolbarState,
} from "@ui-sdk/core/toolbar"
import * as React from "react"
import { Pressable, TextInput, View } from "react-native"
import { renderElement, type Interaction } from "./render-element"
import { ToolbarContext, ToolbarGroupContext } from "./toolbar-context"
import {
  createParts,
  type PartProps,
  type Parts,
  usePart,
  usePrimitive,
} from "./use-primitive"

type ToolbarParts = Parts<
  typeof toolbar,
  {
    button: typeof Pressable
    link: typeof Pressable
    input: typeof TextInput
    separator: typeof View
  }
>

const parts: ToolbarParts = createParts(
  toolbar,
  { button: Pressable, link: Pressable, input: TextInput, separator: View },
  toolbarNative
)

/**
 * A row of controls in a `View`, each its own accessible element, reached by
 * swiping. Toggles and toggle groups inside join it.
 * @experimental
 */
function Toolbar({
  orientation,
  loop,
  disabled,
  controller,
  debug,
  ...props
}: ToolbarOptions & PartProps<typeof View, ToolbarState>) {
  const handle = usePrimitive(
    toolbar,
    { orientation, loop, disabled, controller, debug },
    toolbarNative
  )
  return (
    <ToolbarContext value={handle}>
      {usePart(handle, "root", {}, props as Record<string, unknown>, View)}
    </ToolbarContext>
  )
}

/**
 * A button in the toolbar: a `Pressable` with the button role.
 * @experimental
 */
const ToolbarButton: ToolbarParts["Button"] = parts.Button

/**
 * A link in the toolbar: a `Pressable` with the link role. Its `onPress`
 * navigates.
 * @experimental
 */
function ToolbarLink(props: React.ComponentProps<ToolbarParts["Link"]>) {
  return <parts.Link role="link" {...props} />
}

/**
 * A text field in the toolbar: a `TextInput`, which can't be edited while
 * the field is disabled.
 * @experimental
 */
function ToolbarInput({
  render,
  ...props
}: React.ComponentProps<ToolbarParts["Input"]>) {
  return (
    <parts.Input
      {...props}
      render={(
        host: Record<string, any>,
        state: ToolbarInputState,
        interaction: Interaction
      ) => {
        const editable = !state.disabled && host.editable !== false
        return renderElement(
          TextInput,
          {
            ...host,
            editable,
            accessibilityState: {
              ...host.accessibilityState,
              disabled: !editable,
            },
          },
          render,
          state,
          interaction
        )
      }}
    />
  )
}

/**
 * A group of related items in a `View`. `disabled` disables every item in it.
 * @experimental
 */
function ToolbarGroup({
  disabled,
  children,
  ...props
}: ToolbarGroupProps &
  Omit<PartProps<typeof View, ToolbarGroupState>, "disabled">) {
  const content = (state: ToolbarGroupState, interaction: Interaction) => (
    <ToolbarGroupContext value={state.disabled}>
      {typeof children === "function" ? children(state, interaction) : children}
    </ToolbarGroupContext>
  )
  return usePart(
    toolbar,
    "group",
    { id: React.useId(), disabled },
    { ...props, children: content } as Record<string, unknown>,
    View
  )
}

/**
 * A line between groups of items: a `View` that no screen reader or
 * keyboard stops on.
 * @experimental
 */
const ToolbarSeparator: ToolbarParts["Separator"] = parts.Separator

export { createToolbarController } from "@ui-sdk/core/toolbar"
export type {
  ToolbarApi,
  ToolbarButtonProps,
  ToolbarButtonState,
  ToolbarController,
  ToolbarGroupProps,
  ToolbarGroupState,
  ToolbarInputProps,
  ToolbarInputState,
  ToolbarLinkState,
  ToolbarOptions,
  ToolbarOrientation,
  ToolbarPrimitive,
  ToolbarState,
  ToolbarSeparatorState,
} from "@ui-sdk/core/toolbar"

export {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarInput,
  ToolbarLink,
  ToolbarSeparator,
}
