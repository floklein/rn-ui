import type { ComponentType } from "react"

type Screen = { component: string; example: string; Example: ComponentType }

const examples = require.context(
  "../../examples/components",
  true,
  /^\.\/[\w-]+\/react-native\/[\w-]+\.tsx$/
)

const screens: Screen[] = examples.keys().map((key) => {
  const [, component, , file] = key.split("/")
  return {
    component,
    example: file.replace(/\.tsx$/, ""),
    Example: examples(key).Example,
  }
})

export { type Screen, screens }
