import { DOCUMENT, Injectable, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';

/** The one structured-data block a page has, in the <head>. */
export const STRUCTURED_DATA_ID = 'structured-data';

/** Schema.org JSON-LD: a single node or a `@graph`. */
export type JsonLd = Record<string, unknown>;

/**
 * The Trusted Types policy that may write a JSON-LD block (listed in the CSP's `trusted-types`,
 * ETE-267). It accepts only valid JSON, so it can't be used to run script.
 */
export const JSON_LD_POLICY = 'fm-json-ld';

interface ScriptPolicy {
  createScript(input: string): unknown;
}
interface TrustedTypesFactory {
  createPolicy(name: string, rules: { createScript(input: string): string }): ScriptPolicy;
}

/** One policy per window (keyed by its `trustedTypes`), created on first use. */
const policies = new WeakMap<TrustedTypesFactory, ScriptPolicy | null>();

function jsonLdPolicy(win: (Window & { trustedTypes?: TrustedTypesFactory }) | null) {
  const factory = win?.trustedTypes;
  if (!factory) return null;
  if (!policies.has(factory)) {
    let policy: ScriptPolicy | null = null;
    try {
      policy = factory.createPolicy(JSON_LD_POLICY, {
        createScript: (input) => {
          JSON.parse(input); // throws on anything that isn't JSON
          return input;
        },
      });
    } catch {
      // The CSP doesn't list the policy: assign the plain string, and the CSP reports it.
    }
    policies.set(factory, policy);
  }
  return policies.get(factory) ?? null;
}

/**
 * Writes a page's schema.org data (JSON-LD) into the <head> so it is in the prerendered HTML
 * (ETE-113). A page sets it when it is created; it is removed when the next navigation starts, so
 * a page without data never keeps the previous page's. The block is data, not a script the
 * browser runs, so the CSP does not need its hash. Under Trusted Types (CSP
 * `require-trusted-types-for 'script'`) the text goes through the `fm-json-ld` policy.
 */
@Injectable({ providedIn: 'root' })
export class StructuredData {
  private readonly document = inject(DOCUMENT);

  constructor() {
    inject(Router, { optional: true })?.events.subscribe((e) => {
      if (e instanceof NavigationStart) this.clear();
    });
  }

  set(data: JsonLd): void {
    let script = this.document.getElementById(STRUCTURED_DATA_ID);
    if (!script) {
      script = this.document.createElement('script');
      script.id = STRUCTURED_DATA_ID;
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    // `<` is escaped so a value can never close the script element.
    const json = JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(
      /</g,
      '\\u003c',
    );
    const policy = jsonLdPolicy(this.document.defaultView);
    script.textContent = policy ? (policy.createScript(json) as string) : json;
  }

  clear(): void {
    this.document.getElementById(STRUCTURED_DATA_ID)?.remove();
  }
}
