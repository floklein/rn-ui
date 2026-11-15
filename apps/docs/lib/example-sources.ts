import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { exampleFolder } from "./example-folder"
import { frameworks, type Framework } from "./frameworks"
import { publishedNames } from "./published-names"

function examplePath(name: string, framework: Framework) {
  const { example, ext } = frameworks[framework]
  const [component, base] = name.split("/")
  return path.join(
    /* turbopackIgnore: true */ exampleFolder(component),
    example,
    `${base}.${ext}`
  )
}

/** Whether `framework` has its own copy of the example. */
function hasExample(name: string, framework: Framework) {
  return existsSync(examplePath(name, framework))
}

async function readExampleSources(name: string, framework: Framework) {
  const { example, ext, lang } = frameworks[framework]
  const [component, base] = name.split("/")
  const directory = path.join(exampleFolder(component), example)
  const filename = `${base}.${ext}`
  // Source files are read to show them, never bundled, so Turbopack skips tracing these paths.
  const code = await readFile(
    path.join(/* turbopackIgnore: true */ directory, filename),
    "utf8"
  ).catch(() => null)
  if (!code) {
    return null
  }

  // Examples log to the preview's console through `useLog()`. The code shows it as written, from
  // "./log"; the logger itself is docs-only, so its file isn't shown. Other files from
  // examples/shared show beside the example, imported from the same folder, so copying both works.
  const files = [{ name: filename, lang, code: code.trimEnd() }]
  const log = /from "(?:\.\.\/)+shared\/[^"]+\/log"/.test(code)
  if (log) {
    files[0].code = files[0].code.replace(
      /from "(?:\.\.\/)+shared\/[^"]+\/log"/,
      'from "./log"'
    )
  }
  const shared = [
    ...files[0].code.matchAll(/from "((?:\.\.\/)+shared\/[^"]+)"/g),
  ].map((match) => match[1])
  for (const specifier of new Set(
    shared.filter((specifier) => !specifier.endsWith("/log"))
  )) {
    const resolved = path.resolve(
      /* turbopackIgnore: true */ directory,
      specifier
    )
    const sharedFile = [`${resolved}.${ext}`, `${resolved}.ts`, resolved].find(
      (file) => existsSync(file)
    )
    if (!sharedFile) {
      continue
    }
    files[0].code = files[0].code.replaceAll(
      `"${specifier}"`,
      `"./${path.basename(specifier)}"`
    )
    files.push({
      name: path.basename(sharedFile),
      lang,
      code: (
        await readFile(/* turbopackIgnore: true */ sharedFile, "utf8")
      ).trimEnd(),
    })
  }

  return {
    files: files.map((file) => ({
      ...file,
      code: publishedNames(file.code, framework),
    })),
    log,
  }
}

export { hasExample, readExampleSources }
