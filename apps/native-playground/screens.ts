import type { ComponentType } from "react"

type Screen = { id: string; title: string; Screen: ComponentType }

const examples = require.context(
  "../../examples/components",
  true,
  /^\.\/[\w-]+\/react-native\/[\w-]+\.tsx$/
)

const fixtures = require.context("./fixtures", false, /^\.\/[\w-]+\.tsx$/)

const screens: Screen[] = [
  ...fixtures.keys().map((key) => {
    const name = key.slice(2, -4)
    return {
      id: `fixture-${name}`,
      title: `${name} fixture`,
      Screen: fixtures(key).Fixture,
    }
  }),
  ...examples.keys().map((key) => {
    const [, component, , file] = key.split("/")
    const example = file.replace(/\.tsx$/, "")
    return {
      id: `screen-${component}-${example}`,
      title: `${component} / ${example}`,
      Screen: examples(key).Example,
    }
  }),
]

export { type Screen, screens }
