import type {
  dialog as dialogPrimitive,
  DialogBackdropState,
  DialogContentProps,
  DialogContentState,
  DialogOptions,
  DialogTriggerProps,
  DialogTriggerState,
} from "@ui-sdk/core/dialog"
import { dialogNative, pressTrigger } from "@ui-sdk/core/native"
import type { PresenceState } from "@ui-sdk/core/renderer"
import * as React from "react"
import { Modal, Pressable, Text, View } from "react-native"
import { layerInput, pressSource } from "./native-host"
import { mergeProps } from "./render-element"
import {
  createParts,
  type ExitProps,
  HandleScope,
  type PartProps,
  type PrimitiveHandle,
  useHandle,
  usePart,
  usePressedPart,
  usePrimitive,
} from "./use-primitive"

type TriggerPartProps = PartProps<typeof Pressable, DialogTriggerState> &
  Omit<DialogTriggerProps, "controller" | "shortcut">
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

const OutletContext = React.createContext<Outlet | null>(null)

// A modal dialog's part goes to the `Modal`, and a non-modal one renders in place.
function useOutlet(
  slot: "backdrop" | "content",
  element: React.ReactElement | null,
  modal: boolean
) {
  const outlet = React.useContext(OutletContext)!
  React.useLayoutEffect(() => {
    outlet.set(slot, modal ? element : null)
  })
  React.useLayoutEffect(() => () => outlet.set(slot, null), [outlet, slot])
  return modal ? null : element
}

function DialogModal({
  handle,
  outlet,
}: {
  handle: PrimitiveHandle<typeof dialogPrimitive>
  outlet: Outlet
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
      {backdrop}
      {content}
    </Modal>
  )
}

// Dialog and AlertDialog render the same parts over their own primitive.
function dialogParts(primitive: typeof dialogPrimitive) {
  const parts = createParts(
    primitive,
    { title: Text, description: Text, close: Pressable },
    dialogNative
  )

  function Root({ children, ...options }: RootProps) {
    const handle = usePrimitive(primitive, options, dialogNative)
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

  function Trigger({
    id,
    disabled,
    focusableWhenDisabled,
    payload,
    ...props
  }: TriggerPartProps) {
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

  function Title(props: React.ComponentProps<typeof parts.Title>) {
    return <parts.Title role="heading" {...props} />
  }

  return {
    Root,
    Trigger,
    Backdrop,
    Content,
    Title,
    Description: parts.Description,
    Close: parts.Close,
  }
}

export {
  type BackdropPartProps,
  type ContentPartProps,
  dialogParts,
  type RootProps,
  type TriggerPartProps,
}
