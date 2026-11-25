import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { type ConsentCategoryView, CookieConsentTerminal } from './cookie-consent-terminal';

const categories: ConsentCategoryView[] = [
  {
    id: 'necessary',
    label: 'necessary',
    description: 'theme, consent choice and the Medium articles cache · always on',
    required: true,
    granted: true,
  },
  {
    id: 'analytics',
    label: 'analytics',
    description: 'Google Analytics 4 · _ga, _ga_<id> · 14 months',
    required: false,
    granted: false,
  },
];

/**
 * The cookie consent banner (FR-34): `./consent` in a terminal window. Accept all and Reject all
 * match; Customize shows a switch per category. With focus inside, `a`, `r`, `c` and Esc work.
 * The stories keep it in the flow (`floating: false`); on the site it floats bottom right.
 */
const meta: Meta<CookieConsentTerminal> = {
  title: 'Organisms/CookieConsentTerminal',
  component: CookieConsentTerminal,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  args: { open: true, categories, floating: false, decide: fn(), dismissed: fn() },
};
export default meta;

type Story = StoryObj<CookieConsentTerminal>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const accept = canvas.getByRole('button', { name: /accept all/i });
    const reject = canvas.getByRole('button', { name: /reject all/i });
    // Equally prominent: same size and style.
    await expect(accept.className).toBe(reject.className);
    await userEvent.click(reject);
    await expect(args.decide).toHaveBeenCalledWith({ necessary: true, analytics: false });
  },
};

export const Customize: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /customize/i }));
    await userEvent.click(canvas.getByRole('switch', { name: /analytics/i }));
    await userEvent.click(canvas.getByRole('button', { name: /save choices/i }));
    await expect(args.decide).toHaveBeenCalledWith({ necessary: true, analytics: true });
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: /accept all/i }).focus();
    await userEvent.keyboard('c');
    await expect(canvas.getByRole('switch', { name: /analytics/i })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(args.dismissed).toHaveBeenCalled();
    await userEvent.keyboard('a');
    await expect(args.decide).toHaveBeenCalledWith({ necessary: true, analytics: true });
  },
};
