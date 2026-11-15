import { createMDX } from "fumadocs-mdx/next"
import path from "node:path"
import {
  newestByMajor,
  newestRelease,
  releasesIn,
  webReleaseHeaders,
} from "./lib/web-releases.mjs"

const withMDX = createMDX()

const frameworks = [
  "react",
  "vue",
  "svelte",
  "web-components",
  "solid",
  "react-native",
]

const publicDir = path.join(import.meta.dirname, "public")
const newest = (versions) =>
  JSON.stringify({
    ...Object.fromEntries(newestByMajor(versions)),
    latest: newestRelease(versions),
  })

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Prerendering every page's props tables can pass Next's 60-second default
  // on a busy machine, which fails the whole build.
  staticPageGenerationTimeout: 300,
  // Workspace packages ship TypeScript source. The examples aren't bundled:
  // examples/vite.config.ts compiles them into public/examples.
  transpilePackages: ["@ui-sdk/core", "@ui-sdk/react"],
  turbopack: { root: path.resolve(import.meta.dirname, "../..") },
  // The newest `@ui-sdk/web` release of each major, and of all, like
  // `{"1":"1.3.0","2":"2.0.0","latest":"2.0.0"}`, and the releases with a
  // stylesheet, which older ones lack, for `proxy.ts`.
  env: {
    WEB_RELEASES: newest(releasesIn(publicDir)),
    WEB_STYLE_RELEASES: JSON.stringify(releasesIn(publicDir, ".css")),
    // The day of the build, like "2026-11-10", for the homepage's calendar.
    BUILD_DAY: new Date().toISOString().slice(0, 10),
  },
  async headers() {
    return [
      ...webReleaseHeaders(),
      // Every compiled example's file name carries its hash.
      {
        source: "/examples/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
  async rewrites() {
    // Get Started, Core, Guides and Agents are built once per framework under /for, and
    // served by the reader's cookie, else React's. The pattern takes the router's
    // `.rsc` and `.segments/` requests too, and leaves `.md` and `llms.txt` alone.
    const source =
      "/:path((?!.*(?:\\.md|/llms\\.txt)$)docs(?:/(?:core|guides|agents)(?:[./].*)?|\\.(?:rsc|segments/.*))?)"
    const cookie = { type: "cookie", key: "framework" }
    return {
      beforeFiles: [
        {
          source,
          has: [{ ...cookie, value: `(?<framework>${frameworks.join("|")})` }],
          destination: "/for/:framework/:path",
        },
        {
          source,
          missing: [{ ...cookie, value: `(?:${frameworks.join("|")})` }],
          destination: "/for/react/:path",
        },
      ],
      // Every page as Markdown, like `/docs/react/components/menu.md`. Core's and
      // Agents' own `.md` files are the whole section, and they win.
      afterFiles: [
        { source: "/design", destination: "/design/index.html" },
        { source: "/docs.md", destination: "/md/core/start" },
        { source: "/docs/:path*.md", destination: "/md/:path*" },
      ],
    }
  },
  async redirects() {
    const pages =
      "components|utilities|rendering|server-rendering|custom-parts|styling-and-animation"
    return [
      // Get Started is Core's page by its file, and lives at /docs.
      {
        source: "/docs/core/kernel/style-a-primitive",
        destination: "/docs/core/kernel/style-a-component",
        permanent: true,
      },
      { source: "/docs/core/start", destination: "/docs", permanent: true },
      // Core's pages for each framework are only served through /docs.
      {
        source: "/for/:framework/:path*",
        destination: "/:path*",
        permanent: false,
      },
      {
        source: `/docs/:framework(${frameworks.join("|")})/:folder(hooks|utilities)/observe`,
        destination: "/docs/core/observe",
        permanent: true,
      },
      {
        source: "/docs/utilities/observe",
        destination: "/docs/core/observe",
        permanent: true,
      },
      {
        source: `/docs/:framework(${frameworks.join("|")})/why`,
        destination: "/docs/:framework",
        permanent: true,
      },
      {
        source: "/docs/why",
        destination: "/docs/frameworks",
        permanent: false,
      },
      ...frameworks.map((framework) => ({
        source: "/docs/frameworks",
        has: [{ type: "cookie", key: "framework", value: framework }],
        destination: `/docs/${framework}`,
        permanent: false,
      })),
      {
        source: "/docs/frameworks",
        destination: "/docs/react",
        permanent: false,
      },
      {
        source: `/docs/:framework(${frameworks.join("|")})/usage`,
        destination: "/docs/:framework/parts-and-composition",
        permanent: false,
      },
      // Form was removed: a native form with fields does its job.
      {
        source: `/docs/:framework(${frameworks.join("|")})/components/form`,
        destination: "/docs/:framework/forms",
        permanent: true,
      },
      // The shared sections link to a framework's pages without naming one, like
      // /docs/components/field. They go to the framework the reader last read,
      // which its pages remember in a cookie, else React.
      ...frameworks.map((framework) => ({
        source: `/docs/:page(${pages})/:rest*`,
        has: [{ type: "cookie", key: "framework", value: framework }],
        destination: `/docs/${framework}/:page/:rest*`,
        permanent: false,
      })),
      {
        source: `/docs/:page(${pages})/:rest*`,
        destination: "/docs/react/:page/:rest*",
        permanent: false,
      },
      {
        source: "/docs/core/request-access",
        destination: "/docs/core",
        permanent: true,
      },
      {
        source: "/docs/core/get-started",
        destination: "/docs/core/build-a-component",
        permanent: true,
      },
      {
        source: "/docs/agents/create-agent",
        destination: "/docs/agents/connect-an-agent",
        permanent: true,
      },
      {
        source: "/docs/agents/webmcp",
        destination: "/docs/agents/connect-an-agent/webmcp",
        permanent: true,
      },
      // Where Primitives and Building Blocks were before Core had its section.
      {
        source: "/docs/:framework/utilities/primitives",
        destination: "/docs/core/kernel/define-a-primitive",
        permanent: true,
      },
      // Building Blocks became Behaviors, a page per job, and took Popups and Canvas with it.
      {
        source: "/docs/:framework/utilities/building-blocks",
        destination: "/docs/core/behaviors",
        permanent: true,
      },
      {
        source: "/docs/core/building-blocks",
        destination: "/docs/core/behaviors",
        permanent: true,
      },
      // Older Core pages now live in Core's own pages or in Behaviors.
      {
        source: "/docs/core/primitives",
        destination: "/docs/core/kernel/define-a-primitive",
        permanent: true,
      },
      {
        source:
          "/docs/:path(core/behaviors|behaviors|core/kernel)/:page(state-and-events|state-and-changes)",
        destination: "/docs/core/kernel/handle-changes",
        permanent: true,
      },
      {
        source: "/docs/behaviors/llms.txt",
        destination: "/docs/core/llms.txt",
        permanent: true,
      },
      {
        source: "/docs/:path(core/behaviors|behaviors)/date",
        destination: "/docs/core/date",
        permanent: true,
      },
      {
        source: "/docs/behaviors/:rest*",
        destination: "/docs/core/behaviors/:rest*",
        permanent: true,
      },
      {
        source: "/docs/core/:page(popups|canvas|trees)",
        destination: "/docs/core/behaviors/:page",
        permanent: true,
      },
      // Each framework's Primitives page became Rendering.
      {
        source: `/docs/:framework(${frameworks.join("|")})/primitives`,
        destination: "/docs/:framework/rendering",
        permanent: true,
      },
      {
        source: "/docs/primitives",
        destination: "/docs/rendering",
        permanent: true,
      },
      // React's utilities are hooks.
      {
        source: "/docs/react/utilities/:rest*",
        destination: "/docs/react/hooks/:rest*",
        permanent: true,
      },
      // Core and Agents were once a copy per framework.
      {
        source: "/docs/:framework/core.md",
        destination: "/docs/core.md",
        permanent: true,
      },
      {
        source: "/docs/:framework/core/:page*",
        destination: "/docs/core/:page*",
        permanent: true,
      },
      {
        source: "/docs/:framework/agents",
        destination: "/docs/agents",
        permanent: true,
      },
    ]
  },
}

export default withMDX(config)
