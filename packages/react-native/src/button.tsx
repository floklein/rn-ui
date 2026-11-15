import {
  button as buttonPrimitive,
  type ButtonActionDetails,
  type ButtonOptions,
  type ButtonState,
} from "@ui-sdk/core/button"
import { withSource } from "@ui-sdk/core/renderer"
import { Pressable, type GestureResponderEvent } from "react-native"
import { pressSource } from "./native-host"
import { mergeProps, renderElement, type Interaction } from "./render-element"
import { usePart, usePrimitive, type PartProps } from "./use-primitive"

type ButtonProps = Omit<PartProps<typeof Pressable, ButtonState>, "onPress"> &
  Omit<ButtonOptions, "type"> & {
    /**
     * Runs when the button is pressed. Return a Promise to make the button
     * pending until it settles: it's busy and disabled for screen readers,
     * ignores presses meanwhile, and says `pendingAnnouncement` after a second.
     * `details.source` says how it was pressed, for changes made after an `await`.
     */
    onPress?: (
      event: GestureResponderEvent,
      details: ButtonActionDetails
    ) => unknown
  }

/**
 * A button: a `Pressable` with the button role. It takes part in no form, so
 * it has no `type`.
 * @experimental
 */
function Button({
  disabled,
  focusableWhenDisabled,
  pendingAnnouncement,
  debug,
  onPress,
  render,
  ref,
  ...props
}: ButtonProps) {
  const button = usePrimitive(buttonPrimitive, {
    disabled,
    focusableWhenDisabled,
    pendingAnnouncement,
    debug,
  })
  // Pressable hands the handler its own event, so the part runs the press itself.
  const press = (event: GestureResponderEvent) =>
    withSource(pressSource(), () =>
      button.api.internal.press(undefined, (details) =>
        onPress?.(event, details)
      )
    )
  return usePart(
    button,
    "root",
    {},
    {
      ...props,
      render: (
        root: Record<string, any>,
        state: ButtonState,
        interaction: Interaction
      ) =>
        renderElement(
          Pressable,
          { ...mergeProps(root, { ref }), onPress: press },
          render,
          state,
          interaction
        ),
    },
    Pressable
  )
}

export { Button }
export type {
  ButtonActionDetails,
  ButtonApi,
  ButtonOptions,
  ButtonPrimitive,
  ButtonState,
} from "@ui-sdk/core/button"
