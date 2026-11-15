import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsStackedPanel,
  TabsTab,
} from "@/components/ui/tabs"
import { cn } from "cn"
import { isCodeOnly, type Framework } from "@/lib/frameworks"
import { exampleIndex, readExampleModules } from "@/lib/example-modules"
import { hasExample, readExampleSources } from "@/lib/example-sources"
import { preloadModule } from "react-dom"
import { CodeBlock } from "./code"
import { ExamplePreview } from "./example-preview"
import { FileIcon } from "lucide-react"
import { TabBar } from "./code-tabs"
import { CopyButton } from "./copy-button"
import { ResetButton } from "./reset-button"
import { StylingNote } from "./styling-note"
import { Frame } from "./frame"

async function ComponentExample({
  name,
  framework: wanted,
  fallback,
  caption,
  hideCode = false,
  hideTabs = false,
  compact = false,
  tall = false,
}: {
  name: string
  framework: Framework
  /** The framework to show when `framework` has no copy of the example. */
  fallback?: Framework
  caption?: string
  hideCode?: boolean
  hideTabs?: boolean
  compact?: boolean
  tall?: boolean
}) {
  const isAtTop = exampleIndex() < 2
  const framework = fallback && !hasExample(name, wanted) ? fallback : wanted
  const codeOnly = isCodeOnly(framework)
  const [sources, modules] = await Promise.all([
    readExampleSources(name, framework),
    codeOnly ? null : readExampleModules(name, framework),
  ])
  if (!sources) {
    return null
  }
  // The rest preload as they near the viewport.
  if (isAtTop) {
    modules?.preload.forEach((url) => preloadModule(url))
  }

  const preview = (
    <ExamplePreview
      name={name}
      framework={framework}
      src={modules?.src}
      mount={modules?.mount}
      preload={modules?.preload}
      html={modules?.html}
      compact={compact}
      tall={tall}
      log={sources.log}
    />
  )
  const single = sources.files.length === 1
  const deferred = !codeOnly && !hideCode && !hideTabs
  // Several files show one at a time, so the code panel stays as tall as one file.
  const source = single ? (
    <CodeBlock
      code={sources.files[0].code}
      lang={sources.files[0].lang}
      copy={codeOnly}
      deferred={deferred}
    />
  ) : (
    <Tabs defaultValue={sources.files[0].name}>
      <TabBar>
        <TabsList aria-label="Files">
          {sources.files.map((file) => (
            <TabsTab
              key={file.name}
              value={file.name}
              className="text-xs tracking-normal normal-case"
            >
              {file.name}
            </TabsTab>
          ))}
        </TabsList>
      </TabBar>
      {sources.files.map((file) => (
        <TabsPanel key={file.name} value={file.name}>
          <CodeBlock
            code={file.code}
            lang={file.lang}
            copy={false}
            deferred={deferred}
          />
        </TabsPanel>
      ))}
    </Tabs>
  )

  const flat =
    "[&_[data-code-frame]]:my-0 [&_[data-code-frame]]:rounded-none [&_[data-code-frame]]:bg-transparent [&_[data-code-frame]]:shadow-none [&_[data-code-frame]]:ring-0"

  return (
    <figure className="my-8">
      {modules?.styles.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="examples" />
      ))}
      {codeOnly ? (
        <Frame className={cn("overflow-hidden", flat)}>{source}</Frame>
      ) : hideCode || hideTabs ? (
        <Frame className="flex flex-col overflow-hidden">
          {preview}
          {!hideCode && (
            <div className={cn("border-t border-border/60", flat)}>
              {source}
            </div>
          )}
        </Frame>
      ) : (
        <Frame>
          <Tabs
            data-copy-scope=""
            defaultValue="preview"
            className="group/example flex flex-col"
          >
            <TabBar>
              <TabsList aria-label="Example">
                <TabsTab value="preview">Preview</TabsTab>
                <TabsTab value="code" data-code-tab="">
                  Code
                </TabsTab>
              </TabsList>
              {single && (
                <span className="ms-auto hidden min-w-0 items-center gap-1.5 truncate font-mono text-xs text-muted-foreground group-has-[[data-code-tab][data-selected]]/example:flex">
                  <FileIcon aria-hidden className="size-3.5 shrink-0" />
                  {sources.files[0].name}
                </span>
              )}
              <ResetButton className="ms-auto group-has-[[data-code-tab][data-selected]]/example:hidden" />
              <CopyButton className="hidden group-has-[[data-code-tab][data-selected]]/example:inline-flex" />
            </TabBar>
            <div className="grid [&>*]:min-w-0 [&>*]:[grid-area:1/1] [&>[data-inactive]]:invisible">
              <TabsStackedPanel
                value="preview"
                keepMounted
                className="relative grid rounded-b-frame outline-none focus-visible:inset-ring-3 focus-visible:inset-ring-ring/30"
              >
                {preview}
                <StylingNote
                  packageName={`@ui-sdk/${framework === "web-components" ? "web" : framework}`}
                  className="absolute end-1.5 bottom-1.5"
                />
              </TabsStackedPanel>
              <TabsStackedPanel
                value="code"
                keepMounted
                className={cn(
                  "overflow-hidden rounded-b-frame outline-none",
                  flat
                )}
              >
                {source}
              </TabsStackedPanel>
            </div>
          </Tabs>
        </Frame>
      )}
      {caption && (
        <figcaption className="mt-3 px-1 text-sm leading-relaxed text-balance text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

export { ComponentExample }
