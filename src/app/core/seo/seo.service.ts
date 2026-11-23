import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { SITE } from '../config/site';
import { type PageSeo, type SeoHead, seoHead } from './page-seo';

/**
 * Writes a page's head: title, canonical link, description, robots, Open Graph and Twitter tags.
 * SiteTitleStrategy calls it after every navigation, so each prerendered page carries its own tags
 * and client-side navigation keeps them in step. Tags are replaced, never appended.
 */
@Injectable()
export class SeoService {
  private readonly site = inject(SITE);
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly document = inject(DOCUMENT);

  /** Applies the head for a page and returns it. */
  update(page: { readonly title?: string; readonly seo?: PageSeo }, url: string): SeoHead {
    const head = seoHead(this.site, page, url);
    this.titleService.setTitle(head.title);
    for (const tag of head.tags) {
      this.meta.updateTag(tag, 'name' in tag ? `name="${tag.name}"` : `property="${tag.property}"`);
    }
    this.setCanonical(head.canonical);
    return head;
  }

  private setCanonical(href: string | undefined): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!href) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
