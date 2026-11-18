import { render, screen } from '@testing-library/angular';

import { Stepper } from './stepper';

describe('Stepper', () => {
  it('lists equal steps for a process overview', async () => {
    await render(Stepper, {
      inputs: { steps: [{ title: 'Discover' }, { title: 'Design' }, { title: 'Build' }] },
    });
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[1].textContent).toContain('Step 2: Design');
    expect(items.some((li) => li.hasAttribute('aria-current'))).toBe(false);
  });

  it('marks progress through a flow', async () => {
    await render(Stepper, {
      inputs: {
        orientation: 'vertical',
        steps: [
          { title: 'Pick a time', status: 'completed' },
          { title: 'Your details', status: 'current' },
          { title: 'Confirm', status: 'upcoming' },
        ],
      },
    });
    const [done, current] = screen.getAllByRole('listitem');
    expect(done.textContent).toContain('(completed)');
    expect(done.querySelector('svg')).toBeTruthy();
    expect(current.getAttribute('aria-current')).toBe('step');
    expect(screen.getByRole('list').classList).toContain('fm-stepper--v');
  });
});
