// Jest runs CommonJS without VM modules, so core's lazy `import()`, like the
// announcer's, becomes a `require`. Metro bundles `import()` itself.
const requireDynamicImports = ({ template }) => ({
  visitor: {
    CallExpression(path) {
      if (path.node.callee.type === "Import") {
        path.replaceWith(
          template.expression
            .ast`Promise.resolve().then(() => require(${path.node.arguments[0]}))`
        )
      }
    },
  },
})

module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [requireDynamicImports],
}
