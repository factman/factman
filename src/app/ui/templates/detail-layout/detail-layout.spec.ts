import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';

import { DetailLayout } from './detail-layout';

describe('DetailLayout', () => {
  it('places breadcrumbs and every slot in order', async () => {
    const { container } = await render(
      `<fm-detail-layout [crumbs]="crumbs">
         <h1 detailHero>Consultancy</h1>
         <p detailGallery>Gallery</p>
         <p detailBody>Body</p>
         <aside detailAside>Booking</aside>
         <p detailCta>Call to action</p>
         <p detailRelated>Related</p>
       </fm-detail-layout>`,
      {
        imports: [DetailLayout],
        providers: [provideRouter([])],
        componentProperties: {
          crumbs: [{ label: 'Services', href: '/services' }, { label: 'Consultancy' }],
        },
      },
    );
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
    const order = [
      ...container.querySelectorAll(
        '[detailHero], [detailGallery], [detailBody], [detailAside], [detailCta], [detailRelated]',
      ),
    ].map((el) => el.textContent);
    expect(order).toEqual([
      'Consultancy',
      'Gallery',
      'Body',
      'Booking',
      'Call to action',
      'Related',
    ]);
    expect(screen.getByText('Body').closest('.detail-main')).toBeTruthy();
    expect(screen.getByText('Booking').closest('.detail-aside')).toBeTruthy();
  });

  it('leaves empty slots empty and has no breadcrumbs without crumbs', async () => {
    const { container } = await render(
      `<fm-detail-layout><p detailBody>Body</p></fm-detail-layout>`,
      {
        imports: [DetailLayout],
      },
    );
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(container.querySelector('.detail-aside')?.children).toHaveLength(0);
    expect(container.querySelector('.detail-related .detail-container')?.children).toHaveLength(0);
  });
});
