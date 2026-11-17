import type { Part } from "@ui-sdk/core"
import type { NativeSeen } from "@ui-sdk/core/native"
import * as React from "react"
import { carry } from "./carried-context"
import { seen } from "./native-host"
import { isBehindModal } from "./open-hosts"
import type { Host } from "./overlay-host"

type Around = Pick<
  NativeSeen,
  "offLimits" | "secret" | "confirm" | "within" | "hidden"
>

/**
 * The agent marks, as props on any part and on `AgentRegion`. Each covers
 * everything rendered inside it.
 * @experimental
 */
type AgentMarks = {
  /** A change a person must make, with what it does, like `"Deletes the project"`. */
  "data-agent-confirm"?: string
  /** Agents never see what's inside. */
  "data-agent-hidden"?: boolean
  /** Values inside read `"[redacted]"` to agents. */
  "data-agent-secret"?: boolean
}

const AgentContext = carry(
  "Agent",
  React.createContext<Around>({
    offLimits: false,
    secret: false,
    hidden: false,
    within: [],
  })
)

const marked = (value: unknown) => value != null && value !== false

// What applies inside a part or region with these marks, hidden from
// accessibility or not, and rendered by the instance `owner`.
function useMarks(marks: AgentMarks, hidden = false, owner?: string) {
  const around = React.use(AgentContext)
  const within = React.useMemo(
    () =>
      owner === undefined || around.within.at(-1) === owner
        ? around.within
        : [...around.within, owner],
    [around.within, owner]
  )
  const offLimits = around.offLimits || marked(marks["data-agent-hidden"])
  const secret = around.secret || marked(marks["data-agent-secret"])
  const confirm = marks["data-agent-confirm"] ?? around.confirm
  const inner = around.hidden || hidden
  const inside = React.useMemo(
    () =>
      offLimits === around.offLimits &&
      secret === around.secret &&
      confirm === around.confirm &&
      inner === around.hidden &&
      within === around.within
        ? around
        : { offLimits, secret, confirm, hidden: inner, within },
    [around, offLimits, secret, confirm, inner, within]
  )
  return { outside: around, inside }
}

function withoutMarks<T extends AgentMarks>(props: T) {
  const {
    "data-agent-confirm": confirm,
    "data-agent-hidden": hidden,
    "data-agent-secret": secret,
    ...rest
  } = props
  return [
    {
      "data-agent-confirm": confirm,
      "data-agent-hidden": hidden,
      "data-agent-secret": secret,
    },
    rest,
  ] as const
}

const isHiddenFromAccessibility = (props: {
  accessibilityElementsHidden?: unknown
  importantForAccessibility?: unknown
}) =>
  props.accessibilityElementsHidden === true ||
  props.importantForAccessibility === "no-hide-descendants"

// A press with no touch behind it, shaped as `onPress` expects, as the web's
// agent clicks with a real event.
function agentPressEvent() {
  const timestamp = Date.now()
  const nativeEvent = {
    timestamp,
    identifier: 0,
    locationX: 0,
    locationY: 0,
    pageX: 0,
    pageY: 0,
    target: 0,
    touches: [],
    changedTouches: [],
  }
  return {
    nativeEvent,
    target: 0,
    currentTarget: 0,
    type: "press",
    timeStamp: timestamp,
    bubbles: false,
    cancelable: false,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: false,
    preventDefault() {},
    isDefaultPrevented: () => false,
    stopPropagation() {},
    isPropagationStopped: () => false,
    persist() {},
  }
}

const isSecretField = (props: {
  secureTextEntry?: unknown
  autoComplete?: unknown
  textContentType?: unknown
}) =>
  props.secureTextEntry === true ||
  /password|one-?time-?code|sms-otp|cc-|credit-?card/i.test(
    `${props.autoComplete ?? ""} ${props.textContentType ?? ""}`
  )

// Whether a modal covers the part is read when the bridge asks, since one can open later.
function useSeen(part: Part, layer: Host | null, now: NativeSeen | undefined) {
  React.useLayoutEffect(() => {
    if (!now) {
      return
    }
    seen.set(part, () => ({
      ...now,
      hidden: now.hidden || isBehindModal(layer),
    }))
    return () => {
      seen.delete(part)
    }
  })
}

export {
  AgentContext,
  type AgentMarks,
  agentPressEvent,
  isHiddenFromAccessibility,
  isSecretField,
  useMarks,
  useSeen,
  withoutMarks,
}
