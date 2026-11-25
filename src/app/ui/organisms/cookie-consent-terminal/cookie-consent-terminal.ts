import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Button, Link, Switch } from '@ui/atoms';
import { WindowFrame } from '@ui/molecules';

/** A consent category as the banner shows it (from site.json, with the visitor's current choice). */
export interface ConsentCategoryView {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** Always on; shown, but not switchable. */
  readonly required: boolean;
  readonly granted: boolean;
}

/** The visitor's decision: every listed category, on or off. */
export type ConsentDecision = Readonly<Record<string, boolean>>;

let nextId = 0;

/**
 * The cookie consent banner (FR-34) as a small terminal window, `./consent`. Accept all and
 * Reject all are the same size and style; Customize shows a switch per optional category and
 * Save. With focus inside, `a` accepts, `r` rejects, `c` toggles Customize and Esc closes it
 * without deciding (nothing is granted).
 *
 * It is a non-modal dialog (`role="dialog"` on a `popover="manual"` section): in the top layer,
 * fixed in a corner so the page does not shift, and the page stays usable behind it (no focus
 * trap). Not a `<dialog>`: showing a `<dialog popover>` focuses its first control, and on a first
 * visit the banner must not take focus from the page. With `focusOnOpen` (the visitor asked for
 * it from the footer or the privacy page) it takes focus when it opens and gives it back when it
 * closes. Without the Popover API it is a fixed box shown and hidden with `hidden`.
 * The page owns `open` and the stored decision.
 * @level organism
 */
@Component({
  selector: 'fm-cookie-consent-terminal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './cookie-consent-terminal.scss',
  imports: [Button, FormsModule, Link, Switch, WindowFrame],
  host: { style: 'display: contents' },
  templateUrl: './cookie-consent-terminal.html',
})
export class CookieConsentTerminal {
  readonly open = input(false);
  readonly categories = input.required<readonly ConsentCategoryView[]>();
  readonly policyHref = input('/privacy');
  /** Move focus into the banner when it opens, and back when it closes. */
  readonly focusOnOpen = input(false);
  /**
   * Where focus goes back to on close: the control that opened the banner. Defaults to whatever
   * had focus (Safari does not focus a button when it is clicked, so the page passes it).
   */
  readonly opener = input<HTMLElement | null>(null);
  /** Over the page in the top layer (default); false keeps it in the flow (Storybook, docs). */
  readonly floating = input(true);

  /** Accept all, Reject all or Save: every category, on or off. */
  readonly decide = output<ConsentDecision>();
  /** Closed without deciding (Esc or the close button): nothing is granted. */
  readonly dismissed = output<void>();

  protected readonly id = `fm-consent-${nextId++}`;
  protected readonly message = 'Analytics (Google Analytics 4) only if you allow it. No ads, ever.';
  protected readonly customizing = signal(false);
  /** The switches in Customize, starting from the visitor's current choice. */
  protected readonly draft = linkedSignal<ConsentDecision>(() =>
    Object.fromEntries(this.categories().map((c) => [c.id, c.granted])),
  );
  protected readonly optional = computed(() => this.categories().filter((c) => !c.required));
  protected readonly popover = computed(() =>
    this.floating() && this.popoverSupported ? 'manual' : null,
  );

  private readonly doc = inject(DOCUMENT);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly accept = viewChild('accept', { read: ElementRef });
  private readonly popoverSupported =
    typeof this.doc.createElement('div').showPopover === 'function';
  /** Where focus was before the banner took it, to give it back. */
  private returnFocus: HTMLElement | null = null;

  constructor() {
    afterRenderEffect(() => {
      const panel = this.panel()?.nativeElement;
      if (!panel) return;
      if (this.open()) this.show(panel);
      else this.hide(panel);
    });
  }

  private show(panel: HTMLElement): void {
    if (this.popover() && !panel.matches(':popover-open')) panel.showPopover();
    if (this.focusOnOpen() && !panel.contains(this.doc.activeElement)) {
      const active = this.doc.activeElement;
      this.returnFocus =
        this.opener() ??
        (active instanceof HTMLElement && active !== this.doc.body ? active : null);
      const button = this.accept()?.nativeElement.querySelector('button, a');
      (button as HTMLElement | null)?.focus();
    }
  }

  private hide(panel: HTMLElement): void {
    const hadFocus = panel.contains(this.doc.activeElement);
    if (this.popover() && panel.matches(':popover-open')) panel.hidePopover();
    this.customizing.set(false);
    if (hadFocus && this.returnFocus?.isConnected) this.returnFocus.focus();
    this.returnFocus = null;
  }

  protected acceptAll(): void {
    this.decide.emit(this.all(true));
  }

  protected rejectAll(): void {
    this.decide.emit(this.all(false));
  }

  protected save(): void {
    const draft = this.draft();
    this.decide.emit(
      Object.fromEntries(this.categories().map((c) => [c.id, c.required || draft[c.id] === true])),
    );
  }

  protected toggleCustomize(): void {
    this.customizing.update((on) => !on);
  }

  protected setDraft(id: string, on: boolean): void {
    this.draft.update((d) => ({ ...d, [id]: on }));
  }

  /** `a` accept, `r` reject, `c` customize, Esc close without deciding (focus inside only). */
  protected keydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    const typing =
      target?.isContentEditable ||
      (target instanceof HTMLInputElement && !['checkbox', 'radio'].includes(target.type)) ||
      target instanceof HTMLTextAreaElement;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.dismissed.emit();
      return;
    }
    if (typing) return;
    const key = event.key.toLowerCase();
    if (key === 'a') this.acceptAll();
    else if (key === 'r') this.rejectAll();
    else if (key === 'c') this.toggleCustomize();
    else return;
    event.preventDefault();
  }

  private all(on: boolean): ConsentDecision {
    return Object.fromEntries(this.categories().map((c) => [c.id, c.required || on]));
  }
}
