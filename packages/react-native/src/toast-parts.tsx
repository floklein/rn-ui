import {
  nativeToast,
  type NativeToastSwipe,
  toastNative,
} from "@ui-sdk/core/native"
import type { ToastRegionInternalOptions } from "@ui-sdk/core/renderer"
import {
  createToaster as createCoreToaster,
  toast as coreToast,
  type Toast as ToastData,
  type ToastActionProps,
  type ToastButtonState,
  type ToastCloseProps,
  type ToastItem,
  toastRegion,
  type ToastRegionOptions,
  type ToastRegionState,
  type ToastState as CoreToastState,
  type Toaster,
} from "@ui-sdk/core/toast"
import * as React from "react"
import {
  AppState,
  I18nManager,
  Keyboard,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { carry } from "./carried-context"
import { responder } from "./native-host"
import { useHost, useHosted } from "./overlay-host"
import { type Interaction, mergeProps, withState } from "./render-element"
import {
  type PartProps,
  type PrimitiveHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

type RegionHandle = PrimitiveHandle<typeof toastRegion>

/**
 * A toast's state, for style functions: core's, and where a swipe has moved
 * it, as the web's `--toast-swipe-x` and `--toast-swipe-y`.
 * @experimental
 */
type ToastState = CoreToastState & {
  /** Whether a finger is swiping it. */
  swiping: boolean
  /** How far the swipe moved it across, in points. 0 when it isn't swiped. */
  swipeX: number
  /** How far the swipe moved it down, in points. 0 when it isn't swiped. */
  swipeY: number
  /** The direction a swipe dismissed it toward, as it leaves. */
  swipeDirection?: NativeToastSwipe["direction"]
}

const ToastContext = carry(
  "Toast",
  React.createContext<{
    region: RegionHandle
    toast: ToastData<React.ReactNode>
  } | null>(null)
)

function useToast(part: string) {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error(`${part} must be used inside <Toast>, in a <ToastRegion>.`)
  }
  return context
}

/**
 * Props for `ToastRegion`.
 * @experimental
 */
type ToastRegionProps = Omit<
  PartProps<typeof View, ToastRegionState>,
  "children"
> &
  Omit<ToastRegionOptions, "shortcut"> & {
    /** Renders each toast, usually with `Toast` and its parts. Without it, each toast renders its title, description, action and cancel button. */
    children?: (
      toast: ToastData<React.ReactNode>,
      item: ToastItem<React.ReactNode>
    ) => React.ReactNode
  }

/**
 * Shows a toaster's toasts in the topmost open host, so they show above a
 * modal popup too. Place it once, or let `<OverlayHost>` render it.
 * @experimental
 */
function ToastRegion(props: ToastRegionProps) {
  return <Region {...props} placed />
}

function Region({
  toaster,
  side,
  align,
  maxVisible,
  expanded,
  pendingAnnouncement,
  debug,
  placed,
  children,
  "aria-label": label,
  ...props
}: ToastRegionProps & { placed?: boolean }) {
  const region = usePrimitive(
    toastRegion,
    {
      toaster,
      side,
      align,
      maxVisible,
      expanded,
      pendingAnnouncement,
      debug,
      placed,
      label,
    } satisfies ToastRegionInternalOptions,
    toastNative
  )
  React.useLayoutEffect(() => region.api.internal.connect(), [region])
  // As a hidden page does on the web.
  React.useEffect(() => {
    const away = (state?: string | null) =>
      state === "background" || state === "inactive"
        ? region.api.pause("page-hide")
        : region.api.resume("page-hide")
    away(AppState.currentState)
    const subscription = AppState.addEventListener("change", away)
    return () => {
      subscription.remove()
      region.api.resume("page-hide")
    }
  }, [region])
  const shown = React.useSyncExternalStore(
    region.instance.subscribe,
    () => region.state.items.length > 0
  )
  const list = (state: ToastRegionState) =>
    state.toasts.map((item) => {
      const toast = item.toast as ToastData<React.ReactNode>
      return (
        <ToastContext key={toast.id} value={{ region, toast }}>
          {children ? (
            children(toast, item as ToastItem<React.ReactNode>)
          ) : (
            <DataToast toast={toast} />
          )}
        </ToastContext>
      )
    })
  const hosted = useHosted(
    <RegionView region={region} props={props} list={list} />,
    shown,
    {
      component: "toast",
      id: region.instance.id,
      modal: false,
      follow: true,
    }
  )
  return shown ? hosted : null
}

// Rendered in the host it lands in, whose insets it keeps clear of.
function RegionView({
  region,
  props: { style, ...props },
  list,
}: {
  region: RegionHandle
  props: Omit<PartProps<typeof View, ToastRegionState>, "children">
  list: (state: ToastRegionState) => React.ReactNode
}) {
  const host = useHost()
  const keyboard = useKeyboardHeight()
  const place = (state: ToastRegionState) => {
    const insets = host?.insets() ?? { top: 0, right: 0, bottom: 0, left: 0 }
    const [start, end] = I18nManager.isRTL
      ? [insets.right, insets.left]
      : [insets.left, insets.right]
    return {
      position: "absolute" as const,
      maxWidth: "100%" as const,
      ...(state.side === "top"
        ? { top: insets.top }
        : { bottom: Math.max(insets.bottom, keyboard) }),
      ...(state.align === "start" && { start }),
      ...(state.align === "end" && { end }),
      ...(state.align === "center" && {
        start,
        end,
        alignItems: "center" as const,
      }),
    }
  }
  return usePart(
    region,
    "region",
    {},
    {
      pointerEvents: "box-none",
      ...props,
      style: (state: ToastRegionState, interaction: Interaction) => [
        place(state),
        typeof style === "function" ? style(state, interaction) : style,
      ],
      children: list,
    }
  )
}

function useKeyboardHeight() {
  const [height, setHeight] = React.useState(0)
  React.useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", (event) =>
      setHeight(event.endCoordinates.height)
    )
    const hidden = Keyboard.addListener("keyboardDidHide", () => setHeight(0))
    return () => {
      shown.remove()
      hidden.remove()
    }
  }, [])
  return height
}

