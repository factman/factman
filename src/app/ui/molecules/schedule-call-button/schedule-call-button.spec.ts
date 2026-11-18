import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ScheduleCallButton } from './schedule-call-button';

describe('ScheduleCallButton', () => {
  it('says it opens a dialog and emits schedule with the service', async () => {
    const schedule = vi.fn();
    const { container } = await render(
      `<fm-schedule-call-button service="Consultancy" (schedule)="schedule($event)" />`,
      { imports: [ScheduleCallButton], componentProperties: { schedule } },
    );
    const button = screen.getByRole('button', { name: 'Schedule a call' });
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(container.querySelector('svg')).toBeTruthy();
    await userEvent.click(button);
    expect(schedule).toHaveBeenCalledWith('Consultancy');
  });
});
