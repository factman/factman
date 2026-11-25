/**
 * The résumé as plain HTML (ETE-107, FR-39, FR-40): no Angular, just a string from the
 * ResumeViewModel (buildResumeViewModel in @shared). The template holds only fixed labels and the
 * layout; every piece of content comes from the view model. Unfilled `[placeholder]` tokens are
 * wrapped in `.cv-ph`, highlighted on screen and plain in print. The PDF build (ETE-108) prints it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { RichText } from '../../src/app/shared/resume/resume-text';
import type {
  ResumeSectionId,
  ResumeViewModel,
} from '../../src/app/shared/resume/resume-view-model';

/** The stylesheet, inlined so the document is self-contained. */
export const RESUME_CSS = readFileSync(join(import.meta.dirname, 'resume.css'), 'utf8');

/** The fixed section headings. */
export const HEADINGS: Record<ResumeSectionId, string> = {
  profile: 'Profile',
  skills: 'Core skills',
  experience: 'Experience',
  earlier: 'Earlier experience',
  clients: 'Companies and clients',
  projects: 'Selected projects',
  education: 'Education',
  languages: 'Languages',
  publications: 'Publications',
};

/** The sections that close the résumé side by side, in this order. */
const CLOSING: readonly ResumeSectionId[] = ['education', 'languages', 'publications'];

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const escapeHtml = (s: string): string => s.replace(/[&<>"]/g, (c) => ESCAPES[c]);

/** Rich text as HTML: unfilled placeholders get `.cv-ph`. */
export function rich(text: RichText): string {
  return text
    .map((s) =>
      s.placeholder && !s.placeholder.filled
        ? `<span class="cv-ph">${escapeHtml(s.text)}</span>`
        : escapeHtml(s.text),
    )
    .join('');
}

const section = (id: ResumeSectionId, body: string): string =>
  `<section class="cv-sec cv-sec--${id}"><h2 class="cv-h">${HEADINGS[id]}</h2>\n${body}\n</section>`;

function header(vm: ResumeViewModel): string {
  const lines = vm.header.contact
    .map(
      (line) =>
        `<p class="cv-contact__line">${line
          .map((item) =>
            item.href
              ? `<span><a href="${escapeHtml(item.href)}">${escapeHtml(item.text)}</a></span>`
              : `<span>${escapeHtml(item.text)}</span>`,
          )
          .join('')}</p>`,
    )
    .join('');
  return `<header class="cv-head"><div><h1 class="cv-name">${escapeHtml(vm.header.name)}</h1><p class="cv-role">${escapeHtml(vm.header.headline)}</p></div>
<div class="cv-contact">${lines}</div></header>`;
}

const BODY: Partial<Record<ResumeSectionId, (vm: ResumeViewModel) => string>> = {
  profile: (vm) => `<p class="cv-summary">${rich(vm.summary)}</p>`,
  skills: (vm) =>
    `<dl class="cv-skills">${vm.skillGroups
      .map((g) => `<dt>${escapeHtml(g.label)}</dt><dd>${g.items.map(rich).join(', ')}</dd>`)
      .join('')}</dl>`,
  experience: (vm) =>
    vm.experience
      .map(
        (org) => `<section class="cv-org">
<div class="cv-org__head"><span class="cv-org__name">${escapeHtml(org.organization)}</span>${
          org.location ? `<span class="cv-org__meta">${escapeHtml(org.location)}</span>` : ''
        }</div>
${org.jobs
  .map(
    (job) =>
      `<div class="cv-job"><div class="cv-job__head"><span class="cv-job__title">${escapeHtml(job.title)}</span><span class="cv-job__dates">${escapeHtml(job.dates)}</span></div>${
        job.bullets.length
          ? `\n<ul class="cv-list">${job.bullets.map((b) => `<li>${rich(b)}</li>`).join('')}</ul>`
          : ''
      }</div>`,
  )
  .join('\n')}${
          org.stack.length
            ? `\n<p class="cv-stack"><b>Stack</b> · ${org.stack.map(rich).join(' · ')}</p>`
            : ''
        }
</section>`,
      )
      .join('\n'),
  earlier: (vm) =>
    `<div class="cv-rows">${vm.earlier
      .map(
        (e) =>
          `<div class="cv-row"><span class="cv-row__main"><b>${escapeHtml(e.title)}</b>, ${escapeHtml(e.organization)}</span><span class="cv-row__dates">${escapeHtml(e.dates)}</span>${
            e.note ? `<span class="cv-row__note">${escapeHtml(e.note)}</span>` : ''
          }</div>`,
      )
      .join('')}</div>`,
  clients: (vm) =>
    `<p class="cv-clients">${vm.clients.map((c) => `<span>${escapeHtml(c)}</span>`).join('')}</p>`,
  projects: (vm) =>
    vm.projects
      .map(
        (p) =>
          `<div class="cv-proj"><div class="cv-proj__head"><span class="cv-proj__name">${rich(p.name)}</span><span class="cv-proj__tech">${p.tech.map(rich).join(' · ')}</span></div><p>${rich(p.description)}</p></div>`,
      )
      .join(''),
  education: (vm) =>
    `<p class="cv-small">${vm.education
      .map(
        (e) =>
          `<b>${escapeHtml(e.title)}</b>${e.institution ? `<br>${escapeHtml(e.institution)}` : ''}<br><span class="cv-muted">${escapeHtml(e.dates)}</span>`,
      )
      .join('<br>')}</p>`,
  languages: (vm) =>
    `<p class="cv-small">${vm.languages
      .map(
        (l) =>
          `<b>${escapeHtml(l.name)}</b> <span class="cv-muted">· ${escapeHtml(l.level)}</span>`,
      )
      .join('<br>')}</p>`,
  publications: (vm) =>
    `<p class="cv-small">${[
      ...vm.publications.map(
        (p) =>
          `<b>${escapeHtml(p.title)}</b> <span class="cv-muted">· ${escapeHtml(p.meta)}</span>`,
      ),
      ...vm.press.map((p) => `<span class="cv-muted">Featured: "${escapeHtml(p)}"</span>`),
    ].join('<br>')}</p>`,
};

/** A section is left out when it would be empty. */
function isEmpty(id: ResumeSectionId, vm: ResumeViewModel): boolean {
  switch (id) {
    case 'skills':
      return !vm.skillGroups.length;
    case 'experience':
      return !vm.experience.length;
    case 'earlier':
      return !vm.earlier.length;
    case 'clients':
      return !vm.clients.length;
    case 'projects':
      return !vm.projects.length;
    case 'education':
      return !vm.education.length;
    case 'languages':
      return !vm.languages.length;
    case 'publications':
      return !vm.publications.length && !vm.press.length;
    default:
      return false;
  }
}

/** The résumé's body: its sections in its own order, the closing ones side by side. */
export function resumeBody(vm: ResumeViewModel): string {
  const order = vm.sections.filter((id) => !isEmpty(id, vm));
  const main = order.filter((id) => !CLOSING.includes(id));
  const closing = order.filter((id) => CLOSING.includes(id));
  return [
    header(vm),
    ...main.map((id) => section(id, BODY[id]!(vm))),
    closing.length
      ? `<div class="cv-cols">${closing.map((id) => section(id, BODY[id]!(vm))).join('')}</div>`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** A CSS string literal: quotes, backslashes and line breaks escaped. */
export const cssString = (text: string): string =>
  `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\a ')}"`;

/**
 * The print page boxes' text for this résumé: the footer (name and role) on every page, and from
 * page 2 the running header naming the résumé. "Page x of y" is in resume.css.
 */
export function pageCss(vm: ResumeViewModel): string {
  return `@page{@top-left{content:${cssString(`${vm.header.name} · ${vm.title} résumé`)}}@bottom-left{content:${cssString(vm.footer)}}}@page:first{@top-left{content:none}}`;
}

/** The whole document: self-contained HTML with the stylesheet and page boxes inlined. */
export function renderResume(vm: ResumeViewModel, fontCss = ''): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(vm.header.name)} · ${escapeHtml(vm.title)}</title>
<meta name="author" content="${escapeHtml(vm.header.name)}">
<meta name="robots" content="noindex">
<style>${fontCss}${RESUME_CSS}${pageCss(vm)}</style>
</head>
<body>
<article class="cv-doc" aria-label="${escapeHtml(vm.title)} résumé">
${resumeBody(vm)}
</article>
</body>
</html>
`;
}
