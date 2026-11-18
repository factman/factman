import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

/** 1 → "1 yr", 6 → "6 yrs". */
export const yearsText = (years: number): string => `${years} ${years === 1 ? 'yr' : 'yrs'}`;

/**
 * A skill in monospace, with how many years of use when known: "Angular · 8 yrs".
 * @level atom
 */
@Component({
  selector: 'fm-skill-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './skill-chip.scss',
  host: { style: 'display: contents' },
  template: `<span class="fm-skill">
    {{ label() }}
    @if (yearsLabel(); as y) {
      <span class="fm-skill-years"><span aria-hidden="true">·</span> {{ y }}</span>
    }
  </span>`,
})
export class SkillChip {
  readonly label = input.required<string>();
  readonly years = input<number>();

  protected readonly yearsLabel = computed(() => {
    const years = this.years();
    return years === undefined ? undefined : yearsText(years);
  });
}
