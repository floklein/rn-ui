import type { toolbar } from "@ui-sdk/core/toolbar"
import * as React from "react"
import type { PrimitiveHandle } from "./use-primitive"

const ToolbarContext = React.createContext<PrimitiveHandle<
  typeof toolbar
> | null>(null)

const ToolbarGroupContext = React.createContext(false)

function useToolbarScope() {
  const toolbar = React.useContext(ToolbarContext)
  const groupDisabled = React.useContext(ToolbarGroupContext)
  return toolbar ? () => toolbar.api.internal.scopeIn(groupDisabled) : undefined
}

export { ToolbarContext, ToolbarGroupContext, useToolbarScope }
