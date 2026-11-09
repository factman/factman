/** Runs on staged files from the pre-commit hook. */
export default {
  '*.{ts,html,scss,css,json,md,yml,yaml,mjs,cjs,js}': 'prettier --write',
};
