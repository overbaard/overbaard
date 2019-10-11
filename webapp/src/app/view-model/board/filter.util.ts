import {
  ASSIGNEE_ATTRIBUTES,
  COMPONENT_ATTRIBUTES,
  CURRENT_USER_FILTER_KEY,
  FilterAttributes,
  FilterAttributesUtil,
  FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES,
  LABEL_ATTRIBUTES,
  NONE_FILTER_KEY,
  PARALLEL_TASK_ATTRIBUTES,
  PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES
} from '../../model/board/user/board-filter/board-filter.constants';
import {BoardFilterState} from '../../model/board/user/board-filter/board-filter.model';
import {BoardIssueView} from './board-issue-view';
import {List, Map, Set} from 'immutable';
import {NO_ASSIGNEE} from '../../model/board/data/assignee/assignee.model';
import {CustomFieldData, CustomFieldState, CustomFieldValue} from '../../model/board/data/custom-field/custom-field.model';
import {
  ParallelTask,
  ParallelTaskOption,
  ParallelTaskPosition,
  ProjectState,
  ProjectUtil
} from '../../model/board/data/project/project.model';
import {BoardSearchFilterState, BoardSearchFilterUtil} from '../../model/board/user/board-filter/board-search-filter.model';
import {IssueQlMatcher} from '../../common/parsers/issue-ql/issue-ql.matcher';
import {IssueVisitor} from '../../common/parsers/issue-ql/issue.visitor';

export class AllFilters {
  private readonly _project: SimpleFilter;
  private readonly _issueType: SimpleFilter;
  private readonly _priority: SimpleFilter;
  private readonly _assignee: SimpleFilter;
  private readonly _component: MultiSelectFilter;
  private readonly _label: MultiSelectFilter;
  private readonly _fixVersion: MultiSelectFilter;
  private readonly _customFieldFilters: Map<string, SimpleFilter>;
  private readonly _parallelTaskFilters: Map<string, SimpleFilter>;
  private readonly _parallelTaskFilterPositionsByProject: Map<string, Map<string, ParallelTaskPosition>>;
  private readonly _parallelTaskFilterPositionsByProjectIssueTypeOverride: Map<string, Map<string, Map<string, ParallelTaskPosition>>>;
  private readonly _searchContainingText: string;
  private readonly _searchIssueIds: Set<string>;
  private readonly _searchIssueQlMatcher: IssueQlMatcher;

