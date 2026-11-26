import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  Injector,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ANALYTICS_TRACKER, messageLengthBucket } from '@shared';

import {
  Button,
  Checkbox,
  Image,
  iconEdit,
  iconExternalLink,
  iconMail,
  iconSend,
  Select,
  TextArea,
  TextInput,
} from '@ui/atoms';
import { Alert, CopyButton, type FramedImage, FormField } from '@ui/molecules';

import {
  type ComposedMessage,
  composeMessage,
  type ContactValues,
  validateContact,
} from './contact-message';

/**
 * "Send a message" (FR-27, FR-28, the canvas's contact form): name, email, topic, message and
 * consent, checked on submit with inline errors. There is no backend: "Compose email" opens the
 * visitor's mail app with the message filled in, then shows it ready, with "Open mail app", "Open
 * in Gmail", "Copy message" and "Edit message" in case no mail app opened. Nothing is stored.
 * `composed` reports the draft (for the page's analytics, later).
 * @level organism
 */
@Component({
  selector: 'fm-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // contact-form* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './contact-form.scss',
  imports: [
    Alert,
    Button,
    Checkbox,
    CopyButton,
    FormField,
    ReactiveFormsModule,
    Image,
    Select,
    TextArea,
    TextInput,
  ],
  host: { style: 'display: contents' },
  templateUrl: './contact-form.html',
})
export class ContactForm {
  private readonly document = inject(DOCUMENT);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);
  private readonly tracker = inject(ANALYTICS_TRACKER);
  private started = false;

  /** Where the draft is addressed (contact.json `email`). */
  readonly email = input.required<string>();
  readonly topics = input.required<readonly string[]>();
  /** A topic to start with, e.g. from a service page's "Get a quote". */
  readonly topic = input<string>();
  /** The small cutout portrait beside "Message ready" (the canvas's contact section). */
  readonly sentPhoto = input<FramedImage>();

  readonly composed = output<ComposedMessage>();

  protected readonly icons = {
    send: iconSend,
    mail: iconMail,
    gmail: iconExternalLink,
    edit: iconEdit,
  };
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    topic: new FormControl('', { nonNullable: true }),
    message: new FormControl('', { nonNullable: true }),
    consent: new FormControl(false, { nonNullable: true }),
  });
  private readonly values = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  /** Errors show once the visitor has tried to send, and update as they fix them. */
  private readonly submitted = signal(false);
  protected readonly errors = computed(() => {
    this.values();
    return this.submitted() ? validateContact(this.form.getRawValue() as ContactValues) : {};
  });
  protected readonly options = computed(() => this.topics().map((t) => ({ value: t, label: t })));
  protected readonly draft = signal<ComposedMessage | undefined>(undefined);
  protected readonly firstName = computed(
    () => this.form.getRawValue().name.trim().split(/\s+/)[0] || 'friend',
  );
  protected readonly copyText = computed(() => {
    const d = this.draft();
    return d ? `${d.subject}\n\n${d.body}` : '';
  });

  constructor() {
    queueMicrotask(() => {
      const topic = this.topic();
      if (topic) this.form.controls.topic.setValue(topic);
    });
  }

  /** The first focus inside the form: contact_form_start, once. */
  protected start(): void {
    if (this.started) return;
    this.started = true;
    this.tracker.track('contact_form_start', {});
  }

  protected submit(event?: Event): void {
    event?.preventDefault();
    this.submitted.set(true);
    const values = this.form.getRawValue() as ContactValues;
    const errors = validateContact(values);
    if (Object.keys(errors).length) {
      // Once the errors are on screen, move focus to the first field that needs fixing.
      afterNextRender(
        () =>
          this.host.nativeElement
            .querySelector<HTMLElement>(
              '[aria-invalid="true"], input[type="checkbox"]:not(:checked)',
            )
            ?.focus(),
        { injector: this.injector },
      );
      return;
    }
    const draft = composeMessage(values, this.email());
    this.draft.set(draft);
    this.composed.emit(draft);
    // The topic and the message's length bucket: never the name, email or text (PRD §10).
    this.tracker.track('contact_form_submit', {
      topic: values.topic,
      has_service: !!this.topic(),
      message_length_bucket: messageLengthBucket(values.message.trim().length),
    });
    try {
      this.document.defaultView?.location.assign(draft.mailto);
    } catch {
      // No mail handler (or a test environment): the fallbacks below are on screen.
    }
  }

  protected edit(): void {
    this.draft.set(undefined);
  }
}
