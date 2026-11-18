/** "+2347066780373" → "+234 706 678 0373": the country code, then groups of three. */
export function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  const cc = digits.slice(0, 3);
  const rest = digits.slice(3);
  const groups = rest.length > 6 ? [rest.slice(0, 3), rest.slice(3, 6), rest.slice(6)] : [rest];
  return `+${cc} ${groups.join(' ')}`;
}

/** "+234 ••• ••• ••73": the country code and the last two digits only. */
export function maskPhone(e164: string): string {
  const shown = formatPhone(e164);
  const last = shown.slice(-2);
  return shown.slice(0, 5) + shown.slice(5, -2).replace(/\d/g, '•') + last;
}