  constructor(
      boardFilters: BoardFilterState,
      searchFilters: BoardSearchFilterState,
      projectState: ProjectState,
      customFieldState: CustomFieldState,
      currentUser: string) {
    this._project = new SimpleFilter(PROJECT_ATTRIBUTES, boardFilters.project);
    this._priority = new SimpleFilter(PRIORITY_ATTRIBUTES, boardFilters.priority);
    this._issueType = new SimpleFilter(ISSUE_TYPE_ATTRIBUTES, boardFilters.issueType);
    this._assignee = new CurrentUserFilter(ASSIGNEE_ATTRIBUTES, boardFilters.assignee, currentUser);
    this._component = new MultiSelectFilter(COMPONENT_ATTRIBUTES, boardFilters.component);
    this._label = new MultiSelectFilter(LABEL_ATTRIBUTES, boardFilters.label);
    this._fixVersion = new MultiSelectFilter(FIX_VERSION_ATTRIBUTES, boardFilters.fixVersion);
    this._customFieldFilters = Map<string, SimpleFilter>().withMutations(mutable => {
      boardFilters.customField.forEach((f, k) => {
        const cfd: CustomFieldData = customFieldState.fields.get(k);
        const cfAttrs = FilterAttributesUtil.createCustomFieldFilterAttributes(k, cfd);
        const cfFilter: SimpleFilter = cfAttrs.hasCurrentUser ?
          new CurrentUserFilter(cfAttrs, f, currentUser) : new SimpleFilter(cfAttrs, f);
        mutable.set(k, cfFilter);
      });
    });
    this._parallelTaskFilters = Map<string, SimpleFilter>().withMutations(mutable => {
      boardFilters.parallelTask.forEach((p, k) => {
        if (p.size > 0) {
          mutable.set(k, new SimpleFilter(PARALLEL_TASK_ATTRIBUTES, p));
        }
      });
    });
    this._parallelTaskFilterPositionsByProject = Map<string, Map<string, ParallelTaskPosition>>().withMutations(mutable => {
      if (projectState.boardProjects) {
        projectState.boardProjects.forEach((project) => {
          if (project.parallelTasks) {
            mutable.set(project.key, this.createParallelTaskIndices(project.parallelTasks));
          }
        });
      }
    });
    this._parallelTaskFilterPositionsByProjectIssueTypeOverride =
      Map<string, Map<string, Map<string, ParallelTaskPosition>>>().withMutations(mutable => {
      if (projectState.boardProjects) {
        projectState.boardProjects.forEach(project => {
          if (project.parallelTaskIssueTypeOverrides) {
            mutable.set(project.key, this.createParallelTaskIssueTypeOverrideIndices(project.parallelTaskIssueTypeOverrides));
          }
        });
      }
    });
    this._searchContainingText = searchFilters.containingText.toLocaleLowerCase();
    this._searchIssueIds = searchFilters.issueIds;
    this._searchIssueQlMatcher = searchFilters.parsedIssueQl ? new IssueQlMatcher(searchFilters.parsedIssueQl) : null;
  }

  private createParallelTaskIssueTypeOverrideIndices(parallelTaskIssueTypeOverrides: Map<string, List<List<ParallelTask>>>):
    Map<string, Map<string, ParallelTaskPosition>> {
    return Map<string, Map<string, ParallelTaskPosition>>().withMutations(mutable => {
      parallelTaskIssueTypeOverrides.forEach((parallelTasks, issueType) => {
        mutable.set(issueType, this.createParallelTaskIndices(parallelTasks));
      });
    });
  }

  private createParallelTaskIndices(groupsForProject: List<List<ParallelTask>>): Map<string, ParallelTaskPosition> {
    return Map<string, ParallelTaskPosition>().withMutations(mutable => {
      groupsForProject.forEach((group, groupIndex) => {
        group.forEach((task, taskIndex) => {
          mutable.set(task.display, ProjectUtil.createParallelTaskPosition(groupIndex, taskIndex));
        });
      });
    });
  }

  /**
   *
   * @param {BoardIssueView} issue
   * @return {true} if it is visible, {false} otherwise
   */
  filterVisible(issue: BoardIssueView): boolean {
    if (!this._project.doFilter(issue.projectCode)) {
      return false;
    }
    if (!this._priority.doFilter(issue.priority.name)) {
      return false;
    }
    if (!this._issueType.doFilter(issue.type.name)) {
      return false;
    }
    if (!this._assignee.doFilter(issue.assignee !== NO_ASSIGNEE ? issue.assignee.key : null)) {
      return false;
    }
    if (!this._component.doFilter(issue.components)) {
      return false;
    }
    if (!this._label.doFilter(issue.labels)) {
      return false;
    }
    if (!this._fixVersion.doFilter(issue.fixVersions)) {
      return false;
    }
    if (!this.filterVisibleCustomFields(issue)) {
      return false;
    }
    if (!this.filterVisibleParallelTasks(issue)) {
      return false;
    }

    return true;
  }

  private filterVisibleCustomFields(issue: BoardIssueView): boolean {
    let visible = true;
    this._customFieldFilters.forEach((f, k) => {
      const cfv: CustomFieldValue = issue.customFields.get(k);
      if (!f.doFilter(cfv ? cfv.key : null)) {
        visible = false;
        return false;
      }
    });
    return visible;
  }

