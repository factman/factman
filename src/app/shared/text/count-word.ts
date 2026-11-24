const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/** A count as a sentence starts it: "Eight" for 8; digits past ten ("12"). */
export const countWord = (n: number): string => WORDS[n] ?? String(n);
