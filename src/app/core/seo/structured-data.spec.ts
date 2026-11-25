import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { JSON_LD_POLICY, STRUCTURED_DATA_ID, StructuredData } from './structured-data';

describe('StructuredData', () => {
  const setup = () => {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', children: [] }])] });
    return { data: TestBed.inject(StructuredData), doc: TestBed.inject(DOCUMENT) };
  };
  const block = (doc: Document) => doc.getElementById(STRUCTURED_DATA_ID);

  it('writes one JSON-LD block in the head, with the schema.org context', () => {
    const { data, doc } = setup();
    data.set({ '@type': 'Person', name: 'Ada' });
    data.set({ '@type': 'Person', name: 'Grace' });
    const el = block(doc)!;
    expect(doc.head.querySelectorAll(`#${STRUCTURED_DATA_ID}`)).toHaveLength(1);
    expect(el.getAttribute('type')).toBe('application/ld+json');
    expect(JSON.parse(el.textContent!)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Grace',
    });
  });

  it('escapes < so a value cannot close the script', () => {
    const { data, doc } = setup();
    data.set({ name: '</script><b>' });
    expect(block(doc)!.textContent).not.toContain('</script>');
    expect(JSON.parse(block(doc)!.textContent!).name).toBe('</script><b>');
  });

  it('is removed when the next navigation starts', async () => {
    const { data, doc } = setup();
    data.set({ '@type': 'WebSite' });
    await TestBed.inject(Router).navigateByUrl('/elsewhere');
    expect(block(doc)).toBeNull();
  });

  describe('under Trusted Types (ETE-267)', () => {
    // Angular makes its own policies ("angular", …) through the same factory: pass those through.
    const passThrough = {
      createHTML: (s: string) => s,
      createScript: (s: string) => s,
      createScriptURL: (s: string) => s,
    };
    afterEach(() => delete (window as { trustedTypes?: unknown }).trustedTypes);

    it('writes the block through the fm-json-ld policy, created once, which accepts only JSON', () => {
      let rules: { createScript(input: string): string } | undefined;
      const createScript = vi.fn((input: string) => rules!.createScript(input));
      const ours = vi.fn();
      const createPolicy = (name: string, r: { createScript(input: string): string }) => {
        if (name !== JSON_LD_POLICY) return passThrough;
        ours(name);
        rules = r;
        return { createScript };
      };
      (window as { trustedTypes?: unknown }).trustedTypes = { createPolicy };
      const { data, doc } = setup();
      data.set({ '@type': 'Person', name: 'Ada' });
      data.set({ '@type': 'Person', name: 'Grace' });
      expect(ours).toHaveBeenCalledOnce();
      expect(createScript).toHaveBeenCalledTimes(2);
      expect(JSON.parse(block(doc)!.textContent!).name).toBe('Grace');
      expect(() => rules!.createScript('alert(1)')).toThrow();
    });

    it('falls back to the plain string when the CSP refuses the policy', () => {
      (window as { trustedTypes?: unknown }).trustedTypes = {
        createPolicy: (name: string) => {
          if (name !== JSON_LD_POLICY) return passThrough;
          throw new TypeError('Policy "fm-json-ld" disallowed.');
        },
      };
      const { data, doc } = setup();
      data.set({ '@type': 'WebSite' });
      expect(JSON.parse(block(doc)!.textContent!)['@type']).toBe('WebSite');
    });
  });
});