function DataToast({ toast }: { toast: ToastData<React.ReactNode> }) {
  return (
    <Toast
      style={(state) => [
        styles.toast,
        {
          transform: [
            { translateX: state.swipeX },
            { translateY: state.swipeY },
          ],
        },
      ]}
    >
      <View style={styles.texts}>
        {toast.title != null && <ToastTitle style={styles.title} />}
        {toast.description != null && <ToastDescription />}
      </View>
      {toast.action && <ToastAction style={styles.button} />}
      {toast.cancel && (
        <ToastClose action={toast.cancel.onCancel} style={styles.button}>
          <Text>{toast.cancel.label}</Text>
        </ToastClose>
      )}
    </Toast>
  )
}

/**
 * One toast. Swipe it toward the region's side, or toward the side it's
 * aligned to, to dismiss it. Its state says where the swipe has moved it.
 * @experimental
 */
function Toast(props: PartProps<typeof View, ToastState>) {
  const { region, toast } = useToast("Toast")
  const swipes = nativeToast(region.api)
  const swipe = React.useSyncExternalStore(swipes.subscribe, () =>
    swipes.swipe(toast.id)
  )
  const part = region.instance.part("root", { id: toast.id }, true)
  return usePart(
    region,
    "root",
    { id: toast.id },
    {
      ...mergeProps(responder(part, null), props as Record<string, unknown>),
      ...withState<CoreToastState, Omit<ToastState, keyof CoreToastState>>(
        props,
        () => ({
          swiping: !!swipe && !swipe.direction,
          swipeX: swipe?.x ?? 0,
          swipeY: swipe?.y ?? 0,
          swipeDirection: swipe?.direction,
        })
      ),
    },
    View
  )
}

