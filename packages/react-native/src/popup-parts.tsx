import { pressTrigger } from "@ui-sdk/core/native"
import * as React from "react"
import { Modal, Pressable, StyleSheet } from "react-native"
import { Carried, carry, useCarried } from "./carried-context"
import { useControllerTarget } from "./controller-target"
import { layerInput, pressSource } from "./native-host"
import { landIn, ModalHost, useHosted } from "./overlay-host"
import { mergeProps, renderElement } from "./render-element"
import {
  HandleScope,
  type PrimitiveHandle,
  useHandle,
  useNearest,
  usePressedPart,
} from "./use-primitive"

// No bridge spans a hover popup's trigger and content on native, so a
// pointer gets this long to cross from one to the other (WCAG 1.4.13).
const closeDelayFloor = 100

type PopupHandle = PrimitiveHandle<any> & {
  state: { mounted: boolean; modal: unknown }
}

// The backdrop and content, which the root renders together in a host, or in
// one `Modal` when modal, so the backdrop sits under the content.
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

function useOutlet(slot: "backdrop" | "content", element: React.ReactNode) {
  const outlet = React.useContext(OutletContext)!
  const values = useCarried()
  React.useLayoutEffect(() => {
    outlet.set(
      slot,
      element ? <Carried values={values}>{element}</Carried> : null
    )
  })
  React.useLayoutEffect(() => () => outlet.set(slot, null), [outlet, slot])
  return null
}

// A modal popup's layer is a `Modal` carrying a host of its own.
function PopupLayer({
  handle,
  outlet,
  pressOutside,
  modal = handle.state.modal !== false,
  Root = React.Fragment,
}: {
  handle: PopupHandle
  outlet: Outlet
  pressOutside?: boolean
  modal?: boolean
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
  const layer = modal ? (
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
        <ModalHost>
          {pressOutside && (
            <Pressable
              accessible={false}
              style={StyleSheet.absoluteFill}
              onPress={() => layerInput()?.outsidePress()}
            />
          )}
          {backdrop}
          {content}
        </ModalHost>
      </Root>
    </Modal>
  ) : (
    <>
      {backdrop}
      {content}
    </>
  )
  return useHosted(layer, mounted, {
    component: handle.primitive.name,
    id: handle.instance.id,
    modal,
  })
}

type TriggerProps = {
  id?: string
  disabled?: boolean
  focusableWhenDisabled?: boolean
  payload?: unknown
  controller?: object
  render?: unknown
}

// A popup's trigger, which a controller can connect from outside it. Until
// the popup it names mounts, it's a plain button. `Connected` renders it once
// it has, in place of the part that presses the popup's trigger.
function popupTrigger(
  primitive: PopupHandle["primitive"],
  Connected?: React.ComponentType<Omit<TriggerProps, "controller">>
) {
  function TriggerPart({
    id,
    disabled,
    focusableWhenDisabled,
    payload,
    ...props
  }: Omit<TriggerProps, "controller">) {
    const fallback = React.useId()
    const handle = useHandle(primitive)
    return usePressedPart(
      primitive,
      "trigger",
      { id: id ?? fallback, disabled, focusableWhenDisabled, payload },
      mergeProps(
        { onTouchStart: landIn(handle.api) },
        props as Record<string, unknown>
      ),
      Pressable,
      (part) => () => pressTrigger(part, pressSource())
    )
  }

  return function Trigger({ controller, ...props }: TriggerProps) {
    const handle = useControllerTarget(
      controller as never,
      useNearest(primitive)
    )
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
        render as never,
        { open: false, disabled: !!disabled }
      )
    }
    const Part = Connected ?? TriggerPart
    const part = <Part {...props} />
    return controller ? <HandleScope handle={handle}>{part}</HandleScope> : part
  }
}

export {
  closeDelayFloor,
  createOutlet,
  type Outlet,
  OutletContext,
  PopupLayer,
  popupTrigger,
  useOutlet,
}
