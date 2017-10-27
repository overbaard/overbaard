import {
  ASSIGNEE_ATTRIBUTES,
  COMPONENT_ATTRIBUTES,
  FilterAttributes, FilterAttributesUtil,
  FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES,
  LABEL_ATTRIBUTES,
  NONE_FILTER,
  PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES
} from '../../../model/board/user/board-filter/board-filter.constants';
import {BoardFilterState} from '../../../model/board/user/board-filter/board-filter.model';
import {BoardIssueVm} from './board-issue-vm';
import {Map, Set} from 'immutable';
import {NO_ASSIGNEE} from '../../../model/board/data/assignee/assignee.model';
import {CustomField} from '../../../model/board/data/custom-field/custom-field.model';

export class AllFilters {
  private _project: SimpleFilter;
  private _issueType: SimpleFilter;
  private _priority: SimpleFilter;
  private _assignee: SimpleFilter;
  private _component: MultiSelectFilter;
  private _label: MultiSelectFilter;
  private _fixVersion: MultiSelectFilter;
  private _customFieldFilters: Map<string, SimpleFilter>;

  constructor(boardFilters: BoardFilterState) {
    this._project = new SimpleFilter(PROJECT_ATTRIBUTES, boardFilters.project);
    this._priority = new SimpleFilter(PRIORITY_ATTRIBUTES, boardFilters.priority);
    this._issueType = new SimpleFilter(ISSUE_TYPE_ATTRIBUTES, boardFilters.issueType);
    this._assignee = new SimpleFilter(ASSIGNEE_ATTRIBUTES, boardFilters.assignee);
    this._component = new MultiSelectFilter(COMPONENT_ATTRIBUTES, boardFilters.component)
    this._label = new MultiSelectFilter(LABEL_ATTRIBUTES, boardFilters.label);
    this._fixVersion = new MultiSelectFilter(FIX_VERSION_ATTRIBUTES, boardFilters.fixVersion);
    this._customFieldFilters = Map<string, SimpleFilter>().withMutations(mutable => {
      boardFilters.customField .forEach((f, k) => {
        mutable.set(k, new SimpleFilter(FilterAttributesUtil.createCustomFieldFilterAttributes(k), f));
      });
    });

  }

  /**
   *
   * @param {BoardIssueVm} issue
   * @return {true} if it is visible, {false} otherwise
   */
  filterVisible(issue: BoardIssueVm): boolean {
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
    // TODO - parallel tasks

    return true;
  }

  private filterVisibleCustomFields(issue: BoardIssueVm) {
    let visible = true;
    this._customFieldFilters.forEach((f, k) => {
      const cfv: CustomField = issue.customFields.get(k);
      if (!f.doFilter(cfv ? cfv.key : null)) {
        visible = false;
        return false;
      }
    });
    return visible;
  }
}

class SimpleFilter {
  constructor(private readonly _filterAttributes: FilterAttributes, private readonly _filter: Set<string>) {
  }

  doFilter(key: string): boolean {
    if (this._filter.size > 0) {
      let useKey: string = key;
      if (!key && this._filterAttributes.hasNone) {
        useKey = NONE_FILTER;
      }
      return this._filter.contains(useKey);
    }
    return true;
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
        return this._filter.contains(NONE_FILTER);
      } else {
        if (this._filter.size === 1 && this._filter.contains(NONE_FILTER)) {
          // All we want to match is no components, and we have some components so return that we
          // should be filtered out
          return false;
        }


        for (const key of this._filterArray) {
          if (key === NONE_FILTER) {
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

class MapFilter {
  private _filters: Map<string, SimpleFilter>;
  constructor(private readonly _filterAttributes: FilterAttributes, private readonly _filter: Map<string, Set<string>>) {
    this._filters = Map<string, SimpleFilter>().withMutations(mutable => {
      _filter.forEach((f, k) => {
        mutable.set(k, new SimpleFilter(_filterAttributes, f));
      });
    });
  }

  filterSingle(filterKey: string, key: string) {
    const filter: SimpleFilter = this._filters.get(filterKey);
    if (filter) {
      return filter.doFilter(key);
    }
    return true;

  }

}
