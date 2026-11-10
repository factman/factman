/** One validation problem, printed as `file path: message`. */
export interface Issue {
  /** Repo-relative file, e.g. `src/data/services.json`. */
  file: string;
  /** JSON Pointer inside the file, e.g. `/0/slug`; empty for the whole file. */
  path: string;
  message: string;
  /** The PRD test case it breaks (DS-01 to DS-17, PRD section 12). */
  rule?: DsRule;
  /** Warnings are printed but do not fail `data:validate`. Default: error. */
  level?: 'error' | 'warning';
}

/** PRD section 12 data source cases. DS-14 and DS-15 are tests, not data rules. */
export type DsRule =
  | 'DS-01'
  | 'DS-02'
  | 'DS-03'
  | 'DS-04'
  | 'DS-05'
  | 'DS-06'
  | 'DS-07'
  | 'DS-08'
  | 'DS-09'
  | 'DS-10'
  | 'DS-11'
  | 'DS-12'
  | 'DS-13'
  | 'DS-16'
  | 'DS-17';

export const isError = (issue: Issue): boolean => issue.level !== 'warning';

export function formatIssue(issue: Issue): string {
  return `${issue.file}${issue.path ? ` ${issue.path}` : ''}: ${issue.message}`;
}
