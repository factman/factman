/** One validation problem, printed as `file path: message`. */
export interface Issue {
  /** Repo-relative file, e.g. `src/data/services.json`. */
  file: string;
  /** JSON Pointer inside the file, e.g. `/0/slug`; empty for the whole file. */
  path: string;
  message: string;
  /** The PRD test case it breaks (DS-01 to DS-17 and the RS data cases, PRD section 12). */
  rule?: DsRule;
  /** Warnings are printed but do not fail `data:validate`. Default: error. */
  level?: 'error' | 'warning';
}

/**
 * PRD section 12 cases checked on the data: DS-01 to DS-17 (DS-14 and DS-15 are tests, not data
 * rules) and the résumé data cases RS-01 (schema and references), RS-02 (counts, limits,
 * duplicates) and RS-03 (phone).
 */
export type DsRule =
  | 'RS-01'
  | 'RS-02'
  | 'RS-03'
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
