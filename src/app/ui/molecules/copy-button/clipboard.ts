/**
 * Copies text: the Clipboard API where the browser allows it, otherwise a hidden text area and
 * `execCommand('copy')` (older browsers, or a page that isn't a secure context). Resolves to
 * whether it worked.
 */
export async function copyText(text: string, doc: Document): Promise<boolean> {
  const clipboard = doc.defaultView?.navigator?.clipboard;
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or not focused: try the fallback.
    }
  }
  const area = doc.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  doc.body.appendChild(area);
  area.select();
  try {
    return doc.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
  }
}