/**
 * The toast's title. Renders the toast's `title` when it has no children, and nothing when it has neither.
 * @experimental
 */
function ToastTitle({ children, ...props }: PartProps<typeof Text>) {
  const { toast } = useToast("ToastTitle")
  const content = children ?? toast.title
  return content == null ? null : (
    <TextPart text="title" {...props}>
      {content}
    </TextPart>
  )
}

/**
 * The toast's description. Renders the toast's `description` when it has no children, and nothing when it has neither.
 * @experimental
 */
function ToastDescription({ children, ...props }: PartProps<typeof Text>) {
  const { toast } = useToast("ToastDescription")
  const content = children ?? toast.description
  return content == null ? null : (
    <TextPart text="description" {...props}>
      {content}
    </TextPart>
  )
}

function TextPart({
  text,
  ...props
}: PartProps<typeof Text> & { text: "title" | "description" }) {
  const { region, toast } = useToast("ToastTitle")
  return usePart(region, text, { id: toast.id }, props, Text)
}

/**
 * The toast's action, like Undo. Renders the toast's `action` label when it
 * has no children, and opens the action's `href` with `Linking` when it has
 * one. A Promise from its handler keeps the toast open and the button pending.
 * @experimental
 */
function ToastAction(
  props: Omit<PartProps<typeof Pressable, ToastButtonState>, "onAction"> &
    ToastActionProps
) {
  const { toast } = useToast("ToastAction")
  return toast.action || props.onAction ? <ActionPart {...props} /> : null
}

function ActionPart({
  onAction,
  dismiss,
  children,
  ...props
}: Omit<PartProps<typeof Pressable, ToastButtonState>, "onAction"> &
  ToastActionProps) {
  const { region, toast } = useToast("ToastAction")
  const href = toast.action?.href
  const part = { id: React.useId(), toast: toast.id, onAction, dismiss }
  const label = toast.action?.label
  return usePart(
    region,
    "action",
    part,
    {
      ...(href
        ? {
            role: "link",
            onPress: () => void Linking.openURL(href).catch(() => {}),
          }
        : { role: "button" }),
      ...props,
      children: children ?? (label == null ? label : <Text>{label}</Text>),
    },
    Pressable
  )
}

/**
 * Closes the toast. With an `action`, runs it first, and a returned Promise keeps the toast open until it settles.
 * @experimental
 */
function ToastClose({
  action,
  ...props
}: Omit<PartProps<typeof Pressable, ToastButtonState>, "action"> &
  ToastCloseProps) {
  const { region, toast } = useToast("ToastClose")
  const part = { id: React.useId(), toast: toast.id, action }
  return usePart(region, "close", part, { role: "button", ...props }, Pressable)
}

/**
 * Shows a toast from anywhere: `toast("Saved")`, `toast.success(...)`,
 * `toast.promise(save(), { loading, success, error })`. Content can be any
 * React node.
 * @experimental
 */
const toast = coreToast as Toaster<React.ReactNode>

/**
 * Creates a queue of toasts and the function that adds to it, for a second
 * region with its own toasts. Pass it to that region as `toaster`.
 * @experimental
 */
const createToaster = createCoreToaster as <Content = React.ReactNode>(
  options?: Parameters<typeof createCoreToaster>[0]
) => Toaster<Content>

// Native has no user-agent styles, so a toast rendered from its data brings
// the least it needs to be read over the app: a card that follows the swipe.
const styles = StyleSheet.create({
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    boxShadow: "0 4px 12px #00000026",
  },
  texts: { flexShrink: 1, gap: 4 },
  title: { fontWeight: "600" },
  button: { paddingHorizontal: 12, paddingVertical: 8 },
})

export {
  createToaster,
  Region,
  toast,
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastRegion,
  type ToastRegionProps,
  type ToastState,
  ToastTitle,
}
