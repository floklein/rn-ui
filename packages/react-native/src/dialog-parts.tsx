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
import {
  dialogNative,
  type NativeBehavior,
  pressTrigger,
} from "@ui-sdk/core/native"
import type { PresenceState } from "@ui-sdk/core/renderer"
import * as React from "react"
import { Modal, Pressable, Text, View } from "react-native"
import { Carried, carry, useCarried } from "./carried-context"
import { useControllerEntry, useControllerTarget } from "./controller-target"
import { layerInput, pressSource } from "./native-host"
import { mergeProps, renderElement } from "./render-element"
import {
  createParts,
  type ExitProps,
  HandleScope,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  useHandle,
  useNearest,
  usePart,
  usePressedPart,
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

// The backdrop and content of a modal dialog, which render in one `Modal`
// the root renders, so the backdrop sits under the content.
type Outlet = {
  get: () => { backdrop?: React.ReactNode; content?: React.ReactNode }
  set: (slot: "backdrop" | "content", element: React.ReactNode) => void
  subscribe: (listener: () => void) => () => void
}

function createOutlet() {
  let slots: ReturnType<Outlet["get"]> = {}
  const listeners = new Set<() => void>()
  const outlet: Outlet = {
    get: () => slots,
    set(slot, element) {
      if (slots[slot] === element) {
        return
      }
      slots = { ...slots, [slot]: element }
      listeners.forEach((listener) => listener())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
  return outlet
}

const OutletContext = carry("Outlet", React.createContext<Outlet | null>(null))

// A modal dialog's part goes to the `Modal`, and a non-modal one renders in place.
function useOutlet(
  slot: "backdrop" | "content",
  element: React.ReactElement | null,
  modal: boolean
) {
  const outlet = React.useContext(OutletContext)!
  const values = useCarried()
  React.useLayoutEffect(() => {
    outlet.set(
      slot,
      modal && element ? <Carried values={values}>{element}</Carried> : null
    )
  })
  React.useLayoutEffect(() => () => outlet.set(slot, null), [outlet, slot])
  return modal ? null : element
}

function DialogModal({
  handle,
  outlet,
  Root = React.Fragment,
}: {
  handle: PrimitiveHandle<typeof dialogPrimitive>
  outlet: Outlet
  Root?: React.ComponentType<{ children: React.ReactNode }>
}) {
  const { backdrop, content } = React.useSyncExternalStore(
    outlet.subscribe,
    outlet.get
  )
  const mounted = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => handle.state.mounted
  )
  return (
    <Modal
      visible={mounted && !!content}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {
        layerInput()?.back()
      }}
    >
      <Root>
        {backdrop}
        {content}
      </Root>
    </Modal>
  )
}

// Dialog, AlertDialog and Drawer render the same parts over their own primitive.
function dialogParts(
  primitive: typeof dialogPrimitive,
  behavior: NativeBehavior = dialogNative
) {
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
          <DialogModal handle={handle} outlet={outlet} />
        </OutletContext.Provider>
      </HandleScope>
    )
  }

  // Until the dialog it names mounts, a trigger outside it is a plain button.
  function Trigger({ controller, ...props }: TriggerPartProps) {
    const handle = useControllerTarget(controller, useNearest(primitive))
    if (!handle) {
      const { disabled, focusableWhenDisabled, render, ...rest } = props
      return renderElement(
        Pressable,
        {
          accessibilityRole: "button",
          accessibilityState: { disabled: !!disabled },
          disabled: disabled && !focusableWhenDisabled,
          ...rest,
        },
        render,
        { open: false, disabled: !!disabled }
      )
    }
    const part = <TriggerPart {...props} />
    return controller ? <HandleScope handle={handle}>{part}</HandleScope> : part
  }

  function TriggerPart({
    id,
    disabled,
    focusableWhenDisabled,
    payload,
    ...props
  }: Omit<TriggerPartProps, "controller">) {
    const fallback = React.useId()
    return usePressedPart(
      primitive,
      "trigger",
      { id: id ?? fallback, disabled, focusableWhenDisabled, payload },
      props as Record<string, unknown>,
      Pressable,
      (part) => () => pressTrigger(part, pressSource())
    )
  }

  function Backdrop(props: BackdropPartProps) {
    const handle = useHandle(primitive)
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
    return useOutlet("backdrop", element, handle.state.modal !== false)
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
        { onAccessibilityEscape: () => layerInput()?.escape(handle.api) },
        props as Record<string, unknown>
      ),
      View
    )
    return useOutlet("content", element, handle.state.modal !== false)
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
  createOutlet,
  DialogModal,
  type DialogParts,
  dialogParts,
  OutletContext,
  useOutlet,
  type RootProps,
  type TriggerPartProps,
}
