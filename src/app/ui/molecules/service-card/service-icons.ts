import {
  type IconDef,
  iconCloud,
  iconCode,
  iconCreditCard,
  iconLightbulb,
  iconMobile,
  iconUsers,
  iconWorkflow,
  iconWrench,
} from '@ui/atoms';

/**
 * The icons services.json names for its services (ADR-004). A page that shows ServiceCards
 * registers them (`inject(IconRegistry).register(SERVICE_ICONS)`) so the cards can render the
 * icon by name. The ServiceCard spec checks every service's icon is in this list.
 */
export const SERVICE_ICONS: readonly IconDef[] = [
  iconLightbulb,
  iconCode,
  iconCreditCard,
  iconUsers,
  iconWorkflow,
  iconCloud,
  iconMobile,
  iconWrench,
];
