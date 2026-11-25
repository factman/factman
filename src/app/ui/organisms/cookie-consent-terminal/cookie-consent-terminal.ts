import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
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
import { RouterLink } from '@angular/router';
import { prefersReducedMotion } from '@shared';

import { Button, Caret, iconSave } from '@ui/atoms';
import { WindowFrame } from '@ui/molecules';

/** A consent category as the banner shows it (from site.json, with the visitor's current choice). */
export interface ConsentCategoryView {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** Always on; shown checked, not switchable. */
  readonly required: boolean;
  /** False for a category listed only to say it isn't used (shown unchecked, not switchable). */
  readonly used?: boolean;
  readonly granted: boolean;
}

/** The visitor's decision: every listed category, on or off. */
export type ConsentDecision = Readonly<Record<string, boolean>>;

/** The command the prompt types (canvas CookieConsent), and its timing in ms. */
export const CONSENT_COMMAND = './consent --analytics';
export const CONSENT_TYPING = { start: 120, perChar: 35 } as const;

let nextId = 0;

/**
 * The cookie consent banner (FR-34), as in the canvas's CookieConsent: a dark terminal window
 * docked bottom left (a sheet along the bottom on phones). The prompt types
 * `./consent --analytics`, then the message and two equal primary buttons, "[n] Accept necessary"
 * and "[a] Accept all", with "[c] Customize" below. Customize lists the categories as terminal
 * checkboxes (analytics is the only switch) with Save choices and Back. With focus inside, `n`,
 * `a` and `c` work, and Esc goes back from Customize (or, from the main view, closes the banner
 * for this page view without deciding: nothing is granted).
 *
 * The window is always dark (`data-theme="dark"`), whatever the page theme. It is a non-modal
 * dialog (`role="dialog"` on a `popover="manual"` section, in the top layer, so the page does not
 * shift and stays usable behind it). Not a `<dialog>`: showing one focuses its first control, and
 * on a first visit the banner must not take focus from the page. With `focusOnOpen` (the visitor
 * asked for it from the footer or the privacy page) it takes focus when it opens and gives it back
 * when it closes. With reduced motion the command is shown at once and nothing rises or fades.
 * The page owns `open` and the stored decision.
 * @level organism
 */
@Component({
  selector: 'fm-cookie-consent-terminal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './cookie-consent-terminal.scss',
  imports: [Button, Caret, RouterLink, WindowFrame],
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

  /** Accept necessary, Accept all or Save choices: every category, on or off. */
  readonly decide = output<ConsentDecision>();
  /** Closed without deciding (Esc from the main view): nothing is granted. */
  readonly dismissed = output<void>();

  protected readonly id = `fm-consent-${nextId++}`;
  protected readonly save = iconSave;
  protected readonly message =
    'This site uses Google Analytics to count visits and see which content helps. No ads. Nothing runs until you choose.';
  protected readonly mode = signal<'main' | 'custom'>('main');
  /** How much of the command is typed. */
  protected readonly typed = signal(0);
  protected readonly command = computed(() => CONSENT_COMMAND.slice(0, this.typed()));
  protected readonly ready = computed(() => this.typed() >= CONSENT_COMMAND.length);
  /** The switches in Customize, starting from the visitor's current choice. */
  protected readonly draft = linkedSignal<ConsentDecision>(() =>
    Object.fromEntries(this.categories().map((c) => [c.id, c.granted])),
  );
  protected readonly popover = computed(() =>
    this.floating() && this.popoverSupported ? 'manual' : null,
  );

  private readonly doc = inject(DOCUMENT);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly popoverSupported =
    typeof this.doc.createElement('div').showPopover === 'function';
  /** Where focus was before the banner took it, to give it back. */
  private returnFocus: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private shown = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    afterRenderEffect(() => {
      const panel = this.panel()?.nativeElement;
      if (!panel) return;
      if (this.open()) this.show(panel);
      else this.hide(panel);
    });
  }

  private show(panel: HTMLElement): void {
    if (this.popover() && !panel.matches(':popover-open')) panel.showPopover();
    if (!this.shown) {
      this.shown = true;
      this.type();
    }
    if (this.focusOnOpen() && !panel.contains(this.doc.activeElement)) {
      const active = this.doc.activeElement;
      this.returnFocus =
        this.opener() ??
        (active instanceof HTMLElement && active !== this.doc.body ? active : null);
      panel.focus();
    }
  }

  private hide(panel: HTMLElement): void {
    const hadFocus = panel.contains(this.doc.activeElement);
    if (this.popover() && panel.matches(':popover-open')) panel.hidePopover();
    clearTimeout(this.timer);
    this.shown = false;
    this.mode.set('main');
    if (hadFocus && this.returnFocus?.isConnected) this.returnFocus.focus();
    this.returnFocus = null;
  }

  /** Types the command a character at a time; at once with reduced motion. */
  private type(): void {
    clearTimeout(this.timer);
    if (prefersReducedMotion(this.doc.defaultView)) {
      this.typed.set(CONSENT_COMMAND.length);
      return;
    }
    this.typed.set(0);
    const tick = () => {
      this.typed.update((n) => n + 1);
      if (!this.ready()) this.timer = setTimeout(tick, CONSENT_TYPING.perChar);
    };
    this.timer = setTimeout(tick, CONSENT_TYPING.start);
  }

  protected acceptNecessary(): void {
    this.decide.emit(this.all(false));
  }

  protected acceptAll(): void {
    this.decide.emit(this.all(true));
  }

  protected saveChoices(): void {
    const draft = this.draft();
    this.decide.emit(
      Object.fromEntries(
        this.categories().map((c) => [c.id, c.required || (this.switchable(c) && !!draft[c.id])]),
      ),
    );
  }

  protected customize(): void {
    this.mode.set('custom');
  }

  protected back(): void {
    this.mode.set('main');
  }

  protected toggle(id: string): void {
    this.draft.update((d) => ({ ...d, [id]: !d[id] }));
  }

  protected switchable(c: ConsentCategoryView): boolean {
    return !c.required && c.used !== false;
  }

  /** A category's line after its box: `" analytics   Google Analytics 4 · …"`. */
  protected line(c: ConsentCategoryView): string {
    return ` ${c.label}   ${c.description}`;
  }

  /** The `[x]` / `[ ]` box of a category in Customize. */
  protected box(c: ConsentCategoryView): string {
    const on = c.required || (this.switchable(c) && !!this.draft()[c.id]);
    return on ? '[x]' : '[ ]';
  }

  /**
   * With focus inside: `n` accept necessary, `a` accept all, `c` customize (main view only);
   * Esc goes back from Customize, or closes the banner without deciding.
   */
  protected keydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.mode() === 'custom') this.back();
      else this.dismissed.emit();
      return;
    }
    if (this.mode() !== 'main' || !this.ready()) return;
    const key = event.key.toLowerCase();
    if (key === 'n') this.acceptNecessary();
    else if (key === 'a') this.acceptAll();
    else if (key === 'c') this.customize();
    else return;
    event.preventDefault();
  }

  private all(on: boolean): ConsentDecision {
    return Object.fromEntries(
      this.categories().map((c) => [c.id, c.required || (on && this.switchable(c))]),
    );
  }
}
