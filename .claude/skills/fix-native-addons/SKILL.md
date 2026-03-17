---
name: fix-native-addons
description: >-
  Fix native Node.js addon build failures when using Bun. Use when encountering
  "Could not locate the bindings file" errors, better-sqlite3 build issues, or
  native .node module failures after bun install.
---

# Fix Native Node.js Addons Under Bun

Bun does not automatically run `node-gyp` to compile native addons during `bun install`. Packages with C/C++ bindings (like `better-sqlite3`) will be missing their `.node` binary.

## Symptom

```
Error: Could not locate the bindings file. Tried:
 → …/node_modules/<package>/build/better_sqlite3.node
 → …/node_modules/<package>/build/Release/better_sqlite3.node
 …
```

## Fix

### Example: better-sqlite3 (used by evalite)

```bash
bun x node-gyp rebuild --directory node_modules/better-sqlite3
```

## Notes

- Compiler warnings during the build are expected and harmless.
- The build requires Python 3 and a C++ toolchain (Xcode CLT on macOS).
- This must be re-done after `rm -rf node_modules && bun install`.
