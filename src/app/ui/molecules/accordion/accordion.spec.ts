import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { Accordion } from './accordion';

const items = [
  { id: 'cost', title: 'How much does a project cost?', content: 'It depends on the scope.' },
  { id: 'time', title: 'How long does it take?', content: 'Most projects take 4 to 12 weeks.' },
];

describe('Accordion', () => {
  it('opens one answer at a time with aria-expanded, without a region per answer', async () => {
    const change = vi.fn();
    await render(`<fm-accordion [items]="items" (expandedChange)="change($event)" />`, {
      imports: [Accordion],
      componentProperties: { items, change },
    });
    const cost = screen.getByRole('button', { name: items[0].title });
    const time = screen.getByRole('button', { name: items[1].title });
    expect(cost.getAttribute('aria-expanded')).toBe('false');
    const panel = (i: number) => document.querySelectorAll<HTMLElement>('.fm-acc-item__body')[i];
    // Closed answers stay findable by find-in-page (ETE-255).
    expect(panel(0).getAttribute('hidden')).toBe('until-found');
    await userEvent.click(cost);
    expect(panel(0).hasAttribute('hidden')).toBe(false);
    expect(panel(0).textContent).toContain('scope');
    expect(screen.queryByRole('region')).toBeNull();
    expect(cost.hasAttribute('aria-controls')).toBe(false);
    await userEvent.click(time);
    expect(cost.getAttribute('aria-expanded')).toBe('false');
    expect(time.getAttribute('aria-expanded')).toBe('true');
    expect(change).toHaveBeenLastCalledWith(['time']);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('keeps several open with multiple', async () => {
    await render(Accordion, { inputs: { items, multiple: true, expanded: ['cost'] } });
    await userEvent.click(screen.getByRole('button', { name: items[1].title }));
    const open = [...document.querySelectorAll('.fm-acc-item__body')].filter(
      (el) => !el.hasAttribute('hidden'),
    );
    expect(open).toHaveLength(2);
  });

  it('opens a closed answer when find-in-page matches it (beforematch)', async () => {
    const change = vi.fn();
    await render(`<fm-accordion [items]="items" (expandedChange)="change($event)" />`, {
      imports: [Accordion],
      componentProperties: { items, change },
    });
    const time = document.querySelectorAll('.fm-acc-item__body')[1];
    time.dispatchEvent(new Event('beforematch'));
    await vi.waitFor(() => expect(time.hasAttribute('hidden')).toBe(false));
    expect(change).toHaveBeenLastCalledWith(['time']);
    expect(screen.getByRole('button', { name: items[1].title }).getAttribute('aria-expanded')).toBe(
      'true',
    );
  });
});
