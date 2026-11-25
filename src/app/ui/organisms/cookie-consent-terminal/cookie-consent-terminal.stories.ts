import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { type ConsentCategoryView, CookieConsentTerminal } from './cookie-consent-terminal';

const categories: ConsentCategoryView[] = [
  {
    id: 'necessary',
    label: 'necessary',
    description: 'theme and consent choice · always on',
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
  {
    id: 'advertising',
    label: 'advertising',
    description: 'not used on this site',
    required: false,
    used: false,
    granted: false,
  },
];

/**
 * The cookie consent banner (FR-34), as in the canvas's CookieConsent: the prompt types
 * `./consent --analytics`, then "[n] Accept necessary" and "[a] Accept all" (equal primary
 * buttons) and "[c] Customize". Always dark. The stories keep it in the flow (`floating: false`);
 * on the site it docks bottom left.
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
    const all = await canvas.findByRole('button', { name: 'Accept all' });
    const necessary = canvas.getByRole('button', { name: 'Accept necessary' });
    await expect(all.className).toBe(necessary.className);
    await userEvent.click(necessary);
    await expect(args.decide).toHaveBeenCalledWith({
      necessary: true,
      analytics: false,
      advertising: false,
    });
  },
};

export const Customize: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Customize' }));
    await userEvent.click(canvas.getByRole('switch', { name: /analytics/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save choices' }));
    await expect(args.decide).toHaveBeenCalledWith({
      necessary: true,
      analytics: true,
      advertising: false,
    });
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'Accept all' });
    canvas.getByRole('dialog').focus();
    await userEvent.keyboard('c');
    await expect(canvas.getByRole('switch', { name: /analytics/ })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(args.dismissed).not.toHaveBeenCalled();
    await userEvent.keyboard('a');
    await expect(args.decide).toHaveBeenCalledWith({
      necessary: true,
      analytics: true,
      advertising: false,
    });
  },
};
