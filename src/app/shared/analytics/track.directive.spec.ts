import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { AnalyticsEvent } from './analytics-events';
import { Track } from './track.directive';
import { ANALYTICS_TRACKER } from './tracker';

@Component({
  imports: [Track],
  template: `<button type="button" [fmTrack]="event()">Go</button>`,
})
class Host {
  readonly event = signal<AnalyticsEvent | null>({
    name: 'cta_click',
    params: { cta_id: 'book', location: 'hero' },
  });
}

describe('Track', () => {
  it('sends its event on click, and nothing for null', async () => {
    const track = vi.fn();
    const { fixture } = await render(Host, {
      providers: [{ provide: ANALYTICS_TRACKER, useValue: { track } }],
    });
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(track).toHaveBeenCalledWith('cta_click', { cta_id: 'book', location: 'hero' });

    fixture.componentInstance.event.set(null);
    fixture.detectChanges();
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('goes nowhere without a tracker (the default)', async () => {
    await render(Host);
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(screen.getByRole('button', { name: 'Go' })).toBeTruthy();
  });
});
