import {
  ApplicationRef,
  type ComponentRef,
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  afterNextRender,
  createComponent,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import { TooltipPanel } from './tooltip-panel';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/** Space between the element and the tooltip, and the minimum from the viewport edge, in px. */
const GAP = 8;
/** How long the tooltip waits after the pointer leaves, so it can move onto the tooltip. */
const LEAVE_DELAY = 100;

let nextId = 0;

/**
 * Top-left of a tooltip of `panel` size placed next to `target`, kept inside a viewport of
 * `vw` × `vh`. Pure, so the maths can be tested without layout.
 */
export function tooltipPosition(
  target: Pick<DOMRect, 'top' | 'left' | 'width' | 'height'>,
  panel: { width: number; height: number },
  placement: TooltipPlacement,
  vw: number,
  vh: number,
): { top: number; left: number } {
  const centreX = target.left + target.width / 2 - panel.width / 2;
  const centreY = target.top + target.height / 2 - panel.height / 2;
  const at = {
    top: { top: target.top - panel.height - GAP, left: centreX },
    bottom: { top: target.top + target.height + GAP, left: centreX },
    left: { top: centreY, left: target.left - panel.width - GAP },
    right: { top: centreY, left: target.left + target.width + GAP },
  }[placement];
  const clamp = (v: number, max: number) => Math.min(Math.max(v, GAP), Math.max(GAP, max - GAP));
  return { top: clamp(at.top, vh - panel.height), left: clamp(at.left, vw - panel.width) };
}

/**
 * A short text label shown next to an element on hover and keyboard focus, such as an icon
 * button's name. It closes on Escape and when the pointer and focus leave, and stays open while
 * the pointer is over it. The element's `aria-describedby` points at it, so screen readers read
 * the text with the element. Tooltips never hold anything interactive.
 *
 * `<button fmTooltip="Copy email" placement="bottom">…</button>`
 */
@Directive({
  selector: '[fmTooltip]',
  host: {
    '(mouseenter)': 'pointer(true)',
    '(mouseleave)': 'pointer(false)',
    '(focusin)': 'focused(true)',
    '(focusout)': 'focused(false)',
  },
})
export class Tooltip {
  readonly fmTooltip = input.required<string>();
  readonly placement = input<TooltipPlacement>('top');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly id = `fm-tooltip-${++nextId}`;

  private readonly over = signal(false);
  private readonly overPanel = signal(false);
  private readonly focus = signal(false);
  private readonly dismissed = signal(false);
  private panel?: ComponentRef<TooltipPanel>;
  private leaveTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') this.dismissed.set(true);
  };

  constructor() {
    afterNextRender(() => this.create());
    effect(() => {
      const open = (this.over() || this.overPanel() || this.focus()) && !this.dismissed();
      this.panel?.setInput('text', this.fmTooltip());
      this.show(open);
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.leaveTimer);
      this.doc.removeEventListener('keydown', this.onKey);
      this.panel?.destroy();
    });
  }

  protected pointer(on: boolean): void {
    clearTimeout(this.leaveTimer);
    if (on) {
      this.dismissed.set(false);
      this.over.set(true);
    } else {
      this.leaveTimer = setTimeout(() => this.over.set(false), LEAVE_DELAY);
    }
  }

  protected focused(on: boolean): void {
    if (on) this.dismissed.set(false);
    this.focus.set(on);
  }

  /** Builds the panel on the page body (browser only) and links it to the element. */
  private create(): void {
    this.panel = createComponent(TooltipPanel, { environmentInjector: this.injector });
    this.panel.setInput('panelId', this.id);
    this.panel.setInput('text', this.fmTooltip());
    this.panel.instance.hovered.subscribe((on) => {
      clearTimeout(this.leaveTimer);
      this.overPanel.set(on);
    });
    this.appRef.attachView(this.panel.hostView);
    this.doc.body.appendChild(this.panel.location.nativeElement);
    const el = this.host.nativeElement;
    const described = el.getAttribute('aria-describedby');
    el.setAttribute('aria-describedby', described ? `${described} ${this.id}` : this.id);
  }

  private show(open: boolean): void {
    const panel = this.panel;
    if (!panel) return;
    panel.setInput('open', open);
    panel.changeDetectorRef.detectChanges();
    if (!open) {
      this.doc.removeEventListener('keydown', this.onKey);
      return;
    }
    this.doc.addEventListener('keydown', this.onKey);
    const el: HTMLElement = panel.location.nativeElement;
    const win = this.doc.defaultView;
    const { top, left } = tooltipPosition(
      this.host.nativeElement.getBoundingClientRect(),
      el.getBoundingClientRect(),
      this.placement(),
      win?.innerWidth ?? 0,
      win?.innerHeight ?? 0,
    );
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  }
}
