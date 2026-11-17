import * as React from "react"
import { AgentContext, type AgentMarks, useMarks } from "./agent-context"

/**
 * Props for `AgentRegion`: the marks, and what they cover.
 * @experimental
 */
type AgentRegionProps = AgentMarks & {
  /** What the marks cover. */
  children?: React.ReactNode
}

/**
 * Marks a region that isn't a part, as the `data-agent-*` props mark a part.
 * The marks cover every component rendered inside it, and it renders no view.
 *
 * @example
 * <AgentRegion data-agent-confirm="Deletes the project"><DangerZone /></AgentRegion>
 * @experimental
 */
function AgentRegion({ children, ...marks }: AgentRegionProps) {
  const { inside } = useMarks(marks)
  return <AgentContext value={inside}>{children}</AgentContext>
}

export { agentTools, createAgent, registerTools } from "@ui-sdk/core/agent"
export type {
  AgentAction,
  AgentChange,
  AgentComponent,
  AgentStep,
  ObservedChange,
} from "@ui-sdk/core/agent"
export type { AgentMarks } from "./agent-context"
export { AgentRegion, type AgentRegionProps }
