import { label, type LabelOptions } from "@ui-sdk/core/label"
import { withSource } from "@ui-sdk/core/renderer"
import { Text } from "react-native"
import { useLabelFor } from "./names"
import { controlsById, pressSource } from "./native-host"
import { mergeProps } from "./render-element"
import { type PartProps, usePart, usePrimitive } from "./use-primitive"

/**
 * Names a control from its plain text: a `Text`. `htmlFor` takes the
 * control's `id`, which the label names unless it has an `aria-label`, and a
 * press on the label activates it, as on the web: a switch or checkbox is
 * pressed, a text field starts editing.
 * @experimental
 */
function Label({
  htmlFor,
  debug,
  ...props
}: LabelOptions & { htmlFor?: string } & PartProps<typeof Text>) {
  const handle = usePrimitive(label, { debug })
  useLabelFor(htmlFor, handle.instance.id)
  return usePart(
    handle,
    "root",
    {},
    mergeProps(props as Record<string, unknown>, {
      onPress: () => {
        const activate = htmlFor && controlsById.get(htmlFor)
        if (activate) {
          withSource(pressSource(), activate)
        }
      },
    }),
    Text
  )
}

export type { LabelOptions, LabelPrimitive } from "@ui-sdk/core/label"

export { Label }
