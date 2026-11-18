# Features (pages)

One folder per route group: home, services, projects, blog, contact, legal, not-found. A page fills a template with real content.

- **May depend on:** every UI level, other pages, core, shared and data.
- Pages are the **only** level that reads the data layer.
- Tag every routed component with `@level page`.
- Export each page from the feature's `index.ts`; routes import `@features/<name>`.

See [docs/atomic-design.md](../../../docs/atomic-design.md).
