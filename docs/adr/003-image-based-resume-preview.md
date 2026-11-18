# ADR-003: Image-based résumé preview

- **Status:** Accepted
- **Date:** 2026-11-09
- **Issue:** ETE-217 (decision from ETE-18)

## Context

The site shows a preview of the résumé and offers the PDF as a download. The preview has to work on phones as well as desktops, load quickly, and look like the rest of the site.

## Options considered

1. **Embed the PDF** (`<iframe>`/`<object>`, or a PDF.js viewer)
   - Pros: one artefact; text in the preview stays selectable.
   - Cons: embedded PDFs render poorly or not at all on many mobile browsers; a viewer adds weight and loads slower; the viewer brings its own toolbar and styling; it would also need the CSP loosened (`object-src 'none'`, framing rules).
2. **Show page images, with the PDF as a download**
   - Pros: renders the same on every device; optimised images load fast; the preview can be styled to match the site.
   - Cons: an extra build step to produce the images; the preview text isn't selectable (the PDF download covers that).

## Decision

Show the résumé as **images**, with the PDF still offered as a download, because:

- **Mobile rendering:** images display consistently on every browser and device, where embedded PDFs often don't.
- **Performance:** optimised images load faster than a PDF viewer.
- **Design control:** the preview matches the site's styling and layout, with no viewer chrome.

**How the images are produced:** in CI. `resume:build` renders the PDF with headless Chromium, then rasterises its pages to images at build time. Neither the PDF nor the images are committed to the repo.

## Consequences

- Easier: one consistent preview everywhere, and the build controls image size and format.
- Harder: `resume:build` needs headless Chromium in CI and must run before the site build; the generated output should be cached by input hash to keep builds fast (see ETE-20).
- Accessibility: page images need meaningful alt text, and the downloadable PDF stays the accessible, text-based version.
