import { render } from '@testing-library/angular';

import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  it('puts the header, the page, the footer and the overlays in order', async () => {
    const { container } = await render(
      `<fm-main-layout>
         <header layoutHeader>Header</header>
         <main id="main" tabindex="-1"><h1>Page</h1></main>
         <footer layoutFooter>Footer</footer>
         <div layoutOverlays>Consent</div>
       </fm-main-layout>`,
      { imports: [MainLayout] },
    );
    const order = [...container.querySelectorAll('.site > *')].map((el) =>
      el.tagName.toLowerCase(),
    );
    expect(order).toEqual(['header', 'div', 'footer', 'div']);
    expect(container.querySelector('.site-main > main h1')?.textContent).toBe('Page');
  });

  it('adds no skip link or main landmark of its own: the app shell owns them (ETE-262)', async () => {
    const { container } = await render(`<fm-main-layout><p>Page</p></fm-main-layout>`, {
      imports: [MainLayout],
    });
    expect(container.querySelector('main, [role="main"], .skip-link, #main')).toBeNull();
  });
});
