import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  it('puts the skip link first, then header, main, footer and overlays in order', async () => {
    const { container } = await render(
      `<fm-main-layout>
         <header layoutHeader>Header</header>
         <h1>Page</h1>
         <footer layoutFooter>Footer</footer>
         <div layoutOverlays>Consent</div>
       </fm-main-layout>`,
      { imports: [MainLayout] },
    );
    const order = [...container.querySelectorAll('.site > *')].map((el) =>
      el.tagName.toLowerCase(),
    );
    expect(order).toEqual(['a', 'header', 'main', 'footer', 'div']);
    const main = screen.getByRole('main');
    expect(main.id).toBe('main');
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(main.textContent).toContain('Page');
  });

  it('moves focus to main from the skip link without changing the URL', async () => {
    await render(`<fm-main-layout><p>Page</p></fm-main-layout>`, { imports: [MainLayout] });
    const before = location.href;
    Element.prototype.scrollIntoView = vi.fn();
    await userEvent.click(screen.getByRole('link', { name: 'Skip to content' }));
    expect(document.activeElement).toBe(screen.getByRole('main'));
    expect(location.href).toBe(before);
  });
});
