// PROTOTYPE (issue #14). Dialog on the native host. A modal dialog renders
// in React Native's `Modal`, which isolates it for screen readers and sends
// Android's back to `onRequestClose`. A non-modal one renders in place here:
// the prototype has no `OverlayHost`.
import {
  dialog as dialogPrimitive,
  type DialogBackdropState,
  type DialogCloseProps,
  type DialogCloseState,
  type DialogContentState,
  type DialogOptions,
  type DialogTriggerState,
} from "@ui-sdk/core/dialog"
import { dialogNative } from "@ui-sdk/core/native/dialog"
import * as React from "react"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { deliver } from "./native-host"
import {
  HandleScope,
  useHandle,
  usePart,
  usePrimitive,
  type PartProps,
} from "./use-primitive"

// The backdrop and the content are siblings, and one `Modal` shows both, so
// each hands its element to the dialog's outlet, which renders them there.
type Outlet = {
  set: (slot: string, element: React.ReactNode) => void
  get: (slot: string) => React.ReactNode
  subscribe: (listener: () => void) => () => void
  version: () => number
}

function createOutlet() {
  const elements = new Map<string, React.ReactNode>()
  const listeners = new Set<() => void>()
  let version = 0
  const outlet: Outlet = {
    set(slot, element) {
      if (elements.get(slot) === element) {
        return
      }
      elements.set(slot, element)
      version++
      listeners.forEach((listener) => listener())
    },
    get: (slot) => elements.get(slot),
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    version: () => version,
  }
  return outlet
}

const OutletContext = React.createContext<Outlet | null>(null)

function useOutlet(slot: string, element: React.ReactNode) {
  const outlet = React.useContext(OutletContext)!
  React.useLayoutEffect(() => {
    outlet.set(slot, element)
  })
  React.useLayoutEffect(() => () => outlet.set(slot, null), [outlet, slot])
  return null
}

function DialogOutlet({ outlet }: { outlet: Outlet }) {
  const { instance } = useHandle(dialogPrimitive)
  React.useSyncExternalStore(outlet.subscribe, outlet.version)
  const { modal } = React.useSyncExternalStore(instance.subscribe, instance.get)
  const backdrop = outlet.get("backdrop")
  const content = outlet.get("content")
  if (!backdrop && !content) {
    return null
  }
  if (modal !== true) {
    return (
      <>
        {backdrop}
        {content}
      </>
    )
  }
  // The press catcher sits under the backdrop, which takes no touches, so a
  // press beside the content is an outside press and one on it is not.
  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      onRequestClose={() => {
        deliver("back")
      }}
    >
      <View style={styles.fill}>
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          style={StyleSheet.absoluteFill}
          onPress={() => deliver("outsidePress")}
        />
        {backdrop}
        {content}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({ fill: { flex: 1 } })

/**
 * The props of `Dialog`. `container`, the `modal` value `"trap-focus"`,
 * `persistentElements` and trigger shortcuts are web-only, so they're absent.
 * @experimental
 */
type DialogProps = Omit<
  DialogOptions,
  "container" | "modal" | "persistentElements" | "presentation"
> & {
  /** Whether it blocks the rest of the screen. A modal dialog renders in a `Modal`. */
  modal?: boolean
  children?: React.ReactNode
}

/**
 * A window over the screen that asks for the user's attention. Put its
 * trigger, backdrop and content inside.
 * @experimental
 */
function Dialog({ children, ...options }: DialogProps) {
  const handle = usePrimitive(dialogPrimitive, options, dialogNative)
  const outlet = React.useMemo(createOutlet, [])
  return (
    <HandleScope handle={handle}>
      <OutletContext.Provider value={outlet}>
        {children}
        <DialogOutlet outlet={outlet} />
      </OutletContext.Provider>
    </HandleScope>
  )
}

/**
 * The button that opens the dialog. A `Pressable`.
 * @experimental
 */
function DialogTrigger({
  id,
  disabled,
  payload,
  ...props
}: PartProps<DialogTriggerState> & {
  id?: string
  disabled?: boolean
  payload?: unknown
}) {
  return usePart(
    dialogPrimitive,
    "trigger",
    { id, disabled, payload },
    props,
    Pressable
  )
}

/**
 * A dim behind the dialog, inside its `Modal`. It takes no touches: a press
 * beside the content is an outside press.
 * @experimental
 */
function DialogBackdrop(props: PartProps<DialogBackdropState>) {
  return useOutlet(
    "backdrop",
    usePart(
      dialogPrimitive,
      "backdrop",
      {},
      { pointerEvents: "none", ...props },
      View
    )
  )
}

/**
 * The dialog itself. The screen reader's escape gesture dismisses it.
 * @experimental
 */
function DialogContent({
  initialFocus,
  finalFocus,
  keepMounted,
  ...props
}: PartProps<DialogContentState> & {
  /** Where accessibility focus is requested on open. `"none"` requests none. */
  initialFocus?: "auto" | "content" | "none"
  /** Where it's requested on close. `"none"` requests none. */
  finalFocus?: "trigger" | "none"
  keepMounted?: boolean
}) {
  return useOutlet(
    "content",
    usePart(
      dialogPrimitive,
      "content",
      { initialFocus, finalFocus, keepMounted },
      { onAccessibilityEscape: () => deliver("escape"), ...props },
      View
    )
  )
}

/**
 * The dialog's title, which names it. A `Text` with the header role.
 * @experimental
 */
function DialogTitle(props: PartProps) {
  return usePart(
    dialogPrimitive,
    "title",
    {},
    { accessibilityRole: "header", ...props },
    Text
  )
}

/**
 * Describes the dialog while it's rendered. A `Text`.
 * @experimental
 */
function DialogDescription(props: PartProps) {
  return usePart(dialogPrimitive, "description", {}, props, Text)
}

/**
 * A button that closes the dialog. An `action` runs first, and a Promise it
 * returns keeps the dialog open until it settles.
 * @experimental
 */
function DialogClose({
  id,
  value,
  action,
  ...props
}: PartProps<DialogCloseState> & DialogCloseProps & { id?: string }) {
  return usePart(
    dialogPrimitive,
    "close",
    { id, value, action },
    props,
    Pressable
  )
}

export { createDialogController } from "@ui-sdk/core/dialog"
export type {
  DialogApi,
  DialogBackdropState,
  DialogCloseProps,
  DialogCloseState,
  DialogContentState,
  DialogController,
  DialogDismissAttemptDetails,
  DialogDismissReason,
  DialogOpenChangeDetails,
  DialogOpenChangeReason,
  DialogOptions,
  DialogPrimitive,
  DialogTriggerState,
} from "@ui-sdk/core/dialog"

export {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  type DialogProps,
  DialogTitle,
  DialogTrigger,
}
