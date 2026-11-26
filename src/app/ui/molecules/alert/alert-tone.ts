import { type IconDef } from '@ui/atoms/icon/icon-def';
import { iconAlert, iconCheckCircle, iconInfo, iconWarning } from '@ui/atoms/icon/icons';

export type FeedbackTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

/** The icon that reinforces each tone, so the tone is never colour alone. */
export const TONE_ICON: Record<FeedbackTone, IconDef> = {
  info: iconInfo,
  success: iconCheckCircle,
  warning: iconWarning,
  danger: iconAlert,
  neutral: iconInfo,
};
