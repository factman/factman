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

/** The popover mode this browser supports: `hint` (Chrome 133+), else `manual`, else none. */
function popoverMode(doc: Document): 'hint' | 'manual' | null {
  const probe = doc.createElement('div');
  if (typeof probe.showPopover !== 'function') return null;
  probe.setAttribute('popover', 'hint');
  return probe.popover === 'hint' ? 'hint' : 'manual';
}

/** CSS anchor positioning (Baseline 2026); without it the directive places the panel itself. */
function supportsAnchors(doc: Document): boolean {
  const css = doc.defaultView?.CSS;
  return !!css?.supports?.('anchor-name: --a') && !!css.supports('position-area: top');
}

/**
 * A short text label shown next to an element on hover and keyboard focus, such as an icon
 * button's name. It closes on Escape and when the pointer and focus leave, and stays open while
 * the pointer is over it. The element's `aria-describedby` points at it, so screen readers read
 * the text with the element. Tooltips never hold anything interactive.
 *
 * Where supported, the panel is a `popover="hint"` in the top layer (above an open dialog; the
 * browser closes it on Escape) placed with CSS anchor positioning, which follows the element as
 * the page scrolls and flips at the viewport edge. Elsewhere it is a fixed box the directive
 * places and re-places on scroll and resize (ETE-249).
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
  private mode: 'hint' | 'manual' | null = null;
  private anchored = false;

  /**
   * Escape closes it. A hint popover also closes on a real Escape by itself; this covers manual
   * popovers, browsers without popovers and synthetic key events (tests).
   */
  private readonly onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') this.dismissed.set(true);
  };
  /** The browser closed the popover itself (Escape, light dismiss): keep it closed. */
  private readonly onToggle = (event: Event) => {
    if ((event as ToggleEvent).newState === 'closed' && this.isOpen()) this.dismissed.set(true);
  };
  /** Fallback placement follows the element while the page scrolls or resizes. */
  private readonly onMove = () => this.place();

  constructor() {
    afterNextRender(() => this.create());
    effect(() => {
      const open = this.isOpen();
      this.panel?.setInput('text', this.fmTooltip());
      this.panel?.setInput('placement', this.placement());
      this.show(open);
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.leaveTimer);
      this.listen(false);
      this.panel?.location.nativeElement.removeEventListener('toggle', this.onToggle);
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

  private isOpen(): boolean {
    return (this.over() || this.overPanel() || this.focus()) && !this.dismissed();
  }

  /** The box the tooltip sits next to: the host, or its first child when the host has no box. */
  private anchorElement(): HTMLElement {
    const el = this.host.nativeElement;
    const win = this.doc.defaultView;
    const contents = win?.getComputedStyle(el).display === 'contents';
    return (contents && (el.firstElementChild as HTMLElement | null)) || el;
  }

  /** Builds the panel on the page body (browser only) and links it to the element. */
  private create(): void {
    this.mode = popoverMode(this.doc);
    this.anchored = !!this.mode && supportsAnchors(this.doc);
    this.panel = createComponent(TooltipPanel, { environmentInjector: this.injector });
    this.panel.setInput('panelId', this.id);
    this.panel.setInput('text', this.fmTooltip());
    this.panel.setInput('popover', this.mode);
    this.panel.setInput('anchored', this.anchored);
    this.panel.setInput('placement', this.placement());
    this.panel.instance.hovered.subscribe((on) => {
      clearTimeout(this.leaveTimer);
      this.overPanel.set(on);
    });
    this.appRef.attachView(this.panel.hostView);
    const panel: HTMLElement = this.panel.location.nativeElement;
    this.doc.body.appendChild(panel);
    this.panel.changeDetectorRef.detectChanges();
    panel.addEventListener('toggle', this.onToggle);
    if (this.anchored) {
      const name = `--${this.id}`;
      this.anchorElement().style.setProperty('anchor-name', name);
      panel.style.setProperty('position-anchor', name);
    }
    const el = this.host.nativeElement;
    const described = el.getAttribute('aria-describedby');
    el.setAttribute('aria-describedby', described ? `${described} ${this.id}` : this.id);
    this.show(this.isOpen());
  }

  private show(open: boolean): void {
    const panel = this.panel;
    if (!panel) return;
    panel.setInput('open', open);
    panel.changeDetectorRef.detectChanges();
    const el: HTMLElement = panel.location.nativeElement;
    if (this.mode) {
      const shown = el.matches(':popover-open');
      if (open && !shown) el.showPopover();
      if (!open && shown) el.hidePopover();
    }
    this.listen(open);
    if (open) this.place();
  }

  /** Listeners only while open: Escape where the browser doesn't handle it, and fallback moves. */
  private listen(on: boolean): void {
    const win = this.doc.defaultView;
    const follow = !this.anchored && win;
    if (on) {
      this.doc.addEventListener('keydown', this.onKey);
      if (follow) {
        win.addEventListener('scroll', this.onMove, { capture: true, passive: true });
        win.addEventListener('resize', this.onMove);
      }
    } else {
      this.doc.removeEventListener('keydown', this.onKey);
      if (follow) {
        win.removeEventListener('scroll', this.onMove, { capture: true });
        win.removeEventListener('resize', this.onMove);
      }
    }
  }

  /** Fallback placement, when CSS anchor positioning isn't available. */
  private place(): void {
    const panel = this.panel;
    if (!panel || this.anchored) return;
    const el: HTMLElement = panel.location.nativeElement;
    const win = this.doc.defaultView;
    const { top, left } = tooltipPosition(
      this.anchorElement().getBoundingClientRect(),
      el.getBoundingClientRect(),
      this.placement(),
      win?.innerWidth ?? 0,
      win?.innerHeight ?? 0,
    );
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  }
}
