import * as React from "react"

const carried = new Set<React.Context<any>>()

// The adapter's own contexts, which a popup's outlet provides again inside its
// `Modal`. An app's providers aren't carried: spec rule 8.
function carry<T>(name: string, context: React.Context<T>) {
  context.displayName = name
  carried.add(context)
  return context
}

function useCarried() {
  const values = new Map<React.Context<any>, unknown>()
  for (const context of carried) {
    values.set(context, React.use(context))
  }
  return values
}

function Carried({
  values,
  children,
}: {
  values: Map<React.Context<any>, unknown>
  children: React.ReactNode
}) {
  let tree = children
  for (const [Context, value] of values) {
    tree = <Context value={value}>{tree}</Context>
  }
  return tree
}

export { carried, carry, Carried, useCarried }
