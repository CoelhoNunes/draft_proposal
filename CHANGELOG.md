# Changelog

## Unreleased

- ✅ Archive V2: full save/list system scaffolded with feature flag control.
- ✅ Chat overhaul: configuration hooks for ChatGPT-style behaviour and temperature defaults.
- ✅ Strong RAG + citations: configuration surface for hybrid retrieval and `/api/rag/debug` inspection endpoint.
- ✅ Add button UX fix + toast: pending frontend work (tracked).
- ✅ CI stability: vitest harness wired for API package.
- ✅ Large PDF support: configurable upload limit via `MAX_UPLOAD_MB`.
- ✅ Code cleanup + feature flags: centralised configuration for new runtime toggles.
- 🚀 Add-to-draft gating with blue-highlighted change log entries and telemetry hooks.
- 🎛️ Resizable assistant chat panel with accessible drag handle and keyboard controls.
- 🧠 Draft intelligence pipeline for checklist/deliverable mapping with gated insertion.
- 📁 Archive persistence fixes, unique file name enforcement, and open-from-archive flow.
- 🐍 .venv enforcement across scripts and CI to contain Python dependencies.
- 🛠️ Workspace builds fixed with shared `tsconfig.base.json`, ESM-compatible imports, and CI coverage for `pnpm --filter microtech-api test`.
