import { render, screen } from '@testing-library/angular';

import { spinnerRing } from './ring';
import { Spinner } from './spinner';

describe('spinnerRing', () => {
  it('thickens the stroke for larger spinners', () => {
    expect(spinnerRing(20).w).toBeCloseTo(2.4);
    expect(spinnerRing(32).w).toBeCloseTo(2.25);
    expect(spinnerRing(48).w).toBe(2);
  });
});

describe('Spinner', () => {
  it('is a status that reads its label', async () => {
    const { container } = await render(Spinner, {
      inputs: { label: 'Loading projects', size: 32 },
    });
    const status = screen.getByRole('status');
    expect(status.textContent?.trim()).toBe('Loading projects');
    expect(status.style.width).toBe('32px');
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('puts the logo mark inside the ring for the logo type', async () => {
    const { container } = await render(Spinner, { inputs: { type: 'logo', size: 64 } });
    expect(container.querySelector('.spinner-logo fm-logo')).toBeTruthy();
  });
});
