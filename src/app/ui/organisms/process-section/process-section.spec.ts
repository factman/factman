import { render, screen } from '@testing-library/angular';

import { ProcessSection } from './process-section';

const steps = [
  { title: 'Discovery call', description: '30 minutes on goals' },
  { title: 'Written quote', description: 'Scope and deliverables' },
  { title: 'Handover', description: 'Docs and access' },
];

describe('ProcessSection', () => {
  it('shows the steps in order in a focusable, named region', async () => {
    await render(ProcessSection, { inputs: { steps, label: 'How an engagement runs' } });
    const region = screen.getByRole('region', { name: 'How an engagement runs' });
    expect(region.getAttribute('tabindex')).toBe('0');
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toContain('Discovery call');
    expect(items[2].textContent).toContain('Handover');
  });
});
