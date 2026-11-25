/** What the contact form collects. Nothing is stored or sent from the site (FR-27). */
export interface ContactValues {
  name: string;
  email: string;
  topic: string;
  message: string;
  consent: boolean;
}

export type ContactErrors = Partial<Record<keyof ContactValues, string>>;

/** The shortest message accepted. */
export const MIN_MESSAGE = 20;
/** Mail clients cut long mailto: URLs; past this the body is left for "Copy message". */
export const MAX_MAILTO = 1800;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The topic list: a general enquiry, every service, then the résumé and project requests. */
export const contactTopics = (services: readonly string[]): string[] => [
  'General enquiry',
  ...services,
  'Résumé request',
  'Project access or demo',
];

/** What is wrong with the values, field by field (FR-28); empty when they can be sent. */
export function validateContact(v: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  if (!v.name.trim()) errors.name = 'Enter your name';
  if (!EMAIL.test(v.email.trim()))
    errors.email = 'Enter a valid email address, like you@example.com';
  if (!v.topic) errors.topic = 'Choose a topic or service';
  if (v.message.trim().length < MIN_MESSAGE)
    errors.message = `Tell me a little more: at least ${MIN_MESSAGE} characters`;
  if (!v.consent) errors.consent = 'Agree to be contacted about your message';
  return errors;
}

export interface ComposedMessage {
  subject: string;
  body: string;
  /** Opens the visitor's mail app; the body is dropped when the URL would be too long. */
  mailto: string;
  /** Opens a Gmail draft in the browser. */
  gmail: string;
}

/**
 * The email the form drafts (FR-27): "[Portfolio] Topic from Name", the sender's details and the
 * message, addressed to `to`.
 */
export function composeMessage(
  v: ContactValues,
  to: string,
  site = 'factman.dev',
): ComposedMessage {
  const subject = `[Portfolio] ${v.topic} from ${v.name.trim()}`;
  const body = [
    `Name: ${v.name.trim()}`,
    `Email: ${v.email.trim()}`,
    `Topic: ${v.topic}`,
    '',
    v.message.trim(),
    '',
    '—',
    `Sent from ${site}`,
  ].join('\r\n');
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(body);
  const full = `mailto:${to}?subject=${s}&body=${b}`;
  return {
    subject,
    body,
    mailto: full.length > MAX_MAILTO ? `mailto:${to}?subject=${s}` : full,
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${s}&body=${b}`,
  };
}
