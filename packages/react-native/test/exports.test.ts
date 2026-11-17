import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import * as primitive from "../src/primitive"

const packageDir = path.join(__dirname, "..")
const manifest = JSON.parse(
  readFileSync(path.join(packageDir, "package.json"), "utf8")
)

// Core lists a file's exports once, in `export { }` blocks at its end.
function exportNames(file: string) {
  const text = readFileSync(file, "utf8")
  return [...text.matchAll(/^export (?:type )?\{([^}]*)\}/gm)].flatMap(
    ([, block]) =>
      block
        .split(",")
        .map((entry) => entry.trim().replace(/^type\s+/, ""))
        .filter(Boolean)
  )
}

describe("@ui-sdk/react-native", () => {
  test("its primitive entry exports every name @ui-sdk/react/primitive does", () => {
    const react = exportNames(
      path.join(packageDir, "../react/src/primitive.ts")
    )
    const native = exportNames(path.join(packageDir, "src/primitive.ts"))
    expect(react.length).toBeGreaterThan(5)
    expect(react.filter((name) => !native.includes(name))).toEqual([])
    for (const name of [
      "createParts",
      "mergeProps",
      "renderElement",
      "usePart",
      "usePrimitive",
    ]) {
      expect(typeof primitive[name as keyof typeof primitive]).toBe("function")
    }
  })

  test("its required peers are react and react-native, beside @ui-sdk/core, and it has no dependencies", () => {
    const optional = Object.keys(manifest.peerDependenciesMeta ?? {}).filter(
      (name) => manifest.peerDependenciesMeta[name].optional
    )
    expect(
      Object.keys(manifest.peerDependencies).filter(
        (name) => !name.startsWith("@ui-sdk/") && !optional.includes(name)
      )
    ).toEqual(["react", "react-native"])
    expect(optional).toEqual(["react-native-gesture-handler"])
    expect(manifest.dependencies).toBeUndefined()
  })

  test("Gesture Handler is imported by Drawer's entry alone, which no other module imports", () => {
    const sourceDir = path.join(packageDir, "src")
    const importers = readdirSync(sourceDir).filter((file) =>
      readFileSync(path.join(sourceDir, file), "utf8").includes(
        'from "react-native-gesture-handler"'
      )
    )
    expect(importers).toEqual(["drawer.tsx"])
    const drawerImporters = readdirSync(sourceDir).filter((file) =>
      readFileSync(path.join(sourceDir, file), "utf8").includes(
        'from "./drawer"'
      )
    )
    expect(drawerImporters).toEqual([])
  })

  test("every module is exported or used by another module", () => {
    const sourceDir = path.join(packageDir, "src")
    const modules = readdirSync(sourceDir).map((file) =>
      file.replace(/\.tsx?$/, "")
    )
    const imported = new Set(
      modules.flatMap((name) => {
        const file = readdirSync(sourceDir).find(
          (entry) => entry.replace(/\.tsx?$/, "") === name
        )!
        const code = readFileSync(path.join(sourceDir, file), "utf8")
        return [...code.matchAll(/from "\.\/([\w-]+)"/g)].map(([, to]) => to)
      })
    )
    const exported = new Set(
      Object.keys(manifest.exports).map((key) => key.slice(2))
    )
    expect(
      modules.filter((name) => !exported.has(name) && !imported.has(name))
    ).toEqual([])
    expect(
      Object.keys(manifest.publishConfig.exports).filter(
        (key) => key !== "./package.json"
      )
    ).toEqual(Object.keys(manifest.exports))
  })
})

describe("@ui-sdk/core", () => {
  test("imports nothing from react-native", () => {
    const coreDir = path.join(packageDir, "../core/src")
    const importers = readdirSync(coreDir, { recursive: true })
      .map(String)
      .filter((file) => /\.tsx?$/.test(file))
      .filter((file) =>
        /from "react-native|require\("react-native/.test(
          readFileSync(path.join(coreDir, file), "utf8")
        )
      )
    expect(importers).toEqual([])
  })
})
