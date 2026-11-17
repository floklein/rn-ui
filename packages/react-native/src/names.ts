import * as React from "react"

// The plain text each part renders, by its id. Two parts may share an id, as
// on two screens of a stack: the one mounted last names.
const texts = new Map<string, { text: string }[]>()
const listeners = new Map<string, Set<() => void>>()

function notify(id: string) {
  listeners.get(id)?.forEach((listener) => listener())
}

// check-code: allow return-type recursive, so TypeScript cannot infer it.
function plain(children: unknown, nested = false): string | undefined {
  if (typeof children === "string" || typeof children === "number") {
    return String(children)
  }
  if (children == null || typeof children === "boolean") {
    return ""
  }
  if (nested && React.isValidElement<{ children?: unknown }>(children)) {
    return plain(children.props.children, nested)
  }
  if (!Array.isArray(children)) {
    return
  }
  let text = ""
  for (const child of children) {
    const part = plain(child, nested)
    if (part === undefined) {
      return
    }
    text += part
  }
  return text
}

/**
 * The text of children that are only strings and numbers, or `undefined`.
 * `nested` reads the text inside elements too, as a screen reader does.
 */
function plainText(children: unknown, nested = false) {
  const text = plain(children, nested)?.replace(/\s+/g, " ").trim()
  return text || undefined
}

const textOf = (id: string) => texts.get(id)?.at(-1)?.text

/** The texts the ids name, joined in order, or `undefined` when one names none. */
function resolveIds(ids: string[]) {
  const found = ids.map(textOf)
  return found.length && found.every((text) => text !== undefined)
    ? found.join(" ")
    : undefined
}

const idsOf = (value: string | undefined) =>
  value?.split(/\s+/).filter(Boolean) ?? []

function useText(id: string | undefined, text: string | undefined) {
  React.useLayoutEffect(() => {
    if (id === undefined || text === undefined) {
      return
    }
    const entry = { text }
    texts.set(id, [...(texts.get(id) ?? []), entry])
    notify(id)
    return () => {
      const rest = (texts.get(id) ?? []).filter((item) => item !== entry)
      if (rest.length) {
        texts.set(id, rest)
      } else {
        texts.delete(id)
      }
      notify(id)
    }
  }, [id, text])
}

// Rerenders when any of the ids' texts changes.
function useReferences(ids: string[]) {
  const key = ids.join(" ")
  const subscribe = React.useCallback(
    (listener: () => void) => {
      const own = idsOf(key)
      for (const id of own) {
        let set = listeners.get(id)
        if (!set) {
          listeners.set(id, (set = new Set()))
        }
        set.add(listener)
      }
      return () => {
        for (const id of own) {
          listeners.get(id)?.delete(listener)
        }
      }
    },
    [key]
  )
  const snapshot = () =>
    idsOf(key)
      .map((id) => textOf(id) ?? "\0")
      .join("\u0001")
  React.useSyncExternalStore(subscribe, snapshot, snapshot)
}

// The labels for a control through `htmlFor`, by the control's id. As with
// texts, two screens may hold the same ids: the label mounted last names.
const labelsFor = new Map<string, { id: string }[]>()
const labelListeners = new Set<() => void>()

function watchLabels(listener: () => void) {
  labelListeners.add(listener)
  return () => {
    labelListeners.delete(listener)
  }
}

function useLabelFor(control: string | undefined, label: string) {
  React.useLayoutEffect(() => {
    if (control === undefined) {
      return
    }
    const entry = { id: label }
    labelsFor.set(control, [...(labelsFor.get(control) ?? []), entry])
    labelListeners.forEach((listener) => listener())
    return () => {
      const rest = labelsFor.get(control)!.filter((item) => item !== entry)
      if (rest.length) {
        labelsFor.set(control, rest)
      } else {
        labelsFor.delete(control)
      }
      labelListeners.forEach((listener) => listener())
    }
  }, [control, label])
}

/** The id of the label that names a control, or `undefined`. */
function useLabel(control: string | undefined) {
  const snapshot = () =>
    control === undefined ? undefined : labelsFor.get(control)?.at(-1)?.id
  return React.useSyncExternalStore(watchLabels, snapshot, snapshot)
}

export {
  idsOf,
  plainText,
  resolveIds,
  textOf,
  useLabel,
  useLabelFor,
  useReferences,
  useText,
}
