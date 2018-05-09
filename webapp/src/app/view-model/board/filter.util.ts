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
import {CustomField} from '../../model/board/data/custom-field/custom-field.model';
import {ParallelTask, ParallelTaskPosition, ProjectState, ProjectUtil} from '../../model/board/data/project/project.model';

export class AllFilters {
  private _project: SimpleFilter;
  private _issueType: SimpleFilter;
  private _priority: SimpleFilter;
  private _assignee: SimpleFilter;
  private _component: MultiSelectFilter;
  private _label: MultiSelectFilter;
  private _fixVersion: MultiSelectFilter;
  private _customFieldFilters: Map<string, SimpleFilter>;
  private _parallelTaskFilters: Map<string, SimpleFilter>;
  private _parallelTaskFilterPositionsByProject: Map<string, Map<string, ParallelTaskPosition>>;

  constructor(boardFilters: BoardFilterState, projectState: ProjectState, currentUser: string) {
    this._project = new SimpleFilter(PROJECT_ATTRIBUTES, boardFilters.project);
    this._priority = new SimpleFilter(PRIORITY_ATTRIBUTES, boardFilters.priority);
    this._issueType = new SimpleFilter(ISSUE_TYPE_ATTRIBUTES, boardFilters.issueType);
    this._assignee = new AssigneeFilter(ASSIGNEE_ATTRIBUTES, boardFilters.assignee, currentUser);
    this._component = new MultiSelectFilter(COMPONENT_ATTRIBUTES, boardFilters.component);
    this._label = new MultiSelectFilter(LABEL_ATTRIBUTES, boardFilters.label);
    this._fixVersion = new MultiSelectFilter(FIX_VERSION_ATTRIBUTES, boardFilters.fixVersion);
    this._customFieldFilters = Map<string, SimpleFilter>().withMutations(mutable => {
      boardFilters.customField.forEach((f, k) => {
        mutable.set(k, new SimpleFilter(FilterAttributesUtil.createCustomFieldFilterAttributes(k), f));
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
      projectState.parallelTasks.forEach((groups, project) => {
          mutable.set(project, this.createParallelTaskIndices(groups));
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
      const cfv: CustomField = issue.customFields.get(k);
      if (!f.doFilter(cfv ? cfv.key : null)) {
        visible = false;
        return false;
      }
    });
    return visible;
  }

  private filterVisibleParallelTasks(issue: BoardIssueView): boolean {
    let visible = true;
    const positionsForProject: Map<string, ParallelTaskPosition> = this._parallelTaskFilterPositionsByProject.get(issue.projectCode);
    this._parallelTaskFilters.forEach((f, k) => {
      if (positionsForProject) {
        const pos: ParallelTaskPosition = positionsForProject.get(k);
        if (!issue.parallelTasks ||
          !f.doFilter(
            issue.parallelTasks
              .getIn([pos.groupIndex, pos.taskIndex])
              .options.get(issue.selectedParallelTasks.getIn([pos.groupIndex, pos.taskIndex])).name)) {
          visible = false;
          return false;
        }
      }
    });
    return visible;
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

class AssigneeFilter extends SimpleFilter {
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
