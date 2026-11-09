/** One validation problem, printed as `file path: message`. */
export interface Issue {
  /** Repo-relative file, e.g. `src/data/services.json`. */
  file: string;
  /** JSON Pointer inside the file, e.g. `/0/slug`; empty for the whole file. */
  path: string;
  message: string;
}

export function formatIssue(issue: Issue): string {
  return `${issue.file}${issue.path ? ` ${issue.path}` : ''}: ${issue.message}`;
}
