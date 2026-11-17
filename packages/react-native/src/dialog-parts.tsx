import type {
  AlertDialogController,
  dialog as dialogPrimitive,
  DialogBackdropState,
  DialogContentProps,
  DialogContentState,
  DialogController,
  DialogOptions,
  DialogTriggerProps,
  DialogTriggerState,
} from "@ui-sdk/core/dialog"
import { dialogNative, type NativeBehavior } from "@ui-sdk/core/native"
import type { PresenceState } from "@ui-sdk/core/renderer"
import * as React from "react"
import { Pressable, Text, View } from "react-native"
import { useControllerEntry } from "./controller-target"
import { layerInput } from "./native-host"
import { landIn } from "./overlay-host"
import {
  createOutlet,
  OutletContext,
  PopupLayer,
  popupTrigger,
  useOutlet,
} from "./popup-parts"
import { mergeProps } from "./render-element"
import {
  createParts,
  type ExitProps,
  HandleScope,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  useHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

type TriggerPartProps = PartProps<typeof Pressable, DialogTriggerState> &
  Omit<DialogTriggerProps, "controller" | "shortcut"> & {
    /** Connects a trigger outside the dialog, like one per row, to the dialog with this controller. */
    controller?: DialogController<any, any> | AlertDialogController<any, any>
  }
type BackdropPartProps = PartProps<typeof Pressable, DialogBackdropState>
type ContentPartProps = PartProps<
  typeof View,
  DialogContentState & PresenceState
> &
  Omit<DialogContentProps, "container"> &
  ExitProps
type RootProps = Omit<DialogOptions, "container" | "modal"> & {
  modal?: boolean
  children?: React.ReactNode
}

type DialogParts = Parts<
  typeof dialogPrimitive,
  { title: typeof Text; description: typeof Text; close: typeof Pressable }
>

// Dialog, AlertDialog and Drawer render the same parts over their own primitive.
function dialogParts(
  primitive: typeof dialogPrimitive,
  behavior: NativeBehavior = dialogNative
) {
  const Trigger = popupTrigger(primitive) as (
    props: TriggerPartProps
  ) => React.ReactElement | null
  const parts: DialogParts = createParts(
    primitive,
    { title: Text, description: Text, close: Pressable },
    behavior
  )

  function Root({ children, ...options }: RootProps) {
    const handle = usePrimitive(primitive, options, behavior)
    useControllerEntry(options.controller, handle)
    const [outlet] = React.useState(createOutlet)
    return (
      <HandleScope handle={handle as unknown as PrimitiveHandle<never>}>
        <OutletContext.Provider value={outlet}>
          {children}
          <PopupLayer handle={handle} outlet={outlet} />
        </OutletContext.Provider>
      </HandleScope>
    )
  }

  function Backdrop(props: BackdropPartProps) {
    const element = usePart(
      primitive,
      "backdrop",
      {},
      mergeProps(
        {
          accessible: false,
          onPress: () => layerInput()?.outsidePress(),
        },
        props as Record<string, unknown>
      ),
      Pressable
    )
    return useOutlet("backdrop", element)
  }

  function Content({
    initialFocus,
    finalFocus,
    keepMounted,
    ...props
  }: ContentPartProps) {
    const handle = useHandle(primitive)
    const element = usePart(
      primitive,
      "content",
      { initialFocus, finalFocus, keepMounted },
      mergeProps(
        {
          // The Modal's host isolates it, popups beside it included.
          accessibilityViewIsModal: false,
          onAccessibilityEscape: () => layerInput()?.escape(handle.api),
          onTouchStart: landIn(handle.api),
        },
        props as Record<string, unknown>
      ),
      View
    )
    return useOutlet("content", element)
  }

  function Title(props: React.ComponentProps<DialogParts["Title"]>) {
    return <parts.Title role="heading" {...props} />
  }

  const made: {
    Root: (props: RootProps) => React.ReactElement
    Trigger: (props: TriggerPartProps) => React.ReactElement | null
    Backdrop: (props: BackdropPartProps) => React.ReactElement | null
    Content: (props: ContentPartProps) => React.ReactElement | null
    Title: DialogParts["Title"]
    Description: DialogParts["Description"]
    Close: DialogParts["Close"]
  } = {
    Root,
    Trigger,
    Backdrop,
    Content,
    Title,
    Description: parts.Description,
    Close: parts.Close,
  }
  return made
}

export {
  type BackdropPartProps,
  type ContentPartProps,
  type DialogParts,
  dialogParts,
  type RootProps,
  type TriggerPartProps,
}
