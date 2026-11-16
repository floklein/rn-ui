import * as React from "react"

// The plain text each part renders, by its id. Two parts may share an id, as
// on two screens of a stack: the one mounted last names.
const texts = new Map<string, { text: string }[]>()
const listeners = new Map<string, Set<() => void>>()

function notify(id: string) {
  listeners.get(id)?.forEach((listener) => listener())
}

// check-code: allow return-type recursive, so TypeScript cannot infer it.
function plain(children: unknown): string | undefined {
  if (typeof children === "string" || typeof children === "number") {
    return String(children)
  }
  if (children == null || typeof children === "boolean") {
    return ""
  }
  if (!Array.isArray(children)) {
    return
  }
  let text = ""
  for (const child of children) {
    const part = plain(child)
    if (part === undefined) {
      return
    }
    text += part
  }
  return text
}

/** The text of children that are only strings and numbers, or `undefined`. */
function plainText(children: unknown) {
  const text = plain(children)?.replace(/\s+/g, " ").trim()
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

export { idsOf, plainText, resolveIds, textOf, useReferences, useText }
