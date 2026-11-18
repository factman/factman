import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { WindowFrame } from './window-frame';

/** A desktop-app window: traffic lights, title, tabs and content. */
const meta: Meta<WindowFrame> = {
  title: 'Molecules/WindowFrame',
  component: WindowFrame,
  argTypes: { variant: { control: 'inline-radio', options: ['code', 'terminal'] } },
  args: {
    variant: 'code',
    title: 'portfolio — odunayo.ts',
    tabs: [{ label: 'odunayo.ts', active: true }, { label: 'projects.json' }],
    closable: false,
    glow: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 560px">
        <fm-window-frame [variant]="variant" [title]="title" [tabs]="tabs" [closable]="closable" [glow]="glow">
          <p style="margin: 0; padding: var(--padding-lg); font: 400 13px/21px var(--font-mono); color: inherit">Window content</p>
        </fm-window-frame>
      </div>`,
  }),
};
export default meta;

type Story = StoryObj<WindowFrame>;

export const Code: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Window content')).toBeVisible();
  },
};

export const Terminal: Story = {
  args: { variant: 'terminal', title: 'odunayo@factman: ~', tabs: [], closable: true },
};
