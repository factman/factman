import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { iconSearch } from '@ui/atoms';

import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('shows the message and emits its action', async () => {
    const action = vi.fn();
    await render(
      `<fm-empty-state [icon]="icon" title="No projects match" description="Try fewer filters." actionLabel="Clear filters" (action)="action()" />`,
      { imports: [EmptyState], componentProperties: { icon: iconSearch, action } },
    );
    expect(screen.getByText('No projects match')).toBeTruthy();
    expect(screen.getByText('Try fewer filters.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(action).toHaveBeenCalledOnce();
  });

  it('has no button without an action label', async () => {
    await render(EmptyState, { inputs: { icon: iconSearch, title: 'Nothing here yet' } });
    expect(screen.queryByRole('button')).toBeNull();
  });
});
