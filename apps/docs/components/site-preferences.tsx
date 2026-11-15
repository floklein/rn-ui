"use client"

import { cn } from "cn"
import { type Framework, isFramework } from "@/lib/frameworks"
import {
  colorScheme,
  framework as frameworkPreference,
  packageManager,
  RenderedFramework,
  setFramework,
  useFramework,
} from "@/lib/preferences"
import { isSection, utilitiesFolder } from "@/lib/sections"
import { Preferences } from "@ui-sdk/react/preferences"
import { CheckIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDocsPathname } from "@/lib/pathname"
import * as React from "react"

const preferences = [colorScheme, frameworkPreference, packageManager]

/** The section of the page being read, from its path. */
function useSection() {
  const segment = useDocsPathname().split("/")[2] ?? ""
  return isSection(segment) ? segment : undefined
}

function SitePreferences({ children }: { children: React.ReactNode }) {
  const section = useSection()

  React.useEffect(() => {
    if (section && isFramework(section)) {
      setFramework(section)
    }
  }, [section])

  return <Preferences preferences={preferences}>{children}</Preferences>
}

// The remembered framework, from the attribute the preference sets before the page
// paints, so the check doesn't move after hydration. React until one is saved.
const savedCheck = {
  react:
    "[html[data-framework]:not([data-framework='']):not([data-framework=react])_&]:invisible",
  vue: "invisible [html[data-framework=vue]_&]:visible",
  svelte: "invisible [html[data-framework=svelte]_&]:visible",
  "web-components": "invisible [html[data-framework=web-components]_&]:visible",
  solid: "invisible [html[data-framework=solid]_&]:visible",
  "react-native": "invisible [html[data-framework=react-native]_&]:visible",
}

/** A check on the current framework: the page's, else the remembered one, else React. */
function FrameworkCheck({
  framework,
  className,
}: {
  framework: Framework
  className?: string
}) {
  const section = useSection()
  const shown =
    section && isFramework(section)
      ? section === framework
        ? ""
        : "invisible"
      : savedCheck[framework]
  return (
    <CheckIcon
      aria-hidden
      className={cn("size-4 shrink-0", shown, className)}
    />
  )
}

/** The framework a page was built for, which its framework's tabs, snippets and links hydrate as. */
function PageFramework({
  framework,
  children,
}: {
  framework: Framework
  children: React.ReactNode
}) {
  return (
    <RenderedFramework value={framework}>
      <FollowFramework rendered={framework} />
      {children}
    </RenderedFramework>
  )
}

// Get Started, Core, Agents and Guides are built per framework. When the reader
// picks another, or the router kept a copy built for the one before, fetch the
// page for the new one. Framework pages stay their own, whatever was picked.
function FollowFramework({ rendered }: { rendered: Framework }) {
  const section = useSection()
  const [framework] = useFramework()
  const router = useRouter()
  const shared = !(section && isFramework(section))
  React.useEffect(() => {
    if (shared && framework !== rendered) {
      router.refresh()
    }
  }, [shared, framework, rendered, router])
  return null
}

function FrameworkLink({
  href,
  ...props
}: React.ComponentProps<typeof Link> & { href: string }) {
  const [framework] = useFramework()
  const [, , folder, ...rest] = href.split("/")
  const target = folder === "utilities" ? utilitiesFolder(framework) : folder
  return (
    <Link
      href={["", "docs", framework, target, ...rest].join("/")}
      {...props}
    />
  )
}

function FrameworkContent({
  value,
  children,
}: {
  value: Framework
  children: React.ReactNode
}) {
  const [framework] = useFramework()
  return framework === value ? children : null
}

export {
  FrameworkCheck,
  FrameworkContent,
  FrameworkLink,
  PageFramework,
  SitePreferences,
  useSection,
}
