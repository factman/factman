import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { STRUCTURED_DATA_ID, StructuredData } from './structured-data';

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
});
