import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Skeleton } from './skeleton';

/** A placeholder in the shape of content that is loading. The pulse stops with reduced motion. */
const meta: Meta<Skeleton> = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  argTypes: { shape: { control: 'inline-radio', options: ['line', 'circle', 'rect'] } },
  args: { shape: 'line' },
};
export default meta;

type Story = StoryObj<Skeleton>;

export const Line: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.fm-skel')).toHaveAttribute('aria-hidden', 'true');
  },
};

/** A card loading: photo, avatar and two lines. */
export const Card: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: var(--gap-sm); width: 280px">
        <fm-skeleton shape="rect" width="100%" />
        <div style="display: flex; gap: var(--gap-sm); align-items: center">
          <fm-skeleton shape="circle" />
          <div style="display: flex; flex-direction: column; gap: var(--gap-xs); flex: 1">
            <fm-skeleton width="80%" /><fm-skeleton width="50%" />
          </div>
        </div>
      </div>`,
  }),
};
