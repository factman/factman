import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { SelectableCard } from './selectable-card';

describe('SelectableCard', () => {
  it('is a radio labelled by its card, reporting a pick', async () => {
    const change = vi.fn();
    await render(
      `<fm-selectable-card title="Discovery call" description="30 minutes" name="call" value="discovery" (selectedChange)="change($event)" />
       <fm-selectable-card title="Project review" name="call" value="review" [selected]="true" />`,
      { imports: [SelectableCard], componentProperties: { change } },
    );
    const discovery = screen.getByRole('radio', { name: 'Discovery call' });
    expect(discovery.getAttribute('aria-describedby')).toMatch(/-desc$/);
    expect(screen.getByRole('radio', { name: 'Project review' })).toHaveProperty('checked', true);
    await userEvent.click(screen.getByText('30 minutes'));
    expect(change).toHaveBeenCalledWith(true);
    expect(discovery.closest('label')?.classList).not.toContain('is-selected');
  });

  it('can be a checkbox and disabled', async () => {
    await render(SelectableCard, {
      inputs: { title: 'Add a code audit', type: 'checkbox', disabled: true },
    });
    const box = screen.getByRole('checkbox', { name: 'Add a code audit' });
    expect(box).toHaveProperty('disabled', true);
    expect(box.closest('label')?.classList).toContain('is-disabled');
  });
});
