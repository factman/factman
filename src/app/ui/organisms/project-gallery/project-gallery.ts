import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  inject,
} from '@angular/core';

import { ANALYTICS_TRACKER, ctaEvent, type Project, Track } from '@shared';
import { Button } from '@ui/atoms/button/button';
import { iconSearch } from '@ui/atoms/icon/icons';
import { EmptyState } from '@ui/molecules/empty-state/empty-state';
import { FilterBar, type FilterState } from '@ui/molecules/filter-bar/filter-bar';
import { ProjectCard } from '@ui/molecules/project-card/project-card';

import type { HeroAction } from '../page-hero/page-hero';

import {
  filterOptions,
  filterProjects,
  fromSelection,
  NO_FILTER,
  type ProjectFilter,
  selectedValues,
} from './project-filter';

/**
 * The projects (FR-20, FR-21, the canvas's ProjectsSection): ProjectCards in a grid of three, in
 * the order given (newest first). With `filterable` (the /projects page) a FilterBar on a glass
 * panel filters by status and category and searches, shows "4 of 7 projects" live, and an empty
 * state with "Show all projects" when nothing matches; the page keeps the filter in the URL query
 * (`filter` in, `filterChange` out). Links under the grid (`actions`) are for the home section.
 * A private project's card asks for a walkthrough (`engage`).
 * @level organism
 */
@Component({
  selector: 'fm-project-gallery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // project-gallery* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './project-gallery.scss',
  imports: [Button, EmptyState, FilterBar, ProjectCard, Track],
  host: { style: 'display: contents' },
  templateUrl: './project-gallery.html',
})
export class ProjectGallery {
  /** A call to action's `cta_click` event. */
  protected readonly cta = ctaEvent;

  readonly projects = input.required<readonly Project[]>();
  readonly filterable = input(false);
  readonly filter = input<ProjectFilter>(NO_FILTER);
  readonly actions = input<readonly HeroAction[]>([]);
  readonly headingLevel = input<2 | 3>(3);

  readonly filterChange = output<ProjectFilter>();
  readonly engage = output<Project>();

  protected readonly search = iconSearch;
  private readonly tracker = inject(ANALYTICS_TRACKER);
  protected readonly options = computed(() => filterOptions(this.projects()));
  protected readonly selected = computed(() => selectedValues(this.filter()));
  protected readonly shown = computed(() =>
    this.filterable() ? filterProjects(this.projects(), this.filter()) : this.projects(),
  );
  protected readonly count = computed(
    () => `${this.shown().length} of ${this.projects().length} projects`,
  );

  protected onFilter(state: FilterState): void {
    const before = this.selected();
    for (const value of state.selected.filter((v) => !before.includes(v))) {
      this.tracker.track('filter_used', { scope: 'projects', value });
    }
    // A search is reported as "search": what the visitor typed never leaves the browser.
    if (state.query.trim() && !this.filter().query.trim()) {
      this.tracker.track('filter_used', { scope: 'projects', value: 'search' });
    }
    this.filterChange.emit(fromSelection(state.selected, state.query));
  }

  protected clear(): void {
    this.filterChange.emit(NO_FILTER);
  }
}
