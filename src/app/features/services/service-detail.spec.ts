import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ServiceDetailPage } from './service-detail';

async function renderService(slug = 'devops') {
  const { services } = await import('@data/services');
  const service = services.find((s) => s.slug === slug)!;
  const result = await render(ServiceDetailPage, {
    inputs: { service },
    providers: [provideRouter([])],
  });
  return { ...result, service };
}

describe('ServiceDetailPage (/services/:slug)', () => {
  it('has the service as the h1, its breadcrumbs and "Get a quote"', async () => {
    const { service } = await renderService();
    expect(screen.getByRole('heading', { level: 1, name: service.title })).toBeTruthy();
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(crumbs.textContent).toContain('Services');
    expect(screen.getAllByText('Get a quote').length).toBeGreaterThan(0);
  });

  it('shows who it is for, the deliverables, the steps, the engagement models and the FAQ', async () => {
    const { service } = await renderService();
    for (const name of [
      'Who it is for',
      'Deliverables',
      'How I work',
      'Engagement models',
      'FAQ',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeTruthy();
    }
    expect(screen.getByText(service.audience)).toBeTruthy();
    for (const d of service.deliverables) expect(screen.getByText(d)).toBeTruthy();
    for (const m of service.engagement) expect(screen.getByText(m.title)).toBeTruthy();
  });

  it('lists four other services, starting after this one', async () => {
    const { container, service } = await renderService();
    const { services } = await import('@data/services');
    const related = [...container.querySelectorAll('#related .service-card-link')].map((a) =>
      a.getAttribute('href'),
    );
    expect(related).toHaveLength(4);
    expect(related).not.toContain(`/services/${service.slug}`);
    const ordered = [...services].sort((a, b) => a.order - b.order);
    const next = ordered[(ordered.findIndex((s) => s.slug === service.slug) + 1) % ordered.length];
    expect(related[0]).toBe(`/services/${next.slug}`);
  });

  it('opens the scheduler about this service from "Schedule a call"', async () => {
    const { container, service } = await renderService();
    await userEvent.click(screen.getAllByRole('button', { name: /Schedule a call/ })[0]);
    expect(container.querySelector('iframe')).toBeTruthy();
    expect(screen.getByText(`About ${service.title} · pick a time that suits you.`)).toBeTruthy();
  });
});
