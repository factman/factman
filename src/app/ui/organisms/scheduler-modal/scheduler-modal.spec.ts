import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { SchedulerModal } from './scheduler-modal';

const EMBED = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0-abc_123?gv=true';
const FALLBACK = 'https://calendar.app.google/abc';

const renderModal = (inputs: Record<string, unknown>) =>
  render(SchedulerModal, {
    inputs: { src: EMBED, fallbackUrl: FALLBACK, ...inputs },
    providers: [provideRouter([])],
  });

describe('SchedulerModal', () => {
  it('creates no frame while closed', async () => {
    const { container } = await renderModal({ open: false });
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('frames the calendar while open, with a loading status until it loads', async () => {
    const { container } = await renderModal({ open: true, service: 'DevOps' });
    const frame = container.querySelector('iframe')!;
    expect(frame.getAttribute('src')).toBe(EMBED);
    expect(frame.getAttribute('title')).toContain('Google Calendar');
    expect(screen.getByRole('status').textContent).toContain('Loading available times');
    expect(screen.getByText('About DevOps · pick a time that suits you.')).toBeTruthy();
    frame.dispatchEvent(new Event('load'));
    await screen.findByText(
      'Times show in your time zone. Google Calendar sends the confirmation.',
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('offers the calendar in a new tab', async () => {
    await renderModal({ open: true });
    const link = screen.getByRole('link', { name: /Open in a new tab/ });
    expect(link.getAttribute('href')).toBe(FALLBACK);
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('refuses to frame anything but a Google Calendar appointment schedule', async () => {
    const { container } = await renderModal({ open: true, src: 'https://evil.example.com/x' });
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('asks the page to close from the close button', async () => {
    const closed = vi.fn();
    await render(SchedulerModal, {
      inputs: { open: true, src: EMBED, fallbackUrl: FALLBACK },
      on: { closed },
      providers: [provideRouter([])],
    });
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(closed).toHaveBeenCalled();
  });
});
