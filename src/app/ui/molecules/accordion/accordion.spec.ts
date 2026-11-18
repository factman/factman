import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { Accordion } from './accordion';

const items = [
  { id: 'cost', title: 'How much does a project cost?', content: 'It depends on the scope.' },
  { id: 'time', title: 'How long does it take?', content: 'Most projects take 4 to 12 weeks.' },
];

describe('Accordion', () => {
  it('opens one answer at a time with aria-expanded and a named region', async () => {
    const change = vi.fn();
    await render(`<fm-accordion [items]="items" (expandedChange)="change($event)" />`, {
      imports: [Accordion],
      componentProperties: { items, change },
    });
    const cost = screen.getByRole('button', { name: items[0].title });
    const time = screen.getByRole('button', { name: items[1].title });
    expect(cost.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('region')).toBeNull();
    await userEvent.click(cost);
    expect(screen.getByRole('region', { name: items[0].title }).textContent).toContain('scope');
    expect(cost.getAttribute('aria-controls')).toBe(screen.getByRole('region').id);
    await userEvent.click(time);
    expect(cost.getAttribute('aria-expanded')).toBe('false');
    expect(time.getAttribute('aria-expanded')).toBe('true');
    expect(change).toHaveBeenLastCalledWith(['time']);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('keeps several open with multiple', async () => {
    await render(Accordion, { inputs: { items, multiple: true, expanded: ['cost'] } });
    await userEvent.click(screen.getByRole('button', { name: items[1].title }));
    expect(screen.getAllByRole('region')).toHaveLength(2);
  });
});
