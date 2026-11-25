/**
 * The analytics event catalogue (PRD §10, FR-35): every custom event the site sends, with its
 * parameters. `track()` takes a name from this map and exactly its parameters, so an unknown event
 * or a wrong parameter is a compile error. Names are snake_case, at most 40 characters.
 *
 * No parameter carries personal data or free text: ids, enums and buckets only (no name, email,
 * phone or message). `checkParams` rejects anything that looks like personal data at run time too.
 */

/** Where a résumé preview or download started. */
export type ResumeSource = 'card' | 'modal' | 'hero' | 'header' | 'footer' | 'glance' | 'link';
/** How a visitor reaches out from a booking card or the contact section. */
export type BookingChannel = 'email' | 'whatsapp' | 'scheduler' | 'phone';
/** A contact link or copy button. */
export type ContactChannel =
  'email' | 'phone' | 'whatsapp' | 'linkedin' | 'github' | 'x' | 'medium' | 'website';
/** The length of a composed message, never its text. */
export type MessageLengthBucket = '0-49' | '50-199' | '200-499' | '500+';

/** Event name → parameters. Add an event here, and nowhere else, to make it trackable. */
export interface AnalyticsEvents {
  /** A hero, header or section CTA is clicked. */
  cta_click: { cta_id: string; location: string };
  /** A section is 50% visible for the first time. */
  section_view: { section_id: string };
  /** A project detail page opens. */
  project_open: {
    project_id: string;
    status: 'completed' | 'in-progress' | 'maintained' | 'archived';
    visibility: 'public' | 'private';
  };
  /** A project's live or source link is clicked. */
  project_link_click: { project_id: string; link_type: 'live' | 'source' | 'case-study' };
  /** "Request access", "Request a demo" or "Ask about this project" (projects.json `engage.mode`). */
  project_access_request: {
    project_id: string;
    mode: 'request-access' | 'request-demo' | 'contact';
  };
  /** A service detail page opens. */
  service_view: { service_id: string };
  /** A booking button is clicked. */
  service_enquiry: { service_id: string; channel: BookingChannel };
  /** A Medium article link is clicked. */
  blog_click: { post_id: string; location: 'home' | 'blog' };
  /** An email, phone, WhatsApp or social link is clicked. */
  contact_click: { channel: ContactChannel };
  /** A copy button is used. */
  contact_copy: { channel: ContactChannel };
  /** The first contact form field gets focus. */
  contact_form_start: Record<string, never>;
  /** The contact form composes its mail URL. */
  contact_form_submit: {
    topic: string;
    has_service: boolean;
    message_length_bucket: MessageLengthBucket;
  };
  /** A résumé download link or button is clicked. */
  resume_download: { resume_id: string; source: ResumeSource };
  /** The résumé preview opens. */
  resume_preview_open: { resume_id: string; source: ResumeSource };
  /** Another résumé is chosen inside the preview. */
  resume_variant_switch: { resume_id: string; previous_resume_id: string };
  /** "Open PDF in new tab" in the preview. */
  resume_open_pdf: { resume_id: string };
  /** A filter or search is applied (the value is a tag or category id, never typed text). */
  filter_used: { scope: 'projects' | 'blog' | 'stack'; value: string };
  /** The theme is switched. */
  theme_toggle: { theme: 'light' | 'dark' | 'system' };
  /** An interactive terminal command runs (allow-listed names only). */
  terminal_command: { command: string };
  /** A consent decision is saved. */
  consent_update: { analytics: boolean; source: 'prompt' | 'settings' };
}

export type AnalyticsEventName = keyof AnalyticsEvents;

/** One event as a value: `{ name: 'cta_click', params: { cta_id, location } }`. */
export type AnalyticsEvent = {
  [K in AnalyticsEventName]: { readonly name: K; readonly params: AnalyticsEvents[K] };
}[AnalyticsEventName];

/** Every event name, for checks and tests. */
export const ANALYTICS_EVENT_NAMES = [
  'cta_click',
  'section_view',
  'project_open',
  'project_link_click',
  'project_access_request',
  'service_view',
  'service_enquiry',
  'blog_click',
  'contact_click',
  'contact_copy',
  'contact_form_start',
  'contact_form_submit',
  'resume_download',
  'resume_preview_open',
  'resume_variant_switch',
  'resume_open_pdf',
  'filter_used',
  'theme_toggle',
  'terminal_command',
  'consent_update',
] as const satisfies readonly AnalyticsEventName[];

/** Key events (GA4 conversions) per the PRD. */
export const KEY_EVENTS: readonly AnalyticsEventName[] = [
  'service_enquiry',
  'contact_form_submit',
  'contact_click',
  'resume_download',
  'project_access_request',
];

/** Buckets a message length (characters) so the text itself never leaves the browser. */
export function messageLengthBucket(length: number): MessageLengthBucket {
  if (length < 50) return '0-49';
  if (length < 200) return '50-199';
  if (length < 500) return '200-499';
  return '500+';
}

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
/** Seven or more digits, allowing spaces, dots, dashes and a leading +: a phone number. */
const PHONE = /\+?\d(?:[\s.-]?\d){6,}/;
const MAX_LENGTH = 100;

/**
 * Checks a parameter set for personal data or free text: an email address, a phone number, or a
 * string over 100 characters. Returns the offending key, or null when the parameters are safe.
 */
export function checkParams(params: Readonly<Record<string, unknown>>): string | null {
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'boolean' || typeof value === 'number') continue;
    if (typeof value !== 'string') return key;
    if (value.length > MAX_LENGTH || EMAIL.test(value) || PHONE.test(value)) return key;
  }
  return null;
}
