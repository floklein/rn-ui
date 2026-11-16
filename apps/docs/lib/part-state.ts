import { partStates } from "./data-attributes"
import { stateRows, type Row } from "./reference-rows"

/**
 * The fields one part's style, class name, children and render functions
 * receive on React Native, where state takes the place of data attributes
 * and CSS variables. Types and meanings come from the part's state type.
 */
function partStateRows({
  component,
  part,
  path,
  name,
  omit = [],
}: {
  component: string
  part: string
  path: string
  name: string
  omit?: string[]
}) {
  const described = new Map(
    stateRows({ path, name }).map((row) => [row.name, row])
  )
  const sampled = new Map<string, unknown>()
  for (const state of partStates(component, part)) {
    for (const [field, value] of Object.entries(state)) {
      if (!omit.includes(field)) {
        sampled.set(field, value)
      }
    }
  }
  return [...sampled].map(
    ([field, value]): Row =>
      described.get(field) ?? { name: field, type: typeof value, text: "" }
  )
}

export { partStateRows }
