import {
  ASSIGNEE_ATTRIBUTES,
  COMPONENT_ATTRIBUTES,
  FilterAttributes,
  FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES,
  LABEL_ATTRIBUTES,
  NONE_FILTER,
  PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES
} from '../../../model/board/user/board-filter/board-filter.constants';
import {BoardFilterState} from '../../../model/board/user/board-filter/board-filter.model';
import {BoardIssueVm} from './board-issue-vm';
import {Set} from 'immutable';
import {NO_ASSIGNEE} from '../../../model/board/data/assignee/assignee.model';

export class AllFilters {
  private _project: SimpleFilter;
  private _issueType: SimpleFilter;
  private _priority: SimpleFilter;
  private _assignee: SimpleFilter;
  private _component: MultiSelectFilter;
  private _label: MultiSelectFilter;
  private _fixVersion: MultiSelectFilter;

  constructor(boardFilters: BoardFilterState) {
    this._project = new SimpleFilter(PROJECT_ATTRIBUTES, boardFilters.project);
    this._priority = new SimpleFilter(PRIORITY_ATTRIBUTES, boardFilters.priority);
    this._issueType = new SimpleFilter(ISSUE_TYPE_ATTRIBUTES, boardFilters.issueType);
    this._assignee = new SimpleFilter(ASSIGNEE_ATTRIBUTES, boardFilters.assignee);
    this._component = new MultiSelectFilter(COMPONENT_ATTRIBUTES, boardFilters.component)
    this._label = new MultiSelectFilter(LABEL_ATTRIBUTES, boardFilters.label);
    this._fixVersion = new MultiSelectFilter(FIX_VERSION_ATTRIBUTES, boardFilters.fixVersion);
  }

  /**
   *
   * @param {BoardIssueVm} issue
   * @return {true} if it is filtered, i.e. invisible, {false} otherwise
   */
  filter(issue: BoardIssueVm): boolean {
    if (this._project.doFilter(issue.projectCode)) {
      return true;
    }
    if (this._priority.doFilter(issue.priority.name)) {
      return true;
    }
    if (this._issueType.doFilter(issue.type.name)) {
      return true;
    }
    if (this._assignee.doFilter(issue.assignee !== NO_ASSIGNEE ? issue.assignee.key : null)) {
      return true;
    }
    if (this._component.filterAll(issue.components)) {
      return true;
    }
    if (this._label.filterAll(issue.labels)) {
      return true;
    }
    if (this._fixVersion.filterAll(issue.fixVersions)) {
      return true;
    }
    // TODO - the other map ones

    return false;
  }
}

class SimpleFilter {
  constructor(protected readonly _filterAttributes: FilterAttributes, protected readonly _filter: Set<string>) {
  }

  doFilter(key: string): boolean {
    if (this._filter.size > 0) {
      let useKey: string = key;
      if (!key && this._filterAttributes.hasNone) {
        useKey = NONE_FILTER;
      }

      return !this._filter.contains(useKey);
    }
    return false;
  }
}

class MultiSelectFilter extends SimpleFilter {
  private _filterArray: string[];

  constructor(filterAttributes: FilterAttributes, filter: Set<string>) {
    super(filterAttributes, filter);
    this._filterArray = filter.toArray();
  }

  filterAll(keys: Set<string>): boolean {
    if (this._filter.size > 0) {
      if (!keys) {
        return !this._filter.contains(NONE_FILTER);
      } else {
        if (this._filter.size === 1 && this._filter.contains(NONE_FILTER)) {
          // All we want to match is no components, and we have some components so return that we
          // should be filtered out
          return true;
        }


        for (const key of this._filterArray) {
          if (key === NONE_FILTER) {
            // We have values and we are looking for some values, for this case ignore the
            // none filter
            continue;
          }
          if (keys.contains(key)) {
            return false;
          }
        }
        return true;
      }
    }
    return false;
  }
}