  private filterVisibleParallelTasks(issue: BoardIssueView): boolean {
    let visible = true;
    const parallelTaskPositions: Map<string, ParallelTaskPosition> = this.getParallelTaskPositionsForIssue(issue);
    if (parallelTaskPositions) {
      this._parallelTaskFilters.forEach((f, k) => {
        const pos: ParallelTaskPosition = parallelTaskPositions.get(k);
        if (!pos) {
          visible = false;
          return false;
        }

        if (issue.parallelTasks) {
          const position: number[] = [pos.groupIndex, pos.taskIndex];
          const task: ParallelTask = issue.parallelTasks.getIn(position);
          const selectedOptionIndex: number = issue.selectedParallelTasks.getIn(position);
          const selectedOption: ParallelTaskOption = task.options.get(selectedOptionIndex);
          if (!f.doFilter(selectedOption.name)) {
            visible = false;
            return false;
          }
        } else {
          visible = false;
          return false;
        }
      });
    } else if (this._parallelTaskFilters.size > 0) {
      visible = false;
    }
    return visible;
  }

  private getParallelTaskPositionsForIssue(issue: BoardIssueView): Map<string, ParallelTaskPosition> {
    const issueTypeParallelTaskPositions: Map<string, ParallelTaskPosition> =
      this._parallelTaskFilterPositionsByProjectIssueTypeOverride.getIn([issue.projectCode, issue.type.name]);
    if (issueTypeParallelTaskPositions) {
      return issueTypeParallelTaskPositions;
    }
    return this._parallelTaskFilterPositionsByProject.get(issue.projectCode);
  }

  filterMatchesSearch(issue: BoardIssueView) {
    if (this._searchIssueIds.size > 0) {
      if (!this._searchIssueIds.contains(issue.key)) {
        return false;
      }
    }
    if (BoardSearchFilterUtil.containingTextAboveMinimumLength(this._searchContainingText)) {
      if (issue.summary.toLocaleLowerCase().indexOf(this._searchContainingText) < 0) {
        return false;
      }
    }
    if (this._searchIssueQlMatcher) {
      const matches = this._searchIssueQlMatcher.matchIssue(new IssueVisitor(issue));
      if (!matches) {
        return false;
      }
    }

    return true;
  }
}

class SimpleFilter {
  constructor(private readonly _filterAttributes: FilterAttributes, protected readonly _filter: Set<string>) {
  }

  doFilter(key: string): boolean {
    if (this._filter.size > 0) {
      let useKey: string = key;
      if (!key && this._filterAttributes.hasNone) {
        useKey = NONE_FILTER_KEY;
      }
      return this._filter.contains(useKey);
    }
    return true;
  }
}

// Used for assignees and custom fields of type user
class CurrentUserFilter extends SimpleFilter {
  constructor(filterAttributes: FilterAttributes, filter: Set<string>, private readonly _currentUser: string) {
    super(filterAttributes, filter);
  }

  doFilter(key: string): boolean {
    if (this._filter.contains(CURRENT_USER_FILTER_KEY) && key === this._currentUser) {
      return true;
    }
    return super.doFilter(key);
  }
}

class MultiSelectFilter {
  private _filterArray: string[];

  constructor(private readonly _filterAttributes: FilterAttributes, private readonly _filter: Set<string>) {
    this._filterArray = _filter.toArray();
  }

  doFilter(keys: Set<string>): boolean {
    if (this._filter.size > 0) {
      if (!keys) {
        return this._filter.contains(NONE_FILTER_KEY);
      } else {
        if (this._filter.size === 1 && this._filter.contains(NONE_FILTER_KEY)) {
          // All we want to match is no components, and we have some components so return that we
          // should be filtered out
          return false;
        }


        for (const key of this._filterArray) {
          if (key === NONE_FILTER_KEY) {
            // We have values and we are looking for some values, for this case ignore the
            // none filter
            continue;
          }
          if (keys.contains(key)) {
            return true;
          }
        }
        return false;
      }
    }
    return true;
  }
}
