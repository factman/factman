/**
 * How an `href` given to a Button, IconButton or Link is rendered (ETE-68):
 * - **router:** a path in this app (`/projects`, `/services/devops#book`, `#contact`), rendered
 *   with `routerLink`, so navigation stays in the app and `#fragment` targets work with the
 *   prerendered `<base href>`. An empty path means the current page.
 * - **external:** anything else (`https://…`, `mailto:`, `tel:`), rendered as a plain `href`.
 *   Other sites open in a new tab by default; `mailto:` and `tel:` never do. A file this site
 *   serves (`/resumes/cv.pdf`: a last segment with an extension) is not a route either: it is a
 *   plain `href` too, in the same tab unless `newTab` says otherwise.
 */
export type ParsedHref =
  | {
      kind: 'router';
      path: string;
      queryParams: Record<string, string> | null;
      fragment: string | undefined;
    }
  | { kind: 'external'; url: string; opensNewTab: boolean };

export function parseHref(href: string): ParsedHref {
  const isFile = /^\/[^?#]*\.[a-z0-9]+(?:[?#]|$)/i.test(href) && !href.startsWith('//');
  const isAppPath =
    href.startsWith('#') || (href.startsWith('/') && !href.startsWith('//') && !isFile);
  if (!isAppPath) return { kind: 'external', url: href, opensNewTab: /^https?:\/\//i.test(href) };
  const url = new URL(href, 'https://app.invalid');
  const queryParams = url.search ? Object.fromEntries(url.searchParams) : null;
  return {
    kind: 'router',
    // `#contact` alone stays on the current page.
    path: href.startsWith('#') ? '.' : url.pathname,
    queryParams,
    fragment: url.hash ? decodeURIComponent(url.hash.slice(1)) : undefined,
  };
}
