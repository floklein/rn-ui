import { labelOf } from "../text/typeahead"

// The name screen readers hear for a moving item the app doesn't label: its text.
const itemLabel = (el: HTMLElement) => labelOf(el)

export { itemLabel }
